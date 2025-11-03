import { selectSubtotal, selectTax, selectTotal, useRegisterStore } from '../register/registerStore';
import { buildEscPosReceipt, buildZplForLineItems } from './receiptTemplates';
import { loadReceipt } from '../register/registerApi';

const isElectron = () => Boolean(window && (window as any).electronAPI);

export const useReceiptPrinter = () => {
  const getItems = () => useRegisterStore.getState().items;
  const getTender = () => useRegisterStore.getState().tender;
  const getCustomer = () => useRegisterStore.getState().customer;

  const printReceipt = async (orderId: string) => {
    const items = getItems();
    const tender = getTender();
    const subtotal = selectSubtotal(items);
    const tax = selectTax(subtotal);
    const total = selectTotal(subtotal, tax);
    const loyaltyBalance = getCustomer()?.loyaltyPoints;

    const fallbackCommands = buildEscPosReceipt({
      orderId,
      items,
      subtotalCents: subtotal,
      taxCents: tax,
      totalCents: total,
      tender,
      loyaltyBalance
    });

    try {
      const receipt = await loadReceipt(orderId);
      const commands = receipt.commands ?? fallbackCommands;
      const zpl = receipt.zpl ?? buildZplForLineItems(items);
      if (isElectron()) {
        await (window as any).electronAPI.printEscPos(commands);
        if (zpl.length) await (window as any).electronAPI.printZpl(zpl);
      } else {
        console.info('ESC/POS Receipt', commands);
        console.info('ZPL Labels', zpl);
      }
    } catch (error) {
      console.error('Failed to load receipt template, using fallback', error);
      if (isElectron()) {
        await (window as any).electronAPI.printEscPos(fallbackCommands);
      } else {
        console.info('ESC/POS Receipt', fallbackCommands);
      }
    }
  };

  return { printReceipt };
};
