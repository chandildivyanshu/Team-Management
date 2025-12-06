import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPortfolio extends Document {
    name: string;
    images: { url: string; key: string }[];
    creatorId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        images: [
            {
                url: { type: String, required: true },
                key: { type: String, required: true },
            },
        ],
        creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

const Portfolio: Model<IPortfolio> =
    mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);

export default Portfolio;
