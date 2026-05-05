import axios from "axios";

export const sendWhatsAppMessage = async (
  phone: string,
  message: string
) => {
  const API_TOKEN = process.env.WASEL_API_TOKEN;
  const INSTANCE_ID = process.env.WASEL_INSTANCE_ID;

  if (!API_TOKEN || !INSTANCE_ID) {
    console.error("WhatsApp API credentials missing");
    return null;
  }

  // أرقام فقط
  const formattedPhone = phone.replace(/\D/g, "");

  try {
    const response = await axios.post(
      `https://api.wapilot.net/api/v2/${INSTANCE_ID}/send-message`,
      {
        chat_id: `${formattedPhone}@c.us`, // مهم جدًا
        text: message,
      },
      {
        headers: {
          token: API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
    return null;
  }
};

export const sendVerificationWhatsApp = async (
  phone: string,
  code: string
) => {
  const message = `كود التفعيل الخاص بك في Silver Glow هو: ${code}\n\nيرجى عدم مشاركة هذا الكود مع أي شخص.`;

  return await sendWhatsAppMessage(phone, message);
};
