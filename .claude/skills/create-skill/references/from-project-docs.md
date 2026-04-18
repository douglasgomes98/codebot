# Creating Skills from Project Documentation

Workflow for bootstrapping a skill from existing documentation in a project.

## When to Use

- User wants to create a skill from an existing project's documentation
- Source is local: current directory, `docs/`, `documentation/`, or repo root
- Goal is to make project knowledge accessible to agents

## Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Identify documentation sources
- [ ] Step 2: Plan skill structure
- [ ] Step 3: Generate skill files
- [ ] Step 4: Review coverage and fill gaps
- [ ] Step 5: Validate and integrate
```

### Step 1: Identify Documentation Sources

1. Look for common doc paths: `docs/`, `documentation/`, `packages/*/docs/`, README files at repo root
2. Analyze structure: sidebar, navigation, main topics, entry points
3. Categorize content into: `core`, `features`, `best-practices`, `advanced`
4. **Skip** content agents already know (general programming concepts, common library basics)
5. **Focus** on project-specific knowledge, custom APIs, business logic, schemas

### Step 2: Plan Skill Structure

Map documentation categories to reference files:

```
skills/<skill-name>/
├── SKILL.md                        # Overview + reference table
└── references/
    ├── core-<topic>.md             # Core concepts and fundamentals
    ├── features-<topic>.md         # Feature documentation
    ├── best-practices-<topic>.md   # Patterns and guidelines
    └── advanced-<topic>.md         # Advanced topics
```

Keep the naming consistent with kebab-case and category prefixes.

### Step 3: Generate Skill Files

1. **SKILL.md** (<200 lines):
   - Frontmatter with `name` and `description`
   - Brief intro (2-3 sentences)
   - Sections with tables of references organized by category
   - Quick start or most common workflow

2. **Reference files** (one concept per file):
   - Frontmatter-style heading with description
   - Brief explanation of the concept
   - **Usage** section with working code examples
   - **Key Points** as concise bullets
   - Source comment at the end: `<!-- Source: path/to/original/doc.md -->`

3. **Writing rules**:
   - **Always write in English** — Even if source docs are in another language, translate and adapt all skill content to English
   - **Rewrite for agents** — Don't copy docs verbatim. Be practical and concise.
   - **One concept per file** — Keep references focused
   - **Include working code examples** — Agents learn best from examples
   - **Explain when and why, not just how** — Context helps agents make better decisions

### Step 4: Review Coverage and Fill Gaps

Loop until no major modules are missing:

1. **Compare** generated references against the project's documented surface (docs tree, README, navigation)
2. **Identify gaps** — Focus on major modules only:
   - Core concepts that are central to the project
   - Main APIs or features commonly needed
   - Primary workflows users would ask about
3. **Add** missing references with correct naming prefixes
4. **Update** SKILL.md reference table
5. **Stop when**:
   - All core concepts are covered
   - Main APIs/features have references
   - Primary workflows are documented
   - Only minor edge cases remain

### Step 5: Validate and Integrate

1. Run the standard validation checklist (see SKILL.md → Step 4: Validate)
2. Test by asking the agent questions the skill should help answer
3. Iterate based on agent performance

### Optional: GENERATION.md

For tracking purposes, create a `GENERATION.md` at the skill root:

```markdown
# Generation Info

- **Source:** <source-path> (current project)
- **Generated:** <date>
- **Coverage:** <brief summary of what's covered>
```

This helps future maintainers understand the skill's origin and scope.
