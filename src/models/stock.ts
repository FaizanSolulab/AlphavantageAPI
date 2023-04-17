import mongoose, { Document, model, Schema } from 'mongoose';

export interface StockDocument extends Document {
  user: any;
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

const stockSchema = new Schema<StockDocument>({

  symbol : {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    required: true,
  },
  open: {
    type: Number,
    required: true,
  },
  high: {
    type: Number,
    required: true,
  },
  low: {
    type: Number,
    required: true,
  },
  close: {
    type: Number,
    required: true,
  },
  user: {
     type: mongoose.Types.ObjectId, 
     ref: 'User',
    }

},
{
  timestamps: true
});

export default model<StockDocument>('Stock', stockSchema);
