import mongoose, {Schema, Document} from "mongoose";

export interface IOtp extends Document{
    phone: string;
    code: string;
}

const otpSchema: Schema = new Schema(
    {
        phone: {
            type: String,
            // required: true,
        },

        eemail: {
            type: String,
            // required: true
        },

        code: {
            type: String,
            required: true,
        },

        createdAt: {
            type: Date,
            default: Date.now(),
        }
    },

    {
        timestamps: true
    }
);

export default mongoose.model<IOtp>('Otp', otpSchema);