import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DailyPlan from "@/models/DailyPlan";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const collection = mongoose.connection.collection('dailyplans');

        // List indexes before
        const indexesBefore = await collection.indexes();
        console.log('Indexes before:', indexesBefore);

        // Drop all indexes (except _id)
        // Note: dropIndexes() might fail if there are no indexes to drop, so we wrap in try/catch or check first
        try {
            await collection.dropIndexes();
        } catch (e: any) {
            console.log("Drop indexes error (might be fine):", e.message);
        }

        // List indexes after
        const indexesAfter = await collection.indexes();
        console.log('Indexes after:', indexesAfter);

        return NextResponse.json({
            success: true,
            message: "Indexes dropped successfully",
            indexesBefore,
            indexesAfter
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
