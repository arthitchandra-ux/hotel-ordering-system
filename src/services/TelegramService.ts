import axios from 'axios';
import type { MenuItem } from '../components/MenuCard';

// Typically this would come from an environment variable in production (.env).
// For the scope of the no-code MVP webhook replacement, we point to the Make.com webhook.
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://hook.us1.make.com/your-webhook-id';

export interface OrderPayload {
    order_id: string;
    room: string;
    total_usd: number;
    payment_method: 'khqr' | 'cash';
    status: 'pending_verification' | 'pending_kitchen';
    items: Array<{
        name: string;
        qty: number;
        price: number;
    }>;
    guest_name?: string;
    special_requests?: string;
}

export class TelegramService {
    static async sendOrderNotification(
        roomId: string,
        cart: MenuItem[],
        paymentMethod: 'khqr' | 'cash',
        guestName?: string,
        specialRequests?: string
    ): Promise<boolean> {
        try {
            // 1. Calculate totals
            const total = cart.reduce((sum, item) => sum + item.price, 0);

            // 2. Group items by ID to get quantities
            const itemMap = new Map<string, { item: MenuItem, qty: number }>();
            cart.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.qty += 1;
                } else {
                    itemMap.set(item.id, { item, qty: 1 });
                }
            });

            // 3. Format into Make.com/Telegram expected payload
            const orderId = Math.floor(1000 + Math.random() * 9000).toString(); // Simple ID generation
            const payload: OrderPayload = {
                order_id: orderId,
                room: roomId || 'Walk-in',
                total_usd: total,
                payment_method: paymentMethod,
                status: paymentMethod === 'khqr' ? 'pending_verification' : 'pending_kitchen',
                items: Array.from(itemMap.values()).map(x => ({
                    name: x.item.nameEn,
                    qty: x.qty,
                    price: x.item.price
                })),
                guest_name: guestName || undefined,
                special_requests: specialRequests || undefined
            };

            // 4. Send to Webhook
            console.log('Sending payload to webhook:', payload);
            const response = await axios.post(WEBHOOK_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.status >= 200 && response.status < 300;

        } catch (error) {
            console.error('Failed to send order notification:', error);
            // Fallback for development/testing if Make.com isn't hooked up yet
            if (import.meta.env.DEV) {
                console.warn('Simulating successful webhook in dev mode.');
                return new Promise(resolve => setTimeout(() => resolve(true), 1500));
            }
            return false;
        }
    }
}
