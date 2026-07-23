import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    destination: {
      type: String,
      trim: true,
      index: true,
    },
    travelDate: Date,
    returnDate: Date,
    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    budget: Number,
    source: {
      type: String,
      enum: [
        "website",
        "whatsapp",
        "instagram",
        "facebook",
        "google_ads",
        "referral",
        "call",
        "walk_in",
        "other",
      ],
      default: "other",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "new",
        "assigned",
        "contacted",
        "interested",
        "follow_up",
        "converted",
        "not_interested",
        "lost",
      ],
      default: "new",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    nextFollowUpDate: {
      type: Date,
      index: true,
    },
    convertedAt: Date,
    lostReason: String,
  },
  { timestamps: true },
);

leadSchema.index({ phone: 1, createdBy: 1 });
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

export default mongoose.model("Lead", leadSchema);
