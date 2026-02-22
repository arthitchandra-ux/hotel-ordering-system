import axios from 'axios';
import type { MenuItem } from '../components/MenuCard';

// Typically this would come from an environment variable in production (.env).
const WHATSAPP_WEBHOOK_URL = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL || 'https://hook.us1.make.com/your-whatsapp-webhook-id';

export class WhatsAppService {
    static async notifyStaff(
        roomId: string,
        cart: MenuItem[],
        paymentMethod: 'khqr' | 'cash',
        guestName?: string,
        specialRequests?: string
    ): Promise<boolean> {
        try {
            const total = cart.reduce((sum, item) => sum + item.price, 0);

            const payload = {
                hotel_room: roomId,
                total_usd: total,
                method: paymentMethod,
                guest: guestName || 'Walk-in',
                notes: specialRequests || 'None',
                items: cart.map(item => item.nameEn).join(', ')
            };

            console.log('Dispatching to WhatsApp API bridge:', payload);

            // In a real scenario, this triggers a Make.com webhook which hits Meta's WhatsApp Cloud API
            const response = await axios.post(WHATSAPP_WEBHOOK_URL, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            return response.status >= 200 && response.status < 300;

        } catch (error) {
            console.error('Failed to notify staff via WhatsApp:', error);
            if (import.meta.env.DEV) {
                console.warn('Simulating successful WhatsApp webhook in dev mode.');
                return new Promise(resolve => setTimeout(() => resolve(true), 800));
            }
            return false;
        }
    }
}
