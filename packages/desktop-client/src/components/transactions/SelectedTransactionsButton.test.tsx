import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestProvider } from '@desktop-client/redux/mock';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { SelectedProviderWithItems } from '@desktop-client/hooks/useSelected';

import { SelectedTransactionsButton } from './SelectedTransactionsButton';

import { generateAccount, generateTransaction } from 'loot-core/mocks';

const account = generateAccount('Bank of America', false, false, true);
vi.mock('../../hooks/useAccounts', () => ({
  useAccounts: () => [account],
}));

function ComponentUnderTest({
  onDuplicate,
  onDelete,
  onEdit,
}) {
  const transactions = [...generateTransaction({ account: account.id })];

  return (
    <TestProvider>
      <HotkeysProvider>
        <SelectedProviderWithItems
          name='transactions'
          items={transactions}
          initialSelectedIds={transactions.map(t => t.id)}
          fetchAllIds={() => Promise.resolve(transactions.map(t => t.id))}
        >
          <SelectedTransactionsButton
            getTransaction={(id) => transactions.find(t => id === t.id)}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </SelectedProviderWithItems>
      </HotkeysProvider>
    </TestProvider>
  );
}

function renderComponentUnderTest() {
  const handleDuplicate = vi.fn();
  const handleDelete = vi.fn();
  const handleEdit = vi.fn();

  return {
    ...render(
      <ComponentUnderTest
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    ), handleDuplicate, handleDelete, handleEdit
  };
}

describe('Buttons', () => {
  test('menu items are disabled when selected transaction(s) are from closed account', async () => {
    const { container, handleDuplicate, handleDelete, handleEdit } = renderComponentUnderTest();

    // Open the menu by clicking on the button
    const transactionsButton = container.querySelector('[data-testid="transactions-select-button"]');
    await userEvent.click(transactionsButton);

    const transactionsMenu = screen.getByTestId('transactions-select-tooltip');

    // Ensure the "Delete" menu item can't be clicked
    const deleteItem = transactionsMenu.querySelector('[data-testid="delete"]');
    await userEvent.click(deleteItem);
    expect(handleDelete).not.toHaveBeenCalled();

    // Ensure the "Duplicate" menu item can't be clicked
    const duplicateItem = transactionsMenu.querySelector('[data-testid="duplicate"]');
    await userEvent.click(duplicateItem);
    expect(handleDuplicate).not.toHaveBeenCalled();

    // Ensure the "Account" menu item can't be clicked
    const accountItem = transactionsMenu.querySelector('[data-testid="account"]');
    await userEvent.click(accountItem);
    expect(handleEdit).not.toHaveBeenCalledWith('account');

    // Ensure the "Amount" menu item can't be clicked
    const amountItem = transactionsMenu.querySelector('[data-testid="amount"]');
    await userEvent.click(amountItem);
    expect(handleEdit).not.toHaveBeenCalledWith('amount');
  });

  test('hotkeys for menu items are disabled when selected transaction(s) are from closed account', async () => {
    const { container, handleDuplicate, handleDelete, handleEdit } = renderComponentUnderTest();

    // Ensure the "d" key does not delete transactions
    await userEvent.keyboard('{d}');
    expect(handleDelete).not.toHaveBeenCalled();

    // Ensure the "u" key does not duplicate transactions
    await userEvent.keyboard('{u}');
    expect(handleDuplicate).not.toHaveBeenCalled();

    // Ensure the "a" key does not edit the account
    await userEvent.keyboard('{a}');
    expect(handleEdit).not.toHaveBeenCalledWith('account', expect.anything());

    // Ensure the "m" key does not edit the credit- or debit amount
    await userEvent.keyboard('{m}');
    expect(handleEdit).not.toHaveBeenCalledWith('amount', expect.anything());
  });
});
