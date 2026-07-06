import { computeRatio } from "../lib/successRatio.js";
import { tradeEntriesForUser } from "./tradeEntries.js";

export const statsService = {
  get: async (userId: string) => {
    const allEntries = await tradeEntriesForUser(userId);

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
