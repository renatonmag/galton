import { and, eq, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, tradeEntries } from "../db/schema.js";

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
    let noEntryProfit = 0;
    let noEntryLoss = 0;
    let noEntryBreakeven = 0;

    for (const e of allEntries) {
      if (e.result === "profit") profit++;
      else if (e.result === "loss") loss++;
      else if (e.result === "breakeven") breakeven++;
      else open++;

      if (e.entryAt === null && e.result !== "open") {
        if (e.result === "profit") noEntryProfit++;
        else if (e.result === "loss") noEntryLoss++;
        else noEntryBreakeven++;
      }
    }

    const denominator = profit + loss + breakeven;
    const successRatio = denominator === 0 ? null : (profit + breakeven) / denominator;

    const noEntryDenominator = noEntryProfit + noEntryLoss + noEntryBreakeven;
    const noEntryWinRate =
      noEntryDenominator === 0
        ? null
        : (noEntryProfit + noEntryBreakeven) / noEntryDenominator;

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
