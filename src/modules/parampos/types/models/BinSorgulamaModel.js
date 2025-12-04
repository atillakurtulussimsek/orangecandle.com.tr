import Joi from "joi";

export const BinSorgulamaModel = (data) => {
  const schema = Joi.object({
    BIN: Joi.string()
      .length(6)
      .allow("")
      .messages({
        "string.base": "BIN kodu bir metin olmalıdır",
        "string.length": "BIN kodu 6 veya 8 karakter olmalıdır",
      })
      .custom((value, helpers) => {
        if (value && value.length !== 6 && value.length !== 8) {
          return helpers.error("string.length");
        }
        return value;
      }),
  });

  return schema.validate(data);
};
