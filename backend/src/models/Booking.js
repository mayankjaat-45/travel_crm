import mongoose from "mongoose";
import { truncateSync } from "node:fs";

const bookingSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },
    customerName: {
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
      required: true,
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
    packageName: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "pending", "cancelled", "completed"],
      default: "confirmed",
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
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", function () {
  const total = Number(this.totalAmount || 0);
  const paid = Number(this.paidAmount || 0);

  this.pendingAmount = Math.max(total - paid, 0);

  if (total <= 0 || paid <= 0) {
    this.paymentStatus = "unpaid";
  } else if (paid >= total) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
});

bookingSchema.index({
  assignedTo: 1,
  createdAt: -1,
});
bookingSchema.index({ createdBy: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

export default mongoose.model("Booking", bookingSchema);
