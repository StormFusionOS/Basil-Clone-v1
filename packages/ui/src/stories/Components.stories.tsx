import type { Meta, StoryObj } from '@storybook/react';
import {
  BarcodeInput,
  DataGridLineEditor,
  ManagerApprovalDialog,
  MoneyField,
  PrimaryButton,
  TenderButtons
} from '..';
import { useState } from 'react';

type Story = StoryObj;

export default {
  title: 'Components'
} satisfies Meta;

export const PrimaryButtonStory: Story = {
  render: () => <PrimaryButton showCartIcon>Checkout</PrimaryButton>
};

export const MoneyFieldStory: Story = {
  render: () => {
    const [value, setValue] = useState(1299);
    return <MoneyField label="Amount" value={value} onChange={setValue} />;
  }
};

export const TenderButtonsStory: Story = {
  render: () => {
    const [tender, setTender] = useState<'cash' | 'card' | 'gift_card' | 'store_credit'>('cash');
    return <TenderButtons value={tender} onChange={setTender} />;
  }
};

export const BarcodeInputStory: Story = {
  render: () => <BarcodeInput onSubmit={barcode => alert(barcode)} autoFocus={false} />
};

export const DataGridStory: Story = {
  render: () => (
    <DataGridLineEditor
      rows={[{ id: '1', sku: 'BK-123', title: 'Storybook Testing', qty: 1, price: 2599, discount: 0 }]}
      onRowsChange={() => undefined}
      onRemove={() => undefined}
    />
  )
};

export const ManagerDialogStory: Story = {
  render: () => (
    <ManagerApprovalDialog open onCancel={() => undefined} onApprove={() => undefined} />
  )
};
