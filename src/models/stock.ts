import mongoose, { Document, model, Schema } from 'mongoose';

export interface StockDocument extends Document {
  user: any;
  symbol: string;
  timestamp: Date;
  stockData: Object;
}

const stockSchema = new Schema<StockDocument>({

  symbol : {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    // required: true,
  },
  // open: {
  //   type: Number,
  //   required: true,
  // },
  // high: {
  //   type: Number,
  //   required: true,
  // },
  // low: {
  //   type: Number,
  //   required: true,
  // },
  // close: {
  //   type: Number,
  //   required: true,
  // },
  stockData: {
    type: Object,
    required: true
  }

},
{
  timestamps: true
});

export default model<StockDocument>('Stock', stockSchema);
