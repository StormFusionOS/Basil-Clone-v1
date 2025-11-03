import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTitleDto } from './dto/create-title.dto';
import { UpsertTitleEnrichmentDto } from './dto/enrich-title.dto';

type SearchRow = {
  isbn13: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  title_highlight: string;
  author_highlight: string;
  rank: number;
  similarity: number;
};

type ScanResult =
  | {
      match: 'item';
      item: {
        id: string;
        sku: string;
        isbn13: string;
        title: string;
        condition: string;
        priceCents?: number | null;
      };
    }
  | {
      match: 'title';
      title: {
        isbn13: string;
        title: string;
        subtitle?: string | null;
        authors: string[];
      };
    }
  | { match: 'not_found' };

@Injectable()
export class TitlesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CreateTitleDto[]> {
    return this.prisma.titles.findMany({ take: 100 }) as unknown as Promise<CreateTitleDto[]>;
  }

  async create(payload: CreateTitleDto) {
    return this.prisma.titles.create({
      data: {
        isbn13: payload.isbn13,
        title: payload.title,
        subtitle: payload.subtitle,
        authors: payload.authors
      }
    });
  }

  async upsertFromEnrichment(payload: UpsertTitleEnrichmentDto) {
    await this.prisma.titles.upsert({
      where: { isbn13: payload.isbn13 },
      update: {
        title: payload.title,
        subtitle: payload.subtitle,
        authors: payload.authors,
        publisher: payload.publisher,
        pub_date: payload.publishedAt ? new Date(payload.publishedAt) : null
      },
      create: {
        isbn13: payload.isbn13,
        title: payload.title,
        subtitle: payload.subtitle,
        authors: payload.authors,
        publisher: payload.publisher,
        pub_date: payload.publishedAt ? new Date(payload.publishedAt) : null
      }
    });

    try {
      await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY "title_search"');
    } catch (error) {
      await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW "title_search"');
    }
  }

  async search(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        isbn13,
        title,
        subtitle,
        authors,
        ts_headline('simple', title, plainto_tsquery('simple', ${trimmed})) AS title_highlight,
        ts_headline('simple', authors_text, plainto_tsquery('simple', ${trimmed})) AS author_highlight,
        ts_rank(document, plainto_tsquery('simple', ${trimmed})) AS rank,
        GREATEST(similarity(title, ${trimmed}), similarity(authors_text, ${trimmed})) AS similarity
      FROM title_search
      WHERE document @@ plainto_tsquery('simple', ${trimmed})
         OR similarity(title, ${trimmed}) > 0.2
         OR similarity(authors_text, ${trimmed}) > 0.2
      ORDER BY rank DESC, similarity DESC
      LIMIT 25;
    `;

    return rows.map(row => ({
      isbn13: row.isbn13,
      title: row.title,
      subtitle: row.subtitle,
      authors: row.authors,
      highlights: {
        title: row.title_highlight,
        authors: row.author_highlight
      }
    }));
  }

  async scan(barcode: string): Promise<ScanResult> {
    const normalized = barcode.trim();
    if (!normalized) {
      return { match: 'not_found' };
    }

    const item = await this.prisma.items.findFirst({
      where: {
        OR: [
          { sku_override: normalized },
          { isbn13: normalized }
        ]
      },
      include: {
        title: true
      }
    });

    if (item) {
      return {
        match: 'item',
        item: {
          id: item.id,
          sku: item.sku_override ?? item.id,
          isbn13: item.isbn13,
          title: item.title.title,
          condition: item.condition,
          priceCents: item.title.msrp_cents
        }
      };
    }

    const title = await this.prisma.titles.findUnique({ where: { isbn13: normalized } });
    if (title) {
      return {
        match: 'title',
        title: {
          isbn13: title.isbn13,
          title: title.title,
          subtitle: title.subtitle,
          authors: title.authors
        }
      };
    }

    return { match: 'not_found' };
  }
}
