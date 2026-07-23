import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createMember = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      res.status(400);
      throw new Error("Name, email, phone, password and role are required");
    }

    const allowedRole = ["manager", "sales"];

    if (!allowedRole.includes(role)) {
      res.status(400);
      throw new Error("Only manager and sales role can be created");
    }

    if (req.user.role === "manager" && role === "manager") {
      res.status(403);
      throw new Error("Manager cannot create another manager");
    }

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      res.status(400);
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      success: true,
      message: "Team member created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { name, phone, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role === "admin" && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Only admin can update admin");
    }

    if (role === "admin") {
      res.status(403);
      throw new Error("Admin role cannot be assigned from here");
    }

    if (role && !["manager", "sales"].includes(role)) {
      res.status(400);
      throw new Error("Only manager or sales role can be assigned");
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      res.status(403);
      throw new Error("Admin cannot be deleted");
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Member deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};
