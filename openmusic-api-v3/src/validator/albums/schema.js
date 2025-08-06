const Joi = require('@hapi/joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

module.exports = { AlbumPayloadSchema };
