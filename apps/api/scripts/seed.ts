import { randomUUID, randomBytes, scryptSync } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORGANIZATION_NAME = 'Evergreen Books Co.';
const STORES = [
  { id: 'store_downtown', name: 'Evergreen - Downtown' },
  { id: 'store_north', name: 'Evergreen - Northside' }
];

const CHANNEL_KINDS = ['amazon', 'abebooks', 'alibris', 'biblio', 'chrislands'];
const CONDITIONS = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'];
const SUBJECTS = ['Fiction', 'Non-fiction', 'Mystery', 'Sci-Fi', 'Fantasy', 'History', 'Business'];
const BINDINGS = ['Hardcover', 'Paperback', 'Trade Paperback'];
const VENDOR_NAMES = ['Northwind Books Supply', 'Evergreen Regional Distributor'];
const LOCATION_TEMPLATES = [
  { name: 'Sales Floor', path: 'floor/sales' },
  { name: 'Back Room', path: 'backroom/receiving' }
];

type TitleSeed = {
  isbn13: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  pub_date?: Date;
  binding?: string;
  msrp_cents?: number;
  subjects: string[];
  edition?: string;
  language?: string;
  dimensions?: string;
  weight?: string;
};

type ItemSeed = {
  id: string;
  isbn13: string;
  condition: string;
  signed: boolean;
  first_edition: boolean;
  notes?: string;
  taxable: boolean;
  sku_override?: string;
};

type InventorySeed = {
  item_id: string;
  store_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  bin?: string;
};

function randomOf<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe<T>(value: T, probability = 0.5): T | undefined {
  return Math.random() < probability ? value : undefined;
}

function buildIsbn(index: number): string {
  return String(9780000000000 + index).padStart(13, '0');
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

async function resetDatabase() {
  await prisma.consignor_items.deleteMany();
  await prisma.consignors.deleteMany();
  await prisma.requests.deleteMany();
  await prisma.listings.deleteMany();
  await prisma.channels.deleteMany();
  await prisma.reorder_rules.deleteMany();
  await prisma.receipts.deleteMany();
  await prisma.po_lines.deleteMany();
  await prisma.purchase_orders.deleteMany();
  await prisma.vendors.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.order_lines.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.stock_movements.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.locations.deleteMany();
  await prisma.customers.deleteMany();
  await prisma.items.deleteMany();
  await prisma.titles.deleteMany();
  await prisma.users.deleteMany();
  await prisma.stores.deleteMany();
  await prisma.organizations.deleteMany();
}

async function seedOrganization() {
  const organization = await prisma.organizations.create({
    data: { name: ORGANIZATION_NAME }
  });

  const stores = await Promise.all(
    STORES.map(store =>
      prisma.stores.create({
        data: {
          id: store.id,
          name: store.name,
          org_id: organization.id
        }
      })
    )
  );

  return { organization, stores };
}

async function seedCatalog() {
  const titleChunks: TitleSeed[][] = [];
  const titlesData: TitleSeed[] = [];

  for (let i = 0; i < 1000; i += 1) {
    const authors = Array.from({ length: randomInt(1, 3) }, (_, idx) => `Author ${String.fromCharCode(65 + ((i + idx) % 26))}`);
    const isbn13 = buildIsbn(i);
    titlesData.push({
      isbn13,
      title: `Evergreen Collection Vol. ${i + 1}`,
      subtitle: maybe(`Insights Edition ${i % 7}`, 0.35),
      authors,
      publisher: maybe('Evergreen Press', 0.7),
      pub_date: maybe(new Date(2010 + (i % 14), i % 12, randomInt(1, 28)), 0.6),
      binding: randomOf(BINDINGS),
      msrp_cents: maybe(randomInt(899, 3999), 0.85),
      subjects: [randomOf(SUBJECTS), randomOf(SUBJECTS)],
      edition: maybe(`${randomInt(1, 4)}th`, 0.5),
      language: 'en',
      dimensions: maybe(`${randomInt(5, 8)}x${randomInt(7, 11)}x${(Math.random() * 1.5 + 0.5).toFixed(1)} in`, 0.4),
      weight: maybe(`${(Math.random() * 1.5 + 0.3).toFixed(2)} lbs`, 0.4)
    });

    if (titlesData.length === 200) {
      titleChunks.push(titlesData.splice(0));
    }
  }

  if (titlesData.length) {
    titleChunks.push(titlesData);
  }

  for (const chunk of titleChunks) {
    await prisma.titles.createMany({ data: chunk, skipDuplicates: true });
  }

  const items: ItemSeed[] = [];
  for (let i = 0; i < 1500; i += 1) {
    const isbnIndex = randomInt(0, 999);
    items.push({
      id: randomUUID(),
      isbn13: buildIsbn(isbnIndex),
      condition: randomOf(CONDITIONS),
      signed: Math.random() < 0.1,
      first_edition: Math.random() < 0.15,
      notes: maybe('Includes supplemental material', 0.2),
      taxable: Math.random() > 0.05,
      sku_override: maybe(`SKU-${1000 + i}`, 0.25)
    });
  }

  for (let i = 0; i < items.length; i += 200) {
    const slice = items.slice(i, i + 200);
    await prisma.items.createMany({ data: slice, skipDuplicates: true });
  }

  const inventoryRows: InventorySeed[] = [];
  for (const item of items) {
    for (const store of STORES) {
      const qtyOnHand = randomInt(0, 20);
      const qtyReserved = Math.min(qtyOnHand, randomInt(0, 5));
      inventoryRows.push({
        item_id: item.id,
        store_id: store.id,
        qty_on_hand: qtyOnHand,
        qty_reserved: qtyReserved,
        bin: maybe(`Aisle ${randomInt(1, 12)}-Shelf ${randomInt(1, 5)}`, 0.6)
      });
    }
  }

  for (let i = 0; i < inventoryRows.length; i += 500) {
    const slice = inventoryRows.slice(i, i + 500);
    await prisma.inventory.createMany({ data: slice, skipDuplicates: true });
  }

  const stockMovements = inventoryRows
    .filter(row => row.qty_on_hand !== 0)
    .map(row => ({
      id: randomUUID(),
      item_id: row.item_id,
      store_id: row.store_id,
      type: 'INITIAL_BALANCE',
      qty: row.qty_on_hand,
      ref_type: 'SEED',
      ref_id: null,
      user_id: null
    }));

  if (stockMovements.length) {
    for (let i = 0; i < stockMovements.length; i += 200) {
      const slice = stockMovements.slice(i, i + 200);
      await prisma.stock_movements.createMany({ data: slice, skipDuplicates: true });
    }
  }

  return items;
}

async function seedStoreLocations() {
  const locations: { store_id: string; name: string; path: string }[] = [];
  for (const store of STORES) {
    for (const template of LOCATION_TEMPLATES) {
      locations.push({
        store_id: store.id,
        name: template.name,
        path: `${store.id}/${template.path}`
      });
    }
  }

  await prisma.locations.createMany({ data: locations, skipDuplicates: true });
}

async function seedCustomers() {
  const customers = Array.from({ length: 75 }, (_, idx) => ({
    id: randomUUID(),
    name: `Customer ${idx + 1}`,
    email: `customer${idx + 1}@evergreenbooks.example`,
    phone: maybe(`555-01${(idx + 10).toString().padStart(2, '0')}`, 0.7),
    marketing_opt_in: Math.random() < 0.4,
    store_credit_cents: randomInt(0, 2000),
    loyalty_points: randomInt(0, 500)
  }));

  for (let i = 0; i < customers.length; i += 50) {
    const slice = customers.slice(i, i + 50);
    await prisma.customers.createMany({ data: slice, skipDuplicates: true });
  }

  return customers;
}

async function seedVendorsAndPurchaseOrders(items: { id: string; isbn13: string }[]) {
  const vendors = await Promise.all(
    VENDOR_NAMES.map(name =>
      prisma.vendors.create({
        data: {
          name,
          account_num: maybe(`ACCT-${randomInt(1000, 9999)}`, 0.7),
          payment_terms: maybe('NET 30', 0.6),
          contact: maybe('buyer@northwindbooks.example', 0.5)
        }
      })
    )
  );

  const purchaseOrders = [] as { id: string; vendor_id: string; store_id: string }[];
  for (let i = 0; i < 6; i += 1) {
    const vendor = randomOf(vendors);
    const store = randomOf(STORES);
    const po = await prisma.purchase_orders.create({
      data: {
        vendor_id: vendor.id,
        store_id: store.id,
        status: 'OPEN'
      }
    });
    purchaseOrders.push({ id: po.id, vendor_id: vendor.id, store_id: store.id });

    const lineCount = randomInt(3, 6);
    const chosenItems = Array.from({ length: lineCount }, () => randomOf(items));
    for (const item of chosenItems) {
      const orderedQty = randomInt(5, 20);
      const receivedQty = Math.floor(orderedQty * Math.random() * 0.6);
      await prisma.po_lines.create({
        data: {
          po_id: po.id,
          isbn13: item.isbn13,
          ordered_qty: orderedQty,
          received_qty: receivedQty,
          cost_cents: randomInt(500, 2500)
        }
      });
    }

    await prisma.receipts.create({
      data: {
        po_id: po.id,
        received_by: 'Receiving Bot',
        ts: new Date(Date.now() - randomInt(1, 14) * 86400000)
      }
    });
  }

  return purchaseOrders;
}

async function seedChannels() {
  await prisma.channels.createMany({
    data: CHANNEL_KINDS.map(kind => ({ kind, enabled: false })),
    skipDuplicates: true
  });
}

async function seedUsers(orgId: string) {
  await prisma.users.create({
    data: {
      org_id: orgId,
      store_id: STORES[0].id,
      email: 'admin@evergreenbooks.example',
      name: 'Evergreen Administrator',
      role: 'ADMIN',
      password_hash: hashPassword('Admin!23456')
    }
  });
}

async function refreshViews() {
  await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY "title_search"');
}

async function seed() {
  console.log('Resetting BookForge database...');
  await resetDatabase();

  console.log('Seeding organization and stores...');
  const { organization } = await seedOrganization();

  console.log('Seeding store locations...');
  await seedStoreLocations();

  console.log('Seeding catalog titles, items, and inventory...');
  const items = await seedCatalog();

  console.log('Seeding customers...');
  await seedCustomers();

  console.log('Seeding vendors and purchase orders...');
  await seedVendorsAndPurchaseOrders(items);

  console.log('Seeding channel connectors...');
  await seedChannels();

  console.log('Creating admin user...');
  await seedUsers(organization.id);

  console.log('Refreshing title search view...');
  await refreshViews();

  console.log('Seeded Evergreen Books dataset successfully.');
}

seed()
  .catch(err => {
    console.error('Failed to seed database', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
