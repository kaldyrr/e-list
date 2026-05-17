import React from 'react'

export default function Hero(){
  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="card-bg rounded-lg p-6 text-left">
          <h3 className="text-xl font-semibold">Охлаждение и корпуса</h3>
          <p className="mt-2 text-sm text-gray-300">Лучшие решения от надёжных производителей</p>
          <a className="inline-block mt-4 text-sm text-primary" href="#">Подробнее →</a>
        </div>

        <div className="col-span-1 md:col-span-2 card-bg rounded-lg p-6 relative overflow-hidden">
          <h2 className="text-2xl font-bold">Процессоры<br/>AMD Ryzen</h2>
          <p className="mt-2 text-gray-300">Новое поколение</p>
          <button className="mt-4 px-4 py-2 rounded-md glow-btn text-black font-semibold">К подбору комплектующих</button>
        </div>
      </div>
    </section>
  )
}
