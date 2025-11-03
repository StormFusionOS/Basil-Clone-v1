import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { LineItem, TenderSplit } from './types';

interface RegisterState {
  items: LineItem[];
  customer?: {
    id: string;
    name: string;
    loyaltyPoints: number;
    storeCreditCents: number;
  };
  tender: TenderSplit[];
  note?: string;
  addItem: (item: Omit<LineItem, 'id'> & { id?: string }) => string;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  setCustomer: (customer: RegisterState['customer']) => void;
  setTender: (tender: TenderSplit[]) => void;
  clear: () => void;
}

export const useRegisterStore = create<RegisterState>()(
  immer(set => ({
    items: [],
    tender: [{ id: 'cash', type: 'cash', amountCents: 0 }],
    addItem: item => {
      const id = item.id ?? uuidv4();
      set(state => {
        state.items.push({
          id,
          sku: item.sku,
          title: item.title,
          qty: item.qty,
          priceCents: item.priceCents,
          discountCents: item.discountCents ?? 0,
          overrideReason: item.overrideReason
        });
      });
      return id;
    },
    removeItem: id =>
      set(state => {
        state.items = state.items.filter(item => item.id !== id);
      }),
    updateItem: (id, updates) =>
      set(state => {
        const target = state.items.find(item => item.id === id);
        if (target) Object.assign(target, updates);
      }),
    setCustomer: customer =>
      set(state => {
        state.customer = customer ?? undefined;
      }),
    setTender: tender => set({ tender }),
    clear: () =>
      set(() => ({
        items: [],
        customer: undefined,
        tender: [{ id: 'cash', type: 'cash', amountCents: 0 }]
      }))
  }))
);

export const selectSubtotal = (items: LineItem[]) =>
  items.reduce((total, item) => total + item.qty * item.priceCents - item.discountCents, 0);

export const selectTax = (subtotal: number, rate = 0.095) => Math.round(subtotal * rate);

export const selectTotal = (subtotal: number, tax: number) => subtotal + tax;

export const selectTenderTotal = (tender: TenderSplit[]) => tender.reduce((sum, split) => sum + split.amountCents, 0);
