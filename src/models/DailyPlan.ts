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

// Index for efficient querying (non-unique to allow multiple plans per day)
DailyPlanSchema.index({ userId: 1, date: 1 });

const DailyPlan: Model<IDailyPlan> =
    mongoose.models.DailyPlan || mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);

// ONE-TIME FIX: Attempt to drop the old unique index if it exists
// This is necessary because we changed from unique:true to unique:false
// and Mongoose doesn't always handle this automatically.
(async () => {
    try {
        await DailyPlan.collection.dropIndex('userId_1_date_1');
        console.log('Dropped unique index on DailyPlan');
    } catch (e) {
        // Ignore error (index might not exist or already dropped)
    }
})();

export default DailyPlan;
