import mongoose, { InferSchemaType, type Model } from 'mongoose';

const flowRunSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export type FlowRun = InferSchemaType<typeof flowRunSchema>;

export const FlowRunModel: Model<FlowRun> =
  mongoose.models.FlowRun || mongoose.model<FlowRun>('FlowRun', flowRunSchema);
