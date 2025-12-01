import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyPlan extends Document {
    userId: mongoose.Types.ObjectId;
    date: Date;
    villages: string[];
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DailyPlanSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        villages: [{ type: String, required: true }],
        remarks: { type: String },
    },
    { timestamps: true }
);

// Compound index to ensure one plan per user per day
DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyPlan: Model<IDailyPlan> =
    mongoose.models.DailyPlan || mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);

export default DailyPlan;
