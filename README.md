<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot">
    <img src="https://raw.githubusercontent.com/douglasgomes98/codebot/main/assets/codebot.png" alt="Codebot" width="160" />
  </a>
</p>

<h1 align="center">Codebot — Code generator by templates</h1>

<p align="center">
  Stop copying and pasting boilerplate. Define your file structure once as a template and generate it anywhere with two clicks.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot">
    <img src="https://img.shields.io/visual-studio-marketplace/v/douglasgomes98.codebot?label=VS%20Marketplace&logo=visualstudiocode" alt="VS Marketplace" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot">
    <img src="https://img.shields.io/visual-studio-marketplace/d/douglasgomes98.codebot?label=Installs" alt="Installs" />
  </a>
  <a href="https://open-vsx.org/extension/douglasgomes98/codebot">
    <img src="https://img.shields.io/open-vsx/v/douglasgomes98/codebot?label=Open%20VSX&logo=vscodium" alt="Open VSX" />
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
</p>

---

## What it does

Codebot reads a folder of [Handlebars](https://handlebarsjs.com/) (`.hbs`) template files you define once in your project, and generates all the files from that template every time you right-click a folder in the Explorer.

- **✨ Build Template** — generates a new folder with all files from the chosen template, with every `{{name}}` replaced by your component name.
- **🔁 Update Template** — adds any missing files from a template into an existing folder, without overwriting files that already exist.

Templates can be as simple as a single `.tsx` file or as complex as a full package with nested directories — Codebot handles both.

---

## Quick start

**1. Create your templates folder**

By default, Codebot looks for a `templates/` folder at the root of your workspace. Each subfolder inside it is a separate template.

```
your-project/
└── templates/
    └── ReactComponent/
        ├── ReactComponent.tsx.hbs
        └── index.tsx.hbs
```

**2. Write your template files using `{{name}}`**

`ReactComponent.tsx.hbs`
```tsx
import { ReactNode } from 'react';

export interface {{name}}Props {
  children: ReactNode;
}

export function {{name}}({ children }: {{name}}Props) {
  return <div>{children}</div>;
}
```

`index.tsx.hbs`
```tsx
export * from './{{name}}';
```

**3. Right-click any folder in the Explorer**

Select **✨ Build Template**, type the component name (e.g. `Button`), and Codebot creates:

```
src/components/
└── Button/
    ├── Button.tsx
    └── index.tsx
```

Every `{{name}}` in file names and file contents is replaced with the formatted component name.

---

## Template file naming convention

Codebot renames template files to match the component name using two patterns:

| Template filename | Generated filename (component: `Button`) |
|---|---|
| `ReactComponent.tsx.hbs` | `Button.tsx` |
| `ReactComponent.module.scss.hbs` | `Button.module.scss` |
| `Template.spec.tsx.hbs` | `Button.spec.tsx` |
| `index.tsx.hbs` | `index.tsx` *(unchanged — no match)* |

Any filename that contains either the **template folder name** or the literal word **`Template`** will be renamed to the component name.

---

## Template variables

Only one variable is available inside `.hbs` template content:

| Variable | Value |
|---|---|
| `{{name}}` | The formatted component name (e.g. `Button`, `my-package`, `myComponent`) |

The formatting of `{{name}}` is controlled by the [`nameFormat`](#name-formats) setting.

---

## Commands

Both commands are available by **right-clicking a folder** in the VS Code Explorer.

### ✨ Build Template

> Right-click a folder → **✨ Build Template**

1. You are prompted for the component name.
2. If you have more than one template, you select which template to use.
3. Codebot creates a new subfolder named after the component and writes all template files inside it.
4. Files that already exist are skipped automatically.

### 🔁 Update Template

> Right-click an existing folder → **🔁 Update Template**

Adds any template files that are missing from an existing component folder. The component name is derived from the folder you right-click. Existing files are never overwritten.

---

## Configuration

Open VS Code settings (`Cmd+,` / `Ctrl+,`) and search for **Codebot**, or add any of these keys to your `.vscode/settings.json`:

### `codebot.templatesFolderPath`

Path to the templates folder, relative to the workspace root.

```json
{
  "codebot.templatesFolderPath": "src/templates"
}
```

**Default:** `"templates"`

---

### `codebot.templateSettings`

Per-template settings. Keys must match template folder names exactly.

```json
{
  "codebot.templateSettings": {
    "ReactComponent": {
      "nameFormat": "pascal-case"
    },
    "ReactPackage": {
      "nameFormat": "kebab-case"
    }
  }
}
```

**Default:** `{}` (all templates use `pascal-case`)

---

## Name formats

The `nameFormat` option controls how the value you type is transformed before being passed to `{{name}}` and used as the output folder/file name.

All formats accept any input style — you can type `my button`, `my-button`, `MyButton`, or `myButton` and they all produce the same result.

| Format | Output example | Use case |
|---|---|---|
| `pascal-case` *(default)* | `MyComponent` | React components, classes |
| `kebab-case` | `my-component` | npm packages, CSS classes |
| `camel-case` | `myComponent` | JavaScript functions, variables |
| `snake-case` | `my_component` | Python modules, database tables |

**Example:** typing `"my button"` with each format:

```
pascal-case → MyButton
kebab-case  → my-button
camel-case  → myButton
snake-case  → my_button
```

---

## Nested template directories

Templates can contain subdirectories of any depth (up to 10 levels). The directory structure is preserved in the output.

```
templates/
└── ReactPackage/
    ├── package.json.hbs
    ├── tsconfig.json.hbs
    ├── vite.config.ts.hbs
    └── src/
        ├── App.tsx.hbs
        ├── main.tsx.hbs
        └── lib/
            └── main.tsx.hbs
```

Generates:

```
packages/
└── my-package/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        └── lib/
            └── main.tsx
```

---

## Examples

The [`examples/`](https://github.com/douglasgomes98/codebot/tree/main/examples) folder in this repository contains ready-to-use templates you can copy into your project:

| Template | Files generated | Best for |
|---|---|---|
| [`ComponentSass`](https://github.com/douglasgomes98/codebot/tree/main/examples/ComponentSass) | `.tsx`, `.module.scss`, `.spec.tsx`, `index.tsx` | React components with CSS Modules |
| [`ComponentTailwind`](https://github.com/douglasgomes98/codebot/tree/main/examples/ComponentTailwind) | `.tsx`, `.style.ts`, `index.tsx` | React components with Tailwind Variants |
| [`ComponentStyled`](https://github.com/douglasgomes98/codebot/tree/main/examples/ComponentSyled) | `index.tsx`, `styles.ts` | React components with Styled Components |
| [`StoriesTsx`](https://github.com/douglasgomes98/codebot/tree/main/examples/StoriesTsx) | `.stories.tsx` | Storybook story files |
| [`ReactPackage`](https://github.com/douglasgomes98/codebot/tree/main/examples/ReactPackage) | Full Vite + React package scaffold | Monorepo packages (`kebab-case`) |

### ComponentSass example

`ComponentSass.tsx.hbs`
```tsx
import { ReactNode } from 'react';

import styles from './{{name}}.module.scss';

export interface {{name}}Props {
  children: ReactNode;
}

export function {{name}}({ children }: {{name}}Props) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}
```

`index.tsx.hbs`
```tsx
export * from './{{name}}';
```

### ReactPackage example (kebab-case)

`package.json.hbs`
```json
{
  "name": "@myorg/{{name}}",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

`.vscode/settings.json`
```json
{
  "codebot.templateSettings": {
    "ReactPackage": {
      "nameFormat": "kebab-case"
    }
  }
}
```

Typing `"my button"` generates a folder named `my-button` with `package.json` containing `"name": "@myorg/my-button"`.

---

## Requirements

- VS Code `1.100.0` or later
- Templates folder must exist in the workspace before using the extension

---

## Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot)
- [Open VSX Registry](https://open-vsx.org/extension/douglasgomes98/codebot)
- [GitHub Repository](https://github.com/douglasgomes98/codebot)
- [Report an issue](https://github.com/douglasgomes98/codebot/issues)
