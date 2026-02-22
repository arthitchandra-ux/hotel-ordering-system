const express = require('express');
import { Request, Response } from 'express';
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { z } = require('zod');
const crypto = require('crypto');

dotenv.config();

const app = express();
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// --- MOCK DATABASE SEEDING ROUTE (For testing only) ---
app.post('/api/seed', async (req: Request, res: Response) => {
    try {
        let restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            restaurant = await prisma.restaurant.create({
                data: { name: 'Demo Hotel' }
            });
        }

        const mainCategory = await prisma.category.create({
            data: { nameEn: 'Main', nameKm: 'ប្រភេទអាហារ', restaurantId: restaurant.id }
        });

        const items = [
            { nameEn: 'Beef Lok Lak', nameKm: 'ឡុកឡាក់សាច់គោ', price: 6.50, categoryId: mainCategory.id, restaurantId: restaurant.id },
            { nameEn: 'Fish Amok', nameKm: 'អាម៉ុកត្រី', price: 7.00, categoryId: mainCategory.id, restaurantId: restaurant.id, stockCount: 5 }
        ];

        await prisma.menuItem.createMany({ data: items });
        res.json({ message: 'Database seeded successfully' });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});


// --- MENU ENDPOINTS ---
app.get('/api/menu', async (req: Request, res: Response) => {
    try {
        const items = await prisma.menuItem.findMany({
            include: { category: true }
        });

        // Map to format frontend expects
        const mappedItems = items.map((item: any) => ({
            id: item.id,
            nameEn: item.nameEn,
            nameKm: item.nameKm,
            price: item.price,
            category: item.category.nameEn,
            imageUrl: item.imageUrl,
            available: item.available,
            stockCount: item.stockCount
        }));

        res.json(mappedItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

const toggleMenuSchema = z.object({
    available: z.boolean(),
    stockCount: z.number().nullable().optional()
});

app.put('/api/menu/:id/toggle', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = toggleMenuSchema.parse(req.body);

        const item = await prisma.menuItem.update({
            where: { id },
            data: {
                available: data.available,
                stockCount: data.stockCount
            }
        });

        res.json(item);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error('Failed to toggle menu item:', error);
        res.status(500).json({ error: 'Failed to toggle menu item' });
    }
});

// --- ORDER ENDPOINTS ---

const createOrderSchema = z.object({
    roomId: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'KHQR']),
    guestName: z.string().optional(),
    specialRequests: z.string().optional(),
    items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number().int().positive()
    }))
});

app.post('/api/orders', async (req: Request, res: Response) => {
    try {
        const data = createOrderSchema.parse(req.body);

        // 1. Validate items and calculate TRUE price on the backend
        let totalUsd = 0;
        const orderItemsData = [];

        for (const item of data.items) {
            const dbItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
            if (!dbItem || !dbItem.available) {
                return res.status(400).json({ error: `Item ${item.menuItemId} is not available.` });
            }
            if (dbItem.stockCount !== null && dbItem.stockCount < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${dbItem.nameEn}.` });
            }

            totalUsd += dbItem.price * item.quantity;
            orderItemsData.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                priceAtTime: dbItem.price
            });
        }

        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) throw new Error("No restaurant initialized");

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        // 2. Create the order in the database securely
        const order = await prisma.order.create({
            data: {
                orderNumber,
                roomId: data.roomId || 'Walk-in',
                totalUsd,
                paymentMethod: data.paymentMethod,
                status: data.paymentMethod === 'KHQR' ? 'PENDING_PAYMENT' : 'PENDING_KITCHEN',
                guestName: data.guestName,
                specialRequests: data.specialRequests,
                restaurantId: restaurant.id,
                items: { create: orderItemsData }
            },
            include: { items: true }
        });

        // 3. ABA PayWay integration
        let abaData = null;
        if (data.paymentMethod === 'KHQR') {
            const reqTime = `${Date.now()}`;
            const merchantId = process.env.ABA_MERCHANT_ID;
            const apiKey = process.env.ABA_API_KEY;

            if (!merchantId || !apiKey) {
                console.warn("ABA Credentials missing, simulating ABA payload.");
                // Provide simulation mock data if env vars missing
                abaData = { simulated: true, orderId: order.id };
            } else {
                // Construct required ABA PayWay FormData
                // The fields must be hashed exactly in this order: req_time + merchant_id + tran_id + amount + items + ...
                const itemsBase64 = Buffer.from(JSON.stringify([{
                    name: 'Hotel Order',
                    quantity: '1',
                    price: totalUsd.toFixed(2)
                }])).toString('base64');

                const hashString = `${reqTime}${merchantId}${order.id}${totalUsd.toFixed(2)}${itemsBase64}abapay_khqr`;
                const hash = crypto.createHmac('sha512', apiKey).update(hashString).digest('base64');

                abaData = {
                    req_time: reqTime,
                    merchant_id: merchantId,
                    tran_id: order.id,
                    amount: totalUsd.toFixed(2),
                    items: itemsBase64,
                    hash: hash,
                    payment_option: 'abapay_khqr',
                    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
                    continue_success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin`
                };
            }
        }

        res.status(201).json({ order, abaData });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create order securely' });
    }
});

app.get('/api/orders', async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(orders);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING_PAYMENT', 'PENDING_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
    isPostedToFolio: z.boolean().optional()
});

app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateOrderStatusSchema.parse(req.body);

        const order = await prisma.order.update({
            where: { id },
            data: {
                status: data.status,
                // Assuming isPostedToFolio might be added to schema later, ignoring for now as it's just mock frontend state
            }
        });

        res.json(order);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error('Failed to update order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// --- ABA SECURE WEBHOOK ENDPOINT ---
app.post('/api/webhooks/aba', async (req: Request, res: Response) => {
    // 1. Verify Request Origin (Simplified)
    // In God-Tier: Check ABA Signature headers
    // const signature = req.headers['x-aba-signature'];
    // const expectedSig = crypto.createHmac('sha512', process.env.ABA_API_KEY).update(req.rawBody).digest('base64');
    // if (signature !== expectedSig) return res.status(401).send('Unauthorized');

    const { tran_id, status } = req.body;

    if (status === 'SUCCESS') {
        try {
            await prisma.order.update({
                where: { id: tran_id }, // Assuming tran_id maps to order.id
                data: { status: 'PENDING_KITCHEN' }
            });
            // Emit websocket event to Kitchen Dashboard here
            console.log(`Order ${tran_id} PAID via Webhook. Moving to kitchen.`);
        } catch (e) {
            console.error("Webhook processing error", e);
        }
    }

    res.json({ status: 'OK' });
});


// --- PMS INTEGRATION (MOCK) ---
const postToPmsSchema = z.object({
    orderId: z.string()
});

app.post('/api/pms/folio', async (req: Request, res: Response) => {
    try {
        const { orderId } = postToPmsSchema.parse(req.body);

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'Order must be delivered before posting to PMS' });

        // MOCK: In God-Tier, this would make an XML/SOAP or REST call to Oracle Opera / Cloudbeds.
        console.log(`[PMS INTEGRATION] Posting Charge USD ${order.totalUsd} to Room ${order.roomId} for Order ${order.orderNumber}`);

        // Update local DB to mark as posted
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { isPostedToFolio: true } // Need to push this to Prisma Schema
        });

        res.json({ success: true, message: 'Successfully posted to Guest Folio', order: updatedOrder });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error('Failed to post to PMS:', error);
        res.status(500).json({ error: 'Failed to post to PMS' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Secure Server running on port ${PORT}`);
});
