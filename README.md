# Star Wars Card Games (Sabacc & Pazaak)

TypeScript + React + Vite application implementing Star Wars inspired card games using Microsoft Fluent UI components. Current focus: Pazaak (KOTOR) with AI & multiplayer groundwork. Sabacc variants (Corellian Spike / Kessel) planned.

## Tech Stack

* React 18 + TypeScript
* Vite 7 build tooling
* Fluent UI v9 (no custom CSS overrides – only tokens & utility classes)
* PeerJS (peer‑to‑peer multiplayer foundation)
* Vitest for unit tests

## Features (Pazaak)

* Full rule implementation: main deck, side deck (10 choose 4 deal), standing, bust, ties, tiebreaker, flip, double, variable, dual cards
* Turn enforcement (exactly one draw per turn before stand / end turn)
* AI with difficulty settings (easy / medium / hard) and strategic side card usage
* Action history log (scrollable + expand) for transparency
* Visual standing / busted indicators, confirmations for risky actions
* Multiplayer scaffolding (PeerJS contexts) – local single player vs AI fully functional

## Getting Started

```bash
npm install
npm run dev
```

Visit <http://localhost:5173/starwars-card-games/> (or the URL Vite prints – base path added for Pages; root will redirect appropriately).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm test` | Run Vitest test suite (headless) |
| `npm run build` | Type check & build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Manual deploy to GitHub Pages via `gh-pages` (after build) |

## GitHub Pages Deployment

Automated CI deploy configured in `.github/workflows/deploy.yml`:

1. Push to `main` → workflow runs tests & build.
2. Artifact uploaded & published to GitHub Pages environment.
3. Site served at: `https://<your-username>.github.io/starwars-card-games/`.

Local manual deploy alternative:

```bash
npm run deploy
```

This uses the `gh-pages` branch to publish `dist/`.

### Vite Base Path

`vite.config.ts` sets `base: '/starwars-card-games/'` so assets resolve correctly on Pages. When cloning under a different repo name, update that base.

## Project Structure

```text
src/
  components/      Shared UI pieces (ActionLog, Card components, navigation)
  games/pazaak/    Game engine, AI, layout, types
  contexts/        Multiplayer & notification contexts
  utils/           PeerJS helpers, audio, multiplayer sync
  tests/           Vitest specs (rules & regression tests)
```

## Testing

Deterministic rule & regression tests (AI turn continuity, standing rules, side card end-turn fix). Run:

```bash
npm test
```

## Multiplayer Notes

PeerJS integration scaffolds lobby & connection contexts. Current implementation emphasizes local vs AI; full PvP synchronization of all actions is in progress.

## Development Guidelines

* Keep game logic pure & UI-agnostic under `games/*/gameLogic.ts` & related helpers.
* Avoid inline styles – prefer Fluent UI tokens / makeStyles (project ESLint enforces this).
* One main draw per turn rule must remain enforced by both UI gating & engine flags.
* Add regression tests for every gameplay edge case fix.

## Roadmap

* Complete Sabacc variants logic & UI.
* Enhance multiplayer synchronization (action history broadcast, reconnection handling).
* AI improvements: probabilistic deck tracking, adaptive risk model, timeout safeguards.
* Accessibility passes (ARIA roles on interactive card grid, keyboard shortcuts).
* Mobile layout refinements.

## Contributing

Fork, branch from `main`, add tests for changes, then open a PR. CI must pass (build + tests) before merge.

## License

Fan project for educational/demonstration purposes. Star Wars and related names are trademarks of their respective owners.

---

Enjoy a game of Pazaak – and may the odds (and the deck) be with you.
