import { publishReportingEvent } from "./publish.js";

const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ MessageId: "msg-001" }),
);

vi.mock("@aws-sdk/client-sns", () => ({
  PublishCommand: vi.fn(function (input) {
    Object.assign(this, input);
  }),
}));

const { PublishCommand } = await import("@aws-sdk/client-sns");

const baseConfig = {
  snsClient: { send: mockSend },
  sns: { topicArn: "arn:aws:sns:eu-west-2:000000000000:fcp-audit" },
};

const validEvent = {
  correlationId: "abc-123",
  datetime: "2025-12-01T12:51:41.381Z",
  version: "1.0.0",
  application: "FCP001",
  eventData: {
    status: "created",
  },
};

describe("publishAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ MessageId: "msg-001" });
  });

  describe("defaults", () => {
    test("applies datetime default when not set in event", async () => {
      const { datetime: _, ...eventWithoutDatetime } = validEvent;
      await publishReportingEvent(eventWithoutDatetime, baseConfig);
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.datetime).toBeDefined();
      expect(() => new Date(msg.datetime)).not.toThrow();
    });

    test("preserves event datetime when already set", async () => {
      await publishReportingEvent(validEvent, baseConfig);
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.datetime).toBe(validEvent.datetime);
    });

    test("applies library default version (1.0.0) when not set in event or config", async () => {
      const { version: _, ...eventWithoutVersion } = validEvent;
      await publishReportingEvent(eventWithoutVersion, baseConfig);
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.version).toBe("1.0.0");
    });

    test("applies config version when not set in event", async () => {
      const { version: _, ...eventWithoutVersion } = validEvent;
      await publishReportingEvent(eventWithoutVersion, {
        ...baseConfig,
        version: "2.0",
      });
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.version).toBe("2.0");
    });

    test("event version wins over config version", async () => {
      await publishReportingEvent(
        { ...validEvent, version: "3.0" },
        { ...baseConfig, version: "2.0" },
      );
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.version).toBe("3.0");
    });

    test("applies application from config when not set in event", async () => {
      const { application: _, ...eventWithout } = validEvent;
      await publishReportingEvent(eventWithout, {
        ...baseConfig,
        application: "DefaultApp",
      });
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.application).toBe("DefaultApp");
    });

    test("event application wins over config application", async () => {
      await publishReportingEvent(
        { ...validEvent, application: "MyApp" },
        { ...baseConfig, application: "DefaultApp" },
      );
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.application).toBe("MyApp");
    });
  });

  describe("correlationId", () => {
    test("generates correlationId when generateCorrelationId:true and event has none", async () => {
      const { correlationId: _, ...eventWithout } = validEvent;
      await publishReportingEvent(eventWithout, {
        ...baseConfig,
        generateCorrelationId: true,
      });
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    });

    test("preserves event correlationId when generateCorrelationId:true", async () => {
      await publishReportingEvent(validEvent, {
        ...baseConfig,
        generateCorrelationId: true,
      });
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.correlationId).toBe("abc-123");
    });

    test("does not generate correlationId when generateCorrelationId:false", async () => {
      const { correlationId: _, ...eventWithout } = validEvent;
      await expect(
        publishReportingEvent(eventWithout, {
          ...baseConfig,
          generateCorrelationId: false,
        }),
      ).rejects.toThrow("Invalid reporting event");
    });
  });

  describe("SNS publishing", () => {
    test("calls PublishCommand with correct TopicArn", async () => {
      await publishReportingEvent(validEvent, baseConfig);
      const cmdArg = PublishCommand.mock.calls[0][0];
      expect(cmdArg.TopicArn).toBe(baseConfig.sns.topicArn);
    });

    test("calls PublishCommand with serialised event", async () => {
      await publishReportingEvent(validEvent, baseConfig);
      const cmdArg = PublishCommand.mock.calls[0][0];
      const msg = JSON.parse(cmdArg.Message);
      expect(msg.application).toBe(validEvent.application);
    });

    test("returns messageId from SNS response", async () => {
      const result = await publishReportingEvent(validEvent, baseConfig);
      expect(result).toEqual({ messageId: "msg-001" });
    });

    test("calls send on provided snsClient", async () => {
      await publishReportingEvent(validEvent, baseConfig);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("event validation", () => {
    test("throws when event is invalid after defaults applied", async () => {
      await expect(
        publishReportingEvent({ correlationId: "abc" }, baseConfig),
      ).rejects.toThrow("Invalid reporting event");
    });

    test("error message includes validation details", async () => {
      await expect(
        publishReportingEvent({ correlationId: "abc" }, baseConfig),
      ).rejects.toThrow(/application/);
    });
  });

  describe("config validation", () => {
    test("throws when snsClient is missing", async () => {
      const { snsClient: _, ...configWithout } = baseConfig;
      await expect(
        publishReportingEvent(validEvent, configWithout),
      ).rejects.toThrow("Invalid config");
    });

    test("throws when sns is missing", async () => {
      const { sns: _, ...configWithout } = baseConfig;
      await expect(
        publishReportingEvent(validEvent, configWithout),
      ).rejects.toThrow("Invalid config");
    });

    test("throws when sns.topicArn is missing", async () => {
      await expect(
        publishReportingEvent(validEvent, { ...baseConfig, sns: {} }),
      ).rejects.toThrow("Invalid config");
    });
  });
});
