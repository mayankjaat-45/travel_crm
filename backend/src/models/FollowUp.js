import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    followUpDate: {
      type: Date,
      required: true,
      trim: true,
    },
    followUpTime: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "done", "missed", "rescheduled", "cancelled"],
      default: "pending",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamp: true,
  },
);

followUpSchema.index({ followUpDate: 1, assignedTo: 1 });
followUpSchema.index({ status: 1, followUpDate: 1 });

export default mongoose.model("FollowUp", followUpSchema);
