import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../components/MenuCard';

interface CartState {
    cart: MenuItem[];
    roomId: string;
    setRoomId: (id: string) => void;
    addToCart: (item: MenuItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cart: [],
            roomId: 'Walk-In',
            setRoomId: (id) => set({ roomId: id }),
            addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
            removeFromCart: (itemId) => set((state) => {
                const index = state.cart.findIndex(i => i.id === itemId);
                if (index > -1) {
                    const newCart = [...state.cart];
                    newCart.splice(index, 1);
                    return { cart: newCart };
                }
                return state;
            }),
            clearCart: () => set({ cart: [] }),
            getTotal: () => get().cart.reduce((sum, item) => sum + item.price, 0),
        }),
        {
            name: 'hotel-cart-storage',
        }
    )
);
