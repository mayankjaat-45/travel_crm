import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "card", "cheque", "other"],
      default: "upi",
      index: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ booking: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
