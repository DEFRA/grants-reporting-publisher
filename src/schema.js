import Joi from "joi";

const accountId = Joi.alternatives()
  .try(Joi.string().max(50), Joi.number())
  .custom(String);

export const eventSchema = Joi.object({
  user: Joi.string().max(50).allow(""),
  sessionId: Joi.string().max(50).allow(""),
  correlationId: Joi.string().max(50).required(),
  datetime: Joi.date().iso().required(),
  version: Joi.string().max(10).required(),
  application: Joi.string().max(30).required(),
  service: Joi.string().max(30).required(),
  eventData: Joi.object({
    accounts: Joi.object({
      sbi: accountId,
    }).default({}),
    status: Joi.string().max(120).allow(""),
    details: Joi.object().default({}),
  }).required(),
}).required();

export const configSchema = Joi.object({
  snsClient: Joi.object().required(),
  sns: Joi.object({
    topicArn: Joi.string().required(),
  }).required(),
  version: Joi.string().max(10),
  generateCorrelationId: Joi.boolean(),
  service: Joi.string().max(30),
  application: Joi.string().max(30),
}).required();
