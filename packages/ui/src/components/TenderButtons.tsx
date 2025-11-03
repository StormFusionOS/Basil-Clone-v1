import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export type TenderType = 'cash' | 'card' | 'gift_card' | 'store_credit';

export interface TenderButtonsProps {
  value: TenderType;
  onChange: (value: TenderType) => void;
}

export const TenderButtons = ({ value, onChange }: TenderButtonsProps) => (
  <Stack direction="row" spacing={2} flexWrap="wrap">
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, val) => val && onChange(val)}
      sx={{ '& .MuiToggleButton-root': { minWidth: 160, height: 64, borderRadius: 2, fontWeight: 600 } }}
    >
      <ToggleButton value="cash">
        <PaymentsIcon sx={{ mr: 1 }} /> Cash
      </ToggleButton>
      <ToggleButton value="card">
        <CreditCardIcon sx={{ mr: 1 }} /> Card
      </ToggleButton>
      <ToggleButton value="gift_card">
        <CardGiftcardIcon sx={{ mr: 1 }} /> Gift Card
      </ToggleButton>
      <ToggleButton value="store_credit">
        <AccountBalanceWalletIcon sx={{ mr: 1 }} /> Store Credit
      </ToggleButton>
    </ToggleButtonGroup>
  </Stack>
);
