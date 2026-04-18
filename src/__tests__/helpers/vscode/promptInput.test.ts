import * as vscode from 'vscode';
import { promptInput } from '../../../helpers/vscode/promptInput';

const mockShowInputBox = vscode.window.showInputBox as jest.Mock;

describe('promptInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showInputBox with mapped options', async () => {
    mockShowInputBox.mockResolvedValue('MyComponent');

    const result = await promptInput({
      prompt: 'Enter component name',
      placeholder: 'e.g. Button',
      value: 'Default',
    });

    expect(result).toBe('MyComponent');
    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: 'Enter component name',
      placeHolder: 'e.g. Button',
      value: 'Default',
      validateInput: undefined,
    });
  });

  it('calls showInputBox with no options when called without arguments', async () => {
    mockShowInputBox.mockResolvedValue('SomeValue');

    await promptInput();

    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: undefined,
      placeHolder: undefined,
      value: undefined,
      validateInput: undefined,
    });
  });

  it('returns undefined when user cancels the input box', async () => {
    mockShowInputBox.mockResolvedValue(undefined);

    const result = await promptInput({ prompt: 'Enter name' });

    expect(result).toBeUndefined();
  });

  it('passes validateInput function through to vscode', async () => {
    mockShowInputBox.mockResolvedValue('valid');
    const validate = (v: string) => (v.length < 3 ? 'Too short' : undefined);

    await promptInput({ validateInput: validate });

    expect(mockShowInputBox).toHaveBeenCalledWith(
      expect.objectContaining({ validateInput: validate }),
    );
  });
});
