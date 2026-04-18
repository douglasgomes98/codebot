import * as vscode from 'vscode';
import type { Option } from '../../types/Option';

export type InputOptions = {
  readonly prompt?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly validateInput?: (value: string) => string | undefined;
};

export const promptInput = (
  options: InputOptions = {},
): Promise<Option<string>> =>
  Promise.resolve(
    vscode.window.showInputBox({
      prompt: options.prompt,
      placeHolder: options.placeholder,
      value: options.value,
      validateInput: options.validateInput,
    }),
  );
