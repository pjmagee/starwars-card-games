applyTo: '**'

# Pazaak Rules (Authoritative Minimal Set)

Version: 1.1  |  Scope: Engine + UI reference  |  Last Updated: 2025-08-09

## 1. Objective
Reach 20 or the highest total ≤20. First player to win 3 non-void rounds wins the match.

## 2. Components
* Main Deck: 40 green cards (4× each 1–10)
* Side Deck (per player): 10 chosen special cards (see types). At match start draw 4 at random: your fixed hand for entire match (single‑use each).
* Board: Personal 3×3 (max 9 cards placed left→right, top→bottom).

## 3. Turn Sequence
1. Mandatory: Draw exactly 1 main deck card (skip only if already busted/standing).
2. Optional: Play 1 side card (max one per turn).
3. Choose Action:
	 * Stand – lock total (auto if exactly 20).
	 * Continue – end turn without standing.

Constraints: One draw per turn; one side card per turn; no side-card redraws.

## 4. Side Card Types
| Type | Notation | Effect |
|------|----------|--------|
| Plus | +1..+6 | Adds value |
| Minus | -1..-6 | Subtracts value |
| Dual | ±1..±6 | Choose + or - when played |
| Variable | ±1/±2 | Choose +1, -1, +2, or -2 |
| Flip | 2&4 / 3&6 | Invert sign of all matching ranks on both boards |
| Double | D | Double last drawn main deck card (immediate) |
| Tiebreaker | T (±1) | Acts as ±1; if final scores tie ≤20 and you used it, you win |

## 5. Round End Conditions
Round immediately ends when any occurs:
* Both players standing
* A player busts (>20)
* A board fills (9 cards) without bust
* Both players at 20

## 6. Ties
Equal scores ≤20 without an active tiebreaker effect → round void (no point; replay with remaining hands unchanged).

## 7. Win Condition (Match)
First to 3 round wins (void rounds ignored).

## 8. Strategy Micro-Tips
* Hold flexible negatives / duals to repair near-busts late.
* Flip gains value when 2+ target ranks are present across boards.
* Double earlier on high (6–7) only if you retain mitigation.
* Stand on 17–19 forcing opponent risk when they lack correction cards.
* Track depletion of high ranks (8–10) to refine bust odds above 16.

## 9. Card Inventory Summary
| Category | Count | Breakdown |
|----------|-------|-----------|
| Main Deck | 40 | 4× each 1–10 |
| Plus | 24 | 4× each +1..+6 |
| Minus | 24 | 4× each -1..-6 |
| Dual | 24 | 4× each ±1..±6 |
| Flip | 8 | 4× 2&4, 4× 3&6 |
| Double | 2 | D |
| Tiebreaker | 2 | ±1 (tiebreak effect) |
| Variable | 2 | ±1/±2 |

## 10. Quick Examples
* Exact 20: 7 + 6 + 5 = 18; play +2 → 20 (auto-stand).
* Prevent Bust: At 19 draw 6 → 25; play -5 → 20.
* Flip Swing: Opponent +2,+4 (now +6); you have -4. Play 2&4 Flip → their +2/+4 become -2/-4 (net -6), your -4 becomes +4 (10-point swing).

## 11. Machine Readable Snapshot
```jsonc
{
	"objective": "Reach <=20; first to 3 round wins",
	"roundWinThreshold": 3,
	"mainDeck": { "size": 40, "ranks": [1,2,3,4,5,6,7,8,9,10], "copiesEach": 4 },
	"sideDeck": { "select": 10, "hand": 4, "handRefill": false },
	"board": { "rows": 3, "cols": 3, "maxCards": 9 },
	"turn": { "draws": 1, "sideCards": 1, "autoStandOn": 20 },
	"cardTypes": ["plus","minus","dual","variable","flip","double","tiebreaker"],
	"voidRound": { "condition": "scoresEqual && <=20 && noTiebreaker" },
	"endRoundTriggers": ["bothStanding","bust","boardFull","bothAt20"],
	"tiebreaker": { "winsTie": true },
	"inventory": {
		"plus": 24, "minus": 24, "dual": 24, "flip": 8, "double": 2, "tiebreaker": 2, "variable": 2
	}
}
```

---
End of authoritative Pazaak rules.