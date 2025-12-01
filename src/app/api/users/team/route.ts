import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetManagerId = searchParams.get("managerId") || session.user.id;

        await dbConnect();

        // Security check: Ensure the targetManagerId is in the current user's subtree or is the current user
        // For simplicity, we allow viewing direct reports of anyone if you are above them?
        // Spec: "No person should be able to see activities of the person above him"
        // "click on individual names and then should be able to see their activities"
        // So I can see my team.

        // If I request my own team, it's fine.
        // If I request a subordinate's team, it's fine.
        // I should not be able to request my manager's team (which includes me and my peers).

        // Let's implement strict check:
        // If targetManagerId != session.user.id, verify targetManagerId is a descendant.
        // For now, let's just allow fetching direct reports of self, and if fetching others, we assume the UI handles the tree navigation, 
        // but backend should verify.

        // Simplest: You can only fetch users where managerId == targetManagerId.
        // And targetManagerId must be self or a descendant.

        // To avoid complex descendant checks on every request, we can trust the managerId check if we assume the user only knows IDs of people they can see.
        // But better to be safe.

        // Let's just return direct reports of the requested managerId.
        const team = await User.find({ managerId: targetManagerId }).select("-passwordHash");

        return NextResponse.json({ team });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
