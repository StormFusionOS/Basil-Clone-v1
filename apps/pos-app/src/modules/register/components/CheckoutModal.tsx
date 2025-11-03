import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  MenuItem,
  TextField
} from '@mui/material';
import { useState } from 'react';
import { MoneyField, TenderButtons, TenderType } from '@bookforge/ui';
import { TenderSplit } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  totalDueCents: number;
  initialTender: TenderSplit[];
  onSubmit: (splits: TenderSplit[]) => Promise<void> | void;
  loyaltyBalance?: number;
  isProcessing?: boolean;
}

const tenderTypes: TenderType[] = ['cash', 'card', 'gift_card', 'store_credit'];

const labelMap: Record<TenderType, string> = {
  cash: 'Cash',
  card: 'Card',
  gift_card: 'Gift Card',
  store_credit: 'Store Credit'
};

export const CheckoutModal = ({
  open,
  onClose,
  totalDueCents,
  initialTender,
  onSubmit,
  loyaltyBalance = 0,
  isProcessing = false
}: CheckoutModalProps) => {
  const [tender, setTender] = useState<TenderSplit[]>(initialTender);
  const [activeTender, setActiveTender] = useState<TenderType>(initialTender[0]?.type ?? 'cash');

  const totalTender = tender.reduce((sum, item) => sum + item.amountCents, 0);
  const changeDue = totalTender - totalDueCents;

  const handleAmountChange = (id: string, amount: number) => {
    setTender(prev => prev.map(split => (split.id === id ? { ...split, amountCents: amount } : split)));
  };

  const handleTenderChange = (value: TenderType) => {
    setActiveTender(value);
    setTender(prev => {
      const existing = prev.find(split => split.type === value);
      if (existing) return prev;
      return [...prev, { id: uuidv4(), type: value, amountCents: 0 }];
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Checkout</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="h6">Amount due: ${(totalDueCents / 100).toFixed(2)}</Typography>
          <TenderButtons value={activeTender} onChange={handleTenderChange} />
          {tender.map(split => (
            <Stack direction="row" spacing={2} key={split.id} alignItems="center">
              <TextField select label="Tender" value={split.type} sx={{ minWidth: 180 }}
                onChange={event =>
                  setTender(prev =>
                    prev.map(row => (row.id === split.id ? { ...row, type: event.target.value as TenderType } : row))
                  )
                }
              >
                {tenderTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {labelMap[type]}
                  </MenuItem>
                ))}
              </TextField>
              <MoneyField label="Amount" value={split.amountCents} onChange={value => handleAmountChange(split.id, value)} />
              <TextField
                label="Reference"
                value={split.reference ?? ''}
                onChange={event =>
                  setTender(prev =>
                    prev.map(row => (row.id === split.id ? { ...row, reference: event.target.value } : row))
                  )
                }
              />
            </Stack>
          ))}
          <Typography variant="body2" color="text.secondary">
            Loyalty balance after checkout: {loyaltyBalance} pts
          </Typography>
          <Typography variant="h6" color={changeDue >= 0 ? 'success.main' : 'error.main'}>
            {changeDue >= 0 ? `Change due: $${(changeDue / 100).toFixed(2)}` : `Remaining due: $${Math.abs(changeDue / 100).toFixed(2)}`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(tender)}
          disabled={totalTender < totalDueCents || isProcessing}
        >
          Complete Sale
        </Button>
      </DialogActions>
    </Dialog>
  );
};
