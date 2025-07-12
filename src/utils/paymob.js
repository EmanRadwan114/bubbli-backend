import axios from "axios";

const baseURL = "https://accept.paymob.com/api";

export const getAuthToken = async () => {
  const response = await axios.post(`${baseURL}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  });
  return response.data.token;
};

export const createOrder = async (authToken, amountCents, items, order) => {
  const response = await axios.post(`${baseURL}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items,
    merchant_order_id: order._id.toString(), // 🔥 crucial!
  });
  return response.data;
};

export const generatePaymentKey = async (
  authToken,
  orderId,
  amountCents,
  billingdata
) => {
  const response = await axios.post(`${baseURL}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingdata,
    currency: "EGP",
    integration_id: process.env.PAYMOB_INTEGRATION_ID,
    return_url: `https://bubbli-gifts.netlify.app/order-confirmation/${orderId}`, // 👈 Redirects user here after payment
  });

  return response.data.token;
};

export const getIframeUrl = (paymentToken) => {
  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
};

export const refundPaymob = async (transactionId, amountCents) => {
  try {
    const authResponse = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      {
        api_key: process.env.PAYMOB_API_KEY,
      }
    );

    const token = authResponse.data.token;

    const refundResponse = await axios.post(
      "https://accept.paymob.com/api/acceptance/void_refund/refund",
      {
        auth_token: token,
        transaction_id: transactionId,
        amount_cents: amountCents,
      }
    );

    if (refundResponse.data && refundResponse.data.success) {
      return { success: true };
    } else {
      return { success: false, error: refundResponse.data };
    }
  } catch (err) {
    console.error("Refund API error:", err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};
