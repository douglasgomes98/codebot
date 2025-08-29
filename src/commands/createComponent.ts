import * as path from 'path';
import { ProjectDetector } from '../managers/ProjectDetector';
import { TemplateManager } from '../managers/TemplateManager';
import { PathResolver } from '../utils/PathResolver';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ErrorType, CommandArgs, TemplateType } from '../types';
import { CodebotError } from '../errors';
import {
  getTextByInputBox,
  showMessage,
  showSearchDropdown,
  createFolder,
  createFile,
  checkExistsFile,
  formatTemplateName,
} from '../helpers';

export async function createComponent(args: CommandArgs) {
  const projectDetector = new ProjectDetector();
  const templateManager = new TemplateManager();
  const pathResolver = new PathResolver();
  const configurationManager = new ConfigurationManager();

  try {
    // Step 1: Detect project context using ProjectDetector
    const currentFolderPath = args?.fsPath;
    if (!currentFolderPath) {
      throw new CodebotError(
        ErrorType.WORKSPACE_NOT_FOUND,
        'No folder path provided for component creation',
        { args },
        false
      );
    }

    const projectContext = await projectDetector.detectProject(currentFolderPath);

    // Step 2: Get component name from user
    const componentNameInput = await getTextByInputBox('Enter the component name:');
    if (!componentNameInput || componentNameInput.trim() === '') {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        'Component name cannot be empty',
        { componentName: componentNameInput },
        true
      );
    }

    const trimmedComponentName = componentNameInput!.trim();

    // Step 3: Validate component name using PathResolver
    if (!pathResolver.validatePath(trimmedComponentName)) {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        `Invalid component name: ${trimmedComponentName}. Component names must be valid file/folder names.`,
        { componentName: trimmedComponentName },
        true
      );
    }

    // Step 4: Discover templates using TemplateManager with hierarchical discovery
    const availableTemplates = await templateManager.discoverTemplates(projectContext.projectRoot);
    
    if (availableTemplates.length === 0) {
      throw new CodebotError(
        ErrorType.TEMPLATE_FOLDER_EMPTY,
        `No templates found in project. Searched in: ${projectContext.templatePath}`,
        { 
          projectRoot: projectContext.projectRoot,
          templatePath: projectContext.templatePath,
          isMultiProject: projectContext.isMultiProject
        },
        true
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
          true
        );
      }

      selectedTemplate = availableTemplates.find(t => t.name === selectedTemplateName);
    }

    if (!selectedTemplate) {
      throw new CodebotError(
        ErrorType.TEMPLATE_NOT_FOUND,
        'Selected template not found',
        { availableTemplates },
        false
      );
    }

    // Step 6: Resolve target path using PathResolver
    const targetBasePath = pathResolver.resolveTargetPath(projectContext, trimmedComponentName, currentFolderPath);
    
    // Step 7: Process templates and create files
    const templateFiles = templateManager.getTemplateFiles(selectedTemplate.path);
    
    if (templateFiles.length === 0) {
      throw new CodebotError(
        ErrorType.TEMPLATE_FOLDER_EMPTY,
        `Template folder is empty: ${selectedTemplate.path}`,
        { templatePath: selectedTemplate.path, templateName: selectedTemplate.name },
        false
      );
    }

    // Create target directory if it doesn't exist
    if (!checkExistsFile(targetBasePath)) {
      createFolder(targetBasePath);
    }

    let filesCreated = 0;
    let filesSkipped = 0;

    // Process each template file
    for (const templateFile of templateFiles) {
      try {
        const templatePath = path.join(selectedTemplate.path, templateFile);
        
        // Format the target filename
        const targetFileName = formatTemplateName(
          templateFile,
          selectedTemplate.name,
          trimmedComponentName,
        );
        
        const targetFilePath = path.join(targetBasePath, targetFileName);

        // Skip if file already exists (don't overwrite)
        if (checkExistsFile(targetFilePath)) {
          filesSkipped++;
          continue;
        }

        // Process template content
        const processedContent = templateManager.processTemplate(templatePath, trimmedComponentName);
        
        // Create the file
        createFile(targetFilePath, processedContent);
        filesCreated++;

      } catch (templateError) {
        // Log individual template processing errors but continue with other files
        console.warn(`Failed to process template ${templateFile}:`, templateError);
        throw new CodebotError(
          ErrorType.TEMPLATE_PROCESSING_ERROR,
          `Failed to process template: ${templateFile}`,
          { templateFile, templatePath: selectedTemplate.path, error: templateError },
          false
        );
      }
    }

    // Step 8: Show success message with details
    let successMessage = `Component '${trimmedComponentName}' created successfully!`;
    if (filesCreated > 0) {
      successMessage += ` (${filesCreated} files created`;
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
      if (error.type === ErrorType.TEMPLATE_FOLDER_EMPTY && error.details?.isMultiProject) {
        errorMessage += '\n\nTip: In multi-project workspaces, templates can be placed in:';
        errorMessage += `\n- Project-specific: ${error.details.projectRoot}/templates`;
        errorMessage += `\n- Workspace-wide: ${error.details.workspaceRoot}/templates`;
      }
      
      if (error.type === ErrorType.PROJECT_DETECTION_ERROR) {
        errorMessage += '\n\nTip: Ensure you are running the command from within a valid project folder.';
      }

      showMessage(errorMessage, 'error');
    } else if (error instanceof Error) {
      // Handle unexpected errors
      const unexpectedError = new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Unexpected error during component creation: ${error.message}`,
        { originalError: error.message, stack: error.stack },
        false
      );
      
      showMessage(unexpectedError.message, 'error');
    } else {
      // Handle unknown errors
      showMessage('An unknown error occurred during component creation', 'error');
    }
  }
}
