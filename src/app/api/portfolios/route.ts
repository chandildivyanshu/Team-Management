import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Portfolio, { IPortfolio } from "@/models/Portfolio";
import { s3Client } from "@/lib/s3";
import { DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const portfolios = await Portfolio.find().sort({ createdAt: -1 }).populate("creatorId", "name");

        const sanitizedPortfolios = await Promise.all(portfolios.map(async (p) => {
            const doc: any = p.toObject();

            if (doc.images && doc.images.length > 0) {
                doc.images = await Promise.all(doc.images.map(async (img: any) => {
                    if (img.key) {
                        try {
                            const command = new GetObjectCommand({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: img.key,
                            });
                            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                            return { ...img, url: signedUrl };
                        } catch (err) {
                            console.error(`Error signing URL for key ${img.key}:`, err);
                            return img;
                        }
                    }
                    return img;
                }));
            }
            return doc;
        }));

        return NextResponse.json({ portfolios: sanitizedPortfolios });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'RBM') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, images } = body;

        if (!name) {
            return NextResponse.json({ error: "Portfolio Name is required" }, { status: 400 });
        }

        await dbConnect();

        const portfolio = await Portfolio.create({
            name,
            images: images || [],
            creatorId: session.user.id,
        });

        return NextResponse.json({ success: true, portfolio });
    } catch (error: any) {
        console.error(error);
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
        const { _id, name, images } = body;

        if (!_id) {
            return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "Portfolio Name is required" }, { status: 400 });
        }

        await dbConnect();

        const currentPortfolio = await Portfolio.findById(_id);
        if (!currentPortfolio) {
            return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
        }

        // Logic to find removed images and delete them from S3
        if (currentPortfolio.images && currentPortfolio.images.length > 0) {
            const newImageKeys = new Set((images || []).map((img: any) => img.key));
            const imagesToDelete = currentPortfolio.images.filter((img: any) => !newImageKeys.has(img.key));

            if (imagesToDelete.length > 0) {
                const objectsToDelete = imagesToDelete.map((img: any) => ({ Key: img.key }));
                try {
                    const command = new DeleteObjectsCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Delete: {
                            Objects: objectsToDelete,
                            Quiet: true,
                        },
                    });
                    await s3Client.send(command);
                } catch (s3Error) {
                    console.error("Failed to delete removed images from S3:", s3Error);
                }
            }
        }

        const updatedPortfolio = await Portfolio.findByIdAndUpdate(
            _id,
            {
                name,
                images: images || [],
            },
            { new: true }
        );

        return NextResponse.json({ success: true, portfolio: updatedPortfolio });
    } catch (error: any) {
        console.error(error);
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await dbConnect();

        const portfolio = await Portfolio.findById(id);
        if (!portfolio) {
            return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
        }

        // Delete images from S3
        if (portfolio.images && portfolio.images.length > 0) {
            const objectsToDelete = portfolio.images.map((img: any) => ({ Key: img.key }));
            try {
                const command = new DeleteObjectsCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Delete: {
                        Objects: objectsToDelete,
                        Quiet: true,
                    },
                });
                await s3Client.send(command);
            } catch (s3Error) {
                console.error("Failed to delete images from S3:", s3Error);
                // Continue to delete from DB even if S3 fails
            }
        }

        await Portfolio.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
