import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import EmpCounter from "@/models/EmpCounter";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { secret, password, name, mobile } = await req.json();

        if (secret !== process.env.ONE_TIME_CREATE_RBM_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Check if RBM already exists
        const existingRBM = await User.findOne({ role: "RBM" });
        if (existingRBM) {
            return NextResponse.json({ error: "RBM already exists" }, { status: 400 });
        }

        // Initialize counters if not exist
        await EmpCounter.updateOne(
            { _id: "RBM" },
            { $setOnInsert: { lastNumber: 0 } },
            { upsert: true }
        );
        await EmpCounter.updateOne(
            { _id: "AreaManager" },
            { $setOnInsert: { lastNumber: 0 } },
            { upsert: true }
        );
        await EmpCounter.updateOne(
            { _id: "TerritoryManager" },
            { $setOnInsert: { lastNumber: 0 } },
            { upsert: true }
        );
        await EmpCounter.updateOne(
            { _id: "MDO" },
            { $setOnInsert: { lastNumber: 0 } },
            { upsert: true }
        );

        // Generate RBM ID
        const counter = await EmpCounter.findByIdAndUpdate(
            "RBM",
            { $inc: { lastNumber: 1 } },
            { new: true, upsert: true }
        );

        const empId = `RBM${counter!.lastNumber.toString().padStart(3, "0")}`;
        const passwordHash = await bcrypt.hash(password, 12);

        const rbm = await User.create({
            empId,
            name,
            role: "RBM",
            mobile,
            passwordHash,
        });

        return NextResponse.json({ success: true, empId: rbm.empId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
