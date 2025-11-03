import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

const tiles = [
  { title: 'Open Carts', value: '2', subtitle: 'Carts pending checkout' },
  { title: 'Offline Journals', value: '0', subtitle: 'Transactions queued for sync' },
  { title: 'Transfers Pending', value: '3', subtitle: 'Pick/pack workflows' }
];

const DashboardView = () => (
  <Stack spacing={3} sx={{ px: 4, py: 4 }}>
    <Typography variant="h5">Register Overview</Typography>
    <Grid container spacing={3}>
      {tiles.map(tile => (
        <Grid item xs={12} md={4} key={tile.title}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6">{tile.title}</Typography>
              <Typography variant="h3">{tile.value}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tile.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Stack>
);

export default DashboardView;
