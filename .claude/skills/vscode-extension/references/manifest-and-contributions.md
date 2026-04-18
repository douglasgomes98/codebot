# Extension Manifest & Contribution Points

## package.json Required Fields

```json
{
  "name": "my-extension",          // lowercase, no spaces, unique in Marketplace
  "displayName": "My Extension",   // shown in Marketplace UI
  "description": "...",
  "version": "1.0.0",              // SemVer
  "publisher": "your-publisher-id",
  "license": "MIT",
  "engines": {
    "vscode": "^1.100.0"           // minimum VSCode version supported
  },
  "categories": ["Other"],         // Programming Languages | Linters | Themes | Snippets | Other
  "icon": "assets/icon.png",       // 128x128px PNG
  "main": "./dist/extension.js",   // bundled entry point
  "activationEvents": [],          // omit entries for commands/views (1.74+ auto-activates)
  "contributes": { ... }
}
```

## Full Contribution Points Reference

### commands
```json
"commands": [
  {
    "command": "myExt.action",
    "title": "Do Something",
    "category": "My Extension",  // groups in Command Palette: "My Extension: Do Something"
    "icon": "$(symbol-event)",    // codicon or { "light": "path", "dark": "path" }
    "enablement": "editorHasSelection"  // when clause
  }
]
```

### menus
Common menu locations:
- `commandPalette` — show/hide from palette via `when`
- `explorer/context` — right-click on file/folder
- `editor/context` — right-click in editor
- `editor/title` — top-right of editor tab
- `editor/title/context` — right-click on editor tab
- `view/title` — top of a tree view panel
- `view/item/context` — right-click on tree item
- `scm/title` — source control panel header

```json
"menus": {
  "explorer/context": [
    {
      "command": "myExt.action",
      "when": "explorerResourceIsFolder",
      "group": "1_modification"   // controls position; "navigation" = top, "inline" = icon
    }
  ]
}
```

### configuration
```json
"configuration": {
  "title": "My Extension",
  "properties": {
    "myExt.templatePath": {
      "type": "string",
      "default": "templates",
      "description": "Path to templates folder relative to workspace root",
      "scope": "resource"   // resource | window | application | machine
    },
    "myExt.enabled": {
      "type": "boolean",
      "default": true,
      "markdownDescription": "Enable **My Extension** features"
    }
  }
}
```

### views & viewsContainers
```json
"viewsContainers": {
  "activitybar": [
    {
      "id": "myExtContainer",
      "title": "My Extension",
      "icon": "assets/icon.svg"
    }
  ]
},
"views": {
  "myExtContainer": [
    { "id": "myExt.mainView", "name": "Main View" }
  ],
  "explorer": [
    { "id": "myExt.explorerView", "name": "My Items" }  // adds to Explorer panel
  ]
}
```

### keybindings
```json
"keybindings": [
  {
    "command": "myExt.action",
    "key": "ctrl+shift+p",
    "mac": "cmd+shift+p",
    "when": "editorTextFocus"
  }
]
```

### snippets
```json
"snippets": [
  { "language": "typescript", "path": "./snippets/typescript.json" }
]
```

### languages
```json
"languages": [
  {
    "id": "myLang",
    "aliases": ["My Language"],
    "extensions": [".myl"],
    "configuration": "./language-configuration.json"
  }
]
```

## .vscodeignore

Exclude files from the packaged `.vsix`:
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
```

## Marketplace Requirements

- Icon must be PNG (not SVG)
- Badge/image URLs must use HTTPS
- README displayed on Marketplace page
- CHANGELOG recommended
- Max 30 keywords in `package.json`

## Version Bumping

```bash
vsce publish patch   # 1.0.0 → 1.0.1
vsce publish minor   # 1.0.0 → 1.1.0
vsce publish major   # 1.0.0 → 2.0.0
vsce publish --pre-release  # pre-release channel
```
