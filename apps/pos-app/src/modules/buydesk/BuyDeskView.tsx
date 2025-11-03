import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { BarcodeInput, MoneyField } from '@bookforge/ui';
import { scanBarcode } from '../register/registerApi';
import { buildEscPosReceipt } from '../printing/receiptTemplates';

const conditionMultipliers: Record<string, number> = {
  new: 0.4,
  like_new: 0.35,
  good: 0.3,
  fair: 0.2,
  poor: 0.1
};

const tradeBonus = 1.1;

const BuyDeskView = () => {
  const [isbn, setIsbn] = useState('');
  const [condition, setCondition] = useState<keyof typeof conditionMultipliers>('good');
  const [offerCents, setOfferCents] = useState(0);
  const [tradeOfferCents, setTradeOfferCents] = useState(0);
  const [metadata, setMetadata] = useState<{ title: string; sku: string; priceCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    try {
      setError(null);
      const result = await scanBarcode(barcode);
      setMetadata({ title: result.title, sku: result.sku, priceCents: result.priceCents });
      const base = Math.round(result.priceCents * conditionMultipliers[condition]);
      setOfferCents(base);
      setTradeOfferCents(Math.round(base * tradeBonus));
      setIsbn(barcode);
    } catch (error) {
      setError('Unable to fetch metadata.');
    }
  };

  const handlePrintSlip = async () => {
    if (!metadata) return;
    const slip = buildEscPosReceipt({
      orderId: `BUY-${isbn}`,
      items: [
        {
          id: isbn,
          sku: metadata.sku,
          title: metadata.title,
          qty: 1,
          priceCents: offerCents,
          discountCents: 0
        }
      ],
      subtotalCents: offerCents,
      taxCents: 0,
      totalCents: offerCents,
      tender: [
        { id: 'cash', type: 'cash', amountCents: offerCents },
        { id: 'trade', type: 'store_credit', amountCents: tradeOfferCents }
      ],
      loyaltyBalance: 0
    });
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.printEscPos(slip);
    } else {
      console.info('Offer slip', slip);
    }
  };

  return (
    <Stack spacing={3} sx={{ px: 4, py: 4 }}>
      <Typography variant="h5">Buy Desk Intake</Typography>
      <BarcodeInput onSubmit={handleScan} placeholder="Scan ISBN" />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {metadata ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{metadata.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                SKU {metadata.sku} · MSRP ${(metadata.priceCents / 100).toFixed(2)}
              </Typography>
              <Divider />
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Condition"
                  value={condition}
                  onChange={event => setCondition(event.target.value as keyof typeof conditionMultipliers)}
                  sx={{ minWidth: 200 }}
                >
                  {Object.keys(conditionMultipliers).map(key => (
                    <MenuItem key={key} value={key}>
                      {key.replace('_', ' ').toUpperCase()} ({Math.round(conditionMultipliers[key] * 100)}%)
                    </MenuItem>
                  ))}
                </TextField>
                <MoneyField label="Cash offer" value={offerCents} onChange={setOfferCents} />
                <MoneyField label="Trade offer" value={tradeOfferCents} onChange={setTradeOfferCents} />
              </Stack>
              <Divider />
              <Typography variant="body2">
                External market snapshot (sandbox): demand high, average sell price ${(metadata.priceCents / 100).toFixed(2)}.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handlePrintSlip}>
                  Print Offer Slip
                </Button>
                <Button variant="outlined">Accept & add to inventory</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Scan a book to view pricing guidance and create an offer.
        </Typography>
      )}
    </Stack>
  );
};

export default BuyDeskView;
