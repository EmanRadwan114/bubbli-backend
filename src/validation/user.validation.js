import Ajv from "ajv";
import ajvFormats from "ajv-formats";
import ajvErrors from "ajv-errors";

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv); // For custom error messages
ajvFormats(ajv); // Add support for formats like 'email', 'date', etc.

const updateUserSchema = {
  type: "object",
  properties: {
    oldPassword: {
      type: "string",
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@_$-])[A-Za-z\\d@_$-]{8,}$",
    },
    newPassword: {
      type: "string",
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@_$-])[A-Za-z\\d@_$-]{8,}$",
    },
    email: {
      type: "string",
      format: "email",
    },
    address: {
      type: "array",
      minLength: 0,
    },
    name: {
      type: "string",
      minLength: 3,
    },
    image: {
      type: "string",
      format: "uri",
    },
    phone: {
      type: "string",
      pattern: "^01[0125][0-9]{8}$",
    },
    isPhoneVerified: {
      type: "boolean",
    },
  },
  additionalProperties: false,
  errorMessage: {
    properties: {
      oldPassword: "password must be at least 8 characters, including uppercase, lowercase, a number, and a special character.",
      newPassword: "password must be at least 8 characters, including uppercase, lowercase, a number, and a special character.",
      email: "please enter a valid email address.",
      address: "address must be at least 5 characters.",
      name: "name must be at least 3 characters.",
      image: "image must be a valid URL.",
      phone: "phone must be a valid Egyptian number (e.g., 010xxxxxxxx).",
      isPhoneVerified: "isPhoneVerified must be true or false.",
    },
    additionalProperties: "unexpected extra property in request body.",
  },
};

const updateUserValidation = ajv.compile(updateUserSchema);

export default { updateUserValidation };
