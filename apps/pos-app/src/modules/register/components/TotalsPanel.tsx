import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { LineItem, TenderSplit } from '../types';
import { selectSubtotal, selectTax, selectTenderTotal, selectTotal } from '../registerStore';

export interface TotalsPanelProps {
  items: LineItem[];
  tender: TenderSplit[];
  taxRate?: number;
}

export const TotalsPanel = ({ items, tender, taxRate = 0.095 }: TotalsPanelProps) => {
  const subtotal = selectSubtotal(items);
  const tax = selectTax(subtotal, taxRate);
  const total = selectTotal(subtotal, tax);
  const tenderTotal = selectTenderTotal(tender);

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Totals</Typography>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography>${(subtotal / 100).toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Tax</Typography>
            <Typography>${(tax / 100).toFixed(2)}</Typography>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">${(total / 100).toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Tendered</Typography>
            <Typography>${(tenderTotal / 100).toFixed(2)}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
