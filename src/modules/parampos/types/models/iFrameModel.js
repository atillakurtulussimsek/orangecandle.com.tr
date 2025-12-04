import Joi from "joi";

export const iFrameModel = (data) => {
  const schema = Joi.object({
    GSM: Joi.string()
      .length(10)
      .pattern(/^[1-9][0-9]{9}$/)
      .allow("") // Allow empty string
      .messages({
        "string.pattern.base":
          "Telefon numarası 10 haneli olmalı ve başında 0 olmamalı",
        "string.empty": '"GSM" alanı boş bırakılamaz',
      }),
    Amount: Joi.string()
      .pattern(/^\d+,\d{2}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Tutar geçerli bir formatta olmalı. Örneğin: 10000,50 (binlik ayırıcı olmadan, virgülle ondalık)",
      }),
    Order_ID: Joi.string().min(1).max(36).required().messages({
      "string.max": "Sipariş numarası en fazla 36 karakter olmalıdır",
    }),
    TransactionId: Joi.string()
      .allow("")
      .messages({
        "string.pattern.base":
          "İşlem ID en fazla 36 karakter olmalı ve 'r|' ile başlamalıdır",
      }),
    Callback_URL: Joi.string()
      .max(250)
      .required()
      .messages({
        "string.pattern.base":
          "Geçerli bir URL giriniz (örn: r|https://example.com)",
        "string.max": "Callback URL en fazla 250 karakter olabilir",
      }),
    Installment: Joi.number()
      .integer()
      .min(0)
      .max(99)
      .allow(null, "") // Allow null or empty string
      .required()
      .messages({
        "number.base": "Taksit sayısı bir sayı olmalı",
        "number.min": "Taksit sayısı en az 0 olabilir",
        "number.max": "Taksit sayısı en fazla 99 olabilir",
      }),
    MaxInstallment: Joi.string()
      .pattern(/^[0-9]+$/) // Matches 'r|' followed by a numeric value
      .messages({
        "string.pattern.base":
          "Max taksit sayısı geçerli bir sayı formatında olmalı (örn: r|12)",
      })
      .custom((value, helper) => {
        // Convert to a number after removing the prefix
        const numericValue = parseInt(value.replace(/^r\|/, ""), 10);
        if (numericValue < 0 || numericValue > 99) {
          return helper.message("Max taksit sayısı 0 ile 99 arasında olmalı");
        }
        return numericValue;
      }),
  });

  return schema.validate(data);
};
