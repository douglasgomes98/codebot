# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run compile       # Webpack build (development)
npm run watch         # Webpack watch mode
npm run package       # Production build with hidden source maps
npm run build         # Package extension as .vsix
npm run lint          # ESLint + Prettier with auto-fix
npm run lint:check    # Lint check without fixing (used in CI)
npm test              # Run Jest tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Generate coverage reports
npm run dev-install   # Compile, package, and install extension locally
```

To run a single test file:
```bash
npx jest src/test/path/to/file.test.ts
```

## Architecture

Codebot is a VSCode extension that generates boilerplate code from Handlebars templates. Users right-click a folder in the Explorer, pick a template, enter a component name, and files are generated with `{{name}}` replaced by the component name (PascalCase).

### Entry point

`src/extension.ts` — registers two VSCode commands: `codebot.createComponent` and `codebot.updateComponent`.

### Core flow

1. **Command** (`src/commands/`) receives the folder URI from VSCode context
2. **ProjectDetector** (`src/managers/`) determines the project context (single vs. multi-workspace)
3. **ConfigurationManager** reads `codebot.config.json` for custom template paths
4. **TemplateManager** discovers `.hbs` template files and presents choices to the user
5. **Helpers** (`src/helpers/`) wrap VSCode UI (QuickPick, InputBox, file creation)
6. Template files are compiled via Handlebars and written to disk

### Key modules

- `src/managers/` — Core business logic. `TemplateManager` uses TTL-based caching and supports hierarchical template discovery. Managers accept dependencies via constructor injection.
- `src/commands/` — Thin handlers that orchestrate managers; `createComponent` generates new files, `updateComponent` adds missing template files to an existing component.
- `src/utils/` — `PathResolver` sanitizes and validates paths (prevents traversal attacks). `DirectoryProcessor` scans workspace directories.
- `src/errors/` — `CodebotError` typed error class with error category enum.
- `src/interfaces/` — TypeScript contracts for all managers and core data types (`ITemplateManager`, `IProjectDetector`, etc.).

### Template structure (user-created)

```
project-root/
├── templates/
│   └── ComponentName/
│       ├── ComponentName.tsx.hbs
│       └── index.tsx.hbs
└── codebot.config.json   # optional, sets custom templatesFolderPath
```

Filenames containing the template folder name (or the literal string "Template") are renamed to the component name at generation time.

## Build & packaging

Webpack bundles everything into a single `dist/extension.js`. The `vscode` module is marked as external (provided by the host). TypeScript targets ES6 with strict mode enabled.

## Testing

Jest with `ts-jest`. The `vscode` module is mocked globally (see `src/test/__mocks__/vscode.ts`). Tests live alongside source in `src/test/`.

## Release

Semantic Release runs on pushes to `main` and publishes to the VS Marketplace. Commit messages must follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) to trigger correct version bumps.
