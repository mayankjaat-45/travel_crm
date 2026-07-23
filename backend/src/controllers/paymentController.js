import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const getBookingAccessQuery = (user) => {
  const role = String(user?.role || "").toLowerCase();

  if (role === "admin" || role === "manager" || role === "founder") {
    return {};
  }

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

const refreshBookingPayment = async (bookingId) => {
  const payments = await Payment.find({ booking: bookingId }).lean();

  const paidAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  const booking = await Booking.findById(bookingId);

  if (!booking) return null;

  booking.paidAmount = paidAmount;
  booking.pendingAmount = Math.max(
    Number(booking.totalAmount || 0) - paidAmount,
    0,
  );

  if (Number(booking.totalAmount || 0) <= 0 || paidAmount <= 0) {
    booking.paymentStatus = "unpaid";
  } else if (paidAmount >= Number(booking.totalAmount || 0)) {
    booking.paymentStatus = "paid";
  } else {
    booking.paymentStatus = "partial";
  }

  await booking.save();

  return booking;
};

export const createPayment = async (req, res, next) => {
  try {
    const { booking, amount, paymentMode, paymentDate, remarks } = req.body;

    if (!booking || !amount) {
      res.status(400);
      throw new Error("Booking and amount are required");
    }

    if (Number(amount) <= 0) {
      res.status(400);
      throw new Error("Payment amount must be greater than 0");
    }

    const existingBooking = await Booking.findOne({
      _id: booking,
      ...getBookingAccessQuery(req.user),
    });

    if (!existingBooking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const payment = await Payment.create({
      booking,
      amount: Number(amount),
      paymentMode,
      paymentDate,
      remarks,
      receivedBy: req.user._id,
    });

    await refreshBookingPayment(booking);

    const populatedPayment = await Payment.findById(payment._id)
      .populate(
        "booking",
        "customerName phone destination totalAmount paidAmount pendingAmount paymentStatus",
      )
      .populate("receivedBy", "name email role")
      .lean();

    const updatedBooking = await Booking.findById(booking)
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: {
        payment: populatedPayment,
        booking: updatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findOne({
      _id: bookingId,
      ...getBookingAccessQuery(req.user),
    }).lean();

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const payments = await Payment.find({ booking: bookingId })
      .populate("receivedBy", "name email role")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error("Payment not found");
    }

    const booking = await Booking.findOne({
      _id: payment.booking,
      ...getBookingAccessQuery(req.user),
    }).lean();

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "admin" && role !== "manager" && role !== "founder") {
      res.status(403);
      throw new Error("Only admin or manager can delete payment");
    }

    const bookingId = payment.booking;

    await payment.deleteOne();

    await refreshBookingPayment(bookingId);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
