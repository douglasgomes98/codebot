import * as path from 'node:path';
import { CodebotError } from '../errors';
import {
  checkExistsFile,
  createFile,
  createFolder,
  getTextByInputBox,
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

export async function createComponent(args: CommandArgs) {
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
        'No folder path provided for component creation',
        { args },
        false,
      );
    }

    const projectContext =
      await projectDetector.detectProject(currentFolderPath);

    // Step 2: Get component name from user
    const componentNameInput = await getTextByInputBox(
      'Enter the component name:',
    );
    if (!componentNameInput || componentNameInput.trim() === '') {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        'Component name cannot be empty',
        { componentName: componentNameInput },
        true,
      );
    }

    const trimmedComponentName = componentNameInput?.trim();

    // Step 3: Validate component name using PathResolver
    if (!pathResolver.validatePath(trimmedComponentName)) {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        `Invalid component name: ${trimmedComponentName}. Component names must be valid file/folder names.`,
        { componentName: trimmedComponentName },
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

    // Step 6: Resolve target path using PathResolver
    const targetBasePath = pathResolver.resolveTargetPath(
      projectContext,
      trimmedComponentName,
      currentFolderPath,
    );

    // Step 7: Process templates hierarchically and create files
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

    // Create target directory if it doesn't exist
    if (!checkExistsFile(targetBasePath)) {
      createFolder(targetBasePath);
    }

    // Process the template hierarchy
    const processedTemplate = await templateManager.processTemplateHierarchy(
      templateStructure,
      trimmedComponentName,
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

    const filesCreated = creationReport.filesCreated;
    const filesSkipped = creationReport.filesSkipped;

    // Step 8: Show success message with details
    let successMessage = `Component '${trimmedComponentName}' created successfully!`;
    if (filesCreated > 0) {
      successMessage += ` (${filesCreated} files created`;
      if (creationReport.directoriesCreated > 0) {
        successMessage += `, ${creationReport.directoriesCreated} directories created`;
      }
      if (filesSkipped > 0) {
        successMessage += `, ${filesSkipped} files skipped`;
      }
      successMessage += ')';
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
      const details = error.details as
        | {
            isMultiProject?: boolean;
            projectRoot?: string;
            workspaceRoot?: string;
          }
        | undefined;
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

      showMessage(errorMessage, 'error');
    } else if (error instanceof Error) {
      // Handle unexpected errors
      const unexpectedError = new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Unexpected error during component creation: ${error.message}`,
        { originalError: error.message, stack: error.stack },
        false,
      );

      showMessage(unexpectedError.message, 'error');
    } else {
      // Handle unknown errors
      showMessage(
        'An unknown error occurred during component creation',
        'error',
      );
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

    // Skip if file already exists (don't overwrite)
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
