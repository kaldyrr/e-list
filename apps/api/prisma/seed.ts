import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const processors = await prisma.category.upsert({
    create: {
      description: "CPU for gaming, workstations and everyday PCs.",
      imageUrl:
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80",
      slug: "processors",
      sortOrder: 10,
      title: "Процессоры",
    },
    update: {},
    where: { slug: "processors" },
  });

  const store = await prisma.store.upsert({
    create: {
      rating: 4.7,
      slug: "demo-store",
      title: "Demo Store",
      website: "https://example.com",
    },
    update: {},
    where: { slug: "demo-store" },
  });

  const product = await prisma.product.upsert({
    create: {
      categoryId: processors.id,
      description: "16-core desktop processor for demanding workloads.",
      imageUrl:
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80",
      popularity: 100,
      rating: 4.9,
      slug: "amd-ryzen-9-7950x",
      title: "AMD Ryzen 9 7950X",
      characteristics: {
        create: [
          { group: "Общее", name: "Сокет", sortOrder: 10, value: "AM5" },
          { group: "Ядра", name: "Количество ядер", sortOrder: 20, value: "16" },
          { group: "Частоты", name: "Boost", sortOrder: 30, value: "5.7 GHz" },
        ],
      },
    },
    update: {},
    where: { slug: "amd-ryzen-9-7950x" },
  });

  await prisma.offer.upsert({
    create: {
      id: "seed-offer-ryzen-7950x",
      price: 89990,
      productId: product.id,
      storeId: store.id,
      url: "https://example.com/amd-ryzen-9-7950x",
    },
    update: {
      price: 89990,
    },
    where: {
      id: "seed-offer-ryzen-7950x",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
