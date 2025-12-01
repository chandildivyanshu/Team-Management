import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import DailyPlan from "@/models/DailyPlan";
import { deleteUserRecursively } from "@/lib/user-actions";

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only RBM can delete users
        if (session.user.role !== 'RBM') {
            return NextResponse.json({ error: "Forbidden: Only RBM can delete users" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await dbConnect();

        // 1. Find the user to ensure they exist
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Perform cascade delete
        await deleteUserRecursively(userId);

        return NextResponse.json({ message: "User and all subordinates deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
