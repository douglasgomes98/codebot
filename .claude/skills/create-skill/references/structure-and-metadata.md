# Skill Structure and Metadata

## Directory Layout

```
skill-name/
├── SKILL.md              # Required, <200 lines
├── references/           # Optional - documentation loaded on-demand
│   ├── core-concept.md
│   ├── features-api.md
│   └── advanced-patterns.md
├── scripts/              # Optional - executable code
│   ├── validate.py
│   └── helper.sh
└── assets/               # Optional - files used in output (not loaded into context)
    ├── template/
    └── logo.png
```

## YAML Frontmatter

Every SKILL.md requires frontmatter with exactly two fields:

```yaml
---
name: skill-name
description: What the skill does and when to use it.
---
```

Do not include any other fields in the frontmatter.

### `name` Field

- Max 64 characters
- Lowercase letters, numbers, and hyphens only
- Prefer gerund form: `processing-pdfs`, `analyzing-data`, `managing-databases`
- Acceptable alternatives: noun phrases (`pdf-processing`) or action-oriented (`process-pdfs`)
- **Avoid** vague names: `helper`, `utils`, `tools`, `documents`, `data`

### `description` Field

The description is the **primary trigger mechanism**. The agent reads it to decide when to use the skill.

- Max 1024 characters
- Write in **third person** (it's injected into the system prompt)
- Include **WHAT** (specific capabilities) and **WHEN** (trigger scenarios)
- Be specific and include key terms users would naturally mention
- Include all "when to use" info here — the body loads only AFTER triggering, so "When to Use" sections in the body are wasted

**Good examples:**

```yaml
# PDF Processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# Code Review
description: Review code for quality, security, and maintainability following team standards. Use when reviewing pull requests, examining code changes, or when the user asks for a code review.

# Git Commit Helper
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.

# Excel Analysis
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Bad examples:**

```yaml
description: Helps with documents           # Too vague, no triggers
description: I can help you process files   # Not third person
description: Use this to process data       # Not specific enough
```

## Bundled Resources

### Scripts (`scripts/`)

Executable code for deterministic, repetitive tasks:

- More reliable than agent-generated code each time
- Save tokens (no code generation needed)
- Ensure consistency across uses
- Include error handling and clear documentation
- List required packages in instructions or `requirements.txt`
- Prefer Python or Node.js over Bash (better cross-platform support)
- Always test scripts before including them

Clarify in SKILL.md whether the agent should **execute** or **read** each script.

### References (`references/`)

Documentation loaded on-demand into agent context:

- Keep each file <200 lines when possible
- For files >100 lines, include a table of contents at the top
- One concept per file
- Use category prefixes for organization: `core-*.md`, `features-*.md`, `best-practices-*.md`, `advanced-*.md`
- **No duplication** — information lives in SKILL.md OR references, not both
- Sacrifice grammar for concision when needed

### Assets (`assets/`)

Files used in agent output, never loaded into context:

- Templates, images, icons, fonts, boilerplate code
- Separates output resources from documentation
- Agent can copy/modify these files without reading them into context

## Storage Locations

### Cursor

| Type | Path | Scope |
|------|------|-------|
| Personal | `~/.cursor/skills/skill-name/` | Available across all projects |
| Project | `.cursor/skills/skill-name/` | Shared via repository |

> **Never** create skills in `~/.cursor/skills-cursor/` — reserved for Cursor built-in skills.

### Other Agents

| Agent | Personal | Project |
|-------|----------|---------|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Generic | `~/.agent/skills/` | `.agent/skills/` |

Adjust paths based on your agent harness.
