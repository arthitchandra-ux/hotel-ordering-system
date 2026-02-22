import axios from 'axios';
import { z } from 'zod';
import { menuItemSchema } from './MenuService';

export const orderItemSchema = z.object({
    id: z.string(),
    orderId: z.string(),
    menuItemId: z.string(),
    quantity: z.number(),
    priceAtTime: z.number(),
    menuItem: menuItemSchema
});

export const orderSchema = z.object({
    id: z.string(),
    orderNumber: z.string(),
    roomId: z.string(),
    totalUsd: z.number(),
    paymentMethod: z.enum(['CASH', 'KHQR']),
    status: z.enum(['PENDING_PAYMENT', 'PENDING_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
    isPostedToFolio: z.boolean().default(false),
    guestName: z.string().nullable().optional(),
    specialRequests: z.string().nullable().optional(),
    restaurantId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    items: z.array(orderItemSchema)
});

export const orderResponseSchema = z.array(orderSchema);
export type OrderResponse = z.infer<typeof orderSchema>;

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/orders`
    : 'http://localhost:3001/api/orders';

export class OrderService {
    static async fetchOrders(): Promise<OrderResponse[]> {
        const response = await axios.get(API_URL);
        return orderResponseSchema.parse(response.data);
    }

    static async updateOrderStatus(orderId: string, status: OrderResponse['status']) {
        const response = await axios.put(`${API_URL}/${orderId}/status`, { status });
        return orderSchema.parse(response.data);
    }

    static async postToFolio(orderId: string) {
        const PMS_API_URL = import.meta.env.VITE_API_BASE_URL
            ? `${import.meta.env.VITE_API_BASE_URL}/api/pms/folio`
            : 'http://localhost:3001/api/pms/folio';

        const response = await axios.post(PMS_API_URL, { orderId });
        return response.data;
    }
}
