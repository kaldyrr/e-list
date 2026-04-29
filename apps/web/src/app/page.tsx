import type { ProductSummary } from "@elist/shared";
import Image from "next/image";
import {
  BarChart3,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";

const categories = [
  "Для игр",
  "Для работы",
  "Комплектующие",
  "Сеть и связь",
  "Софт и подписки",
  "Аксессуары",
];

const products: ProductSummary[] = [
  {
    id: "ryzen-7950x",
    slug: "amd-ryzen-9-7950x",
    title: "AMD Ryzen 9 7950X",
    categorySlug: "processors",
    imageUrl:
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80",
    minPrice: { amount: 89990, currency: "RUB" },
    oldPrice: { amount: 99990, currency: "RUB" },
    badges: ["ХИТ"],
  },
  {
    id: "core-i9-13900k",
    slug: "intel-core-i9-13900k",
    title: "Intel Core i9-13900K",
    categorySlug: "processors",
    imageUrl:
      "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80",
    minPrice: { amount: 95990, currency: "RUB" },
    badges: [],
  },
  {
    id: "ryzen-7800x3d",
    slug: "amd-ryzen-7-7800x3d",
    title: "AMD Ryzen 7 7800X3D",
    categorySlug: "processors",
    imageUrl:
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80",
    minPrice: { amount: 69990, currency: "RUB" },
    badges: ["NEW"],
  },
  {
    id: "core-i7-13700k",
    slug: "intel-core-i7-13700k",
    title: "Intel Core i7-13700K",
    categorySlug: "processors",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    minPrice: { amount: 59990, currency: "RUB" },
    badges: [],
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070818]/92">
      <header className="border-b border-white/8 bg-[#0b0d1b]/95">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 lg:px-8">
          <a href="#" className="flex shrink-0 items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#ff6a00] text-lg font-black">
              E
            </span>
            <span className="text-xl font-bold">E-List</span>
          </a>

          <form className="hidden min-w-0 flex-1 items-center overflow-hidden rounded-lg bg-white text-slate-900 md:flex">
            <label className="sr-only" htmlFor="search">
              Поиск товара
            </label>
            <input
              id="search"
              className="h-11 min-w-0 flex-1 border-0 px-4 outline-none"
              placeholder="Поиск товара, например RTX 4090"
            />
            <button className="flex h-11 items-center gap-2 bg-blue-600 px-6 font-semibold text-white">
              <Search size={18} />
              Найти
            </button>
          </form>

          <nav className="ml-auto flex items-center gap-4 text-xs text-white/90">
            <IconLink icon={<Heart size={22} />} label="Избранное" />
            <IconLink icon={<BarChart3 size={22} />} label="Сравнение" />
            <IconLink icon={<ShoppingCart size={22} />} label="Корзина" />
            <IconLink icon={<UserRound size={22} />} label="Войти" />
          </nav>
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-4 py-3 text-sm font-semibold text-white/88 lg:px-8">
          <span className="flex items-center gap-1 whitespace-nowrap text-[#ff6a00]">
            <MapPin size={16} />
            Солнечный
          </span>
          {categories.map((category) => (
            <a key={category} className="whitespace-nowrap" href="#">
              {category}
            </a>
          ))}
          <a className="ml-auto whitespace-nowrap text-[#ff6a00]" href="#">
            Акции
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[300px_1fr_300px] lg:px-8">
        <PromoCard
          title="Охлаждение и корпуса"
          text="Решения от надежных производителей"
          image="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=700&q=80"
        />

        <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-white/8 bg-[#2a0d17]">
          <Image
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            fill
            priority
            src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1400&q=80"
          />
          <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-6">
            <h1 className="text-4xl font-black leading-tight">
              Процессоры AMD Ryzen
            </h1>
            <p className="mt-3 text-xl text-white/80">Новое поколение</p>
            <p className="mt-2 text-white/62">
              Невероятная мощность для игр, работы и сборок любого уровня.
            </p>
            <a
              className="mt-6 inline-flex w-fit items-center gap-3 rounded-lg bg-blue-600 px-7 py-4 font-bold"
              href="#processors"
            >
              К подбору комплектующих
              <ChevronRight size={18} />
            </a>
          </div>
        </div>

        <PromoCard
          title="Накопители"
          text="SSD NVMe с высокой скоростью чтения"
          image="https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=700&q=80"
        />
      </section>

      <section id="processors" className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <SectionHeader title="Процессоры" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

function IconLink({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a className="hidden flex-col items-center gap-1 sm:flex" href="#">
      {icon}
      <span>{label}</span>
    </a>
  );
}

function PromoCard({
  image,
  text,
  title,
}: {
  image: string;
  text: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-white/8 bg-[#102342] p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 min-h-10 text-sm leading-6 text-white/70">{text}</p>
      <div className="relative mt-3 h-32 w-full overflow-hidden">
        <Image alt="" className="object-cover" fill src={image} />
      </div>
      <a className="mt-4 inline-flex items-center gap-2 font-bold" href="#">
        Подробнее <ChevronRight size={16} />
      </a>
    </article>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-950 via-indigo-950 to-fuchsia-950 px-6 py-5">
      <h2 className="text-2xl font-black">{title}</h2>
      <a className="inline-flex items-center gap-2 font-bold" href="#">
        Смотреть все
        <ChevronRight size={18} />
      </a>
    </div>
  );
}

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#1f2942] bg-[#080a12]">
      <div className="relative bg-black">
        <Image
          alt={product.title}
          className="aspect-[4/2.6] w-full object-cover opacity-90"
          height={520}
          src={product.imageUrl}
          width={800}
        />
        {product.badges[0] ? (
          <span className="absolute left-4 top-4 rounded-full bg-[#ff6a00] px-4 py-1 text-xs font-black">
            {product.badges[0]}
          </span>
        ) : null}
        <button className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/70">
          <Heart size={22} />
        </button>
      </div>
      <div className="p-6">
        <h3 className="min-h-14 text-xl font-bold">{product.title}</h3>
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-3xl font-black">
            {formatPrice(product.minPrice.amount)} ₽
          </span>
          {product.oldPrice ? (
            <span className="text-sm text-white/35 line-through">
              {formatPrice(product.oldPrice.amount)} ₽
            </span>
          ) : null}
        </div>
        <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-[#ff6a00] px-5 py-4 font-bold shadow-[0_10px_28px_rgba(255,106,0,0.28)]">
          <ShoppingCart size={20} />
          В корзину
        </button>
      </div>
    </article>
  );
}
