import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type ProjectStatus = "active" | "archived" | "trashed";

export interface IProject extends Document {
  title: string;
  templateId: Types.ObjectId;
  owner: Types.ObjectId;
  modifiedBy: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    modifiedBy: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "archived", "trashed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

ProjectSchema.index({ owner: 1, title: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
ProjectSchema.index({ owner: 1, updatedAt: -1 });
ProjectSchema.index({ owner: 1, status: 1, updatedAt: -1 });

const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
