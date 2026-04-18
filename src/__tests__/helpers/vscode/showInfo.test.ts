import * as vscode from 'vscode';
import { showInfo } from '../../../helpers/vscode/showInfo';

const mockShowInfo = vscode.window.showInformationMessage as jest.Mock;

describe('showInfo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showInformationMessage with the given message', () => {
    showInfo('Component created successfully');

    expect(mockShowInfo).toHaveBeenCalledWith('Component created successfully');
    expect(mockShowInfo).toHaveBeenCalledTimes(1);
  });

  it('calls showInformationMessage with empty string', () => {
    showInfo('');

    expect(mockShowInfo).toHaveBeenCalledWith('');
  });
});
