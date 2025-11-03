import { Card, CardContent, Stack, Typography, Button } from '@mui/material';
import { useRegisterStore } from '../registerStore';

export const CustomerPanel = () => {
  const customer = useRegisterStore(state => state.customer);

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Customer</Typography>
            <Button variant="outlined" size="small">
              Lookup
            </Button>
          </Stack>
          {customer ? (
            <Stack spacing={0.5}>
              <Typography>{customer.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Loyalty: {customer.loyaltyPoints} pts · Store credit ${(customer.storeCreditCents / 100).toFixed(2)}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No customer selected
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
