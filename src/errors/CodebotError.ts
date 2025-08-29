import { ErrorType } from '../types';

export class CodebotError extends Error {
  public readonly type: ErrorType;
  public readonly details?: any;
  public readonly recoverable: boolean;

  constructor(type: ErrorType, message: string, details?: any, recoverable: boolean = false) {
    super(message);
    this.name = 'CodebotError';
    this.type = type;
    this.details = details;
    this.recoverable = recoverable;
  }

  static workspaceNotFound(): CodebotError {
    return new CodebotError(
      ErrorType.WORKSPACE_NOT_FOUND,
      'Workspace path not found!',
      undefined,
      false
    );
  }

  static invalidComponentName(name?: string): CodebotError {
    return new CodebotError(
      ErrorType.INVALID_COMPONENT_NAME,
      'Invalid component name!',
      { providedName: name },
      true
    );
  }

  static templateFolderEmpty(path: string): CodebotError {
    return new CodebotError(
      ErrorType.TEMPLATE_FOLDER_EMPTY,
      'Templates folder is empty!',
      { templatePath: path },
      true
    );
  }

  static templateNotFound(templateType: string): CodebotError {
    return new CodebotError(
      ErrorType.TEMPLATE_NOT_FOUND,
      'Template folder not found!',
      { templateType },
      true
    );
  }

  static fileSystemError(operation: string, path: string, originalError?: Error): CodebotError {
    return new CodebotError(
      ErrorType.FILE_SYSTEM_ERROR,
      `File system error during ${operation}`,
      { path, originalError: originalError?.message },
      false
    );
  }

  static templateProcessingError(templatePath: string, originalError?: Error): CodebotError {
    return new CodebotError(
      ErrorType.TEMPLATE_PROCESSING_ERROR,
      'Error processing template',
      { templatePath, originalError: originalError?.message },
      true
    );
  }

  static projectDetectionError(folderPath: string, originalError?: Error): CodebotError {
    return new CodebotError(
      ErrorType.PROJECT_DETECTION_ERROR,
      'Error detecting project context',
      { folderPath, originalError: originalError?.message },
      true
    );
  }

  static configurationError(configPath: string, originalError?: Error): CodebotError {
    return new CodebotError(
      ErrorType.CONFIGURATION_ERROR,
      'Error loading configuration',
      { configPath, originalError: originalError?.message },
      true
    );
  }

  static pathValidationError(path: string, reason: string): CodebotError {
    return new CodebotError(
      ErrorType.FILE_SYSTEM_ERROR,
      `Invalid path: ${reason}`,
      { path, reason },
      true
    );
  }

  static pathTraversalError(path: string): CodebotError {
    return new CodebotError(
      ErrorType.FILE_SYSTEM_ERROR,
      'Path traversal attempt detected',
      { path },
      false
    );
  }

  static pathOutsideBoundariesError(path: string, projectRoot: string): CodebotError {
    return new CodebotError(
      ErrorType.FILE_SYSTEM_ERROR,
      'Path is outside project boundaries',
      { path, projectRoot },
      false
    );
  }
}