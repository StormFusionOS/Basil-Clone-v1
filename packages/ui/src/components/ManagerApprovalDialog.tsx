import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography
} from '@mui/material';
import { useState } from 'react';

export interface ManagerApprovalDialogProps {
  open: boolean;
  title?: string;
  reasonLabel?: string;
  onApprove: (payload: { reason: string; pin: string }) => void;
  onCancel: () => void;
}

export const ManagerApprovalDialog = ({
  open,
  title = 'Manager Approval Required',
  reasonLabel = 'Reason',
  onApprove,
  onCancel
}: ManagerApprovalDialogProps) => {
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');

  const reset = () => {
    setReason('');
    setPin('');
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onCancel();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Manager override is required to continue. Enter a brief explanation and the manager PIN.
          </Typography>
          <TextField label={reasonLabel} value={reason} onChange={event => setReason(event.target.value)} fullWidth autoFocus />
          <TextField
            label="Manager PIN"
            value={pin}
            onChange={event => setPin(event.target.value)}
            fullWidth
            type="password"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={() => {
            reset();
            onCancel();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onApprove({ reason, pin });
            reset();
          }}
          disabled={!reason || !pin}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};
