import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Activity from "@/models/Activity";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validate required fields
        const requiredFields = ['farmerName', 'farmerMobile', 'village', 'taluka', 'district', 'cropOrHybrid', 'farmersInvolved', 'tentativeExpense', 'photos'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
            }
        }

        await dbConnect();

        const activity = await Activity.create({
            ...body,
            creatorId: session.user.id,
            empId: session.user.email, // using email field as empId in session
            isPublished: true, // Spec says "once he publishes... he should not be able to edit". Assuming create = publish for now or add a draft state later.
            publishedAt: new Date(),
        });

        return NextResponse.json({ success: true, activity });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

import { getAllSubordinateIds } from "@/lib/user-actions";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId"); // View activities of specific user
        const scope = searchParams.get("scope"); // 'team' for all subordinates

        await dbConnect();

        let query: any = { deletedAt: null };

        if (scope === 'team') {
            // Get all subordinate IDs
            const subordinateIds = await getAllSubordinateIds(session.user.id);
            // Include self and all subordinates
            query.creatorId = { $in: [session.user.id, ...subordinateIds] };
        } else if (userId) {
            if (userId !== session.user.id) {
                if (session.user.role === 'RBM') {
                    // RBM can see everyone
                } else {
                    const targetUser = await User.findById(userId);
                    if (targetUser?.managerId?.toString() !== session.user.id) {
                        return NextResponse.json({ error: "Unauthorized to view this user's activities" }, { status: 403 });
                    }
                }
            }
            query.creatorId = userId;
        } else {
            query.creatorId = session.user.id;
        }

        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .populate("creatorId", "name empId");

        // Process activities to sign URLs and filter expense
        const sanitizedActivities = await Promise.all(activities.map(async (act) => {
            const doc: any = act.toObject();

            // Filter expense
            if (session.user.role !== 'RBM' && doc.creatorId.toString() !== session.user.id) {
                delete doc.tentativeExpense;
            }

            // Sign photo URLs
            if (doc.photos && doc.photos.length > 0) {
                doc.photos = await Promise.all(doc.photos.map(async (photo: any) => {
                    if (photo.key) {
                        try {
                            const command = new GetObjectCommand({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: photo.key,
                            });
                            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                            return { ...photo, url: signedUrl };
                        } catch (err) {
                            console.error(`Error signing URL for key ${photo.key}:`, err);
                            return photo;
                        }
                    }
                    return photo;
                }));
            }

            return doc;
        }));

        return NextResponse.json({ activities: sanitizedActivities });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'RBM') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get("id");

        if (!activityId) {
            return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
        }

        await dbConnect();

        const activity = await Activity.findByIdAndDelete(activityId);

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'RBM') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { _id, photos, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
        }

        await dbConnect();

        // If photos are provided, we replace the existing list.
        // This allows for deletion (by omitting them) and addition (by including new ones).
        if (photos) {
            // @ts-ignore
            updateData.photos = photos;
        }

        const activity = await Activity.findByIdAndUpdate(
            _id,
            { $set: updateData },
            { new: true }
        );

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, activity });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
