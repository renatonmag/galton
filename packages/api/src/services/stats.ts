import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";
import { computeRatio } from "../lib/successRatio.js";

export const statsService = {
  get: async (userId: string) => {
    const allEntries = await db
      .select({ result: tradeEntries.result, entryAt: tradeEntries.entryAt })
      .from(tradeEntries)
      .innerJoin(sessions, eq(tradeEntries.sessionId, sessions.id))
      .where(eq(sessions.userId, userId));

    let profit = 0;
    let loss = 0;
    let breakeven = 0;
    let open = 0;

    for (const e of allEntries) {
      if (e.result === "profit") profit++;
      else if (e.result === "loss") loss++;
      else if (e.result === "breakeven") breakeven++;
      else open++;
    }

    const closedEntries = allEntries.filter((e) => e.result !== "open");
    const noEntryClosedEntries = closedEntries.filter((e) => e.entryAt === null);

    const successRatio = computeRatio(closedEntries);
    const noEntryWinRate = computeRatio(noEntryClosedEntries);

    return {
      successRatio,
      noEntryWinRate,
      total: allEntries.length,
      profit,
      loss,
      breakeven,
      open,
    };
  },
};
