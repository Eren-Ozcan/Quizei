# Domina

An absurd-but-true trivia game. The product isn't the answer itself — it's the
"no way!" moment the answer creates.

Built on three question formats:

| Format | Question | Scoring |
|---|---|---|
| **Yes / No** | "Does a cockroach live for days after losing its head?" | Right/wrong + speed bonus |
| **Numeric estimate** | "How many muscles are in an elephant's trunk?" | **Logarithmic** — you score if the order of magnitude is right |
| **Comparison** | "Which is heavier: a cumulus cloud or a blue whale?" | Pick the right side, keep the streak alive |

This is the web app of the
[game-ideas #14 — Fun Facts Arena](https://github.com/Eren-Ozcan/game-ideas/blob/master/ideas/14-fun-facts-arena.tr.md)
idea.

---

## Why logarithmic scoring?

The entire numeric mode rests on this decision. If knowing the exact number were
rewarded, the game would belong to people who memorize trivia. Instead, the score
looks at **how many digits** the estimate is off by:

```
accuracy = max(0, 1 - |log10(estimate / answer)| / 2)
```

- Exact hit → 100%
- Off by 10x → 50%
- Off by 100x → 0

So the question isn't really "how many?", it's "how many zeros?". This gamified
Fermi estimation gives everyone a fair footing, and the logarithmic ruler on the
answer screen teaches the rule at a glance.

## Sourcing policy

Accuracy is the one non-negotiable thing in this product: a single wrong "fact"
going viral would kill the brand. That's why the rule is baked into the code:

- The `source` field is **required** by the type system — a question without a
  source doesn't compile.
- `npm run validate:questions` checks every question at the gate: both languages
  filled in, an https source, a unique id, no duplicate questions.
- Comparison questions must differ by at least **1.15x**. Anything closer counts
  as a coin flip rather than knowledge, and the validator rejects it. (This rule
  actually eliminated a question during development.)
- `npm run check:sources` verifies every source link over the network. Currently
  **128/128** reachable.
- Fast-moving data (net worth, subscriber counts, satellite counts) was
  **deliberately left out** of the pool — it rots within a single season.

The source link on the answer screen is always visible; the player can verify the
claim instantly.

## Modes

- **Daily Five** — The same 5 questions for everyone, picked with a date-derived
  seed (no server). Emoji-grid sharing and daily streak tracking.
- **Arena** — A free 10-question round mixing all three formats.
- **Comparison Streak** — Sudden death. One wrong answer ends the streak.
- **Party** — 2-8 players taking turns on the same device, with a "pass the phone"
  screen in between. Scoreboard at the end plus a "silliest estimate" award.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check + production build (`dist/`) |
| `npm run preview` | Serve the build locally |
| `npm test` | All tests (53) |
| `npm run typecheck` | Type check only |
| `npm run validate:questions` | Question pool integrity check |
| `npm run check:sources` | Verify source links over the network |

## Architecture

No framework — faithful to the idea file's note that it's "technically very light,
no engine needed". Total bundle: **45 kB gzip**.

```
src/
  core/          Game logic, fully independent of the DOM
    types.ts       Question schema (source required)
    scoring.ts     Logarithmic scoring, speed bonus, grading
    rng.ts         Seeded RNG — lets daily mode work without a server
    daily.ts       Date-derived daily question selection
    session.ts     Round state machine (four modes)
    storage.ts     localStorage: streak, high score, accuracy per format
    share.ts       Emoji grid + native share / clipboard fallback
    i18n.ts        TR/EN, language-aware large-number formatting
  data/          168+ questions, in three files by format
  ui/            Screens; they read core, they don't inject dependencies into it
```

The `core` layer never touches browser APIs; the tests can play the game
end-to-end in Node. `tests/app.integration.test.ts` plays all four modes to
completion on jsdom with real clicks.

## Language

TR and EN are first-class from the start: every question carries `tr`/`en` fields
in the data schema, and the validator requires both to be filled in. Numbers are
formatted according to the active language (`1,5 milyon` / `1.5 million`).

## Roadmap

- [x] Phase 1 — Web prototype: three modes, logarithmic scoring, sharing
- [x] Daily mode + streak tracking + emoji-grid sharing
- [x] Party mode (pass-and-play)
- [x] Content validation pipeline (schema + source checks)
- [ ] Grow the pool to 500+ questions (the idea file's launch threshold)
- [ ] Mobile via a Capacitor wrapper
- [ ] Online multiplayer with room codes
- [ ] Category-based question packs and seasonal themes

## Contributing: adding a question

Add it to the matching format file under `src/data/`, then run:

```bash
npm run validate:questions && npm run check:sources
```

Make sure the source genuinely supports the claim — the validator checks that the
link is *reachable*, not that it is *correct*. That part is still a human job.
