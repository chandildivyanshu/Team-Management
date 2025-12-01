import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import DailyPlan from "@/models/DailyPlan";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { villages, remarks } = await req.json();

        // Validate date is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await dbConnect();

        // Allow multiple plans per day, so no need to check for existing plan.

        const plan = await DailyPlan.create({
            userId: session.user.id,
            date: today,
            villages,
            remarks,
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") || session.user.id;

        await dbConnect();

        // Permission check similar to activities
        if (userId !== session.user.id) {
            if (session.user.role === 'RBM') {
                // Allowed
            } else {
                const targetUser = await User.findById(userId);
                if (targetUser?.managerId?.toString() !== session.user.id) {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
                }
            }
        }

        const plans = await DailyPlan.find({ userId }).sort({ date: -1 });

        return NextResponse.json({ plans });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const planId = searchParams.get("id");

        if (!planId) {
            return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
        }

        await dbConnect();

        const plan = await DailyPlan.findById(planId);
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Only allow deleting own plans
        if (plan.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await DailyPlan.findByIdAndDelete(planId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
