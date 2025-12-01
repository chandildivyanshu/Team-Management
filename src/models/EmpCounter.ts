import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmpCounter extends Omit<Document, '_id'> {
    _id: string; // "RBM", "AreaManager", "TerritoryManager", "MDO"
    lastNumber: number;
}

const EmpCounterSchema: Schema = new Schema({
    _id: { type: String, required: true },
    lastNumber: { type: Number, default: 0 },
});

const EmpCounter: Model<IEmpCounter> =
    mongoose.models.EmpCounter || mongoose.model<IEmpCounter>('EmpCounter', EmpCounterSchema);

export default EmpCounter;
