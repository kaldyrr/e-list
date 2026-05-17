import React from 'react'

type Props = {
  title: string
  price: string
  image?: string
  tag?: string
}

export default function ProductCard({title, price, image, tag}: Props){
  return (
    <div className="card-bg rounded-xl p-4 shadow-lg">
      <div className="relative rounded-md overflow-hidden h-40 bg-[#0f1724] flex items-center justify-center">
        <img src={image ?? 'https://via.placeholder.com/300x180'} alt={title} className="object-cover w-full h-full" />
        {tag && <span className="absolute top-3 left-3 bg-orange-500 text-black text-xs font-semibold px-2 py-1 rounded">{tag}</span>}
      </div>
      <div className="mt-4">
        <h4 className="font-medium">{title}</h4>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xl font-bold">{price}</div>
          <button className="ml-4 px-4 py-2 rounded-md glow-btn text-black font-semibold">В корзину</button>
        </div>
      </div>
    </div>
  )
}
