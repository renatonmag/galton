import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { rollForwardPastWeekend } from "./dailyReports.js";

describe("rollForwardPastWeekend", () => {
  it("leaves a weekday unchanged", () => {
    const friday = DateTime.fromISO("2026-07-03"); // Friday
    expect(rollForwardPastWeekend(friday).toISODate()).toBe("2026-07-03");
  });

  it("rolls a Saturday forward to the following Monday", () => {
    const saturday = DateTime.fromISO("2026-07-04"); // Saturday
    expect(rollForwardPastWeekend(saturday).toISODate()).toBe("2026-07-06");
  });

  it("rolls a Sunday forward to the following Monday", () => {
    const sunday = DateTime.fromISO("2026-07-05"); // Sunday
    expect(rollForwardPastWeekend(sunday).toISODate()).toBe("2026-07-06");
  });
});
