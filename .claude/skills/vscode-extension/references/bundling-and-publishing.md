# Bundling & Publishing

## Webpack Configuration (Current Best Practice)

```javascript
// webpack.config.js
const path = require('node:path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    library: { type: 'commonjs2' },   // webpack 5 syntax (not libraryTarget)
  },
  externals: {
    vscode: 'commonjs vscode',        // never bundle vscode — it's provided by the host
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [{ test: /\.ts$/, exclude: /node_modules/, use: 'ts-loader' }],
  },
  devtool: 'nosources-source-map',    // dev builds; use hidden-source-map for production
};
```

## package.json Scripts

```json
"scripts": {
  "vscode:prepublish": "npm run package",
  "compile": "webpack",
  "watch": "webpack --watch",
  "package": "webpack --mode production --devtool hidden-source-map",
  "build": "vsce package",
  "lint": "biome check --write .",
  "lint:check": "biome ci .",
  "test": "jest",
  "dev-install": "npm run compile && vsce package && code --install-extension myext-$(node -p \"require('./package.json').version\").vsix --force"
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "out",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

## .vscodeignore

```
src/**
**/*.ts
**/*.map
tsconfig.json
webpack.config.js
biome.json
jest.config.js
.vscode-test/**
node_modules/**
coverage/**
out/**
.github/**
CONTRIBUTING.md
```

## Publishing Checklist

Before publishing:
- [ ] `npm run lint:check` passes clean
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — `.vsix` created without errors
- [ ] Inspect `.vsix` contents: `npx @vscode/vsce ls`
- [ ] README describes features with screenshots/GIFs
- [ ] CHANGELOG has entry for new version
- [ ] Icon is 128×128px PNG (not SVG)
- [ ] `engines.vscode` matches minimum tested version

## Publishing Commands

```bash
# One-time setup
npm install -g @vscode/vsce
vsce login <publisher-id>   # requires Azure DevOps PAT

# Package only
vsce package                # creates .vsix

# Publish
vsce publish                # uses current version
vsce publish patch          # auto-bumps patch (1.0.0 → 1.0.1)
vsce publish minor          # auto-bumps minor (1.0.0 → 1.1.0)
vsce publish --pre-release  # publish to pre-release channel
```

## GitHub Actions CI/CD

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint:check
      - run: npm test
      - run: npm run package
      - name: Publish
        run: npx @vscode/vsce publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

## Semantic Release Integration

```json
// package.json — release config
"release": {
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/git", { "assets": ["CHANGELOG.md", "package.json"] }]
  ]
}
```

Commit convention triggers:
- `fix:` → patch bump
- `feat:` → minor bump
- `feat!:` or `BREAKING CHANGE:` → major bump

## Testing with @vscode/test-cli (Modern Approach)

```bash
npm install --save-dev @vscode/test-cli @vscode/test-electron
```

```typescript
// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';
export default defineConfig({ files: 'out/test/**/*.test.js' });
```

Or keep **Jest** with `ts-jest` (no extension host needed) for unit/integration tests that mock the `vscode` module — simpler and faster for most extension logic.
