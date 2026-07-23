import Booking from "../models/Booking.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

const getBookingAccessQuery = (user) => {
  if (user.role === "admin" || user.role === "manager") {
    return {};
  }

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

export const createBooking = async (req, res, next) => {
  try {
    const {
      lead,
      customerName,
      phone,
      email,
      destination,
      travelDate,
      returnDate,
      adults,
      children,
      packageName,
      totalAmount,
      paidAmount,
      bookingStatus,
      assignedTo,
      notes,
    } = req.body;

    if (!customerName || !phone || !destination || !totalAmount) {
      res.status(400);
      throw new Error(
        "Customer name, phone, destination and total amount are required",
      );
    }

    let finalAssignedTo = assignedTo || req.user._id;

    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo).lean();

      if (!assignedUser) {
        res.status(404);
        throw new Error("Assigned user not found");
      }

      if (!["manager", "sales"].includes(assignedUser.role)) {
        res.status(400);
        throw new Error("Booking can be assigned only to manager or sales");
      }
    }

    const booking = await Booking.create({
      lead,
      customerName,
      phone,
      email,
      destination,
      travelDate,
      returnDate,
      adults,
      children,
      packageName,
      totalAmount,
      paidAmount,
      bookingStatus,
      assignedTo: finalAssignedTo,
      createdBy: req.user._id,
      notes,
    });

    if (lead) {
      const existingLead = await Lead.findById(lead);

      if (existingLead) {
        existingLead.status = "converted";
        existingLead.convertedAt = new Date();
        await existingLead.save();

        await ActivityLog.create({
          lead: existingLead._id,
          user: req.user._id,
          action: "booking_created",
          message: `Booking created by ${req.user.name}`,
        });
      }
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      bookingStatus,
      paymentStatus,
      assignedTo,
    } = req.query;

    const query = {
      ...getBookingAccessQuery(req.user),
    };

    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (assignedTo && ["admin", "manager"].includes(req.user.role)) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Math.min(Number(limit) || 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      ...getBookingAccessQuery(req.user),
    })
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      ...getBookingAccessQuery(req.user),
    });

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const allowedFields = [
      "customerName",
      "phone",
      "email",
      "destination",
      "travelDate",
      "returnDate",
      "adults",
      "children",
      "packageName",
      "totalAmount",
      "paidAmount",
      "bookingStatus",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        booking[field] = req.body[field];
      }
    });

    if (
      req.body.assignedTo !== undefined &&
      ["admin", "manager"].includes(req.user.role)
    ) {
      booking.assignedTo = req.body.assignedTo;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (!["admin", "manager"].includes(req.user.role)) {
      res.status(403);
      throw new Error("Only admin or manager can delete booking");
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
