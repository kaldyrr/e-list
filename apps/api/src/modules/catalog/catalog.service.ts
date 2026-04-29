import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { productSortOptions } from "@elist/shared";
import { PrismaService } from "../prisma/prisma.service";
import type { ProductQuery } from "./catalog.types";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        imageUrl: true,
      },
    });
  }

  async listProducts(query: ProductQuery) {
    const take = clampNumber(query.limit, 1, 48, 24);
    const skip = clampNumber(query.offset, 0, 10_000, 0);
    const sort = productSortOptions.includes(query.sort as never)
      ? query.sort
      : "popular";

    const where: Prisma.ProductWhereInput = {
      category: query.category ? { slug: query.category } : undefined,
      title: query.search
        ? { contains: query.search, mode: "insensitive" }
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        include: {
          category: true,
          offers: {
            orderBy: { price: "asc" },
            take: 1,
          },
        },
        orderBy: getProductOrderBy(sort),
        skip,
        take,
        where,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((product) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        categorySlug: product.category.slug,
        imageUrl: product.imageUrl,
        minPrice: product.offers[0]
          ? { amount: product.offers[0].price, currency: product.offers[0].currency }
          : null,
        rating: product.rating,
      })),
      limit: take,
      offset: skip,
      total,
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      include: {
        category: true,
        characteristics: {
          orderBy: { sortOrder: "asc" },
        },
        offers: {
          include: {
            store: true,
          },
          orderBy: { price: "asc" },
        },
      },
      where: { slug },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }
}

function clampNumber(
  rawValue: string | number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function getProductOrderBy(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") {
    return [{ offers: { _count: "desc" } }, { title: "asc" }];
  }

  if (sort === "price-desc") {
    return [{ offers: { _count: "desc" } }, { title: "desc" }];
  }

  if (sort === "rating") {
    return [{ rating: "desc" }, { title: "asc" }];
  }

  return [{ popularity: "desc" }, { title: "asc" }];
}
