export const cleanPhone = (phone) => {
  if (!phone) return "";

  let value = String(phone).replace(/\D/g, "");

  if (value.length === 10) {
    value = `91${value}`;
  }

  return value;
};

export const openWhatsApp = (phone, message = "") => {
  const clean = cleanPhone(phone);

  if (!clean) {
    alert("Phone number not available");
    return;
  }

  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
};

export const leadWhatsAppMessage = (lead) => {
  return `Hello ${lead?.name || ""}, thanks for contacting us for ${
    lead?.destination || "your travel enquiry"
  }. Our team will assist you shortly.`;
};

export const bookingConfirmationMessage = (booking) => {
  return `Hello ${booking?.customerName || ""}, your booking for ${
    booking?.destination || "your trip"
  } has been created. Total amount: ₹${Number(
    booking?.totalAmount || 0,
  ).toLocaleString("en-IN")}.`;
};

export const paymentReminderMessage = (booking) => {
  return `Hello ${booking?.customerName || ""}, your pending payment for ${
    booking?.packageName || booking?.destination || "your travel booking"
  } is ₹${Number(booking?.pendingAmount || 0).toLocaleString(
    "en-IN",
  )}. Please complete the payment to confirm your travel arrangements.`;
};

export const quotationMessage = (quotation) => {
  return `Hello ${quotation?.customerName || ""}, your travel quotation for ${
    quotation?.destination || "your trip"
  } is ready. Total quotation amount: ₹${Number(
    quotation?.totalAmount || 0,
  ).toLocaleString("en-IN")}.`;
};
