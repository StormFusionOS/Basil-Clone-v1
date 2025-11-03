import Button, { ButtonProps } from '@mui/material/Button';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { forwardRef } from 'react';

export type PrimaryButtonProps = ButtonProps & {
  showCartIcon?: boolean;
};

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, showCartIcon = false, ...props }, ref) => (
    <Button ref={ref} variant="contained" color="primary" startIcon={showCartIcon ? <ShoppingCartIcon /> : undefined} {...props}>
      {children}
    </Button>
  )
);

PrimaryButton.displayName = 'PrimaryButton';
