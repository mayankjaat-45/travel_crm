import ActivityLog from "../models/ActivityLog.js";
import FollowUp from "../models/FollowUp.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";

const getFollowUpAccessQuery = (user) => {
  if (user.role === "admin" || user.role === "manager") {
    return {};
  }

  return { assignedTo: user._id };
};

export const createFollowUp = async (req, res, next) => {
  try {
    const { lead, followUpDate, followUpTime, remarks, assignedTo } = req.body;

    if (!lead || !followUpDate || !assignedTo) {
      res.status(404);
      throw new Error("Leads, FollowUpDate and assigned user are required");
    }

    const existingLead = await Lead.findById(lead);

    if (!existingLead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    const assignedUser = await User.findById(assignedTo).lean();

    if (!assignedUser) {
      res.status(404);
      throw new Error("Assigned User not found");
    }

    if (!["manager", "sales"].includes(assignedUser.role)) {
      res.status(400);
      throw new Error("follow-up can be assigned only to manager or sales");
    }

    const followUp = await FollowUp.create({
      lead,
      followUpDate,
      followUpTime,
      remarks,
      assignedTo,
      createdBy: req.user._id,
    });

    existingLead.nextFollowUpDate = followUpDate;

    if (existingLead.status !== "converted") {
      existingLead.status = "follow_up";
    }

    await existingLead.save();

    await ActivityLog.create({
      lead,
      user: req.user._id,
      action: "follow_up_created",
      message: `Follow-up created by ${req.user.name}`,
    });

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate("lead", "name email phone destination status priority")
      .populate("assignedTo", "name email phone role")
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Follow_up Created Successfully",
      data: populatedFollowUp,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowUps = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      assignedTo,
      fromDate,
      toDate,
      type,
    } = req.query;

    const query = {
      ...getFollowUpAccessQuery(req.user),
    };

    if (status) query.status = status;

    if (assignedTo && ["admin", "manager"].includes(req.user.role)) {
      query.assignedTo = assignedTo;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (type === "today") {
      query.followUpDate = {
        $gte: todayStart,
        $lte: todayEnd,
      };
    } else if (type === "overdue") {
      query.followUpDate = {
        $lt: todayStart,
      };
      query.status = "pending";
    } else if (fromDate || toDate) {
      query.followUpDate = {};

      if (fromDate) {
        query.followUpDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        query.followUpDate.$lte = new Date(toDate);
      }
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Math.min(Number(limit) || 20, 100);
    const skip = (pageNumber - 1) * pageSize;

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate("lead", "name email phone destination status priority")
        .populate("assignedTo", "name email phone role")
        .populate("createdBy", "name email role")
        .sort({ followUpDate: 1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      FollowUp.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: followUps,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOne({
      _id: req.params.id,
      ...getFollowUpAccessQuery(req.user),
    });

    if (!followUp) {
      res.status(404);
      throw new Error("follow-up not found");
    }

    const { followUpDate, followUpTime, remarks, status, assignedTo } =
      req.body;

    if (followUpDate !== undefined) followUp.followUpDate = followUpDate;
    if (followUpTime !== undefined) followUp.followUpTime = followUpTime;
    if (remarks !== undefined) followUp.remarks = remarks;
    if (status !== undefined) followUp.status = status;

    if (
      assignedTo !== undefined &&
      ["admin", "manager"].includes(req.user.role)
    ) {
      followUp.assignedTo = assignedTo;
    }

    await followUp.save();

    await ActivityLog.create({
      lead: followUp.lead,
      user: req.user._id,
      action: "follow_up_updated",
      message: `Follow-up updated by ${req.user.name}`,
    });

    const updatedFollowUp = await FollowUp.findById(followUp._id)
      .populate("lead", "name email phone destination status priority")
      .populate("assignedTo", "name email phone role")
      .lean();

    res.status(200).json({
      success: true,
      message: "follow-up Updated successfully",
      data: updatedFollowUp,
    });
  } catch (error) {
    next(error);
  }
};

//delete follow Up
export const deleteFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      res.status(404);
      throw new Error("follow-up not found");
    }

    if (
      req.user.role === "sales" &&
      String(followUp.assignedTo) !== String(req.user._id)
    ) {
      res.status(403);
      throw new Error("you are not allowed to delete this follow-up");
    }

    await ActivityLog.create({
      lead: followUp.lead,
      user: req.user._id,
      action: "follow_up_deleted",
      message: `Follow-up deleted by ${req.user.name}`,
    });
    await followUp.deleteOne();

    res.status(200).json({
      success: true,
      message: "follow-up Deleted Successfully",
    });
  } catch (error) {
    next(error);
  }
};
