import * as Handlebars from 'handlebars';
import { type AppError, makeError } from '../../types/AppError';
import { err, ok, type Result } from '../../types/Result';

export const compileTemplate = (
  templateContent: string,
  data: Record<string, string>,
): Result<string, AppError> => {
  try {
    const template = Handlebars.compile(templateContent);
    return ok(template(data));
  } catch (cause) {
    return err(
      makeError('TEMPLATE_COMPILE_ERROR', 'Failed to compile template', cause),
    );
  }
};
