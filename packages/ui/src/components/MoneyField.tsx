import { forwardRef } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export interface MoneyFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(({ value, onChange, ...props }, ref) => (
  <TextField
    {...props}
    inputRef={ref}
    type="number"
    inputProps={{ step: 0.01, min: 0, 'aria-label': props.label ?? 'Amount' }}
    value={(value / 100).toFixed(2)}
    onChange={event => {
      const next = Number.parseFloat(event.target.value || '0');
      onChange(Math.round(next * 100));
    }}
  />
));

MoneyField.displayName = 'MoneyField';
