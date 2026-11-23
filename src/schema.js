import Joi from "joi";
import {
  AGREEMENT_CREATED,
  AGREEMENT_STATUS_CHANGED,
  APPLICATION_CREATED,
  APPLICATION_STATUS_CHANGED,
  CLAIM_SUBMITTED,
} from "./constants.js";

const MAX_30 = 30;
const MAX_50 = 50;

const accountId = Joi.alternatives()
  .try(Joi.string().max(MAX_50), Joi.number())
  .custom(String);

const parcelsSchema = Joi.array().items(Joi.string());

const optionsSchema = Joi.array().items(
  Joi.object({
    parcelReference: Joi.string().allow("").required(),
    parcelSizeUnderAgreement: Joi.number().optional(),
    optionCode: Joi.string().required(),
    optionYear: Joi.number().integer().optional(),
    optionStartDate: Joi.date().iso().optional(),
    optionEndDate: Joi.date().iso().optional(),
    optionQuantity: Joi.number().required(),
    optionValue: Joi.number().required(),
  }),
);

const agreementCreatedEventSchema = Joi.object({
  agreementId: Joi.string().required(),
  agreementType: Joi.string().required(),
  agreementStatus: Joi.string().required(),
  agreementStartDate: Joi.date().iso().optional(),
  agreementEndDate: Joi.date().iso().optional(),
  agreementValue: Joi.number().optional(),
  sbi: accountId.required(),
  parcels: parcelsSchema.required(),
  options: optionsSchema.required(),
});

const agreementStatusChangedEventSchema = Joi.object({
  agreementId: Joi.string().required(),
  agreementStatus: Joi.string().required(),
  statusDate: Joi.date().iso().required(),
  agreementStartDate: Joi.date().iso().optional(),
  agreementEndDate: Joi.date().iso().optional(),
  agreementValue: Joi.number().optional(),
  userId: Joi.string().optional(),
  parcels: parcelsSchema.optional(),
  options: optionsSchema.optional(),
});

const applicationStatusChangedEventSchema = Joi.object({
  applicationId: Joi.string().required(),
  applicationStatus: Joi.string().required(),
  statusDate: Joi.date().iso().required(),
  userId: Joi.string().optional(),
});

const claimSubmittedEventSchema = Joi.object({
  sbi: accountId.required(),
  agreementId: Joi.string().required(),
  claimId: Joi.string().required(),
  claimCode: Joi.string().optional(),
  claimStatus: Joi.string().required(),
  claimReceiptDate: Joi.date().iso().required(),
  claimValue: Joi.number().required(),
  claimPaymentRef: Joi.string().allow("").optional(),
});

const applicationCreatedEventSchema = Joi.object({
  sbi: accountId.required(),
  crn: accountId.required(),
  applicationId: Joi.string().required(),
  applicationType: Joi.string().required(),
  applicationReceiptDate: Joi.date().iso().required(),
  applicantName: Joi.string().optional(),
  applicationPayload: Joi.object().required(),
});

export const eventSchema = Joi.object({
  correlationId: Joi.string().max(MAX_50).required(),
  datetime: Joi.date().iso().required(),
  version: Joi.string().max(10).required(),
  application: Joi.string().max(MAX_30).required(),
  service: Joi.string().max(MAX_30).required(),
  eventData: Joi.object({
    eventType: Joi.string()
      .valid(
        AGREEMENT_CREATED,
        AGREEMENT_STATUS_CHANGED,
        CLAIM_SUBMITTED,
        APPLICATION_CREATED,
        APPLICATION_STATUS_CHANGED,
      )
      .required(),
  })
    .when(Joi.object({ eventType: AGREEMENT_CREATED }).unknown(), {
      then: agreementCreatedEventSchema,
    })
    .when(Joi.object({ eventType: AGREEMENT_STATUS_CHANGED }).unknown(), {
      then: agreementStatusChangedEventSchema,
    })
    .when(Joi.object({ eventType: CLAIM_SUBMITTED }).unknown(), {
      then: claimSubmittedEventSchema,
    })
    .when(Joi.object({ eventType: APPLICATION_CREATED }).unknown(), {
      then: applicationCreatedEventSchema,
    })
    .when(Joi.object({ eventType: APPLICATION_STATUS_CHANGED }).unknown(), {
      then: applicationStatusChangedEventSchema,
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
