import * as vscode from 'vscode';
import type { Option } from '../../types/Option';

export type SelectionOptions = {
  readonly placeholder?: string;
};

export const promptSelection = (
  items: readonly string[],
  options: SelectionOptions = {},
): Promise<Option<string>> =>
  Promise.resolve(
    vscode.window.showQuickPick([...items], {
      placeHolder: options.placeholder,
      canPickMany: false,
    }),
  );
