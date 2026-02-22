import React from 'react';

export interface MenuItem {
  id: string;
  nameEn: string;
  nameKm: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  stockCount?: number;
}

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  if (!item.available || (item.stockCount !== undefined && item.stockCount <= 0)) return null;

  return (
    <div className="group relative flex bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden mb-5 border border-white/40">
      <div className="relative w-[120px] sm:w-[140px] shrink-0">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150&h=150'}
          alt={item.nameEn}
          className="w-full h-full object-cover"
        />
        {item.stockCount !== undefined && item.stockCount <= 5 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-md z-20">
            Only {item.stockCount} left
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/90" />
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between ml-[-10px] relative z-10">
        <div>
          <h3 className="m-0 text-lg font-bold text-gray-900 leading-tight tracking-tight">
            {item.nameEn}
            <span className="block mt-1 font-sans text-sm text-gray-500 font-medium tracking-normal">{item.nameKm}</span>
          </h3>
          <p className="mt-2 text-base font-bold text-[#D4AF37]">${item.price.toFixed(2)}</p>
        </div>
        <button
          onClick={() => onAddToCart(item)}
          className="mt-3 bg-gray-900 hover:bg-black text-white border-none py-2.5 px-4 rounded-xl font-semibold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-md"
        >
          Add to Cart <span className="font-sans font-normal opacity-80 text-xs">បញ្ចូលទៅកន្ត្រក</span>
        </button>
      </div>
    </div>
  );
};
