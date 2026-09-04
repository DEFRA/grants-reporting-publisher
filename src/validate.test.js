import { validateReportingEvent } from "./validate.js";
import { AGREEMENT_CREATED, AGREEMENT_STATUS_CHANGED } from "./constants.js";

const validBase = {
  correlationId: "abc-123",
  datetime: "2025-12-01T12:51:41.381Z",
  version: "1.0.0",
  application: "FCP001",
  service: "grants",
};

const eventDataPayload = {
  eventType: AGREEMENT_STATUS_CHANGED,
  agreementId: "WMP123456789",
  agreementStatus: "ACCEPTED",
  statusDate: "2025-12-01T12:51:41.381Z",
  sbi: "abc123",
};

describe("validateReportingEvent", () => {
  describe("valid events", () => {
    test("accepts event with basic account data only", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(true);
      expect(result.value).toBeDefined();
    });

    test("accepts optional agreementStatus and details fields", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_STATUS_CHANGED,
          agreementId: "WMP123456789",
          agreementStatus: "created",
          statusDate: "2025-12-01T12:51:41.381Z",
          details: { agreementId: "agreement_456" },
        },
      });
      expect(result.valid).toBe(true);
    });

    test("normalises the validated value (converts datetime to Date object)", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(true);
      expect(result.value.datetime).toBeInstanceOf(Date);
    });
  });

  describe("invalid events", () => {
    test("returns valid:false when eventData is null", () => {
      const result = validateReportingEvent({ ...validBase, eventData: null });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"eventData" must be of type object');
    });

    test("returns valid:false when eventData is absent", () => {
      const result = validateReportingEvent({ ...validBase });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"eventData" is required');
    });

    test("returns valid:false when correlationId is missing", () => {
      const { correlationId: _, ...event } = validBase;
      const result = validateReportingEvent({
        ...event,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("correlationId"))).toBe(true);
    });

    test("returns valid:false when datetime is missing", () => {
      const { datetime: _, ...event } = validBase;
      const result = validateReportingEvent({
        ...event,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("datetime"))).toBe(true);
    });

    test("returns valid:false when application is missing", () => {
      const { application: _, ...event } = validBase;
      const result = validateReportingEvent({
        ...event,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("application"))).toBe(true);
    });

    test("returns valid:false when version exceeds max length", () => {
      const result = validateReportingEvent({
        ...validBase,
        version: "x".repeat(11),
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    });

    test("returns valid:false when eventType is invalid", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          ...eventDataPayload,
          eventType: "INVALID_EVENT_TYPE",
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        '"eventData.eventType" must be one of [AGREEMENT_CREATED, AGREEMENT_STATUS_CHANGED]',
      );
    });

    test("returns multiple errors with abortEarly:false", () => {
      const result = validateReportingEvent({ eventData: eventDataPayload });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("Agreement created events", () => {
    test("accepts a valid Agreement created event", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
          agreementType: "WOODLAND",
          agreementStatus: "ACCEPTED",
          agreementStartDate: "2026-09-01",
          agreementEndDate: "2029-08-31",
          agreementValue: 1575.0,
          sbi: "200000001",
          options: [],
        },
      });
      expect(result.valid).toBe(true);
    });

    test("accepts Agreement created event with options", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
          agreementType: "WOODLAND",
          agreementStatus: "ACCEPTED",
          sbi: "200000001",
          options: [
            {
              parcelReference: "SD8545-9935",
              parcelSizeUnderAgreement: 15.75,
              optionCode: "WMP1",
              optionYear: 1,
              optionStartDate: "2026-09-01",
              optionEndDate: "2029-08-31",
              optionQuantity: 15.75,
              optionValue: 1575.0,
            },
          ],
        },
      });
      expect(result.valid).toBe(true);
    });

    test("accepts Agreement created event without optional fields", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
          agreementType: "WOODLAND",
          agreementStatus: "ACCEPTED",
          sbi: "200000001",
          options: [],
        },
      });
      expect(result.valid).toBe(true);
    });

    test("accepts Agreement created event with minimal options", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
          agreementType: "WOODLAND",
          agreementStatus: "ACCEPTED",
          sbi: "200000001",
          options: [
            {
              parcelReference: "SD8545-9935",
              optionCode: "WMP1",
              optionStartDate: "2026-09-01",
              optionEndDate: "2029-08-31",
              optionQuantity: 15.75,
              optionValue: 1575.0,
            },
          ],
        },
      });
      expect(result.valid).toBe(true);
    });

    test("rejects Agreement created event if required fields are missing", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"eventData.agreementType" is required');
      expect(result.errors).toContain(
        '"eventData.agreementStatus" is required',
      );
      expect(result.errors).toContain('"eventData.sbi" is required');
      expect(result.errors).toContain('"eventData.options" is required');
    });

    test("rejects Agreement created event if options contain invalid data", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_CREATED,
          agreementId: "WMP123456789",
          agreementType: "WOODLAND",
          agreementStatus: "ACCEPTED",
          sbi: "200000001",
          options: [
            {
              agreementId: "WMP123456789",
              // missing mandatory option fields
            },
          ],
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        '"eventData.options[0].parcelReference" is required',
      );
    });
  });

  describe("Agreement status changed events", () => {
    test("accepts a valid Agreement status changed event with all fields", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_STATUS_CHANGED,
          agreementId: "WMP123456789",
          agreementStatus: "ACCEPTED",
          agreementStartDate: "2026-09-01",
          agreementEndDate: "2029-08-31",
          statusDate: "2026-09-02T10:00:00Z",
          agreementValue: 1575.0,
        },
      });
      expect(result.valid).toBe(true);
    });

    test("accepts a valid Agreement status changed event with all fields including userId", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_STATUS_CHANGED,
          agreementId: "WMP123456789",
          agreementStatus: "ACCEPTED",
          agreementStartDate: "2026-09-01",
          agreementEndDate: "2029-08-31",
          statusDate: "2026-09-02T10:00:00Z",
          agreementValue: 1575.0,
          userId: "user-123",
        },
      });
      expect(result.valid).toBe(true);
    });

    test("accepts a valid Agreement status changed event with only mandatory fields", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_STATUS_CHANGED,
          agreementId: "WMP123456789",
          agreementStatus: "ACCEPTED",
          statusDate: "2026-09-02T10:00:00Z",
        },
      });
      expect(result.valid).toBe(true);
    });

    test("rejects Agreement status changed event if required fields are missing", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          eventType: AGREEMENT_STATUS_CHANGED,
          agreementId: "WMP123456789",
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        '"eventData.agreementStatus" is required',
      );
      expect(result.errors).toContain('"eventData.statusDate" is required');
    });
  });
});
