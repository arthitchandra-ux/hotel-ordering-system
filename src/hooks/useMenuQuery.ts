import { useQuery } from '@tanstack/react-query';
import { MenuService } from '../services/MenuService';
import type { MenuItem } from '../components/MenuCard';

export const useMenuQuery = () => {
    return useQuery<MenuItem[], Error>({
        queryKey: ['menu'],
        queryFn: async () => {
            return await MenuService.fetchMenu();
        },
        staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
        retry: 3, // Auto-retry on failure gracefully
    });
};
