import Joi from "joi";

export const PosOranlariModel = (data) => {
  const schema = Joi.object({
   SanalPOS_ID: Joi.string().allow(""),
  });

  return schema.validate(data);
};
