import Lead from "../models/Lead.js";
import Quotation from "../models/Quotation.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

const getQuotationAccessQuery = (user) => {
  const role = String(user?.role || "").toLowerCase();

  if (role === "admin" || role === "manager" || role === "founder") {
    return {};
  }

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

export const createQuotation = async (req, res, next) => {
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
      items,
      discount,
      tax,
      inclusions,
      exclusions,
      terms,
      status,
      assignedTo,
    } = req.body;

    if (!customerName || !phone || !destination) {
      res.status(400);
      throw new Error("Customer name, phone and destination are required");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("At least one quotation item is required");
    }

    const finalAssignedTo = assignedTo || req.user._id;

    const assignedUser = await User.findById(finalAssignedTo).lean();

    if (!assignedUser) {
      res.status(404);
      throw new Error("Assigned user not found");
    }

    if (!["manager", "sales"].includes(assignedUser.role)) {
      res.status(400);
      throw new Error("Quotation can be assigned only to manager or sales");
    }

    const quotation = await Quotation.create({
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
      items,
      discount,
      tax,
      inclusions,
      exclusions,
      terms,
      status,
      assignedTo: finalAssignedTo,
      createdBy: req.user._id,
    });

    if (lead) {
      const existingLead = await Lead.findById(lead);

      if (existingLead && existingLead.status !== "converted") {
        existingLead.status = "interested";
        await existingLead.save();
      }
    }

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: populatedQuotation,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", status, assignedTo } = req.query;

    const query = {
      ...getQuotationAccessQuery(req.user),
    };

    if (status) query.status = status;

    if (assignedTo && ["admin", "manager"].includes(req.user.role)) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { quotationNo: { $regex: search, $options: "i" } },
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

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Quotation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: quotations,
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

export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      ...getQuotationAccessQuery(req.user),
    })
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .populate("convertedToBooking", "customerName totalAmount bookingStatus")
      .lean();

    if (!quotation) {
      res.status(404);
      throw new Error("Quotation not found");
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      ...getQuotationAccessQuery(req.user),
    });

    if (!quotation) {
      res.status(404);
      throw new Error("Quotation not found");
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
      "items",
      "discount",
      "tax",
      "inclusions",
      "exclusions",
      "terms",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        quotation[field] = req.body[field];
      }
    });

    if (
      req.body.assignedTo !== undefined &&
      ["admin", "manager"].includes(req.user.role)
    ) {
      quotation.assignedTo = req.body.assignedTo;
    }

    await quotation.save();

    const updatedQuotation = await Quotation.findById(quotation._id)
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: updatedQuotation,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      res.status(404);
      throw new Error("Quotation not found");
    }

    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "admin" && role !== "manager" && role !== "founder") {
      res.status(403);
      throw new Error("Only admin or manager can delete quotation");
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const convertQuotationToBooking = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      ...getQuotationAccessQuery(req.user),
    });

    if (!quotation) {
      res.status(404);
      throw new Error("Quotation not found");
    }

    if (quotation.status === "converted" && quotation.convertedToBooking) {
      res.status(400);
      throw new Error("Quotation already converted to booking");
    }

    const booking = await Booking.create({
      lead: quotation.lead || undefined,

      customerName: quotation.customerName,
      phone: quotation.phone,
      email: quotation.email,
      destination: quotation.destination,

      travelDate: quotation.travelDate,
      returnDate: quotation.returnDate,

      adults: quotation.adults || 1,
      children: quotation.children || 0,

      packageName: quotation.packageName || quotation.destination,

      totalAmount: quotation.totalAmount || 0,
      paidAmount: 0,
      pendingAmount: quotation.totalAmount || 0,

      bookingStatus: "confirmed",
      paymentStatus: "unpaid",

      assignedTo: quotation.assignedTo,
      createdBy: req.user._id,

      notes: `Created from quotation ${quotation.quotationNo}`,
    });

    quotation.status = "converted";
    quotation.convertedToBooking = booking._id;
    await quotation.save();

    if (quotation.lead) {
      await Lead.findByIdAndUpdate(quotation.lead, {
        status: "converted",
        convertedAt: new Date(),
      });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("lead", "name phone email destination status")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Quotation converted to booking successfully",
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};
