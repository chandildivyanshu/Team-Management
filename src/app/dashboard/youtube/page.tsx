"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { Search, Eye, Calendar, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function YoutubeChannel() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState("");
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchVideos = async (pageToken = "") => {
        if (!pageToken) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams();
            if (debouncedQuery) params.append("q", debouncedQuery);
            if (pageToken) params.append("pageToken", pageToken);

            const res = await fetch(`/api/youtube?${params.toString()}`);
            const data = await res.json();

            if (data.items) {
                if (pageToken) {
                    setVideos((prev) => [...prev, ...data.items]);
                } else {
                    setVideos(data.items);
                }
                setNextPageToken(data.nextPageToken || "");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [debouncedQuery]);

    const handleLoadMore = () => {
        if (nextPageToken) {
            fetchVideos(nextPageToken);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Bolo Kisan Channel
                </h2>
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="Search by crop name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <div key={video.id.videoId} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative aspect-video">
                                <img
                                    src={video.snippet.thumbnails.high.url}
                                    alt={video.snippet.title}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => setSelectedVideoId(video.id.videoId)}
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity group w-full h-full cursor-pointer"
                                >
                                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg transform scale-75 group-hover:scale-100">
                                        <Play className="w-6 h-6 text-white ml-1 fill-current" />
                                    </div>
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-2" title={video.snippet.title}>
                                    {video.snippet.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Eye className="w-3 h-3 mr-1" />
                                        {video.statistics ? Number(video.statistics.viewCount).toLocaleString() : 'N/A'} views
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDistanceToNow(new Date(video.snippet.publishedAt), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {videos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No videos found.
                        </div>
                    )}
                </div>
            )}

            {nextPageToken && !loading && (
                <div className="flex justify-center mt-8 pb-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 disabled:opacity-50 flex items-center"
                    >
                        {loadingMore ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                                Loading...
                            </>
                        ) : (
                            "Load More Videos"
                        )}
                    </button>
                </div>
            )}
            {selectedVideoId && (
                <VideoPlayerModal
                    videoId={selectedVideoId}
                    onClose={() => setSelectedVideoId(null)}
                />
            )}
        </DashboardLayout>
    );
}
