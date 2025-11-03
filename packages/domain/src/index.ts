import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3)
});

export type Money = z.infer<typeof MoneySchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  title: z.string(),
  price: MoneySchema,
  inventory: z.number().int().nonnegative()
});

export type Product = z.infer<typeof ProductSchema>;

export const OrderLineSchema = z.object({
  product: ProductSchema,
  quantity: z.number().int().positive()
});

export type OrderLine = z.infer<typeof OrderLineSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  customerId: z.string().nullable(),
  lines: z.array(OrderLineSchema),
  total: MoneySchema
});

export type Order = z.infer<typeof OrderSchema>;

export * from './ports';
