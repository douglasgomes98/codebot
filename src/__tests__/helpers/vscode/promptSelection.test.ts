import * as vscode from 'vscode';
import { promptSelection } from '../../../helpers/vscode/promptSelection';

const mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;

describe('promptSelection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showQuickPick with items and placeholder', async () => {
    mockShowQuickPick.mockResolvedValue('ComponentA');

    const result = await promptSelection(['ComponentA', 'ComponentB'], {
      placeholder: 'Select a template',
    });

    expect(result).toBe('ComponentA');
    expect(mockShowQuickPick).toHaveBeenCalledWith(
      ['ComponentA', 'ComponentB'],
      {
        placeHolder: 'Select a template',
        canPickMany: false,
      },
    );
  });

  it('calls showQuickPick with default options when none provided', async () => {
    mockShowQuickPick.mockResolvedValue('Item');

    await promptSelection(['Item']);

    expect(mockShowQuickPick).toHaveBeenCalledWith(['Item'], {
      placeHolder: undefined,
      canPickMany: false,
    });
  });

  it('returns undefined when user dismisses the picker', async () => {
    mockShowQuickPick.mockResolvedValue(undefined);

    const result = await promptSelection(['A', 'B']);

    expect(result).toBeUndefined();
  });

  it('does not mutate the original items array', async () => {
    mockShowQuickPick.mockResolvedValue('A');
    const items = ['A', 'B'] as const;

    await promptSelection(items);

    const passedItems = mockShowQuickPick.mock.calls[0][0];
    expect(passedItems).not.toBe(items);
    expect(passedItems).toEqual(['A', 'B']);
  });
});
