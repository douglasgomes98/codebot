import * as vscode from 'vscode';
import { showError } from '../../../helpers/vscode/showError';

const mockShowError = vscode.window.showErrorMessage as jest.Mock;

describe('showError', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showErrorMessage with the given message', () => {
    showError('Template not found');

    expect(mockShowError).toHaveBeenCalledWith('Template not found');
    expect(mockShowError).toHaveBeenCalledTimes(1);
  });

  it('calls showErrorMessage with empty string', () => {
    showError('');

    expect(mockShowError).toHaveBeenCalledWith('');
  });
});
