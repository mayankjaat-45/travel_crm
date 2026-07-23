import Booking from "../models/Booking.js";
import Lead from "../models/Lead.js";
import Quotation from "../models/Quotation.js";

const getRole = (user) => {
  return String(user?.role || "").toLowerCase();
};

const isAdminOrManager = (user) => {
  const role = getRole(user);
  return role === "admin" || role === "manager" || role === "founder";
};

const getUserAccessQuery = (user) => {
  if (isAdminOrManager(user)) {
    return {};
  }

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

export const globalSearch = async (req, res, next) => {
  try {
    const { query = "" } = req.query;

    const searchText = String(query || "").trim();

    if (!searchText) {
      return res.status(200).json({
        success: true,
        data: {
          leads: [],
          bookings: [],
          quotations: [],
        },
      });
    }

    const accessQuery = getUserAccessQuery(req.user);

    const regex = { $regex: searchText, $options: "i" };

    const leadSearchQuery = {
      ...accessQuery,
      $or: [
        { name: regex },
        { phone: regex },
        { email: regex },
        { destination: regex },
        { source: regex },
        { status: regex },
      ],
    };

    const bookingSearchQuery = {
      ...accessQuery,
      $or: [
        { customerName: regex },
        { phone: regex },
        { email: regex },
        { destination: regex },
        { packageName: regex },
        { bookingStatus: regex },
        { paymentStatus: regex },
      ],
    };

    const quotationSearchQuery = {
      ...accessQuery,
      $or: [
        { quotationNo: regex },
        { customerName: regex },
        { phone: regex },
        { email: regex },
        { destination: regex },
        { packageName: regex },
        { status: regex },
      ],
    };

    const [leads, bookings, quotations] = await Promise.all([
      Lead.find(leadSearchQuery)
        .populate("assignedTo", "name email phone role")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Booking.find(bookingSearchQuery)
        .populate("assignedTo", "name email phone role")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Quotation.find(quotationSearchQuery)
        .populate("assignedTo", "name email phone role")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        leads,
        bookings,
        quotations,
      },
    });
  } catch (error) {
    next(error);
  }
};
