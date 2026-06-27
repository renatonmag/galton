# Galton

A personal trading journal. The user logs trades against predefined market patterns to build historical statistics, then uses those statistics to get a probabilistic recommendation before entering future trades.

## Language

**Estratégia (Strategy)**:
A named trading approach defined by the user. Contains one or more Setups.
_Avoid_: strategy, plan

**Setup**:
A named market pattern within an Estratégia. Has a list of Características. Historical statistics (Win Rate) are tracked per Setup.
_Avoid_: pattern, signal, configuration

**Característica (Characteristic)**:
An observable criterion attached to a Setup. Can be a boolean (present/absent) or a multiple-choice selection. Used to evaluate whether a Setup is present in a market situation.
_Avoid_: criterion, condition, rule, attribute

**Registro (Log Entry)**:
The record of one trade evaluation: which Setup was identified, what Decisão was made, and what Resultado followed. The core unit of the journal.
_Avoid_: trade, entry, record, log

**Recomendação (Recommendation)**:
The app's output after identifying a Setup: **TRADE** if mathematical expectation is positive, **NO TRADE** if negative. Entirely computed — the user does not input this.
_Avoid_: decision, suggestion, signal

**Resultado (Result)**:
Whether the Recomendação proved correct. ✓ (success) or ✗ (failure). For TRADE: the trade was profitable. For NO TRADE: the setup would have been a loss. Optional — a Registro may exist without a Resultado while the trade is still open or outcome unknown.
_Avoid_: outcome, performance

**Lucro (Profit)**:
The monetary gain on a TRADE Registro. Logged alongside Prejuízo to capture the risk-reward ratio used in the Expectativa Matemática formula.
_Avoid_: gain, return

**Prejuízo (Loss)**:
The actual monetary loss realized on a TRADE Registro. Logged alongside Lucro to capture the risk-reward ratio used in the Expectativa Matemática formula.
_Avoid_: loss, drawdown

**Comentário (Comment)**:
Free-text note attached to a Registro. May be produced by voice transcription.
_Avoid_: note, description, annotation

**Histórico (History Dashboard)**:
A read-only view aggregating all Registros. Shows Win Rate and Expectativa Matemática per Setup, and total P&L across all Registros.
_Avoid_: history, stats, analytics, reports

**Win Rate**:
The percentage of Registros for a given Setup where Resultado = success.
_Avoid_: accuracy, hit rate, success rate

**Expectativa Matemática (Mathematical Expectation)**:
The expected value per Registro for a given Setup: (Win Rate × average Lucro) − (Loss Rate × average Prejuízo). Positive expectation → TRADE. Negative → NO TRADE. The signal that drives the Recomendação. Requires at least 10 Registros; displayed as "dados insuficientes" below that threshold.
_Avoid_: expected value, EV, edge

**Sessão (Trading Session)**:
A user-created container that groups one or more Registros from a single trading session. Auto-named by date. Each voice or text input within a Sessão produces exactly one Registro. A Sessão is either open (accepting new Registros and Resultados) or closed (read-only).
_Avoid_: session, live mode, play mode
