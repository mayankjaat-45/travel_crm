import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: {
      type: String,
      unique: true,
      index: true,
    },

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

    items: {
      type: [quotationItemSchema],
      default: [],
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    inclusions: {
      type: String,
      trim: true,
    },

    exclusions: {
      type: String,
      trim: true,
    },

    terms: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "converted"],
      default: "draft",
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

    convertedToBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  { timestamps: true },
);

quotationSchema.pre("save", async function () {
  const subTotal = this.items.reduce((sum, item) => {
    return sum + Number(item.quantity || 1) * Number(item.price || 0);
  }, 0);

  this.subTotal = subTotal;

  const discount = Number(this.discount || 0);
  const tax = Number(this.tax || 0);

  this.totalAmount = Math.max(subTotal - discount + tax, 0);

  if (!this.quotationNo) {
    const count = await mongoose.model("Quotation").countDocuments();
    this.quotationNo = `QT-${String(count + 1).padStart(5, "0")}`;
  }
});

quotationSchema.index({ assignedTo: 1, createdAt: -1 });
quotationSchema.index({ createdBy: 1, createdAt: -1 });
quotationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Quotation", quotationSchema);
