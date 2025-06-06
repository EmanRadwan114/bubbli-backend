import Ajv from "ajv";
import ajvErrors from "ajv-errors";

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);

export const createOrderSchema = {
  type: "object",
  additionalProperties: false,
  required: ["shippingAddress", "paymentMethod", "phone"],
  properties: {
    shippingAddress: { type: "string", minLength: 3 },
    paymentMethod: { type: "string", enum: ["cash", "online"] },
    couponCode: { type: "string", minLength: 1 }, // optional coupon code
    phone: { type: "string", pattern: "^01[0125][0-9]{8}$" }, // Egyptian phone number format
  },
  errorMessage: {
    required: {
      shippingAddress:
        "shippingAddress is required and must be a non-empty string",
      paymentMethod:
        "paymentMethod is required and must be either 'cash' or 'online'",
      phone: "phone is required and must be a valid Egyptian number",
    },
    properties: {
      shippingAddress:
        "shippingAddress must be a non-empty string with at least 3 characters",
      paymentMethod: "paymentMethod must be one of 'cash' or 'online'",
      couponCode: "couponCode, if provided, must be a non-empty string",
      phone: "phone must be a valid Egyptian number (e.g., 010xxxxxxxx)",
    },
    additionalProperties: "unexpected extra property in request body",
  },
};

const updateOrderSchema = {
  type: "object",
  properties: {
    shippingStatus: {
      type: "string",
      enum: ["pending", "prepared", "shipped"],
    },
  },
  additionalProperties: false,
  errorMessage: {
    properties: {
      shippingStatus:
        "shipping status must be one of the following: pending, prepared or shipped",
    },
    additionalProperties: "unexpected extra property in request body",
  },
};

const createOrderValidation = ajv.compile(createOrderSchema);
const updateOrderValidation = ajv.compile(updateOrderSchema);

export default { createOrderValidation, updateOrderValidation };
