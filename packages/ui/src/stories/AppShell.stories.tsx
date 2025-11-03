import type { Meta, StoryObj } from '@storybook/react';
import { AppShell, BarcodeInput, DataGridLineEditor, ManagerApprovalDialog, MoneyField, TenderButtons } from '..';
import { useState } from 'react';

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell
};

export default meta;

type Story = StoryObj<typeof AppShell>;

export const RegisterShell: Story = {
  render: () => {
    const [rows, setRows] = useState([
      { id: '1', sku: 'BK-1001', title: 'Sample Book', qty: 1, price: 1899, discount: 0 }
    ]);
    const [tender, setTender] = useState<'cash' | 'card' | 'gift_card' | 'store_credit'>('cash');
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
      <AppShell
        title="Register"
        toolbar={<BarcodeInput onSubmit={() => setDialogOpen(true)} placeholder="Scan item" autoFocus={false} />}
        sidebar={<MoneyField label="Amount" value={1899} onChange={() => undefined} />}
        footer={<TenderButtons value={tender} onChange={setTender} />}
      >
        <DataGridLineEditor rows={rows} onRowsChange={setRows} onRemove={() => setRows([])} />
        <ManagerApprovalDialog
          open={dialogOpen}
          onCancel={() => setDialogOpen(false)}
          onApprove={() => setDialogOpen(false)}
        />
      </AppShell>
    );
  }
};
