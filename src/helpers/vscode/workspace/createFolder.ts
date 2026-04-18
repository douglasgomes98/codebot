import * as vscode from 'vscode';
import { type AppError, makeError } from '../../../types/AppError';
import { err, ok, type Result } from '../../../types/Result';

export const createWorkspaceFolder = async (
  uri: vscode.Uri,
): Promise<Result<void, AppError>> => {
  try {
    await vscode.workspace.fs.createDirectory(uri);
    return ok(undefined);
  } catch (cause) {
    return err(
      makeError(
        'WORKSPACE_FOLDER_CREATE_ERROR',
        `Failed to create workspace folder: ${uri.fsPath}`,
        cause,
      ),
    );
  }
};
