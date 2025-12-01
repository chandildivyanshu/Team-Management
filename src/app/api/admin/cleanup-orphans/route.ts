import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { deleteUserRecursively } from "@/lib/user-actions";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'RBM') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();

        // Fetch all users
        const users = await User.find({});
        const userIds = new Set(users.map(u => u._id.toString()));

        const orphans = users.filter(u => u.managerId && !userIds.has(u.managerId.toString()));

        console.log(`Found ${orphans.length} orphaned users.`);

        let deletedCount = 0;
        for (const orphan of orphans) {
            console.log(`Deleting orphan: ${orphan.name} (${orphan._id})`);
            await deleteUserRecursively(orphan._id.toString());
            deletedCount++;
        }

        return NextResponse.json({
            message: "Cleanup completed",
            orphansFound: orphans.length,
            deletedCount
        });
    } catch (error: any) {
        console.error("Error cleaning up orphans:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
