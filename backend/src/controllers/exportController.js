import ExcelJS from "exceljs";
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

const sendWorkbook = async (res, workbook, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

export const exportLeads = async (req, res, next) => {
  try {
    const query = getAccessQuery(req.user);

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");

    sheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Destination", key: "destination", width: 22 },
      { header: "Status", key: "status", width: 18 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Source", key: "source", width: 18 },
      { header: "Budget", key: "budget", width: 15 },
      { header: "Assigned To", key: "assignedTo", width: 25 },
      { header: "Created By", key: "createdBy", width: 25 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];

    leads.forEach((lead) => {
      sheet.addRow({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || "",
        destination: lead.destination || "",
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        budget: lead.budget || 0,
        assignedTo: lead.assignedTo?.name || "",
        createdBy: lead.createdBy?.name || "",
        createdAt: lead.createdAt
          ? new Date(lead.createdAt).toLocaleString("en-IN")
          : "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    await sendWorkbook(res, workbook, "travel-crm-leads.xlsx");
  } catch (error) {
    next(error);
  }
};

export const exportBookings = async (req, res, next) => {
  try {
    const query = getAccessQuery(req.user);

    const bookings = await Booking.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bookings");

    sheet.columns = [
      { header: "Customer", key: "customerName", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Destination", key: "destination", width: 22 },
      { header: "Package", key: "packageName", width: 25 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Paid Amount", key: "paidAmount", width: 15 },
      { header: "Pending Amount", key: "pendingAmount", width: 15 },
      { header: "Booking Status", key: "bookingStatus", width: 18 },
      { header: "Payment Status", key: "paymentStatus", width: 18 },
      { header: "Assigned To", key: "assignedTo", width: 25 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];

    bookings.forEach((booking) => {
      sheet.addRow({
        customerName: booking.customerName,
        phone: booking.phone,
        email: booking.email || "",
        destination: booking.destination,
        packageName: booking.packageName || "",
        totalAmount: booking.totalAmount || 0,
        paidAmount: booking.paidAmount || 0,
        pendingAmount: booking.pendingAmount || 0,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        assignedTo: booking.assignedTo?.name || "",
        createdAt: booking.createdAt
          ? new Date(booking.createdAt).toLocaleString("en-IN")
          : "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    await sendWorkbook(res, workbook, "travel-crm-bookings.xlsx");
  } catch (error) {
    next(error);
  }
};

export const exportQuotations = async (req, res, next) => {
  try {
    const query = getAccessQuery(req.user);

    const quotations = await Quotation.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quotations");

    sheet.columns = [
      { header: "Quotation No", key: "quotationNo", width: 18 },
      { header: "Customer", key: "customerName", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Destination", key: "destination", width: 22 },
      { header: "Package", key: "packageName", width: 25 },
      { header: "Subtotal", key: "subTotal", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Tax", key: "tax", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Assigned To", key: "assignedTo", width: 25 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];

    quotations.forEach((quotation) => {
      sheet.addRow({
        quotationNo: quotation.quotationNo,
        customerName: quotation.customerName,
        phone: quotation.phone,
        email: quotation.email || "",
        destination: quotation.destination,
        packageName: quotation.packageName || "",
        subTotal: quotation.subTotal || 0,
        discount: quotation.discount || 0,
        tax: quotation.tax || 0,
        totalAmount: quotation.totalAmount || 0,
        status: quotation.status,
        assignedTo: quotation.assignedTo?.name || "",
        createdAt: quotation.createdAt
          ? new Date(quotation.createdAt).toLocaleString("en-IN")
          : "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    await sendWorkbook(res, workbook, "travel-crm-quotations.xlsx");
  } catch (error) {
    next(error);
  }
};

export const exportPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "booking",
        select:
          "customerName phone email destination packageName totalAmount paidAmount pendingAmount assignedTo createdBy",
      })
      .populate("receivedBy", "name email role")
      .sort({ paymentDate: -1 })
      .lean();

    const role = getRole(req.user);

    const filteredPayments =
      role === "admin" || role === "manager" || role === "founder"
        ? payments
        : payments.filter((payment) => {
            return (
              String(payment.booking?.assignedTo) === String(req.user._id) ||
              String(payment.booking?.createdBy) === String(req.user._id)
            );
          });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "Customer", key: "customerName", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Destination", key: "destination", width: 22 },
      { header: "Package", key: "packageName", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Mode", key: "paymentMode", width: 18 },
      { header: "Payment Date", key: "paymentDate", width: 22 },
      { header: "Received By", key: "receivedBy", width: 25 },
      { header: "Remarks", key: "remarks", width: 35 },
    ];

    filteredPayments.forEach((payment) => {
      sheet.addRow({
        customerName: payment.booking?.customerName || "",
        phone: payment.booking?.phone || "",
        destination: payment.booking?.destination || "",
        packageName: payment.booking?.packageName || "",
        amount: payment.amount || 0,
        paymentMode: payment.paymentMode,
        paymentDate: payment.paymentDate
          ? new Date(payment.paymentDate).toLocaleString("en-IN")
          : "",
        receivedBy: payment.receivedBy?.name || "",
        remarks: payment.remarks || "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    await sendWorkbook(res, workbook, "travel-crm-payments.xlsx");
  } catch (error) {
    next(error);
  }
};
