# Product Marketing Context

*Last updated: 2026-07-08*

> **STATUS: V1 DRAFT — auto-drafted from `CONTEXT.md` and the domain model.**
> Lines marked `⚠️ ASSUMPTION` are my best guess — confirm or correct them.
> Lines marked `❓ NEEDS INPUT` are gaps only you can fill.

## Product Overview
**One-liner:** Galton lets you ask your own trading history a question — in real time, before you take the trade.

**What it does:** Galton is a real-time behavioral tool, not a post-hoc journal. In the middle of a session, before committing to a trade, you consult your own track record: Galton gives a TRADE / NO-TRADE verdict from your historical success ratio, shows how often you'd have been right when you sat out ("no-entry win rate"), and lets you interrogate your own past behavior in the moment that matters. It also captures trades and voice notes, and turns your freeform reflections into AI weekly coaching on what to fix.

**Product category:** **Trading journal — anchored, then subverted.** DECIDED: claim the familiar, searchable "trading journal" category (retail day traders already search it and understand the shelf) rather than pioneering a new category (which would cost time/copy just to explain what kind of thing Galton is). Then immediately break the frame: *"a trading journal you use **before** the trade, not after."* The word "journal" orients; the twist is the hook. Use the contrast against retrospective journals as the core positioning device.

**Product type:** Mobile app (iOS/Android via Expo), freemium SaaS. ❓ NEEDS INPUT: is web in scope, or mobile-only at launch?

**Business model:** Freemium. Free core (journal + real-time verdict) with a paid tier for AI coaching / advanced behavioral insight. ⚠️ Confirm exactly where the free/paid line sits — this drives the waitlist's founding-member framing.

## Positioning & Hero (DECIDED)
**Positioning statement:** For retail day traders who give back profits to impulsive trades, Galton is the trading journal you open *before* the trade, not after — it answers "knowing my own history, should I take this?" in the moment, and shows what the trades you skipped were worth.

**Hero headline (chosen):**
> **Ask your own track record before you take the trade.**
> Galton reads your trading behavior back to you and shows your path to consistency — in the moment you need it most, before you give it back.

*Note: deliberately "consistency," not "profit" — a behavioral outcome Galton genuinely produces, in the audience's own language, without slipping into the get-rich/hype register the brand avoids.*

**Category strategy:** Anchor + subvert — "trading journal," but used *before* the trade. Lead with the behavior-mirror angle; use the no-entry win rate ("the trades you don't take are worth something — we prove it") as the standout supporting section.

**Mental models to lean on:** Contrast effect (vs. retrospective journals), loss aversion (given-back profits > missed gains), JTBD (hiring self-control, not a logbook), zero-price effect (free to start, no card), anti-hype as trust (calm brand = "one of us" among gambling-culture apps).

## Landing Page — Main Flow Section (DECIDED)
**Replaces the traditional "features grid" as the primary how-it-works area.** For a timing-based product, a *sequence* conveys the differentiator (before the trade, not after) in a way a static grid cannot. Showing the loop *is* the argument that Galton isn't another retrospective journal.

**The section:** one continuous, real-time loop that happens mid-session in seconds — not an onboarding/setup guide. Frame around the tempo of a live decision. Three connected beats (Rule of Three; reads as "simple, on purpose" — matches the calm voice).

**Section intro:** "One decision, before you click." / "Here's how a moment with Galton goes — mid-session, in seconds."

1. **Capture — "Add a trade or a thought."** Absorbs voice-first journaling. Job: get it in without breaking focus (one tap for the trade, a few words for the thought behind it). Mechanism: *activation energy* — frictionless on purpose, since friction is why past journals got abandoned. The only step the user *does* — keep it feather-light. Subcopy: "One tap for the trade in front of you. A few words for what's going through your head. No forms, no ritual — the part that used to be a chore is the part you barely notice."
2. **Consult your own record — "It searches your rules, your past behavior, your do's and don'ts."** Job: put the user's own rules, do's/don'ts, and prior behavior in this situation back in front of them at the moment they'd ignore it. Mechanism: *contrast effect* (silently separates from retrospective tools). Subcopy: "Galton reads back the rules you set, the do's and don'ts you wrote for yourself, and how you've actually behaved in moments like this — your own record, in front of you, at the moment you'd usually ignore it."
3. **The disciplined path — "And finds the most disciplined path."** Absorbs the verdict and the no-entry win rate implicitly. Job: point to the move the user's own record supports, including when the honest answer is to sit out. Mechanism: *loss aversion, inverted*. End by handing agency back ("the pause is still yours"). This is the payoff beat — give it the most weight; the "mirror, not master" reframe lives here and pre-empts the "too crude" objection without naming it. Subcopy: "A clear read on the move your own record supports — including when the honest answer is to sit this one out. The pause is still yours. Galton just makes sure you take it with your eyes open."

**Design/voice guardrails:** show tempo (one connected vertical motion, numbered beats — not disconnected cards); plain short declarative copy, one headline + 1–2 sentences per beat; no badges / "AI-powered ✨"; one CTA at the end (join the waitlist), not per beat; never surface any win-rate rule/threshold/formula or the R:R objection here. Keep AI weekly coaching out of this section — it's a different time horizon and not part of the real-time loop.

**Future-version note:** In a later iteration of the landing page, each feature deserves its own full section (verdict, no-entry win rate, voice journaling, AI coaching each expanded). The main-flow loop is the v1 primary how-it-works area that integrates all four compactly; the per-feature sections are the planned expansion once there's more to show and prove.

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
**Core problem (CONFIRMED framing):** Most traders don't lose because they can't read a chart — they lose because they can't stop themselves. Impulsive, emotional, revenge trades wreck otherwise-decent strategies.

**The villain framing — "not your fault, but your responsibility" (governs ALL copy):**
Name the problem honestly as a *discipline* problem (traders respect being leveled with — don't euphemize it). But never shame the trader: it's not their fault (they're human, the pressure is real, and every journal they tried only showed up *after* the damage). It IS their responsibility to fix — and responsibility needs the right tool. This gives ownership without shame (a stoic frame: dichotomy of control — same lineage as the Galton name). NEVER use shame/blame ("stop sabotaging yourself"); NEVER excuse it away either ("it's not you, it's the situation"). Always: honest name → absolve fault → hand back agency → Galton is the instrument of that responsibility.

**Problem narrative (site-ready arc):**
> You already know how to trade. You just can't always trust yourself to do it.
> Let's be honest about what this is: a discipline problem. The rules are clear before the session. Then the market opens, adrenaline takes over, and you take the trade you swore off — then chase it, then give a good week back in an afternoon.
> It's not your fault. You're human, the pressure is real, and every journal you've tried only ever showed up *after* the damage was done.
> But it is your responsibility. And responsibility needs the right tool — one that meets you *before* the trade, not after.

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

## Objection Handling — Principles
- **R:R limitation: don't mention it proactively (DECIDED).** The "mirror, not master" frame makes it irrelevant. Keep the full rebuttal in the FAQ only, for skeptics who go looking. Calm brands say less — don't manufacture an objection casual visitors would never have.
- **Market the behavior, not the formula (DECIDED).** The win-rate/50% threshold is a *placeholder rule* that will change. NEVER feature the literal "50%" or the specific formula as the defining mechanism — it will date the copy and invite the "arbitrary threshold" attack. Always write at the purpose altitude ("puts your own record in front of you before you act"), which stays true no matter how the underlying rule evolves.

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
**Words to use:** consistency (primary aspiration word), path to consistency, discipline, restraint, edge, your own numbers/track record, before the trade, sit out, tilt, revenge trade, give it back / given-back profits
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
