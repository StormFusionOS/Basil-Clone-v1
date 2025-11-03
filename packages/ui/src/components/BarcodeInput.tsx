import { forwardRef, useEffect, useRef } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export interface BarcodeInputProps extends Omit<TextFieldProps, 'onSubmit'> {
  onSubmit: (barcode: string) => void;
  autoFocus?: boolean;
}

export const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(({ onSubmit, autoFocus = true, ...props }, ref) => {
  const buffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (buffer.current) {
          onSubmit(buffer.current);
          buffer.current = '';
        }
        return;
      }
      if (event.key.length === 1) {
        buffer.current += event.key;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (buffer.current) {
            onSubmit(buffer.current);
            buffer.current = '';
          }
        }, 80);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [autoFocus, onSubmit]);

  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      inputRef={ref}
      placeholder={props.placeholder ?? 'Scan or enter barcode'}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const value = (event.target as HTMLInputElement).value.trim();
          if (value) onSubmit(value);
          (event.target as HTMLInputElement).value = '';
        }
      }}
    />
  );
});

BarcodeInput.displayName = 'BarcodeInput';
