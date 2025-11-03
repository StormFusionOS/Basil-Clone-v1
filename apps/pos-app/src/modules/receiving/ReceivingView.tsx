import { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { DataGridLineEditor, LineItemRow } from '@bookforge/ui';
import { scanBarcode } from '../register/registerApi';

const ReceivingView = () => {
  const [poNumber, setPoNumber] = useState('');
  const [lines, setLines] = useState<LineItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    try {
      setError(null);
      const result = await scanBarcode(barcode);
      setLines(prev => [
        ...prev,
        {
          id: `${barcode}-${Date.now()}`,
          sku: result.sku,
          title: result.title,
          qty: 1,
          price: result.priceCents,
          discount: 0
        }
      ]);
    } catch (error) {
      setError('Unable to match barcode to PO item.');
    }
  };

  return (
    <Stack spacing={3} sx={{ px: 4, py: 4 }}>
      <Typography variant="h5">Receiving & Cycle Counts</Typography>
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField label="PO / ASN" value={poNumber} onChange={event => setPoNumber(event.target.value)} />
            <Button variant="contained">Load PO</Button>
            <Button variant="outlined" onClick={() => setLines([])}>
              Reset
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <DataGridLineEditor rows={lines} onRowsChange={setLines} onRemove={id => setLines(lines.filter(line => line.id !== id))} />
      <TextField
        label="Scan Item"
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleScan((event.target as HTMLInputElement).value);
            (event.target as HTMLInputElement).value = '';
          }
        }}
        placeholder="Scan barcode"
      />
      <Button variant="contained" color="primary">
        Commit Receipt
      </Button>
    </Stack>
  );
};

export default ReceivingView;
