import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  description: string;
  image: string;
  latexCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    latexCode: { type: String, required: true },
  },
  { timestamps: true },
);

const Template: Model<ITemplate> =
  mongoose.models.Template ?? mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;