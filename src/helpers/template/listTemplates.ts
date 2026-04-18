import type * as vscode from 'vscode';
import type { AppError } from '../../types/AppError';
import type { Result } from '../../types/Result';
import { ok } from '../../types/Result';
import { listWorkspaceEntries } from '../vscode/workspace/listEntries';

export const listTemplates = async (
  templatesUri: vscode.Uri,
): Promise<Result<string[], AppError>> => {
  const result = await listWorkspaceEntries(templatesUri);
  if (!result.success) return result;

  const names = result.value
    .filter(entry => entry.type === 'directory')
    .map(entry => entry.name);

  return ok(names);
};
