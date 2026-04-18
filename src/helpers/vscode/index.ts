export type { WorkspaceFolder } from './getWorkspaceFolders';
export { getWorkspaceFolders } from './getWorkspaceFolders';
export type { InputOptions } from './promptInput';
export { promptInput } from './promptInput';
export type { SelectionOptions } from './promptSelection';
export { promptSelection } from './promptSelection';
export { showError } from './showError';
export { showInfo } from './showInfo';
export type { DirectoryEntry } from './workspace';
export {
  createWorkspaceFolder,
  listWorkspaceEntries,
  readWorkspaceFile,
  workspaceFileExists,
  writeWorkspaceFile,
} from './workspace';
