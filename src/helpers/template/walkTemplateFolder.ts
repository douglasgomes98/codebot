import * as vscode from 'vscode';
import type { AppError } from '../../types/AppError';
import { makeError } from '../../types/AppError';
import type { Result } from '../../types/Result';
import { err, ok } from '../../types/Result';
import { listWorkspaceEntries } from '../vscode/workspace/listEntries';

export type TemplateFileEntry = {
  readonly relativePath: string;
  readonly uri: vscode.Uri;
};

const MAX_DEPTH = 10;

const walk = async (
  uri: vscode.Uri,
  prefix: string,
  depth: number,
): Promise<Result<TemplateFileEntry[], AppError>> => {
  if (depth > MAX_DEPTH) {
    return err(
      makeError(
        'TEMPLATE_MAX_DEPTH_EXCEEDED',
        `Template folder exceeds the maximum allowed depth of ${MAX_DEPTH}.`,
      ),
    );
  }

  const result = await listWorkspaceEntries(uri);
  if (!result.success) return result;

  const entries: TemplateFileEntry[] = [];

  for (const entry of result.value) {
    const entryUri = vscode.Uri.joinPath(uri, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.type === 'file') {
      entries.push({ relativePath, uri: entryUri });
    } else if (entry.type === 'directory') {
      const subResult = await walk(entryUri, relativePath, depth + 1);
      if (!subResult.success) return subResult;
      entries.push(...subResult.value);
    }
  }

  return ok(entries);
};

export const walkTemplateFolder = (
  uri: vscode.Uri,
): Promise<Result<TemplateFileEntry[], AppError>> => walk(uri, '', 0);
