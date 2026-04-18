# Writing Guidelines

## Language: Always English

All skill files must be written in **English**, regardless of the language the user communicates in. This includes:

- SKILL.md (frontmatter and body)
- All reference files
- Scripts and code comments
- Asset descriptions

English maximizes agent comprehension across all models and ensures cross-team reusability. If the source documentation is in another language, translate and adapt the content to English when generating skill files.

## Conciseness

The context window is a shared resource. Your skill competes with conversation history, other skills, and the actual request.

**Default assumption**: Agents are already very smart. Only add context they don't already have.

Challenge each piece of information:

- "Does the agent really need this explanation?"
- "Can I assume the agent already knows this?"
- "Does this paragraph justify its token cost?"

**Good** (~50 tokens):

```markdown
## Extract PDF text

Use pdfplumber:

​```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
​```
```

**Bad** (~150 tokens):

```markdown
## Extract PDF text

PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available for PDF processing, but we
recommend pdfplumber because it's easy to use...
```

## Writing Style

- Use **imperative/infinitive form** (verb-first): "Extract text with..." not "You should extract..."
- Use objective, instructional language
- Sacrifice grammar for concision when needed in references
- Prefer concise code examples over verbose explanations

## Description Best Practices

### Rules

1. **Third person** — "Processes files" not "I process files"
2. **Specific** — Include exact capabilities and key terms
3. **WHAT + WHEN** — What it does AND when to trigger it
4. **Key terms** — Include words users would naturally mention

### Template

```yaml
description: [Capability 1], [Capability 2], [Capability 3]. Use when [trigger 1], [trigger 2], or [trigger 3].
```

## Terminology

Choose one term and use it consistently throughout the entire skill:

| Pick one | Not these |
|----------|-----------|
| API endpoint | URL, route, path |
| field | box, element, control |
| extract | pull, get, retrieve |
| validate | check, verify, test |

## Degrees of Freedom

Match specificity to the task's fragility:

| Level | When | Example |
|-------|------|---------|
| **High** (text instructions) | Multiple valid approaches | Code review guidelines |
| **Medium** (pseudocode/templates) | Preferred pattern exists | Report generation |
| **Low** (specific scripts) | Fragile/critical operations | Database migrations |

Think of it as: narrow bridge with cliffs needs guardrails (low freedom), open field allows many routes (high freedom).

## One Default, Not Many Options

**Bad** — Confusing:

```markdown
You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image...
```

**Good** — Clear default with escape hatch:

```markdown
Use pdfplumber for text extraction.
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
```

## Time-Sensitive Information

Avoid it. If unavoidable, use this pattern:

```markdown
## Current method

Use the v2 API endpoint.

## Old patterns (deprecated)

<details>
<summary>Legacy v1 API</summary>
...
</details>
```

## Evaluation-Driven Development

Build evaluations before writing extensive documentation:

1. **Identify gaps** — Run agent on tasks without the skill. Document failures.
2. **Create evaluations** — Build 3+ scenarios that test these gaps.
3. **Establish baseline** — Measure agent performance without the skill.
4. **Write minimal instructions** — Only enough to address gaps and pass evaluations.
5. **Iterate** — Execute evaluations, compare against baseline, refine.

This ensures the skill solves real problems rather than documenting imagined ones.

## Iterative Development

Work with one agent instance ("Agent A") to create the skill, test with another ("Agent B"):

1. Complete a task without a skill — notice what info you repeatedly provide
2. Identify the reusable pattern
3. Ask Agent A to create the skill
4. Review for conciseness (remove unnecessary explanations)
5. Test with Agent B on real tasks
6. Iterate based on observation
