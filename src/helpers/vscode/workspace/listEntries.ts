import * as vscode from 'vscode';
import { type AppError, makeError } from '../../../types/AppError';
import { err, ok, type Result } from '../../../types/Result';

export type DirectoryEntry = {
  readonly name: string;
  readonly type: 'file' | 'directory' | 'other';
};

// vscode.FileType values: Unknown=0, File=1, Directory=2, SymbolicLink=64
const toEntryType = (fileType: number): DirectoryEntry['type'] => {
  if (fileType === 1) return 'file';
  if (fileType === 2) return 'directory';
  return 'other';
};

export const listWorkspaceEntries = async (
  uri: vscode.Uri,
): Promise<Result<DirectoryEntry[], AppError>> => {
  try {
    const entries = await vscode.workspace.fs.readDirectory(uri);
    return ok(
      entries.map(([name, type]: [string, number]) => ({
        name,
        type: toEntryType(type),
      })),
    );
  } catch (cause) {
    return err(
      makeError(
        'WORKSPACE_DIR_LIST_ERROR',
        `Failed to list workspace directory: ${uri.fsPath}`,
        cause,
      ),
    );
  }
};
