import { useEffect, useState } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { BookForgeApiClient } from '@bookforge/clients';
import type { Order } from '@bookforge/domain';

const client = new BookForgeApiClient({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1' });

const App = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    client
      .fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Recent Orders</Typography>
          {orders.length === 0 ? (
            <Typography color="text.secondary">No orders yet.</Typography>
          ) : (
            orders.map(order => (
              <Typography key={order.id} variant="body2">
                {order.id} – {order.total.amount.toFixed(2)} {order.total.currency}
              </Typography>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default App;
