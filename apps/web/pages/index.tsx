import React from 'react'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'

export default function Home(){
  return (
    <main>
      <Hero />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Процессоры</h3>
          <a className="text-sm text-gray-300" href="#">Смотреть все →</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <ProductCard title="AMD Ryzen 9 7950X" price="89 990 ₽" tag="ХИТ" image="https://picsum.photos/seed/ryzen/400/240" />
          <ProductCard title="Intel Core i9-13900K" price="95 990 ₽" image="https://picsum.photos/seed/intel/400/240" />
          <ProductCard title="AMD Ryzen 7 7800X3D" price="69 990 ₽" tag="NEW" image="https://picsum.photos/seed/7800/400/240" />
          <ProductCard title="Intel Core i7-13700K" price="59 990 ₽" image="https://picsum.photos/seed/i7137/400/240" />
        </div>
      </section>
    </main>
  )
}
