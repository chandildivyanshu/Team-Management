import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const managerId = searchParams.get("managerId");

        if (!managerId) {
            return NextResponse.json({ error: "Manager ID is required" }, { status: 400 });
        }

        await dbConnect();

        // 1. Find all descendants (recursive)
        const getAllDescendants = async (managerId: string): Promise<any[]> => {
            const directReports = await User.find({ managerId });
            let allDescendants = [...directReports];

            for (const report of directReports) {
                const subReports = await getAllDescendants(report._id.toString());
                allDescendants = [...allDescendants, ...subReports];
            }

            return allDescendants;
        };

        const descendants = await getAllDescendants(managerId);

        // Include the manager themselves in the stats
        const manager = await User.findById(managerId);
        if (!manager) {
            return NextResponse.json({ error: "Manager not found" }, { status: 404 });
        }

        const teamMembers = [manager, ...descendants];
        const teamUserIds = teamMembers.map(u => u._id);

        // 2. Aggregate activities
        const activities = await Activity.find({
            creatorId: { $in: teamUserIds },
            deletedAt: null
        });

        // 3. Group by role
        const breakdown: Record<string, number> = {
            "AreaManager": 0,
            "TerritoryManager": 0,
            "MDO": 0,
            "RBM": 0 // Just in case
        };

        let total = 0;

        activities.forEach((activity: any) => {
            const user = teamMembers.find(u => u._id.toString() === activity.creatorId.toString());
            if (user && user.role) {
                if (breakdown[user.role] !== undefined) {
                    breakdown[user.role]++;
                } else {
                    breakdown[user.role] = 1;
                }
                total++;
            }
        });

        return NextResponse.json({
            total,
            breakdown
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
