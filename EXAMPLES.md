# Usage Examples

This page provides examples of how to use the `@defra/grants-reporting-publisher` library to publish reporting events.

## Configuration

To publish events, you need to provide a configuration object that includes an AWS SNS client and the target topic ARN.

```javascript
import { SNSClient } from "@aws-sdk/client-sns";
import {
  publishReportingEvent,
  AGREEMENT_CREATED,
  AGREEMENT_STATUS_CHANGED,
} from "@defra/grants-reporting-publisher";

const snsClient = new SNSClient({ region: "eu-west-2" });

const config = {
  snsClient,
  sns: {
    topicArn: "arn:aws:sns:eu-west-2:123456789012:your-topic-name",
  },
  application: "YOUR_APPLICATION_CODE", // e.g., "GAS or grants-payments-service"
  service: "your-service-name", // optional, defaults to "grants", just omit this for now
  generateCorrelationId: true, // automatically generate a UUID for each event
};
```

## Event Types

### Agreement Created (`AGREEMENT_CREATED`)

Use this event type when a new agreement is created.

```javascript
const agreementCreatedEvent = {
  eventData: {
    eventType: AGREEMENT_CREATED,
    agreementId: "AG-123456",
    agreementType: "WOODLAND",
    agreementStatus: "ACCEPTED",
    agreementStartDate: "2026-01-01",
    agreementEndDate: "2031-12-31",
    agreementValue: 50000.0,
    sbi: "200000001",
    options: [
      {
        parcelReference: "SD8545-9935",
        parcelSizeUnderAgreement: 10.5,
        optionCode: "WD1",
        optionYear: 1,
        optionStartDate: "2026-01-01",
        optionEndDate: "2026-12-31",
        optionQuantity: 10.5,
        optionValue: 10500.0,
      },
    ],
  },
};

try {
  const { messageId } = await publishReportingEvent(
    agreementCreatedEvent,
    config,
  );
  console.log(`Event published with Message ID: ${messageId}`);
} catch (error) {
  console.error("Failed to publish event:", error.message);
}
```

### Agreement Status Changed (`AGREEMENT_STATUS_CHANGED`)

Use this event type when the status of an existing agreement changes.

```javascript
const statusChangedEvent = {
  eventData: {
    eventType: AGREEMENT_STATUS_CHANGED,
    agreementId: "AG-123456",
    agreementStatus: "COMPLETED",
    statusDate: new Date().toISOString(),
    agreementStartDate: "2026-01-01",
    agreementEndDate: "2031-12-31",
    agreementValue: 50000.0,
    userId: "user-uuid-123", // optional
  },
};

try {
  const { messageId } = await publishReportingEvent(statusChangedEvent, config);
  console.log(`Event published with Message ID: ${messageId}`);
} catch (error) {
  console.error("Failed to publish event:", error.message);
}
```

## Validation Only

If you only want to validate an event without publishing it:

```javascript
import { validateReportingEvent } from "@defra/grants-reporting-publisher";

const event = {
  correlationId: "your-correlation-id",
  datetime: new Date().toISOString(),
  version: "1.0.0",
  application: "FCP",
  service: "grants",
  eventData: {
    eventType: AGREEMENT_STATUS_CHANGED,
    agreementId: "AG-123",
    agreementStatus: "ACTIVE",
    statusDate: new Date().toISOString(),
  },
};

const { valid, errors, value } = validateReportingEvent(event);

if (!valid) {
  console.error("Validation errors:", errors);
} else {
  console.log("Event is valid:", value);
}
```
