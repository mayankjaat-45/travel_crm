import ActivityLog from "../models/ActivityLog.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";

const getLeadAccessQuery = (user) => {
  if (user.role === "admin" || user.role === "manager") {
    return {};
  }

  return { assignedTo: user._id };
};

export const createLead = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      destination,
      travelDate,
      returnDate,
      adults,
      children,
      budget,
      source,
      priority,
      assignedTo,
      notes,
      nextFollowUpDate,
    } = req.body;

    if (!name || !phone) {
      res.status(400);
      throw new Error("Name and phone are required");
    }

    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo).lean();

      if (!assignedUser) {
        res.status(404);
        throw new Error("Assigned user not found");
      }

      if (!["manager", "sales"].includes(assignedUser.role)) {
        res.status(400);
        throw new Error("Lead can be assigned only to manager or sales member");
      }
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      destination,
      travelDate,
      returnDate,
      adults,
      children,
      budget,
      source,
      priority,
      assignedTo,
      notes,
      nextFollowUpDate,
      status: assignedTo ? "assigned" : "new",
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      lead: lead._id,
      user: req.user._id,
      action: "lead_created",
      message: `Lead created by ${req.user.name}`,
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: populatedLead,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      source,
      priority,
      assignedTo,
    } = req.query;

    const query = {
      ...getLeadAccessQuery(req.user),
    };

    if (status) query.status = status;
    if (source) query.source = source;
    if (priority) query.priority = priority;

    if (assignedTo && ["manager", "admin"].includes(req.user.role)) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Math.min(Number(limit) || 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Lead.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: leads,
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

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      ...getLeadAccessQuery(req.user),
    })
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    const activities = await ActivityLog.find({ lead: lead._id })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        lead,
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      ...getLeadAccessQuery(req.user),
    });

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    const allowedFields = [
      "name",
      "phone",
      "email",
      "destination",
      "travelDate",
      "returnDate",
      "adults",
      "children",
      "budget",
      "source",
      "priority",
      "notes",
      "nextFollowUpDate",
      "lostReason",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    await lead.save();

    await ActivityLog.create({
      lead: lead._id,
      user: req.user._id,
      action: "lead_updated",
      message: `Lead updated by ${req.user.name}`,
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    next(error);
  }
};

export const assignLead = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      res.status(400);
      throw new Error("Assigned user is required");
    }

    const assignedUser = await User.findById(assignedTo).lean();

    if (!assignedUser) {
      res.status(404);
      throw new Error("Assigned user not found");
    }

    if (!["manager", "sales"].includes(assignedUser.role)) {
      res.status(400);
      throw new Error("Lead can be assigned only to manager or sales member");
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    lead.assignedTo = assignedTo;
    lead.status = "assigned";

    await lead.save();

    await ActivityLog.create({
      lead: lead._id,
      user: req.user._id,
      action: "lead_assigned",
      message: `Lead assigned by ${req.user.name}`,
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(200).json({
      success: true,
      message: "Lead assigned successfully",
      data: updatedLead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status, lostReason } = req.body;

    if (!status) {
      res.status(400);
      throw new Error("Status is required");
    }

    const allowedStatus = [
      "new",
      "assigned",
      "contacted",
      "interested",
      "follow_up",
      "converted",
      "not_interested",
      "lost",
    ];

    if (!allowedStatus.includes(status)) {
      res.status(400);
      throw new Error("Invalid lead status");
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...getLeadAccessQuery(req.user),
    });

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    lead.status = status;

    if (status === "converted") {
      lead.convertedAt = new Date();
    }

    if (status === "lost") {
      lead.lostReason = lostReason || "";
    }

    await lead.save();

    await ActivityLog.create({
      lead: lead._id,
      user: req.user._id,
      action: "status_updated",
      message: `Lead status changed to ${status} by ${req.user.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    await ActivityLog.deleteMany({ lead: lead._id });
    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
