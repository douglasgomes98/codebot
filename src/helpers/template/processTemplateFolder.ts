import type * as vscode from 'vscode';
import type { AppError } from '../../types/AppError';
import { makeError } from '../../types/AppError';
import type { Result } from '../../types/Result';
import { err, ok } from '../../types/Result';
import { readWorkspaceFile } from '../vscode/workspace/readFile';
import { compileTemplate } from './compileTemplate';
import { isTemplateFile } from './isTemplateFile';
import { removeTemplateExtension } from './removeTemplateExtension';
import { resolveTargetPath } from './resolveTargetPath';
import { walkTemplateFolder } from './walkTemplateFolder';

export type ProcessedTemplateFile = {
  readonly targetRelativePath: string;
  readonly content: string;
};

export const processTemplateFolder = async (
  templateFolderUri: vscode.Uri,
  templateName: string,
  componentName: string,
): Promise<Result<ProcessedTemplateFile[], AppError>> => {
  const walkResult = await walkTemplateFolder(templateFolderUri);
  if (!walkResult.success) return walkResult;

  const processed: ProcessedTemplateFile[] = [];
  const seenPaths = new Set<string>();

  for (const entry of walkResult.value) {
    if (!isTemplateFile(entry.relativePath)) continue;

    const contentResult = await readWorkspaceFile(entry.uri);
    if (!contentResult.success) return contentResult;

    const compiledResult = compileTemplate(contentResult.value, {
      name: componentName,
    });
    if (!compiledResult.success) return compiledResult;

    const targetRelativePath = resolveTargetPath(
      removeTemplateExtension(entry.relativePath),
      templateName,
      componentName,
    );

    if (seenPaths.has(targetRelativePath)) {
      return err(
        makeError(
          'TEMPLATE_DUPLICATE_PATH',
          `Template produces duplicate output path: '${targetRelativePath}'.`,
        ),
      );
    }
    seenPaths.add(targetRelativePath);

    processed.push({ targetRelativePath, content: compiledResult.value });
  }

  return ok(processed);
};
