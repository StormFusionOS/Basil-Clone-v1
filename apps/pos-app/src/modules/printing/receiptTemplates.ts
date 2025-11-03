import { format } from 'date-fns';
import { LineItem, TenderSplit } from '../register/types';

interface ReceiptOptions {
  orderId: string;
  items: LineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  tender: TenderSplit[];
  loyaltyBalance?: number;
}

const ESC = '\u001b';
const GS = '\u001d';

const text = (value: string) => `${value}\n`;

export const buildEscPosReceipt = ({
  orderId,
  items,
  subtotalCents,
  taxCents,
  totalCents,
  tender,
  loyaltyBalance
}: ReceiptOptions) => {
  const lines: string[] = [];
  lines.push(`${ESC}@`); // init
  lines.push(`${ESC}!\u0010`);
  lines.push(text('Evergreen Books Co.'));
  lines.push(text('BookForge POS'));
  lines.push(`${ESC}!\u0000`);
  lines.push(text(format(new Date(), 'PPpp')));
  lines.push(text(`Order: ${orderId}`));
  lines.push(text('--------------------------------')); // separator
  items.forEach(item => {
    lines.push(text(`${item.qty}x ${item.title}`));
    lines.push(text(`    ${(item.priceCents / 100).toFixed(2)}  Disc ${(item.discountCents / 100).toFixed(2)}`));
  });
  lines.push(text('--------------------------------'));
  lines.push(text(`Subtotal: ${(subtotalCents / 100).toFixed(2)}`));
  lines.push(text(`Tax: ${(taxCents / 100).toFixed(2)}`));
  lines.push(text(`Total: ${(totalCents / 100).toFixed(2)}`));
  lines.push(text('--------------------------------'));
  tender.forEach(split => {
    lines.push(text(`${split.type.toUpperCase()}: ${(split.amountCents / 100).toFixed(2)}`));
  });
  const change = tender.reduce((sum, split) => sum + split.amountCents, 0) - totalCents;
  lines.push(text(`Change: ${(change / 100).toFixed(2)}`));
  lines.push(text(`Loyalty balance: ${loyaltyBalance ?? 0} pts`));
  lines.push(text('Return policy: 14 days with receipt.')); 
  lines.push(`${GS}k\u0004${orderId}\u0000`); // barcode (CODE39)
  lines.push(`${ESC}d\u0003`); // feed
  lines.push(`${ESC}m`); // cut
  return lines;
};

export const buildZplForLineItems = (items: LineItem[]) =>
  items.map(
    item =>
      `^XA^CI28^PW812^LL406^FO40,40^A0N,48,48^FD${item.title}^FS^FO40,120^A0N,40,40^FDSKU ${item.sku}^FS^FO40,180^A0N,40,40^FD$${(
        item.priceCents / 100
      ).toFixed(2)}^FS^FO40,240^BY2^BCN,120,Y,N,N^FD${item.sku}^FS^XZ`
  );
