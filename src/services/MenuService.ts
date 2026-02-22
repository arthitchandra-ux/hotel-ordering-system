import axios from 'axios';
import { z } from 'zod';
import type { MenuItem } from '../components/MenuCard';

// 1. Define God-Tier Zod Schema for strict runtime validation
export const menuItemSchema = z.object({
    id: z.string(),
    nameEn: z.string(),
    nameKm: z.string(),
    price: z.number(),
    category: z.string(),
    imageUrl: z.string().nullable().optional().transform(val => val || ''),
    available: z.boolean(),
    stockCount: z.number().nullable().optional().transform(val => val === null ? undefined : val)
});

export const menuResponseSchema = z.array(menuItemSchema);

// Full-Stack Architecture: connect to our real local Next.js/Node API now
const MENU_API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/menu`
    : 'http://localhost:3001/api/menu';

export class MenuService {
    static async fetchMenu(): Promise<MenuItem[]> {
        try {
            const response = await axios.get(MENU_API_URL);

            // 2. Runtime Schema Parsing: Will throw detailed errors if Airtable/DB shape changes
            const validData = menuResponseSchema.parse(response.data);
            return validData;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                console.error("API Contract Violation! Data structure mismatch:", (error as any).errors);
            } else {
                console.error("Failed to fetch menu from API.", error);
            }
            throw error;
        }
    }

    static async toggleAvailability(id: string, available: boolean, stockCount?: number): Promise<MenuItem> {
        try {
            const response = await axios.put(`${MENU_API_URL}/${id}/toggle`, { available, stockCount });
            return menuItemSchema.parse(response.data);
        } catch (error) {
            console.error("Failed to toggle menu availability", error);
            throw error;
        }
    }
}
