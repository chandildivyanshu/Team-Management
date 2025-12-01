import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmpCounter extends Document<string> {
    _id: string; // use string as _id
    lastNumber: number;
}

const EmpCounterSchema: Schema<IEmpCounter> = new Schema({
    _id: { type: String, required: true },
    lastNumber: { type: Number, default: 0 },
});

const EmpCounter: Model<IEmpCounter> =
    mongoose.models.EmpCounter || mongoose.model<IEmpCounter>("EmpCounter", EmpCounterSchema);

export default EmpCounter;
