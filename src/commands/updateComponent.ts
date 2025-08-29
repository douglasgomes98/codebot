import * as path from 'path';
import { ProjectDetector } from '../managers/ProjectDetector';
import { TemplateManager } from '../managers/TemplateManager';
import { PathResolver } from '../utils/PathResolver';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ErrorType, CommandArgs, TemplateType } from '../types';
import { CodebotError } from '../errors';
import {
  showMessage,
  showSearchDropdown,
  createFolder,
  createFile,
  checkExistsFile,
  formatTemplateName,
} from '../helpers';

export async function updateComponent(args: CommandArgs) {
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
        'No folder path provided for component update',
        { args },
        false
      );
    }

    const projectContext = await projectDetector.detectProject(currentFolderPath);

    // Step 2: Extract component name from folder path
    const componentName = path.basename(currentFolderPath);
    if (!componentName || componentName.trim() === '') {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        'Cannot determine component name from folder path',
        { currentFolderPath },
        true
      );
    }

    // Step 3: Validate component name using PathResolver
    if (!pathResolver.validatePath(componentName)) {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        `Invalid component name: ${componentName}. Component names must be valid file/folder names.`,
        { componentName, folderPath: currentFolderPath },
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

    // Step 6: Validate target path is within project boundaries
    const targetBasePath = currentFolderPath;
    
    // Ensure the target path is within project boundaries using PathResolver
    try {
      pathResolver.resolveTargetPath(projectContext, componentName, path.dirname(currentFolderPath));
    } catch (pathError) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Target path validation failed: ${pathError instanceof Error ? pathError.message : 'Unknown error'}`,
        { targetPath: targetBasePath, projectContext },
        false
      );
    }
    
    // Step 7: Process templates and update files (only create missing files)
    const templateFiles = templateManager.getTemplateFiles(selectedTemplate.path);
    
    if (templateFiles.length === 0) {
      throw new CodebotError(
        ErrorType.TEMPLATE_FOLDER_EMPTY,
        `Template folder is empty: ${selectedTemplate.path}`,
        { templatePath: selectedTemplate.path, templateName: selectedTemplate.name },
        false
      );
    }

    // Ensure target directory exists
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
          componentName,
        );
        
        const targetFilePath = path.join(targetBasePath, targetFileName);

        // Skip if file already exists (key difference from createComponent - don't overwrite)
        if (checkExistsFile(targetFilePath)) {
          filesSkipped++;
          continue;
        }

        // Process template content
        const processedContent = templateManager.processTemplate(templatePath, componentName);
        
        // Create the missing file
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
    let successMessage = `Component '${componentName}' updated successfully!`;
    if (filesCreated > 0) {
      successMessage += ` (${filesCreated} files added`;
      if (filesSkipped > 0) {
        successMessage += `, ${filesSkipped} files already exist`;
      }
      successMessage += ')';
    } else if (filesSkipped > 0) {
      successMessage = `Component '${componentName}' is already up to date (${filesSkipped} files already exist)`;
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

      if (error.type === ErrorType.INVALID_COMPONENT_NAME) {
        errorMessage += '\n\nTip: For update operations, make sure you are right-clicking on a component folder.';
      }

      showMessage(errorMessage, 'error');
    } else if (error instanceof Error) {
      // Handle unexpected errors
      const unexpectedError = new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Unexpected error during component update: ${error.message}`,
        { originalError: error.message, stack: error.stack },
        false
      );
      
      showMessage(unexpectedError.message, 'error');
    } else {
      // Handle unknown errors
      showMessage('An unknown error occurred during component update', 'error');
    }
  }
}
