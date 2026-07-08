# Product Marketing Context

*Last updated: 2026-07-08*

> **STATUS: V1 DRAFT — auto-drafted from `CONTEXT.md` and the domain model.**
> Lines marked `⚠️ ASSUMPTION` are my best guess — confirm or correct them.
> Lines marked `❓ NEEDS INPUT` are gaps only you can fill.

## Product Overview
**One-liner:** Galton lets you ask your own trading history a question — in real time, before you take the trade.

**What it does:** Galton is a real-time behavioral tool, not a post-hoc journal. In the middle of a session, before committing to a trade, you consult your own track record: Galton gives a TRADE / NO-TRADE verdict from your historical success ratio, shows how often you'd have been right when you sat out ("no-entry win rate"), and lets you interrogate your own past behavior in the moment that matters. It also captures trades and voice notes, and turns your freeform reflections into AI weekly coaching on what to fix.

**Product category:** Real-time trading-discipline / behavioral tool. Adjacent shelf is "trading journal," but the wedge is that competitors review the *past* while Galton acts in the *present*. ⚠️ Decide whether to fight on the crowded "trading journal" search term or define a new category ("in-the-moment discipline").

**Product type:** Mobile app (iOS/Android via Expo), freemium SaaS. ❓ NEEDS INPUT: is web in scope, or mobile-only at launch?

**Business model:** Freemium. Free core (journal + real-time verdict) with a paid tier for AI coaching / advanced behavioral insight. ⚠️ Confirm exactly where the free/paid line sits — this drives the waitlist's founding-member framing.

## Target Audience
**Target customer:** Retail day traders (stocks/futures/forex/crypto) who over-trade and struggle with discipline — profits given back to impulsive, emotional, and revenge trades.

**Primary use case:** Consulting their own past behavior *in real time, mid-session*, to decide whether to take the trade in front of them.

**Jobs to be done:**
- "In this moment, before I click, remind me what I actually do in situations like this." (real-time behavioral recall)
- "Stop me from making the impulsive trade I'll regret." (discipline / self-control)
- "Show me the value of the trades I *didn't* take." (validate restraint)
- "Tell me honestly whether I'm actually getting better or just busy." (objective self-review)

**Use cases:**
- Pre-trade gut-check: tap Add Trade → see TRADE/NO-TRADE verdict + current win rate before committing
- Post-session review: mark a session reviewed, log outcomes, capture a voice note while it's fresh
- Weekly self-coaching: read the AI report surfacing recurring mistakes and strengths from your own notes

## Personas
*(B2C — single user, no buying committee. Skipped.)*

## Problems & Pain Points
**Core problem:** Most traders don't lose because they can't read a chart — they lose because they can't stop themselves. Impulsive, emotional, revenge trades wreck otherwise-decent strategies. ⚠️ ASSUMPTION on emphasis — confirm this is the wound you want to lead with.

**Why alternatives fall short:**
- Generic journals (Edgewear, TraderSync, Tradervue) are *record-keeping* — passive logs you fill out after the fact. They don't intervene *before* the trade, and journaling feels like a chore people abandon.
- Spreadsheets require discipline to even maintain — the very thing the trader lacks.
- Broker analytics show P&L, not behavior patterns, and never quantify the value of restraint.

**What it costs them:** Blown accounts, failed prop-firm evaluations, months of "progress" erased by a handful of tilt trades, and the demoralizing sense of not knowing if they're actually improving.

**Emotional tension:** Frustration ("why do I keep doing this?"), self-doubt, and the shame of self-sabotage — knowing the mistake as you make it and doing it anyway.

## Competitive Landscape
**The category insight:** Every established tool is **retrospective** — you review trades *after* they happen. Galton is the only one built for the **moment of decision**. That timing difference *is* the positioning. Don't let Galton get filed as "another journal."

**Direct (retrospective journals):** TraderSync / Tradervue / Edgewonk — full-featured, but analysis-heavy, desktop-first, and passive: they log and review after the fact. None answer "should I take *this* trade?" in real time. ⚠️ Confirm these are the names your audience actually compares against.
**Secondary:** Spreadsheets / Notion templates — free and flexible, but require the discipline the user is missing and give zero in-the-moment feedback.
**Indirect:** "Just trade the plan" willpower / trading-psychology books & courses — knowledge without a system that enforces it at the moment of temptation.

## Differentiation
**Key differentiators:**
- **Real-time behavioral recall** — you consult your own history *mid-session, before you act*. Every competitor is retrospective. This is the category-defining wedge.
- **The TRADE / NO-TRADE verdict from *your own* history** — a decision engine, not a logbook. Intervenes before the trade, not after.
- **The "no-entry win rate"** — quantifies how often you'd have been right when you sat out. Nobody else rewards *restraint*.
- **Voice-first journaling** — capture reflections by speaking; the AI reads them back to you as coaching.
- **AI weekly coaching report** — narrative "what to fix today" pulled from your own words, not a dashboard of numbers.
- **The Galton name/story** — regression to the mean, probability over gut feeling. The brand *is* the thesis.

**How we do it differently:** We turn the trader's own data into an accountability partner that acts *before* the trade and celebrates the trades they wisely skipped.

**Why that's better:** Discipline is the actual bottleneck. A tool that enforces it beats a tool that merely records the damage.

**Why customers choose us:** It's the only journal that answers "should I take *this* trade?" using their own numbers, and the only one that proves the money they made by *not* trading.

## Objections
| Objection | Response |
|-----------|----------|
| "A 50%-win-rate rule is too simplistic to gate my trades." | The verdict is a discipline mirror, not a black-box signal — it reflects *your* edge back at you and is fixed at the decision moment so you can't rationalize after. ⚠️ confirm framing. |
| "I already have a journal / spreadsheet." | Those record the damage. Galton intervenes before it and shows what your restraint is worth. |
| "Will my trades/notes be private and secure?" | ❓ NEEDS INPUT — privacy/security stance for financial data. |
| "Another subscription?" | ❓ depends on monetization decision. |

**Anti-persona:** Long-term buy-and-hold investors, algo/systematic traders who don't make discretionary in-the-moment decisions, and anyone wanting market signals/tips (Galton reflects *your* behavior, it doesn't predict markets).

## Switching Dynamics
**Push:** Tired of blowing up accounts on impulsive trades; retrospective journals never stop the trade in the moment; can't tell if they're improving.
**Pull:** Answers from their own history *before* the trade; proof that sitting out pays; coaching in their own words.
**Habit:** Trading on gut/adrenaline; abandoning after-the-fact journals after a week.
**Anxiety:** "Will the app second-guess a trade I know is good?" / "Is it just another thing to maintain mid-session?" — address with low-friction, glanceable real-time recall and the reframe that it's a mirror, not a boss.

## Customer Language
❓ NEEDS INPUT — replace with **verbatim** phrases from real traders (Reddit, Discord, reviews, your own interviews). Placeholders below:
**How they describe the problem:**
- "I keep revenge trading and giving back all my profits."
- "I know the rules, I just don't follow them."
- "I don't know if I'm actually getting better."
**How they describe us:** *(to be captured post-launch)*
**Words to use:** discipline, restraint, edge, your own numbers, before the trade, sit out, track record, tilt, revenge trade, consistency
**Words to avoid:** signals, tips, predictions, guaranteed, get rich, "beat the market" (Galton is about behavior, not market-timing claims)
**Glossary:**
| Term | Meaning |
|------|---------|
| TRADE / NO-TRADE verdict | The app's recommendation at decision time, based on the user's success ratio (≥50% → TRADE) |
| No-entry win rate | How often the user would have been right on trades they observed but didn't enter |
| Success ratio | (profit + breakeven) / (profit + breakeven + loss), across all closed trades |
| Session | A group of trades on a given day |
| Reviewed | User has looked back over a session and cleared it off their plate |

## Brand Voice
**Tone:** Calm & disciplined. Zen, minimalist, anti-hype. Trading as a craft of patience — deliberately counter-positioned against the loud, gambling-culture, adrenaline-driven trading apps. Never uses fear, FOMO, or hype to sell (that would contradict the product's whole thesis).
**Style:** Quiet, plain, unhurried. Short declarative sentences. Confidence through restraint, not volume. Lets the numbers and the idea speak.
**Personality:** Disciplined, honest, precise, understated, on-your-side. The steady voice in your ear that says "you don't have to take this one."

## Proof Points
❓ NEEDS INPUT — pre-launch, so no metrics/testimonials yet.
**Value themes:**
| Theme | Proof (to be gathered) |
|-------|------------------------|
| Discipline before the trade | The TRADE/NO-TRADE verdict engine |
| Restraint pays | The no-entry win rate metric |
| Improve with self-awareness | AI weekly coaching report |
| Honesty about your edge | Verdict frozen at decision time — no post-hoc rationalizing |

## Goals
**Business goal:** Validate demand and build a pre-launch email list.
**Conversion action:** Join the waitlist (email capture).
**Current metrics:** Pre-launch — none yet.
