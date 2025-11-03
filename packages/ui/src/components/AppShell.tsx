import { ReactNode } from 'react';
import { Box, Stack, Toolbar, Typography, useTheme } from '@mui/material';

export interface AppShellProps {
  title: string;
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  offline?: boolean;
  offlineMessage?: string;
}

export const AppShell = ({
  title,
  toolbar,
  sidebar,
  children,
  footer,
  offline = false,
  offlineMessage = 'Offline mode: transactions will sync when back online.'
}: AppShellProps) => {
  const theme = useTheme();
  return (
    <Stack direction="column" sx={{ height: '100vh', width: '100vw', bgcolor: theme.palette.background.default }}>
      <Box component="header" sx={{ px: 4, py: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {toolbar}
          </Stack>
        </Stack>
        {offline ? (
          <Box
            sx={{
              mt: 2,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              bgcolor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText,
              fontWeight: 600
            }}
          >
            {offlineMessage}
          </Box>
        ) : null}
      </Box>
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        {sidebar ? (
          <Box component="aside" sx={{ width: 420, borderRight: `1px solid ${theme.palette.divider}`, overflowY: 'auto' }}>
            {sidebar}
          </Box>
        ) : null}
        <Box component="main" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Toolbar sx={{ display: 'none' }} />
          {children}
        </Box>
      </Stack>
      {footer ? (
        <Box component="footer" sx={{ px: 4, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          {footer}
        </Box>
      ) : null}
    </Stack>
  );
};
