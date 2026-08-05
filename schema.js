const joi = require("joi");

module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      title: string().required(),
      description: string().required(),
      location: string().required(),
      country: string().required(),
      price: number().required().min(0),
      image: string().allow("", null),
    })
    .required(),
});
