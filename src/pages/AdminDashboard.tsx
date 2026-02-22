import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    UtensilsCrossed,
    Settings,
    LogOut,
    CheckCircle,
    Clock,
    CheckCircle2,
    Printer,
    FileCheck,
    BarChart3
} from 'lucide-react';
import { KitchenTicket } from '../components/KitchenTicket';
import { MenuService } from '../services/MenuService';
import { OrderService } from '../services/OrderService';
import type { OrderResponse } from '../services/OrderService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Recharts Data
const ANALYTICS_DATA = [
    { time: '10:00', sales: 45 },
    { time: '11:00', sales: 120 },
    { time: '12:00', sales: 350 },
    { time: '13:00', sales: 280 },
    { time: '14:00', sales: 150 },
    { time: '15:00', sales: 90 },
];

export const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics'>('orders');

    const { data: menuItems = [] } = useQuery({
        queryKey: ['admin-menu'],
        queryFn: MenuService.fetchMenu,
        refetchInterval: 60000 // Refetch menu every 1min
    });

    const toggleMenuMutation = useMutation({
        mutationFn: ({ id, available, stockCount }: { id: string, available: boolean, stockCount?: number }) =>
            MenuService.toggleAvailability(id, available, stockCount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
            // Also invalidate frontend menu queries if they share a cache or use a global key
            queryClient.invalidateQueries({ queryKey: ['menu'] });
        }
    });

    const { data: orders = [] } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: OrderService.fetchOrders,
        refetchInterval: 10000 // Refetch every 10 seconds for live feel
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: OrderResponse['status'] }) => OrderService.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
    });

    // Removed legacy local menu state arrays to use pure useQuery data.

    const postToFolioMutation = useMutation({
        mutationFn: (id: string) => OrderService.postToFolio(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            alert("Success: Order successfully posted to Guest's PMS Folio.");
        },
        onError: () => {
            alert("Error: Failed to post to PMS Folio.");
        }
    });

    // For Kitchen Ticket Printing
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const kotRef = useRef<HTMLDivElement>(null);
    const [activePrintOrder, setActivePrintOrder] = useState<OrderResponse | null>(null);

    const updateOrderStatus = (orderId: string, newStatus: OrderResponse['status']) => {
        updateStatusMutation.mutate({ id: orderId, status: newStatus });
    };

    const postToFolio = (orderId: string) => {
        postToFolioMutation.mutate(orderId);
    };

    const toggleMenuItemAvailability = (itemId: string) => {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            toggleMenuMutation.mutate({
                id: itemId,
                available: !item.available,
                stockCount: item.stockCount
            });
        }
    };

    const updateStockCount = (itemId: string, newCount?: number) => {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            toggleMenuMutation.mutate({
                id: itemId,
                available: newCount !== 0,
                stockCount: newCount === -1 ? undefined : newCount
            });
        }
    };

    const handlePrintKOT = async (order: OrderResponse) => {
        setActivePrintOrder(order);
        setPrintingOrderId(order.id);

        // Slight delay to allow DOM to render the hidden KOT template
        setTimeout(async () => {
            if (!kotRef.current) return;
            try {
                const canvas = await html2canvas(kotRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`KOT_${order.id}.pdf`);
            } catch (error) {
                console.error("Could not generate KOT", error);
            } finally {
                setPrintingOrderId(null);
            }
        }, 300);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-sans flex flex-col md:flex-row">

            {/* Hidden KOT Template */}
            {activePrintOrder && (
                <KitchenTicket
                    ref={kotRef}
                    orderId={activePrintOrder.orderNumber}
                    roomId={activePrintOrder.roomId}
                    cart={activePrintOrder.items.map((i: any) => ({ ...i.menuItem, cartQuantity: i.quantity }))}
                    specialRequests={activePrintOrder.specialRequests || undefined}
                    timestamp={new Date(activePrintOrder.createdAt)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col border-r border-gray-800 hidden md:flex">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-gray-900 shadow-md">
                            <UtensilsCrossed size={16} />
                        </div>
                        Hotel Manager
                    </h1>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${activeTab === 'orders' ? 'bg-[#D4AF37] text-gray-900 shadow-lg' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <LayoutDashboard size={18} />
                        Live Orders
                        {orders.filter(o => o.status === 'PENDING_PAYMENT' || o.status === 'PENDING_KITCHEN').length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                                {orders.filter(o => o.status === 'PENDING_PAYMENT' || o.status === 'PENDING_KITCHEN').length} New
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${activeTab === 'menu' ? 'bg-[#D4AF37] text-gray-900 shadow-lg' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <UtensilsCrossed size={18} />
                        Menu Management
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${activeTab === 'analytics' ? 'bg-[#D4AF37] text-gray-900 shadow-lg' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold hover:bg-gray-800 text-gray-400">
                        <Settings size={18} />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-gray-500 hover:text-white hover:bg-gray-800 w-full">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
                <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D4AF37] flex items-center justify-center text-gray-900">
                        <UtensilsCrossed size={12} />
                    </div>
                    Hotel Manager
                </h1>
                <div className="flex bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-[#D4AF37] text-gray-900' : 'text-gray-400'}`}
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'menu' ? 'bg-[#D4AF37] text-gray-900' : 'text-gray-400'}`}
                    >
                        Menu
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">

                <AnimatePresence mode="wait">
                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Live Orders</h2>
                                    <p className="text-gray-500 text-sm mt-1">Real-time kitchen display system.</p>
                                </div>
                                <div className="text-sm font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-gray-600">
                                    <Clock size={16} /> {new Date().toLocaleTimeString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {/* Columns */}
                                {(['PENDING_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'] as OrderResponse['status'][]).map((statusGroup) => (
                                    <div key={statusGroup} className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                                {statusGroup.replace('_', ' ')}
                                            </h3>
                                            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {orders.filter(o => o.status === statusGroup || (statusGroup === 'PENDING_KITCHEN' && o.status === 'PENDING_PAYMENT')).length}
                                            </span>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-4">
                                            <AnimatePresence>
                                                {orders.filter(o => o.status === statusGroup || (statusGroup === 'PENDING_KITCHEN' && o.status === 'PENDING_PAYMENT')).map(order => (
                                                    <motion.div
                                                        key={order.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-md ${['PENDING_PAYMENT', 'PENDING_KITCHEN'].includes(order.status) ? 'border-red-500' :
                                                            order.status === 'PREPARING' ? 'border-blue-500' :
                                                                order.status === 'READY' ? 'border-yellow-500' :
                                                                    'border-green-500 opacity-60'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                                                    Room {order.roomId}
                                                                </h4>
                                                                <div className="text-xs text-gray-400 font-mono mt-0.5 mb-1">{order.orderNumber}</div>
                                                                {order.guestName && (
                                                                    <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                                                                        {order.guestName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-1">
                                                                <div className="font-bold text-[#D4AF37]">${order.totalUsd.toFixed(2)}</div>
                                                                <div className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${order.paymentMethod === 'KHQR' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                                    {order.paymentMethod}
                                                                    {order.status === 'PENDING_PAYMENT' && (
                                                                        <span className="block text-[8px] mt-0.5 text-red-500 animate-pulse">Awaiting Conf</span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handlePrintKOT(order)}
                                                                    disabled={printingOrderId === order.id}
                                                                    className="text-gray-400 hover:text-gray-900 transition-colors mt-1 p-1"
                                                                    title="Print Kitchen Ticket"
                                                                >
                                                                    <Printer size={16} className={printingOrderId === order.id ? 'animate-pulse' : ''} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                                            {order.items.map((item, i) => (
                                                                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0 last:pb-0">
                                                                    <span className="font-medium text-gray-700">{item.quantity}x {item.menuItem.nameEn}</span>
                                                                </div>
                                                            ))}
                                                            {order.specialRequests && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs font-bold text-red-500 italic">
                                                                    *Note: {order.specialRequests}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        {['PENDING_PAYMENT', 'PENDING_KITCHEN'].includes(order.status) && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                                                            >
                                                                Accept to Kitchen
                                                            </button>
                                                        )}
                                                        {order.status === 'PREPARING' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                                                className="w-full bg-[#D4AF37] hover:bg-yellow-500 text-gray-900 py-2 rounded-xl font-black text-sm transition-colors shadow-sm"
                                                            >
                                                                Mark as Ready
                                                            </button>
                                                        )}
                                                        {order.status === 'READY' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle size={16} /> Delivered
                                                            </button>
                                                        )}
                                                        {order.status === 'DELIVERED' && (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="text-center text-xs font-bold text-green-500 flex items-center justify-center gap-1 py-1">
                                                                    <CheckCircle2 size={12} /> Completed
                                                                </div>
                                                                {/* PMS Handoff */}
                                                                <button
                                                                    onClick={() => postToFolio(order.id)}
                                                                    className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                                                                >
                                                                    <FileCheck size={14} /> Post to PMS Folio
                                                                </button>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {orders.filter(o => o.status === statusGroup || (statusGroup === 'PENDING_KITCHEN' && o.status === 'PENDING_PAYMENT')).length === 0 && (
                                                <div className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex items-center justify-center text-gray-400 text-sm font-medium opacity-50">
                                                    Empty
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Menu Management</h2>
                                    <p className="text-gray-500 text-sm mt-1">Control pricing and availability.</p>
                                </div>
                                <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">
                                    + Add Item
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-1">Item</div>
                                    <div className="col-span-4">Name</div>
                                    <div className="col-span-2">Category</div>
                                    <div className="col-span-2">Price</div>
                                    <div className="col-span-3 text-right">Status</div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {menuItems.map(item => (
                                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
                                            <div className="col-span-1 hidden md:block">
                                                <img src={item.imageUrl} alt={item.nameEn} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                            </div>
                                            <div className="col-span-4">
                                                <div className="font-bold text-gray-900">{item.nameEn}</div>
                                                <div className="text-xs text-gray-500 font-sans">{item.nameKm}</div>
                                            </div>
                                            <div className="col-span-2 hidden md:block">
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="col-span-2 font-bold text-[#D4AF37]">
                                                ${item.price.toFixed(2)}
                                            </div>
                                            <div className="col-span-full md:col-span-3 flex justify-end items-center gap-4 mt-2 md:mt-0">
                                                <div className="flex items-center gap-2 mr-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:block">Stock</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-16 h-8 text-sm font-bold border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                                                        value={item.stockCount ?? ''}
                                                        placeholder="∞"
                                                        onChange={(e) => updateStockCount(item.id, e.target.value ? parseInt(e.target.value) : undefined)}
                                                    />
                                                </div>
                                                <label className="flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={item.available}
                                                            onChange={() => toggleMenuItemAvailability(item.id)}
                                                        />
                                                        <div className={`block w-10 h-6 rounded-full transition-colors ${item.available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${item.available ? 'transform translate-x-4' : ''}`}></div>
                                                    </div>
                                                    <div className="ml-3 text-sm font-bold w-16">
                                                        {item.available ? <span className="text-green-600">In Stock</span> : <span className="text-gray-400">Sold Out</span>}
                                                    </div>
                                                </label>
                                                <button className="text-blue-500 hover:text-blue-700 text-sm font-bold px-3 py-1 bg-blue-50 rounded-lg hidden md:block">
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Sales & Analytics</h2>
                                    <p className="text-gray-500 text-sm mt-1">Real-time revenue monitoring.</p>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Today's Revenue</div>
                                    <div className="text-4xl font-black text-[#D4AF37]">$1,240.50</div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Total Orders</div>
                                    <div className="text-4xl font-black text-gray-900">84</div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Avg. Ticket Size</div>
                                    <div className="text-4xl font-black text-gray-900">$14.76</div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Intraday Sales Trajectory</h3>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="time" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                                                formatter={(value: any) => [`$${value}`, 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
