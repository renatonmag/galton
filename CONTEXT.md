# Galton

A personal trading journal. The user logs trades against predefined market patterns to build historical statistics, then uses those statistics to get a probabilistic recommendation before entering future trades.

## Language

**Strategy**:
A named trading approach defined by the user. Contains one or more Setups.
_Avoid_: plan

**Setup**:
A named market pattern within a Strategy. Has a list of Characteristics. Historical statistics (Win Rate) are tracked per Setup.
_Avoid_: pattern, signal, configuration

**Characteristic**:
An observable criterion attached to a Setup. Can be a boolean (present/absent) or a multiple-choice selection. Used to evaluate whether a Setup is present in a market situation.
_Avoid_: criterion, condition, rule, attribute

**Log Entry**:
The record of one trade evaluation: which Setup was identified, what Recommendation was made, and what Result followed. The core unit of the journal.
_Avoid_: trade, entry, record, log

**Recommendation**:
The app's output after identifying a Setup: **TRADE** if mathematical expectation is positive, **NO TRADE** if negative. Entirely computed — the user does not input this.
_Avoid_: decision, suggestion, signal

**Result**:
Whether the Recommendation proved correct. ✓ (success) or ✗ (failure). For TRADE: the trade was profitable. For NO TRADE: the setup would have been a loss. Optional — a Log Entry may exist without a Result while the trade is still open or outcome unknown.
_Avoid_: outcome, performance

**Profit**:
The monetary gain on a TRADE Log Entry. Logged alongside Loss to capture the risk-reward ratio used in the Mathematical Expectation formula.
_Avoid_: gain, return

**Loss**:
The actual monetary loss realized on a TRADE Log Entry. Logged alongside Profit to capture the risk-reward ratio used in the Mathematical Expectation formula.
_Avoid_: drawdown

**Comment**:
Free-text note attached to a Log Entry. May be produced by voice transcription.
_Avoid_: note, description, annotation

**History Dashboard**:
A read-only view aggregating all Log Entries. Shows Win Rate and Mathematical Expectation per Setup, and total P&L across all Log Entries.
_Avoid_: history, stats, analytics, reports

**Win Rate**:
The percentage of Log Entries for a given Setup where Result = success.
_Avoid_: accuracy, hit rate, success rate

**Mathematical Expectation**:
The expected value per Log Entry for a given Setup: (Win Rate × average Profit) − (Loss Rate × average Loss). Positive expectation → TRADE. Negative → NO TRADE. The signal that drives the Recommendation. Requires at least 10 Log Entries; displayed as "insufficient data" below that threshold.
_Avoid_: expected value, EV, edge

**Trading Session**:
A user-created container that groups one or more Log Entries from a single trading session. Auto-named by date. Each voice or text input within a Trading Session produces exactly one Log Entry. A Trading Session is either open (accepting new Log Entries and Results) or closed (read-only).
_Avoid_: session, live mode, play mode
