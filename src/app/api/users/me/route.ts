import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { profilePicUrl, name, password, mobile } = await req.json();
        const updateData: any = {};
        if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;
        if (name) updateData.name = name;
        if (mobile) updateData.mobile = mobile;
        if (password) {
            const bcrypt = require("bcryptjs");
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        await User.findByIdAndUpdate(session.user.id, updateData);

        return NextResponse.json({ success: true });
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

        await dbConnect();

        const user = await User.findById(session.user.id)
            .select("-passwordHash")
            .populate("managerId", "name role");

        return NextResponse.json({ user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
