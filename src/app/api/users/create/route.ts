import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import EmpCounter from "@/models/EmpCounter";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, role, mobile, password } = await req.json();
        const managerRole = session.user.role;
        const managerId = session.user.id;

        // Validate hierarchy
        const allowedRoles: Record<string, string> = {
            "RBM": "AreaManager",
            "AreaManager": "TerritoryManager",
            "TerritoryManager": "MDO",
        };

        if (allowedRoles[managerRole] !== role) {
            return NextResponse.json(
                { error: `You are not authorized to create a ${role}` },
                { status: 403 }
            );
        }

        await dbConnect();

        // Generate EmpID
        const counter = await EmpCounter.findByIdAndUpdate(
            role,
            { $inc: { lastNumber: 1 } },
            { new: true, upsert: true }
        );

        let prefix = "";
        if (role === "AreaManager") prefix = "AM";
        else if (role === "TerritoryManager") prefix = "TM";
        else if (role === "MDO") prefix = "MDO";

        const empId = `${prefix}${counter!.lastNumber.toString().padStart(4, "0")}`;

        // Hash password (use provided or generate random?)
        // Spec says: "give them id and password". So manager provides it or we generate it.
        // Let's assume manager provides it for simplicity, or we generate a default one.
        // For now, require password in body.
        if (!password) {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            empId,
            name,
            role,
            mobile,
            passwordHash,
            managerId,
        });

        return NextResponse.json({ success: true, empId: newUser.empId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
