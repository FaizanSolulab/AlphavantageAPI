import {Schema, model, Document} from "mongoose";

export interface IUser extends Document {
    phoneNumber: string;
    email: string;
    password: string;
    verified: boolean;
    accessToken: string;
    searchedSymbols: string[];
}

const userSchema = new Schema<IUser>({
    phoneNumber: {
        type: String,
        // required: true,
        unique: true,
    },

    email:{
      type: String,
      // required: true,
      unique: true,
    },

    password: {
        type: String,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      searchedSymbols:{
        type: [String],
        default: [],
      },
},
{
    timestamps: true
  }
);

export default model<IUser>('User', userSchema);