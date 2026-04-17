# Progressive Disclosure

## Core Rule

SKILL.md must be under **200 lines**. Every skill exceeding this should be refactored. While skills up to 500 lines can still perform, splitting into references is always preferred for optimal performance.

## Three-Level Loading

1. **Metadata** (~100 words) — Always in agent context. Determines when skill triggers.
2. **SKILL.md body** (<200 lines) — Loaded when skill activates. Core instructions only.
3. **References** (unlimited) — Loaded on-demand when agent needs specific details.

### Why It Matters

- ~85% reduction in initial context load
- Faster skill activation (under 100ms vs 500ms+)
- Agent loads only what's needed, when it's needed
- Skills remain maintainable and focused

## Disclosure Patterns

### Pattern 1: High-level guide with references

```markdown
# PDF Processing

## Quick start
[Essential instructions — enough to handle 80% of cases]

## Advanced features
- **Form filling**: See [references/forms.md](references/forms.md)
- **API reference**: See [references/api.md](references/api.md)
- **Examples**: See [references/examples.md](references/examples.md)
```

### Pattern 2: Domain-specific organization

Organize by domain when a skill covers multiple areas:

```
bigquery-skill/
├── SKILL.md (overview + navigation)
└── references/
    ├── finance.md (revenue, billing)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

Agent reads only the relevant domain file (e.g., sales question → only `sales.md`).

### Pattern 3: Framework/variant organization

```
cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

### Pattern 4: Conditional details

```markdown
# DOCX Processing

## Creating documents
Use docx-js. See [references/creation.md](references/creation.md).

## Editing documents
For simple edits, modify XML directly.

**For tracked changes**: See [references/redlining.md](references/redlining.md)
**For OOXML details**: See [references/ooxml.md](references/ooxml.md)
```

## Rules

1. **One level deep** — All references link directly from SKILL.md. Never chain references (reference → reference → reference).
2. **Reference files <200 lines** — Split further if needed.
3. **Table of contents** — For reference files >100 lines, add a ToC at the top so the agent can see the full scope on preview.
4. **No duplication** — Information lives in SKILL.md OR references, not both.
5. **Clear navigation** — SKILL.md must tell the agent what each reference contains and when to read it.

## Refactoring a Monolithic Skill

**Before** (1000-line SKILL.md):

- Everything in one file
- Slow to load, hard to maintain

**After** (well-structured):

```
my-skill/
├── SKILL.md           # 150 lines — core principles, overview, reference table
└── references/
    ├── components.md  # 150 lines
    ├── routing.md     # 100 lines
    ├── forms.md       # 120 lines
    └── styling.md     # 80 lines
```

### Steps to Refactor

1. Identify the core instructions (keep in SKILL.md)
2. Group related detailed content into reference files
3. Replace detailed sections in SKILL.md with one-line references
4. Add a reference table at the bottom of SKILL.md
5. Verify no duplication between SKILL.md and references
6. Test that the agent can still complete tasks effectively
