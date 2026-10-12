import { Schema, model, Types } from "mongoose";
export interface IProject {
  title: string;
  framework: string;
  databaseEngine:
    | "mongodb"
    | "postgresql"
    | "mysql"
    | "mariadb"
    | "sqlite"
    | "cockroachdb"
    | "dynamodb"
    | "firebase";
  userId: Types.ObjectId;
  canvasState: { nodes: unknown[]; edges: unknown[] };
  dbSchema: unknown[];
  prdContent: string;
  auditTrail: Array<{
    actorId: Types.ObjectId;
    action: string;
    createdAt: Date;
  }>;
}
const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    framework: { type: String, default: "express-ts" },
    databaseEngine: {
      type: String,
      enum: [
        "mongodb",
        "postgresql",
        "mysql",
        "mariadb",
        "sqlite",
        "cockroachdb",
        "dynamodb",
        "firebase",
      ],
      default: "mongodb",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    canvasState: {
      nodes: { type: [Schema.Types.Mixed], default: [] },
      edges: { type: [Schema.Types.Mixed], default: [] },
    },
    dbSchema: { type: [Schema.Types.Mixed], default: [] },
    prdContent: { type: String, default: "" },
    auditTrail: {
      type: [
        {
          actorId: { type: Schema.Types.ObjectId, ref: "User" },
          action: { type: String, maxlength: 160 },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);
export const Project = model<IProject>("Project", projectSchema);
