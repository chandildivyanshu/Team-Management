import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID; // "Bolo Kisan" channel ID

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const pageToken = searchParams.get("pageToken") || "";

        if (!YOUTUBE_API_KEY) {
            return NextResponse.json({ error: "YouTube API Key not configured" }, { status: 500 });
        }

        let items: any[] = [];
        let nextPageToken = "";

        if (q) {
            // SEARCH MODE (Expensive: 100 units)
            const baseUrl = "https://www.googleapis.com/youtube/v3/search";
            const params = new URLSearchParams({
                part: "snippet",
                channelId: CHANNEL_ID || "",
                q: q,
                type: "video",
                maxResults: "50",
                key: YOUTUBE_API_KEY,
                pageToken: pageToken,
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("YouTube Search API Error:", data);
                return NextResponse.json({ error: data.error.message }, { status: response.status });
            }

            items = data.items || [];
            nextPageToken = data.nextPageToken || "";

        } else {
            // BROWSE MODE (Cheap: 1 unit for playlistItems + 1 unit for channels if needed)

            // 1. Get Uploads Playlist ID (if we don't have it, we could hardcode or fetch. Fetching is safer).
            // Optimization: Channel ID starts with 'UC', Uploads Playlist usually starts with 'UU' + rest of ID.
            // Let's try to derive it to save 1 unit, or fetch it properly. 
            // Proper way:
            let uploadsPlaylistId = "";

            // Try to derive first (works for most channels)
            if (CHANNEL_ID && CHANNEL_ID.startsWith("UC")) {
                uploadsPlaylistId = "UU" + CHANNEL_ID.substring(2);
            } else {
                // Fallback: Fetch channel details
                const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
                const channelRes = await fetch(channelUrl);
                const channelData = await channelRes.json();
                if (channelData.items && channelData.items.length > 0) {
                    uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
                }
            }

            if (!uploadsPlaylistId) {
                return NextResponse.json({ error: "Could not find uploads playlist" }, { status: 500 });
            }

            // 2. Fetch Playlist Items
            const playlistUrl = "https://www.googleapis.com/youtube/v3/playlistItems";
            const params = new URLSearchParams({
                part: "snippet",
                playlistId: uploadsPlaylistId,
                maxResults: "50",
                key: YOUTUBE_API_KEY,
                pageToken: pageToken,
            });

            const response = await fetch(`${playlistUrl}?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("YouTube Playlist API Error:", data);
                return NextResponse.json({ error: data.error.message }, { status: response.status });
            }

            // Normalize structure to match Search API
            // Search: id: { videoId: "..." }
            // Playlist: snippet: { resourceId: { videoId: "..." } }
            items = (data.items || []).map((item: any) => ({
                ...item,
                id: { videoId: item.snippet.resourceId.videoId }, // Normalize ID
            }));
            nextPageToken = data.nextPageToken || "";
        }

        // 3. Fetch Statistics (View Counts) - Common for both modes (1 unit)
        const videoIds = items.map((item: any) => item.id.videoId).join(",");

        if (videoIds) {
            const statsUrl = "https://www.googleapis.com/youtube/v3/videos";
            const statsParams = new URLSearchParams({
                part: "statistics",
                id: videoIds,
                key: YOUTUBE_API_KEY,
            });

            const statsResponse = await fetch(`${statsUrl}?${statsParams.toString()}`);
            const statsData = await statsResponse.json();

            // Merge stats into items
            const statsMap = new Map(statsData.items?.map((item: any) => [item.id, item.statistics]) || []);

            items = items.map((item: any) => ({
                ...item,
                statistics: statsMap.get(item.id.videoId)
            }));
        }

        return NextResponse.json({ items, nextPageToken });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
