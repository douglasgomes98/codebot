import * as path from 'node:path';
import { CodebotError } from '../errors';
import {
  checkExistsFile,
  createFile,
  createFolder,
  showMessage,
  showSearchDropdown,
} from '../helpers';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProjectDetector } from '../managers/ProjectDetector';
import { TemplateManager } from '../managers/TemplateManager';
import {
  type CommandArgs,
  ErrorType,
  type ProcessedDirectory,
  type ProcessedFile,
  type TemplateType,
} from '../types';
import { PathResolver } from '../utils/PathResolver';

export async function updateComponent(args: CommandArgs) {
  const projectDetector = new ProjectDetector();
  const templateManager = new TemplateManager();
  const pathResolver = new PathResolver();
  const _configurationManager = new ConfigurationManager();

  try {
    // Step 1: Detect project context using ProjectDetector
    const currentFolderPath = args?.fsPath;
    if (!currentFolderPath) {
      throw new CodebotError(
        ErrorType.WORKSPACE_NOT_FOUND,
        'No folder path provided for component update',
        { args },
        false,
      );
    }

    const projectContext =
      await projectDetector.detectProject(currentFolderPath);

    // Step 2: Extract component name from folder path
    const componentName = path.basename(currentFolderPath);
    if (!componentName || componentName.trim() === '') {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        'Cannot determine component name from folder path',
        { currentFolderPath },
        true,
      );
    }

    // Step 3: Validate component name using PathResolver
    if (!pathResolver.validatePath(componentName)) {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        `Invalid component name: ${componentName}. Component names must be valid file/folder names.`,
        { componentName, folderPath: currentFolderPath },
        true,
      );
    }

    // Step 4: Discover templates using TemplateManager with hierarchical discovery
    const availableTemplates = await templateManager.discoverTemplates(
      projectContext.projectRoot,
    );

    if (availableTemplates.length === 0) {
      throw new CodebotError(
        ErrorType.TEMPLATE_FOLDER_EMPTY,
        `No templates found in project. Searched in: ${projectContext.templatePath}`,
        {
          projectRoot: projectContext.projectRoot,
          templatePath: projectContext.templatePath,
          isMultiProject: projectContext.isMultiProject,
        },
        true,
      );
    }

    // Step 5: Select template type
    let selectedTemplate: TemplateType | undefined;

    if (availableTemplates.length === 1) {
      selectedTemplate = availableTemplates[0];
    } else {
      const templateNames = availableTemplates.map(t => t.name);
      const selectedTemplateName = await showSearchDropdown(
        templateNames,
        'Select template type',
        'Start typing to filter templates...',
      );

      if (!selectedTemplateName) {
        throw new CodebotError(
          ErrorType.TEMPLATE_NOT_FOUND,
          'No template type selected',
          { availableTemplates: templateNames },
          true,
        );
      }

      selectedTemplate = availableTemplates.find(
        t => t.name === selectedTemplateName,
      );
    }

    if (!selectedTemplate) {
      throw new CodebotError(
        ErrorType.TEMPLATE_NOT_FOUND,
        'Selected template not found',
        { availableTemplates },
        false,
      );
    }

    // Step 6: Validate target path is within project boundaries
    const targetBasePath = currentFolderPath;

    // Ensure the target path is within project boundaries using PathResolver
    try {
      pathResolver.resolveTargetPath(
        projectContext,
        componentName,
        path.dirname(currentFolderPath),
      );
    } catch (pathError) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Target path validation failed: ${pathError instanceof Error ? pathError.message : 'Unknown error'}`,
        { targetPath: targetBasePath, projectContext },
        false,
      );
    }

    // Step 7: Process templates hierarchically and update files (only create missing files)
    const templateStructure = await templateManager.scanTemplateStructure(
      selectedTemplate.path,
    );

    if (
      templateStructure.files.length === 0 &&
      templateStructure.directories.length === 0
    ) {
      throw new CodebotError(
        ErrorType.TEMPLATE_FOLDER_EMPTY,
        `Template folder is empty: ${selectedTemplate.path}`,
        {
          templatePath: selectedTemplate.path,
          templateName: selectedTemplate.name,
        },
        false,
      );
    }

    // Ensure target directory exists
    if (!checkExistsFile(targetBasePath)) {
      createFolder(targetBasePath);
    }

    // Process the template hierarchy
    const processedTemplate = await templateManager.processTemplateHierarchy(
      templateStructure,
      componentName,
    );

    // Track creation and skipping statistics
    const creationReport = {
      filesCreated: 0,
      filesSkipped: 0,
      directoriesCreated: 0,
      createdFiles: [] as string[],
      skippedFiles: [] as string[],
    };

    // Process root-level files
    await processFiles(processedTemplate.files, targetBasePath, creationReport);

    // Process directories recursively
    await processDirectories(
      processedTemplate.directories,
      targetBasePath,
      creationReport,
    );

    // Step 8: Show success message with details
    let successMessage = `Component '${componentName}' updated successfully!`;
    if (creationReport.filesCreated > 0) {
      successMessage += ` (${creationReport.filesCreated} files added`;
      if (creationReport.directoriesCreated > 0) {
        successMessage += `, ${creationReport.directoriesCreated} directories created`;
      }
      if (creationReport.filesSkipped > 0) {
        successMessage += `, ${creationReport.filesSkipped} files already exist`;
      }
      successMessage += ')';
    } else if (creationReport.filesSkipped > 0) {
      successMessage = `Component '${componentName}' is already up to date (${creationReport.filesSkipped} files already exist)`;
    }

    if (projectContext.isMultiProject && projectContext.projectName) {
      successMessage += ` in project '${projectContext.projectName}'`;
    }

    showMessage(successMessage, 'information');
  } catch (error) {
    // Handle multi-project specific errors
    if (error instanceof CodebotError) {
      let errorMessage = error.message;

      // Add context for multi-project scenarios
      const details =
        typeof error.details === 'object' && error.details !== null
          ? (error.details as Record<string, unknown>)
          : null;
      if (
        error.type === ErrorType.TEMPLATE_FOLDER_EMPTY &&
        details?.isMultiProject
      ) {
        errorMessage +=
          '\n\nTip: In multi-project workspaces, templates can be placed in:';
        errorMessage += `\n- Project-specific: ${details.projectRoot}/templates`;
        errorMessage += `\n- Workspace-wide: ${details.workspaceRoot}/templates`;
      }

      if (error.type === ErrorType.PROJECT_DETECTION_ERROR) {
        errorMessage +=
          '\n\nTip: Ensure you are running the command from within a valid project folder.';
      }

      if (error.type === ErrorType.INVALID_COMPONENT_NAME) {
        errorMessage +=
          '\n\nTip: For update operations, make sure you are right-clicking on a component folder.';
      }

      showMessage(errorMessage, 'error');
    } else if (error instanceof Error) {
      // Handle unexpected errors
      const unexpectedError = new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Unexpected error during component update: ${error.message}`,
        { originalError: error.message, stack: error.stack },
        false,
      );

      showMessage(unexpectedError.message, 'error');
    } else {
      // Handle unknown errors
      showMessage('An unknown error occurred during component update', 'error');
    }
  }
}

// Helper function to process files hierarchically
async function processFiles(
  files: ProcessedFile[],
  basePath: string,
  creationReport: {
    filesCreated: number;
    filesSkipped: number;
    directoriesCreated: number;
    createdFiles: string[];
    skippedFiles: string[];
  },
): Promise<void> {
  for (const file of files) {
    const targetFilePath = path.join(basePath, file.targetPath);

    // Skip if file already exists (key difference from createComponent - don't overwrite)
    if (checkExistsFile(targetFilePath)) {
      creationReport.filesSkipped++;
      creationReport.skippedFiles.push(file.targetPath);
      continue;
    }

    try {
      // Create the file
      createFile(targetFilePath, file.content);
      creationReport.filesCreated++;
      creationReport.createdFiles.push(file.targetPath);
    } catch (error) {
      throw new CodebotError(
        ErrorType.TEMPLATE_PROCESSING_ERROR,
        `Failed to create file: ${file.targetPath}`,
        { targetPath: targetFilePath, error },
        false,
      );
    }
  }
}

// Helper function to process directories hierarchically
async function processDirectories(
  directories: ProcessedDirectory[],
  basePath: string,
  creationReport: {
    filesCreated: number;
    filesSkipped: number;
    directoriesCreated: number;
    createdFiles: string[];
    skippedFiles: string[];
  },
): Promise<void> {
  for (const directory of directories) {
    const targetDirPath = path.join(basePath, directory.targetPath);

    // Create directory if it doesn't exist
    if (!checkExistsFile(targetDirPath)) {
      createFolder(targetDirPath);
      creationReport.directoriesCreated++;
    }

    // Process files in this directory
    await processFiles(directory.files, basePath, creationReport);

    // Process subdirectories recursively
    await processDirectories(
      directory.subdirectories,
      basePath,
      creationReport,
    );
  }
}
