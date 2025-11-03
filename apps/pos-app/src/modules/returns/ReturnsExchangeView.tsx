import { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { DataGridLineEditor, LineItemRow, ManagerApprovalDialog } from '@bookforge/ui';
import { scanBarcode } from '../register/registerApi';

const restockByCondition = (condition: string) => condition !== 'poor';

const ReturnsExchangeView = () => {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const handleLookup = async () => {
    if (!receiptNumber) return;
    try {
      setError(null);
      const result = await scanBarcode(receiptNumber);
      setLineItems([
        {
          id: 'return-line',
          sku: result.sku,
          title: result.title,
          qty: -1,
          price: result.priceCents,
          discount: 0
        },
        {
          id: 'exchange-line',
          sku: `${result.sku}-EX`,
          title: `${result.title} (Exchange)`,
          qty: 1,
          price: result.priceCents,
          discount: 0
        }
      ]);
    } catch (error) {
      setError('Unable to locate receipt.');
    }
  };

  return (
    <Stack spacing={3} sx={{ height: '100%', px: 4, py: 4 }}>
      <Typography variant="h5">Returns & Exchanges</Typography>
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Receipt barcode or order ID"
              value={receiptNumber}
              onChange={event => setReceiptNumber(event.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleLookup}>
              Lookup
            </Button>
            <Button variant="outlined" color="warning" onClick={() => setApprovalOpen(true)}>
              Policy Override
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <DataGridLineEditor rows={lineItems} onRowsChange={setLineItems} onRemove={() => setLineItems([])} />
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Restock items automatically when condition allows. Manager override required for policy exceptions.
        </Typography>
        {lineItems.map(item => (
          <Typography key={item.id} variant="body2">
            {item.title} → {restockByCondition(item.overrideReason ?? 'good') ? 'Restock to shelf' : 'Send to clearance bin'}
          </Typography>
        ))}
      </Stack>
      <ManagerApprovalDialog
        open={approvalOpen}
        onCancel={() => setApprovalOpen(false)}
        onApprove={() => setApprovalOpen(false)}
        reasonLabel="Override reason"
      />
    </Stack>
  );
};

export default ReturnsExchangeView;
