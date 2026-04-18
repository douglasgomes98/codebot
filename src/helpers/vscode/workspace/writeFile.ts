import * as vscode from 'vscode';
import { type AppError, makeError } from '../../../types/AppError';
import { err, ok, type Result } from '../../../types/Result';

const encoder = new TextEncoder();

export const writeWorkspaceFile = async (
  uri: vscode.Uri,
  content: string,
): Promise<Result<void, AppError>> => {
  try {
    await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
    return ok(undefined);
  } catch (cause) {
    return err(
      makeError(
        'WORKSPACE_FILE_WRITE_ERROR',
        `Failed to write workspace file: ${uri.fsPath}`,
        cause,
      ),
    );
  }
};
