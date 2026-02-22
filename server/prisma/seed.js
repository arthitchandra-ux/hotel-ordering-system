"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log('Seeding database...');
    // Create Restaurant
    const restaurant = await prisma.restaurant.create({
        data: {
            name: 'The Grand Hotel'
        }
    });
    // Create Categories
    const catBreakfast = await prisma.category.create({
        data: { nameEn: 'Breakfast', nameKm: 'អាហារពេលព្រឹក', restaurantId: restaurant.id }
    });
    const catMains = await prisma.category.create({
        data: { nameEn: 'Main Courses', nameKm: 'ម្ហូបចម្បង', restaurantId: restaurant.id }
    });
    const catDrinks = await prisma.category.create({
        data: { nameEn: 'Beverages', nameKm: 'ភេសជ្ជៈ', restaurantId: restaurant.id }
    });
    // Create Menu Items
    await prisma.menuItem.createMany({
        data: [
            {
                nameEn: 'American Breakfast',
                nameKm: 'អាហារពេលព្រឹកអាមេរិក',
                price: 8.50,
                categoryId: catBreakfast.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&q=80',
                available: true,
            },
            {
                nameEn: 'Kuy Teav (Cambodian Noodle Soup)',
                nameKm: 'គុយទាវ',
                price: 4.50,
                categoryId: catBreakfast.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&q=80',
                available: true,
            },
            {
                nameEn: 'Beef Lok Lak',
                nameKm: 'ឡុកឡាក់សាច់គោ',
                price: 9.00,
                categoryId: catMains.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=500&q=80',
                available: true,
            },
            {
                nameEn: 'Fish Amok',
                nameKm: 'អាម៉ុកត្រី',
                price: 8.50,
                categoryId: catMains.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1548943487-a2e4142f9e16?w=500&q=80',
                available: true,
            },
            {
                nameEn: 'Iced Latte',
                nameKm: 'កាហ្វេទឹកដោះគោទឹកកក',
                price: 3.50,
                categoryId: catDrinks.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
                available: true,
            },
            {
                nameEn: 'Fresh Coconut',
                nameKm: 'ទឹកដូង',
                price: 2.50,
                categoryId: catDrinks.id,
                restaurantId: restaurant.id,
                imageUrl: 'https://images.unsplash.com/photo-1523428461295-829d89ebb9b1?w=500&q=80',
                available: true,
            }
        ]
    });
    console.log('Database seeded successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map