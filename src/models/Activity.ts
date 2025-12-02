import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
    creatorId: mongoose.Types.ObjectId;
    empId: string;
    title?: string;
    farmerName: string;
    farmerMobile: string;
    village: string;
    taluka: string;
    district: string;
    cropOrHybrid: string;
    farmersInvolved: number;
    tentativeExpense?: number;
    remarks?: string;
    activityType: 'General' | 'Special';
    contactType?: 'Calling' | 'Direct';
    photos: { url: string; key: string }[];
    publishedAt?: Date;
    isPublished: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
    {
        creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        empId: { type: String, required: true },
        title: { type: String },
        farmerName: { type: String, required: true },
        farmerMobile: { type: String, required: true },
        village: { type: String, required: true },
        taluka: { type: String, required: true },
        district: { type: String, required: true },
        cropOrHybrid: { type: String, required: true },
        farmersInvolved: { type: Number, required: true },
        tentativeExpense: {
            type: Number,
            required: function (this: any) {
                return this.activityType === 'Special';
            }
        },
        remarks: { type: String },
        activityType: {
            type: String,
            enum: ['General', 'Special'],
            default: 'Special',
            required: true
        },
        contactType: {
            type: String,
            enum: ['Calling', 'Direct'],
            required: function (this: any) {
                return this.activityType === 'General';
            }
        },
        photos: [
            {
                url: { type: String, required: true },
                key: { type: String, required: true },
            },
        ],
        publishedAt: { type: Date },
        isPublished: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const Activity: Model<IActivity> =
    mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
