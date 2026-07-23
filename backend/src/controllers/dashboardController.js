import Booking from "../models/Booking.js";
import FollowUp from "../models/FollowUp.js";
import Lead from "../models/Lead.js";
import Quotation from "../models/Quotation.js";

const getRole = (user) => {
  return String(user?.role || "").toLowerCase();
};

const isAdminOrManager = (user) => {
  const role = getRole(user);
  return role === "admin" || role === "manager" || role === "founder";
};

const getUserLeadQuery = (user) => {
  if (isAdminOrManager(user)) return {};
  return { assignedTo: user._id };
};

const getUserFollowUpQuery = (user) => {
  if (isAdminOrManager(user)) return {};
  return { assignedTo: user._id };
};

const getUserBookingQuery = (user) => {
  if (isAdminOrManager(user)) return {};

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

const getUserQuotationQuery = (user) => {
  if (isAdminOrManager(user)) return {};

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }],
  };
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const leadQuery = getUserLeadQuery(req.user);
    const followUpQuery = getUserFollowUpQuery(req.user);
    const bookingQuery = getUserBookingQuery(req.user);
    const quotationQuery = getUserQuotationQuery(req.user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      newLeads,
      assignedLeads,
      contactedLeads,
      interestedLeads,
      followUpLeads,
      convertedLeads,
      notInterestedLeads,
      lostLeads,

      todayFollowUps,
      overdueFollowUps,

      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedBookings,
      totalBookingAmountResult,
      pendingPaymentAmountResult,

      totalQuotations,
      draftQuotations,
      sentQuotations,
      acceptedQuotations,
      convertedQuotations,
      rejectedQuotations,
      totalQuotationAmountResult,

      recentLeads,
      todaysFollowUpsList,
      recentBookings,
      recentQuotations,
    ] = await Promise.all([
      Lead.countDocuments(leadQuery),
      Lead.countDocuments({ ...leadQuery, status: "new" }),
      Lead.countDocuments({ ...leadQuery, status: "assigned" }),
      Lead.countDocuments({ ...leadQuery, status: "contacted" }),
      Lead.countDocuments({ ...leadQuery, status: "interested" }),
      Lead.countDocuments({ ...leadQuery, status: "follow_up" }),
      Lead.countDocuments({ ...leadQuery, status: "converted" }),
      Lead.countDocuments({ ...leadQuery, status: "not_interested" }),
      Lead.countDocuments({ ...leadQuery, status: "lost" }),

      FollowUp.countDocuments({
        ...followUpQuery,
        followUpDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        status: "pending",
      }),

      FollowUp.countDocuments({
        ...followUpQuery,
        followUpDate: {
          $lt: todayStart,
        },
        status: "pending",
      }),

      Booking.countDocuments(bookingQuery),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: "confirmed" }),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: "pending" }),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: "cancelled" }),
      Booking.countDocuments({ ...bookingQuery, bookingStatus: "completed" }),

      Booking.aggregate([
        { $match: bookingQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      Booking.aggregate([
        { $match: bookingQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$pendingAmount" },
          },
        },
      ]),

      Quotation.countDocuments(quotationQuery),
      Quotation.countDocuments({ ...quotationQuery, status: "draft" }),
      Quotation.countDocuments({ ...quotationQuery, status: "sent" }),
      Quotation.countDocuments({ ...quotationQuery, status: "accepted" }),
      Quotation.countDocuments({ ...quotationQuery, status: "converted" }),
      Quotation.countDocuments({ ...quotationQuery, status: "rejected" }),

      Quotation.aggregate([
        { $match: quotationQuery },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      Lead.find(leadQuery)
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      FollowUp.find({
        ...followUpQuery,
        followUpDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        status: "pending",
      })
        .populate("lead", "name phone email destination status priority")
        .populate("assignedTo", "name email phone role")
        .sort({ followUpDate: 1 })
        .limit(5)
        .lean(),

      Booking.find(bookingQuery)
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Quotation.find(quotationQuery)
        .populate("lead", "name phone email destination status")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalBookingAmount = totalBookingAmountResult?.[0]?.total || 0;
    const pendingPaymentAmount = pendingPaymentAmountResult?.[0]?.total || 0;
    const totalQuotationAmount = totalQuotationAmountResult?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalLeads,
          newLeads,
          assignedLeads,
          contactedLeads,
          interestedLeads,
          followUpLeads,
          convertedLeads,
          notInterestedLeads,
          lostLeads,

          todayFollowUps,
          overdueFollowUps,

          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          completedBookings,
          totalBookingAmount,
          pendingPaymentAmount,

          totalQuotations,
          draftQuotations,
          sentQuotations,
          acceptedQuotations,
          convertedQuotations,
          rejectedQuotations,
          totalQuotationAmount,
        },

        recentLeads,
        todaysFollowUpsList,
        recentBookings,
        recentQuotations,
      },
    });
  } catch (error) {
    next(error);
  }
};
