# Emergent taxonomy (platform rule) — draft note

> Spec-only draft. **Not filed into SPEC.md** unless separately asked.
> Captures Michael’s platform rule, separate from any personal knowledge-graph build.

## Rule (Michael / platform)

PointMint’s knowledge-graph types should behave like **Obsidian tags**: community use can **auto-create** new node types on first use (examples: `trade_show`, `law_school`, `publication`, `organization`, `product`).

### Core reserved types (locked)

These stay platform-owned and must not be redefined by community emergence:

- `company`
- `school`
- `skill`
- `industry`
- `human`
- `agent`

Existing **REL** types already listed in **SPEC §19** remain locked the same way.

### Collision / governance

- New emergent types **must not collide** with reserved ids or names (exact match or confusing near-duplicates of the locked set / §19 RELs).
- **Michael is not the regulator of node types.** Platform + community emergence is. Personal graphs (LinkedIn seed, Gmail proposals, etc.) may *propose* emergent types in import payloads; they do not mint reserved vocabulary.

### Personal-build boundary

Personal enrichment work (e.g. `prototype/data/michael-linkedin-graph.json`, `prototype/data/michael-gmail-graph-proposals.json`) may use emergent type strings as **proposals**. Import/merge into live D1 is a separate, explicit step — not implied by this note.

---

*Drafted 2026-10-25 (America/New_York) from Michael’s platform guidance during Gmail graph-proposal scan.*
