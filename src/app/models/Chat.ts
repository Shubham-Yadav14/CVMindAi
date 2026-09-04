import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IChat extends Document {
  project: Types.ObjectId;
  humanCommand: string;
  aiResponse: string;
  latexCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    humanCommand: { type: String, required: true, trim: true },
    aiResponse: { type: String, default: "" },
    latexCode: { type: String, required: true },
  },
  { timestamps: true },
);

ChatSchema.index({ project: 1, createdAt: -1 });

const Chat: Model<IChat> =
  mongoose.models.Chat ?? mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;