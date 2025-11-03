import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { AppShell, PrimaryButton } from '@bookforge/ui';
import { Box, Stack } from '@mui/material';
import RegisterView from './modules/register/RegisterView';
import ReturnsExchangeView from './modules/returns/ReturnsExchangeView';
import BuyDeskView from './modules/buydesk/BuyDeskView';
import { useOfflineHeartbeat } from './modules/offline/useOfflineHeartbeat';
import ReceivingView from './modules/receiving/ReceivingView';
import DashboardView from './modules/dashboard/DashboardView';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: 'none',
  color: isActive ? 'inherit' : 'rgba(255,255,255,0.64)'
});

const App = () => {
  const offline = useOfflineHeartbeat();

  return (
    <HashRouter>
      <AppShell
        title="BookForge POS Register"
        offline={offline}
        toolbar={
          <Stack direction="row" spacing={2}>
            <NavLink to="/register" style={navLinkStyle}>
              <PrimaryButton size="large">Register</PrimaryButton>
            </NavLink>
            <NavLink to="/returns" style={navLinkStyle}>
              <PrimaryButton size="large">Returns</PrimaryButton>
            </NavLink>
            <NavLink to="/buy-desk" style={navLinkStyle}>
              <PrimaryButton size="large">Buy Desk</PrimaryButton>
            </NavLink>
            <NavLink to="/receiving" style={navLinkStyle}>
              <PrimaryButton size="large">Receiving</PrimaryButton>
            </NavLink>
          </Stack>
        }
      >
        <Box sx={{ height: '100%' }}>
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/returns" element={<ReturnsExchangeView />} />
            <Route path="/buy-desk" element={<BuyDeskView />} />
            <Route path="/receiving" element={<ReceivingView />} />
          </Routes>
        </Box>
      </AppShell>
    </HashRouter>
  );
};

export default App;
