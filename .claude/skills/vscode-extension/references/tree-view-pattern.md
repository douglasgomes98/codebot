# Tree View Pattern

## Full TreeDataProvider Implementation

```typescript
import * as vscode from 'vscode';

interface MyItem {
  label: string;
  children?: MyItem[];
  contextValue?: string; // used in "when" clauses for menus
}

class MyTreeDataProvider implements vscode.TreeDataProvider<MyItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MyItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MyItem): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.children?.length
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    item.contextValue = element.contextValue;       // enables "when: viewItem == myType"
    item.iconPath = new vscode.ThemeIcon('file');   // or Uri for custom icon
    item.tooltip = `Tooltip for ${element.label}`;
    item.command = {                                // click action
      command: 'myExt.openItem',
      title: 'Open',
      arguments: [element]
    };
    return item;
  }

  getChildren(element?: MyItem): MyItem[] {
    if (!element) return this.getRootItems();
    return element.children ?? [];
  }

  private getRootItems(): MyItem[] {
    return [
      { label: 'Section A', children: [{ label: 'Item 1', contextValue: 'leaf' }] },
      { label: 'Section B', contextValue: 'leaf' }
    ];
  }
}

// Registration in activate()
export function activate(context: vscode.ExtensionContext) {
  const provider = new MyTreeDataProvider();

  const treeView = vscode.window.createTreeView('myExt.treeViewId', {
    treeDataProvider: provider,
    showCollapseAll: true,     // adds collapse-all button to view title
    canSelectMany: false
  });

  // Refresh on relevant events
  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand('myExt.refresh', () => provider.refresh()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh())
  );
}
```

## package.json for Tree View

```json
"contributes": {
  "viewsContainers": {
    "activitybar": [
      { "id": "myExtContainer", "title": "My Extension", "icon": "assets/icon.svg" }
    ]
  },
  "views": {
    "myExtContainer": [
      { "id": "myExt.treeViewId", "name": "My Items" }
    ]
  },
  "commands": [
    { "command": "myExt.refresh", "title": "Refresh", "icon": "$(refresh)" },
    { "command": "myExt.deleteItem", "title": "Delete Item", "icon": "$(trash)" }
  ],
  "menus": {
    "view/title": [
      { "command": "myExt.refresh", "when": "view == myExt.treeViewId", "group": "navigation" }
    ],
    "view/item/context": [
      {
        "command": "myExt.deleteItem",
        "when": "view == myExt.treeViewId && viewItem == leaf",
        "group": "inline"
      }
    ]
  }
}
```

## Revealing Items Programmatically

```typescript
// Requires createTreeView (not registerTreeDataProvider)
await treeView.reveal(item, { select: true, focus: true, expand: true });
```

## Welcome View (empty state)

```json
"viewsWelcome": [
  {
    "view": "myExt.treeViewId",
    "contents": "No templates found.\n[Create Template](command:myExt.createTemplate)\nOr [learn more](https://example.com).",
    "when": "myExt.isEmpty"
  }
]
```

Set the context key via:
```typescript
vscode.commands.executeCommand('setContext', 'myExt.isEmpty', true);
```
