import { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Typography, Alert, Button, Snackbar } from '@mui/material';
import {
  BarcodeInput,
  DataGridLineEditor,
  LineItemRow,
  ManagerApprovalDialog,
  TenderButtons
} from '@bookforge/ui';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerPanel } from './components/CustomerPanel';
import { TotalsPanel } from './components/TotalsPanel';
import {
  useRegisterStore,
  selectSubtotal,
  selectTax,
  selectTotal,
  selectTenderTotal
} from './registerStore';
import { checkout, fetchManagerApproval, fetchOpenCart, saveOpenCart, scanBarcode } from './registerApi';
import { TenderSplit } from './types';
import { useOfflineHeartbeat } from '../offline/useOfflineHeartbeat';
import { useReceiptPrinter } from '../printing/useReceiptPrinter';
import { v4 as uuidv4 } from 'uuid';

const RegisterView = () => {
  const items = useRegisterStore(state => state.items);
  const addItem = useRegisterStore(state => state.addItem);
  const removeItem = useRegisterStore(state => state.removeItem);
  const updateItem = useRegisterStore(state => state.updateItem);
  const tender = useRegisterStore(state => state.tender);
  const setTender = useRegisterStore(state => state.setTender);
  const clear = useRegisterStore(state => state.clear);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [pendingOverride, setPendingOverride] = useState<{
    lineId: string;
    priceCents: number;
    reason: string;
  } | null>(null);
  const offline = useOfflineHeartbeat();
  const { printReceipt } = useReceiptPrinter();

  useEffect(() => {
    const bootstrap = async () => {
      if (window.electronAPI) {
        const cached = await window.electronAPI.loadCartSnapshot();
        if (Array.isArray(cached)) {
          let lastId: string | null = null;
          (cached as LineItemRow[]).forEach(row => {
            lastId = addItem({
              id: row.id,
              sku: row.sku,
              title: row.title,
              qty: row.qty,
              priceCents: row.price,
              discountCents: row.discount,
              overrideReason: row.overrideReason
            });
          });
          setActiveRowId(lastId);
          return;
        }
      }
      try {
        const data = await fetchOpenCart();
        let lastId: string | null = null;
        data.items.forEach(item => {
          lastId = addItem({
            id: item.id,
            sku: item.sku,
            title: item.title,
            qty: item.qty,
            priceCents: item.priceCents,
            discountCents: item.discountCents
          });
        });
        setActiveRowId(lastId);
      } catch (error) {
        const cached = localStorage.getItem('register-cache');
        if (cached) {
          const parsed = JSON.parse(cached) as LineItemRow[];
          let lastId: string | null = null;
          parsed.forEach(row => {
            lastId = addItem({
              id: row.id,
              sku: row.sku,
              title: row.title,
              qty: row.qty,
              priceCents: row.price,
              discountCents: row.discount,
              overrideReason: row.overrideReason
            });
          });
          setActiveRowId(lastId);
        }
      }
    };

    bootstrap();
  }, [addItem]);

  useEffect(() => {
    const rows: LineItemRow[] = items.map(item => ({
      id: item.id,
      sku: item.sku,
      title: item.title,
      qty: item.qty,
      price: item.priceCents,
      discount: item.discountCents,
      overrideReason: item.overrideReason
    }));
    localStorage.setItem('register-cache', JSON.stringify(rows));
    if (window.electronAPI) {
      window.electronAPI.saveCartSnapshot(rows).catch(() => undefined);
    }
    if (!offline) saveOpenCart(items).catch(() => undefined);
  }, [items, offline]);

  const subtotal = useMemo(() => selectSubtotal(items), [items]);
  const tax = useMemo(() => selectTax(subtotal), [subtotal]);
  const total = useMemo(() => selectTotal(subtotal, tax), [subtotal, tax]);

  const handleRowsChange = (rows: LineItemRow[]) => {
    rows.forEach(row => {
      updateItem(row.id, {
        qty: Number(row.qty),
        priceCents: Number(row.price),
        discountCents: Number(row.discount),
        overrideReason: row.overrideReason
      });
    });
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    const nextItems = useRegisterStore.getState().items;
    setActiveRowId(nextItems.length ? nextItems[nextItems.length - 1].id : null);
  };

  const handleBarcode = async (barcode: string) => {
    try {
      setScanError(null);
      const result = await scanBarcode(barcode);
      const newId = addItem({
        sku: result.sku,
        title: result.title,
        qty: 1,
        priceCents: result.priceCents,
        discountCents: 0
      });
      setActiveRowId(newId);
    } catch (error) {
      setScanError('Unable to resolve barcode. Manual entry required.');
    }
  };

  const handleCheckout = async (splits: TenderSplit[]) => {
    const payload = {
      id: uuidv4(),
      items: useRegisterStore.getState().items,
      tender: splits,
      override: Boolean(overrideReason)
    };

    if (offline) {
      await window.electronAPI?.appendOffline({ id: payload.id, payload });
      clear();
      setCheckoutOpen(false);
      setOverrideReason(null);
      setActiveRowId(null);
      setToast('Sale captured offline. Will sync when online.');
      return;
    }

    setProcessing(true);
    try {
      const result = await checkout(payload);
      await printReceipt(result.orderId);
      clear();
      setCheckoutOpen(false);
      setOverrideReason(null);
      setActiveRowId(null);
      setToast('Checkout complete');
    } catch (error) {
      setScanError('Checkout failed. Review payment terminals.');
    } finally {
      setProcessing(false);
    }
  };

  const requireManager = useCallback((reason: string) => {
    setOverrideReason(reason);
    setManagerDialogOpen(true);
  }, []);

  const startPriceOverride = useCallback(
    (presetReason?: string) => {
      const targetId = activeRowId ?? items[items.length - 1]?.id;
      if (!targetId) return;
      const target = items.find(item => item.id === targetId);
      const priceInput = window.prompt(
        'Enter override price ($)',
        target ? (target.priceCents / 100).toFixed(2) : '0.00'
      );
      if (priceInput === null) return;
      const parsedPrice = Number.parseFloat(priceInput);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        setScanError('Invalid price entered.');
        return;
      }
      const reason = window.prompt('Enter override reason', presetReason ?? '') ?? '';
      if (!reason.trim()) {
        setScanError('Override reason is required.');
        return;
      }
      setActiveRowId(targetId);
      setPendingOverride({
        lineId: targetId,
        priceCents: Math.round(parsedPrice * 100),
        reason: reason.trim()
      });
      requireManager(reason.trim());
    },
    [activeRowId, items, requireManager]
  );

  const handleManagerApproval = async ({ reason, pin }: { reason: string; pin: string }) => {
    const approval = await fetchManagerApproval(pin);
    if (approval.approved) {
      setOverrideReason(reason);
      setManagerDialogOpen(false);
      if (pendingOverride) {
        updateItem(pendingOverride.lineId, {
          priceCents: pendingOverride.priceCents,
          overrideReason: pendingOverride.reason
        });
        setPendingOverride(null);
      } else {
        setCheckoutOpen(true);
      }
    } else {
      setPendingOverride(null);
      setScanError('Manager approval required for this action.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (managerDialogOpen || checkoutOpen) return;
      if (event.key === 'F2') {
        event.preventDefault();
        if (!activeRowId) return;
        const target = items.find(item => item.id === activeRowId);
        if (!target) return;
        const nextQtyInput = window.prompt('Enter quantity', target.qty.toString());
        if (nextQtyInput === null) return;
        const parsed = Number.parseInt(nextQtyInput, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          setScanError('Quantity must be a positive number.');
          return;
        }
        updateItem(activeRowId, { qty: parsed });
      }
      if (event.key === 'F3') {
        event.preventDefault();
        if (!activeRowId) return;
        const target = items.find(item => item.id === activeRowId);
        if (!target) return;
        const discountInput = window.prompt(
          'Enter discount amount ($)',
          (target.discountCents / 100).toFixed(2)
        );
        if (discountInput === null) return;
        const parsed = Number.parseFloat(discountInput);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setScanError('Discount must be zero or greater.');
          return;
        }
        updateItem(activeRowId, { discountCents: Math.round(parsed * 100) });
      }
      if (event.key === 'F4') {
        event.preventDefault();
        startPriceOverride();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRowId, checkoutOpen, items, managerDialogOpen, startPriceOverride, updateItem]);

  return (
    <Stack direction="row" sx={{ height: '100%', position: 'relative' }}>
      {offline ? (
        <Alert severity="warning" sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          Offline mode active — sales will queue until the API at port 8080 is available.
        </Alert>
      ) : null}
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ px: 4, py: 2 }} spacing={3} alignItems="center">
          <Typography variant="h5">Scan items</Typography>
          <BarcodeInput onSubmit={handleBarcode} autoFocus={!offline} />
          <Button
            variant="outlined"
            onClick={() => startPriceOverride('Manual price override')}
            color="warning"
          >
            Override
          </Button>
          <Button variant="contained" color="primary" onClick={() => setCheckoutOpen(true)} disabled={!items.length}>
            Checkout
          </Button>
        </Stack>
        {scanError ? (
          <Alert severity="error" sx={{ mx: 4 }}>
            {scanError}
          </Alert>
        ) : null}
        <Stack sx={{ flex: 1, minHeight: 0, px: 4, pb: 4 }}>
          <DataGridLineEditor
            rows={items.map(item => ({
              id: item.id,
              sku: item.sku,
              title: item.title,
              qty: item.qty,
              price: item.priceCents,
              discount: item.discountCents,
              overrideReason: item.overrideReason
            }))}
            onRowsChange={handleRowsChange}
            onRemove={handleRemove}
            activeRowId={activeRowId}
            onActiveRowChange={setActiveRowId}
          />
        </Stack>
      </Stack>
      <Stack spacing={3} sx={{ width: 420, px: 4, py: 4, bgcolor: 'background.paper', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
        <CustomerPanel />
        <TotalsPanel items={items} tender={tender} />
        <Stack spacing={2}>
          <Typography variant="h6">Tender</Typography>
          <TenderButtons
            value={tender[0]?.type ?? 'cash'}
            onChange={type => setTender([{ id: type, type, amountCents: selectTenderTotal(tender) || total }])}
          />
        </Stack>
      </Stack>
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalDueCents={total}
        initialTender={tender.length ? tender : [{ id: 'cash', type: 'cash', amountCents: total }]}
        onSubmit={handleCheckout}
        loyaltyBalance={useRegisterStore.getState().customer?.loyaltyPoints}
        isProcessing={processing}
      />
      <ManagerApprovalDialog
        open={managerDialogOpen}
        onApprove={handleManagerApproval}
        onCancel={() => setManagerDialogOpen(false)}
      />
      <Snackbar
        open={Boolean(toast)}
        message={toast ?? ''}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
      />
    </Stack>
  );
};

export default RegisterView;
