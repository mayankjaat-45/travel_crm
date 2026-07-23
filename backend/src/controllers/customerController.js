import Booking from "../models/Booking.js";
import Lead from "../models/Lead.js";
import Payment from "../models/Payment.js";
import Quotation from "../models/Quotation.js";

const getRole = (user) => {
  return String(user?.role || "").toLowerCase();
};

const isAdminOrManager = (user) => {
  const role = getRole(user);
  return role === "admin" || role === "manager" || role === "founder";
};

const getAccessQuery = (user) => {
  if (isAdminOrManager(user)) return {};

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

export const getCustomerProfile = async (req, res, next) => {
  try {
    const rawPhone = req.params.phone;

    const phone = normalizePhone(rawPhone);

    if (!phone) {
      res.status(400);
      throw new Error("Phone number is required");
    }

    const accessQuery = getAccessQuery(req.user);

    const phoneRegex = new RegExp(phone.slice(-10), "i");

    const [leads, bookings, quotations] = await Promise.all([
      Lead.find({
        ...accessQuery,
        phone: phoneRegex,
      })
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .lean(),

      Booking.find({
        ...accessQuery,
        phone: phoneRegex,
      })
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .lean(),

      Quotation.find({
        ...accessQuery,
        phone: phoneRegex,
      })
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .populate(
          "convertedToBooking",
          "customerName totalAmount bookingStatus",
        )
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const bookingIds = bookings.map((booking) => booking._id);

    const payments = await Payment.find({
      booking: { $in: bookingIds },
    })
      .populate("booking", "customerName phone destination packageName")
      .populate("receivedBy", "name email role")
      .sort({ paymentDate: -1 })
      .lean();

    const totalBookingAmount = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount || 0),
      0,
    );

    const totalPaidAmount = bookings.reduce(
      (sum, booking) => sum + Number(booking.paidAmount || 0),
      0,
    );

    const totalPendingAmount = bookings.reduce(
      (sum, booking) => sum + Number(booking.pendingAmount || 0),
      0,
    );

    const latest = leads[0] || bookings[0] || quotations[0] || null;

    const customer = {
      name: latest?.name || latest?.customerName || "Customer",
      phone: rawPhone,
      email: latest?.email || "",
      destination:
        latest?.destination ||
        bookings[0]?.destination ||
        quotations[0]?.destination ||
        "",
    };

    res.status(200).json({
      success: true,
      data: {
        customer,
        summary: {
          totalLeads: leads.length,
          totalBookings: bookings.length,
          totalQuotations: quotations.length,
          totalPayments: payments.length,
          totalBookingAmount,
          totalPaidAmount,
          totalPendingAmount,
        },
        leads,
        bookings,
        quotations,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};
