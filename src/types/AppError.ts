export type ErrorCode =
  | 'FILE_READ_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'FOLDER_CREATE_ERROR'
  | 'FOLDER_LIST_ERROR'
  | 'TEMPLATE_COMPILE_ERROR'
  | 'TEMPLATE_DUPLICATE_PATH'
  | 'TEMPLATE_MAX_DEPTH_EXCEEDED'
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_FILE_READ_ERROR'
  | 'WORKSPACE_FILE_WRITE_ERROR'
  | 'WORKSPACE_FOLDER_CREATE_ERROR'
  | 'WORKSPACE_DIR_LIST_ERROR';

export type AppError = {
  readonly code: ErrorCode;
  readonly message: string;
  readonly cause?: unknown;
};

export const makeError = (
  code: ErrorCode,
  message: string,
  cause?: unknown,
): AppError => ({
  code,
  message,
  cause,
});
