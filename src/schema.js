import Joi from "joi";
import { AGREEMENT_CREATED, AGREEMENT_STATUS_CHANGED } from "./constants.js";

const MAX_30 = 30;
const MAX_50 = 50;

const accountId = Joi.alternatives()
  .try(Joi.string().max(MAX_50), Joi.number())
  .custom(String);

export const eventSchema = Joi.object({
  correlationId: Joi.string().max(MAX_50).required(),
  datetime: Joi.date().iso().required(),
  version: Joi.string().max(10).required(),
  application: Joi.string().max(MAX_30).required(),
  service: Joi.string().max(MAX_30).required(),
  eventData: Joi.object({
    eventType: Joi.string()
      .valid(AGREEMENT_CREATED, AGREEMENT_STATUS_CHANGED)
      .required(),
  })
    .when(Joi.object({ eventType: AGREEMENT_CREATED }).unknown(), {
      then: Joi.object({
        agreementId: Joi.string().required(),
        agreementType: Joi.string().required(),
        agreementStatus: Joi.string().required(),
        agreementStartDate: Joi.date().iso().optional(),
        agreementEndDate: Joi.date().iso().optional(),
        agreementValue: Joi.number().optional(),
        sbi: accountId.required(),
        options: Joi.array()
          .items(
            Joi.object({
              parcelReference: Joi.string().allow("").required(),
              parcelSizeUnderAgreement: Joi.number().optional(),
              optionCode: Joi.string().required(),
              optionYear: Joi.number().integer().optional(),
              optionStartDate: Joi.date().iso().required(),
              optionEndDate: Joi.date().iso().required(),
              optionQuantity: Joi.number().required(),
              optionValue: Joi.number().required(),
            }),
          )
          .required(),
      }),
    })
    .when(Joi.object({ eventType: AGREEMENT_STATUS_CHANGED }).unknown(), {
      then: Joi.object({
        agreementId: Joi.string().required(),
        agreementStatus: Joi.string().required(),
        statusDate: Joi.date().iso().required(),
        agreementStartDate: Joi.date().iso().optional(),
        agreementEndDate: Joi.date().iso().optional(),
        agreementValue: Joi.number().optional(),
        userId: Joi.string().optional(),
      }),
    })
    .unknown()
    .required(),
}).required();

export const configSchema = Joi.object({
  snsClient: Joi.object().required(),
  sns: Joi.object({
    topicArn: Joi.string().required(),
  }).required(),
  version: Joi.string().max(10),
  generateCorrelationId: Joi.boolean(),
  service: Joi.string().max(MAX_30),
  application: Joi.string().max(MAX_30),
}).required();
