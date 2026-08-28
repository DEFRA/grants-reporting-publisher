import { validateReportingEvent } from "./validate.js";

const validBase = {
  correlationId: "abc-123",
  datetime: "2025-12-01T12:51:41.381Z",
  version: "1.0.0",
  application: "FCP001",
  service: "grants",
};

const eventDataPayload = {
  accounts: {
    sbi: "abc123",
  },
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

    test("accepts optional status and details fields", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: {
          status: "created",
          details: { agreementId: "agreement_456" },
        },
      });
      expect(result.valid).toBe(true);
    });

    test("normalises the validated value (applies joi defaults)", () => {
      const result = validateReportingEvent({
        ...validBase,
        eventData: eventDataPayload,
      });
      expect(result.valid).toBe(true);
      expect(result.value.eventData.details).toEqual({});
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

    test("returns multiple errors with abortEarly:false", () => {
      const result = validateReportingEvent({ eventData: eventDataPayload });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
