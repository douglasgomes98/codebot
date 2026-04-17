---
name: create-skill
description: Create optimized Agent Skills for Cursor and other AI agents. Use when the user wants to create, write, structure, or improve a skill, asks about skill structure, SKILL.md format, best practices, progressive disclosure, or wants to generate skills from existing project documentation.
---

# Create Skill

Guide for creating effective skills that extend agent capabilities with specialized knowledge, workflows, and tool integrations.

## What Skills Provide

1. **Specialized workflows** — Multi-step procedures for specific domains
2. **Tool integrations** — Instructions for working with file formats or APIs
3. **Domain expertise** — Company-specific knowledge, schemas, business logic
4. **Bundled resources** — Scripts, references, and assets for repetitive tasks

## Skill Structure

```
skill-name/
├── SKILL.md              # Required, <200 lines
│   ├── YAML frontmatter  # name + description (required)
│   └── Markdown body     # Core instructions
└── Bundled Resources     # Optional
    ├── scripts/          # Executable code
    ├── references/       # Documentation loaded on-demand
    └── assets/           # Files used in output (templates, images)
```

### Storage Locations (Cursor)

| Type | Path | Scope |
|------|------|-------|
| Personal | `~/.cursor/skills/skill-name/` | All your projects |
| Project | `.cursor/skills/skill-name/` | Shared via repository |

> **Never** create skills in `~/.cursor/skills-cursor/` — reserved for Cursor built-in skills.

See [references/structure-and-metadata.md](references/structure-and-metadata.md) for full details on frontmatter, naming, and bundled resources.

## Progressive Disclosure (Critical)

SKILL.md must be under **200 lines**. Split detailed content into `references/` files.

### Three-Level Loading

1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — Loaded when skill triggers (<200 lines)
3. **Bundled resources** — Loaded on-demand by agent (unlimited)

This achieves ~85% reduction in context load. See [references/progressive-disclosure.md](references/progressive-disclosure.md) for patterns.

## Core Principles

1. **Always in English** — All skill files (SKILL.md, references, scripts, comments) must be written in English, regardless of the user's language. English maximizes agent comprehension and cross-team reusability.
2. **Concise is key** — The context window is shared. Only add what the agent doesn't already know. Challenge every paragraph: "Does this justify its token cost?"
3. **Degrees of freedom** — High (text) for flexible tasks, Medium (pseudocode) for preferred patterns, Low (scripts) for fragile operations
4. **Imperative writing** — Use verb-first: "Extract text with..." not "You should extract..."
5. **One default, not many options** — Provide a recommended approach with an escape hatch, not a menu of choices
6. **Test with multiple models** — Effectiveness varies by model

See [references/writing-guidelines.md](references/writing-guidelines.md) for detailed guidance.

## Creation Workflow

### Step 1: Gather Requirements

Understand the skill's purpose through concrete examples:

- What specific task or workflow should this skill help with?
- When should the agent automatically apply it? (trigger scenarios)
- What domain knowledge does the agent need that it wouldn't already know?
- Should it be personal (`~/.cursor/skills/`) or project (`.cursor/skills/`)?

Use the **AskQuestion** tool when available for structured gathering. If context from a previous conversation exists, infer the skill from what was discussed.

### Step 2: Plan Resources

Analyze each use case and identify reusable resources:

- **Scripts** — Code that would be rewritten each time (e.g., `scripts/validate.py`)
- **References** — Documentation the agent should consult (e.g., `references/schema.md`)
- **Assets** — Files used in output, not loaded into context (e.g., `assets/template/`)

### Step 3: Write the Skill

1. Create the directory structure
2. Write SKILL.md with frontmatter:
   - `name`: lowercase, hyphens only, max 64 chars
   - `description`: specific, third-person, includes WHAT + WHEN triggers (max 1024 chars)
3. Write concise body (<200 lines) with core instructions
4. Create reference files for detailed content (<200 lines each)
5. Add scripts/assets as needed
6. Delete any unnecessary placeholder files

### Step 4: Validate

- [ ] **All files written in English** (even if user communicates in another language)
- [ ] SKILL.md under 200 lines
- [ ] Description is specific, third-person, includes WHAT and WHEN
- [ ] Consistent terminology throughout
- [ ] References are one level deep (no nested references)
- [ ] No time-sensitive information
- [ ] Examples are concrete, not abstract
- [ ] Scripts tested and working

### Step 5: Iterate

1. Use the skill on real tasks
2. Identify struggles or inefficiencies
3. Update SKILL.md or bundled resources
4. Test again with different models

## Common Patterns

See [references/patterns-and-examples.md](references/patterns-and-examples.md) for:

- Template pattern (output format)
- Workflow pattern (checklists + sequential steps)
- Conditional workflow pattern (decision trees)
- Feedback loop pattern (validate → fix → repeat)
- Examples pattern (input/output pairs)
- Complete skill example

## Creating Skills from Project Documentation

For bootstrapping skills from existing project docs, see [references/from-project-docs.md](references/from-project-docs.md).

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Vague names (`helper`, `utils`) | Specific names (`processing-pdfs`, `code-review`) |
| Verbose explanations | Challenge every paragraph's token cost |
| Too many options | One default + escape hatch |
| Windows paths (`scripts\file.py`) | Forward slashes (`scripts/file.py`) |
| Time-sensitive info | "Current method" + "Old patterns (deprecated)" |
| Inconsistent terminology | Pick one term, use it everywhere |
| Monolithic 1000+ line SKILL.md | Split into references (<200 lines each) |
| Over-fragmented (50+ tiny files) | 5-10 focused reference files |

## References

| Topic | File |
|-------|------|
| Structure and metadata | [references/structure-and-metadata.md](references/structure-and-metadata.md) |
| Writing guidelines | [references/writing-guidelines.md](references/writing-guidelines.md) |
| Patterns and examples | [references/patterns-and-examples.md](references/patterns-and-examples.md) |
| Progressive disclosure | [references/progressive-disclosure.md](references/progressive-disclosure.md) |
| Skills from project docs | [references/from-project-docs.md](references/from-project-docs.md) |
