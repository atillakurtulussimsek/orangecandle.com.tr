import Joi from "joi";
export const OnProvizyonIptalModel = (data) => {
  const schema = Joi.object({
    Prov_ID: Joi.string().allow(""),
    Siparis_ID: Joi.string().required(),
  });
  return schema.validate(data);
};