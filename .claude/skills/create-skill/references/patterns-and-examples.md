# Common Patterns and Examples

## Template Pattern

Provide output format templates for consistent results:

````markdown
## Report structure

Use this template:

```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```
````

For strict requirements, prefix with "ALWAYS use this exact template."
For flexible guidance, add "Adjust sections as needed."

## Examples Pattern

For output-quality-dependent skills, provide input/output pairs:

````markdown
## Commit message format

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```
````

## Workflow Pattern

Break complex operations into sequential steps with a checklist:

````markdown
## Form filling workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

**Step 1: Analyze the form**
Run: `python scripts/analyze_form.py input.pdf`
...
````

## Conditional Workflow Pattern

Guide through decision points:

```markdown
## Document modification

1. Determine modification type:

   **Creating new?** → Follow "Creation workflow" below
   **Editing existing?** → Follow "Editing workflow" below

2. Creation workflow:
   - Use docx-js library
   - Build document from scratch
   ...

3. Editing workflow:
   - Modify XML directly
   ...
```

## Feedback Loop Pattern

For quality-critical tasks, implement validate → fix → repeat:

```markdown
## Document editing process

1. Make your edits
2. **Validate immediately**: `python scripts/validate.py output/`
3. If validation fails:
   - Review the error message
   - Fix the issues
   - Run validation again
4. **Only proceed when validation passes**
```

This pattern greatly improves output quality for fragile operations.

## Complete Skill Example

**Directory structure:**

```
code-review/
├── SKILL.md
└── references/
    ├── standards.md
    └── examples.md
```

**SKILL.md:**

```markdown
---
name: code-review
description: Review code for quality, security, and maintainability following team standards. Use when reviewing pull requests, examining code changes, or when the user asks for a code review.
---

# Code Review

## Quick Start

When reviewing code:

1. Check for correctness and potential bugs
2. Verify security best practices
3. Assess readability and maintainability
4. Ensure tests are adequate

## Review Checklist

- [ ] Logic is correct and handles edge cases
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] Follows project style conventions
- [ ] Functions are focused and appropriately sized
- [ ] Error handling is comprehensive
- [ ] Tests cover the changes

## Feedback Format

- 🔴 **Critical**: Must fix before merge
- 🟡 **Suggestion**: Consider improving
- 🟢 **Nice to have**: Optional enhancement

## References

- Detailed coding standards: [references/standards.md](references/standards.md)
- Example reviews: [references/examples.md](references/examples.md)
```

## Balanced Skill Sizing

| Type | Lines | Problem |
|------|-------|---------|
| **Monolithic** | 1000+ | Slow activation, hard to navigate |
| **Over-fragmented** | 50+ files | Hard to understand, excessive file reads |
| **Balanced** | ~150 SKILL.md + 5-10 refs | Fast activation, clear structure |

Aim for the balanced approach: a concise SKILL.md that serves as a navigation hub, with 5-10 focused reference files for detailed content.
