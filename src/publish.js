import crypto from "node:crypto";
import { PublishCommand } from "@aws-sdk/client-sns";
import { validateReportingEvent } from "./validate.js";
import { configSchema } from "./schema.js";

const DEFAULT_VERSION = "1.0.0";
const DEFAULT_SERVICE = "grants";

function applyDefaults(event, config) {
  const defaults = {
    datetime: new Date().toISOString(),
    version: config.version ?? DEFAULT_VERSION,
    service: config.service ?? DEFAULT_SERVICE,
    ...(config.generateCorrelationId && { correlationId: crypto.randomUUID() }),
    ...(config.application && { application: config.application }),
  };

  return { ...defaults, ...event };
}

export async function publishReportingEvent(event, config) {
  const { error: configError } = configSchema.validate(config, {
    abortEarly: false,
  });

  if (configError) {
    throw new Error(
      `Invalid config: ${configError.details.map((d) => d.message).join(", ")}`,
    );
  }

  const merged = applyDefaults(event, config);

  const { valid, errors } = validateReportingEvent(merged);

  if (!valid) {
    throw new Error(`Invalid reporting event: ${errors.join(", ")}`);
  }

  const { snsClient, sns } = config;

  const result = await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify(merged),
      TopicArn: sns.topicArn,
    }),
  );

  return { messageId: result.MessageId };
}
