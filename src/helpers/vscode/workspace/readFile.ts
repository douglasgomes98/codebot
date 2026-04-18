import * as vscode from 'vscode';
import { type AppError, makeError } from '../../../types/AppError';
import { err, ok, type Result } from '../../../types/Result';

const decoder = new TextDecoder();

export const readWorkspaceFile = async (
  uri: vscode.Uri,
): Promise<Result<string, AppError>> => {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return ok(decoder.decode(bytes));
  } catch (cause) {
    return err(
      makeError(
        'WORKSPACE_FILE_READ_ERROR',
        `Failed to read workspace file: ${uri.fsPath}`,
        cause,
      ),
    );
  }
};
