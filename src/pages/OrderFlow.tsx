import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MenuCard } from '../components/MenuCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { TelegramService } from '../services/TelegramService';
import { WhatsAppService } from '../services/WhatsAppService';
import { useMenuQuery } from '../hooks/useMenuQuery';
import { useCartStore } from '../store/useCartStore';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { ShoppingCart, UtensilsCrossed, DownloadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';

type ViewState = 'menu' | 'success' | 'checking_out';

export const OrderFlow: React.FC = () => {
    const [searchParams] = useSearchParams();
    const urlRoomId = searchParams.get('rid') || 'Unknown';

    // 1. Global State via Zustand
    const { cart, addToCart, clearCart, getTotal, setRoomId, roomId } = useCartStore();

    // Sync URL room ID to global store on load
    useEffect(() => {
        if (urlRoomId !== 'Unknown') setRoomId(urlRoomId);
    }, [urlRoomId, setRoomId]);

    // 2. Data Fetching via React Query
    const { data: menuItems = [], isLoading: isLoadingMenu } = useMenuQuery();

    const [viewState, setViewState] = useState<ViewState>('menu');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [orderTimestamp, setOrderTimestamp] = useState<Date>(new Date());
    const [savedPaymentMethod, setSavedPaymentMethod] = useState<'khqr' | 'cash'>('khqr');
    const [orderId, setOrderId] = useState<string>('');
    const receiptRef = React.useRef<HTMLDivElement>(null);

    const total = getTotal();

    const handleAddToCart = (item: any) => {
        addToCart(item);
        setToastMessage(`Added ${item.nameEn} to cart`);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            // Need to temporarily bring it into viewport to render properly with html2canvas sometimes, 
            // but fixed off-screen with absolute usually works if scale is 1
            const canvas = await html2canvas(receiptRef.current, {
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
            pdf.save(`Receipt_Hotel_R${roomId}_${orderId}.pdf`);
        } catch (error) {
            console.error("Could not generate receipt", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCheckoutConfirm = async (paymentMethod: 'khqr' | 'cash', guestName: string, specialRequests: string) => {
        setIsSubmitting(true);

        try {
            // Group cart items to get quantities
            const itemCounts: Record<string, number> = {};
            cart.forEach(item => {
                itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
            });
            const itemsPayload = Object.entries(itemCounts).map(([id, quantity]) => ({
                menuItemId: id,
                quantity
            }));

            const API_URL = import.meta.env.VITE_API_BASE_URL
                ? `${import.meta.env.VITE_API_BASE_URL}/api/orders`
                : 'http://localhost:3001/api/orders';

            const response = await axios.post(API_URL, {
                roomId,
                paymentMethod: paymentMethod.toUpperCase(),
                guestName,
                specialRequests,
                items: itemsPayload
            });

            const backendOrder = response.data.order;
            const abaData = response.data.abaData;

            // Optional: Backup notifications to Telegram/WhatsApp
            Promise.all([
                TelegramService.sendOrderNotification(roomId, cart, paymentMethod, guestName, specialRequests),
                WhatsAppService.notifyStaff(roomId, cart, paymentMethod, guestName, specialRequests)
            ]).catch(console.error);

            if (paymentMethod === 'khqr' && abaData && !abaData.simulated) {
                // Real ABA Redirect Logic
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase';
                form.target = '_self'; // Redirect same window

                Object.keys(abaData).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = abaData[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
                return; // Stop execution, leaving page
            }

            setOrderTimestamp(new Date(backendOrder.createdAt || new Date()));
            setSavedPaymentMethod(paymentMethod);
            setOrderId(backendOrder.orderNumber); // Real ID
            setViewState('success');

        } catch (error) {
            console.error("Backend API Error:", error);
            alert("Error connecting to the server. Please show your screen to the staff.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (viewState === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, delay: 0.1 }}
                    className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"
                >
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </motion.div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Order Received!</h1>
                <p className="text-lg text-gray-500 font-sans mb-10">ទទួលបានការបញ្ជាទិញ!</p>
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-8 mb-10 w-full max-w-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <UtensilsCrossed size={120} />
                    </div>
                    <p className="text-gray-400 mb-1 text-xs font-bold uppercase tracking-widest relative z-10">Delivering to</p>
                    <p className="text-4xl font-black text-gray-900 relative z-10">Room {roomId}</p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={isDownloading}
                        className="w-full text-white font-bold bg-gray-900 border-none px-8 py-4 rounded-2xl cursor-pointer hover:bg-black transition-colors shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <DownloadCloud size={20} className={isDownloading ? "animate-bounce" : ""} />
                        {isDownloading ? 'Generating PDF...' : 'Download Receipt / ទាញយកវិក្កយបត្រ'}
                    </button>

                    <button
                        onClick={() => {
                            clearCart();
                            setViewState('menu');
                        }}
                        className="w-full text-[#D4AF37] font-bold bg-yellow-50 px-8 py-4 rounded-2xl hover:bg-yellow-100 transition-colors shadow-sm"
                    >
                        Order More / កម្ម៉ង់បន្ថែម
                    </button>
                </div>

                {/* Hidden Receipt used just for PDF generation */}
                <ReceiptTemplate
                    ref={receiptRef}
                    orderId={orderId}
                    roomId={roomId}
                    cart={cart}
                    total={total}
                    paymentMethod={savedPaymentMethod}
                    timestamp={orderTimestamp}
                />
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-32 relative font-sans selection:bg-[#D4AF37] selection:text-white">
            <header className="bg-white/80 backdrop-blur-xl px-5 py-6 shadow-[0_4px_30px_rgb(0,0,0,0.03)] sticky top-0 z-10 border-b border-white">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-[22px] font-black text-gray-900 leading-none tracking-tight">
                            Room Menu <span className="font-sans text-gray-400 font-normal ml-1">ម៉ឺនុយ</span>
                        </h1>
                        {roomId !== 'Unknown' && (
                            <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-[0.2em] font-bold">Table / Room {roomId}</p>
                        )}
                    </div>
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                        <UtensilsCrossed size={18} className="text-[#D4AF37]" />
                    </div>
                </div>
            </header>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-gray-900 text-white px-5 py-3 rounded-full font-medium shadow-2xl flex items-center text-sm border border-gray-800">
                            <span className="text-[#D4AF37] mr-2">✓</span>
                            <span>{toastMessage}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-md mx-auto p-4 pt-6">
                {isLoadingMenu ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-10 h-10 border-4 border-gray-100 border-t-[#D4AF37] rounded-full mb-4"
                        />
                        <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">Reading Menu...</p>
                    </div>
                ) : (
                    menuItems.map(item => (
                        <MenuCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                    ))
                )}
            </main>

            {/* Floating Cart Footer */}
            <AnimatePresence>
                {cart.length > 0 && viewState === 'menu' && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 left-4 right-4 z-40"
                    >
                        <div className="max-w-md mx-auto bg-gray-900/90 backdrop-blur-xl p-2 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-gray-700/50 flex items-center justify-between pointer-events-auto">
                            <div className="flex bg-black/40 text-white px-5 py-3.5 rounded-2xl font-bold items-center border border-white/5">
                                <ShoppingCart size={18} className="mr-3 text-[#D4AF37]" />
                                <span className="text-lg">{cart.length}</span>
                            </div>
                            <button
                                onClick={() => setViewState('checking_out')}
                                className="bg-[#D4AF37] hover:bg-[#C5A028] text-gray-900 px-8 py-3.5 rounded-2xl font-black flex-1 ml-2 shadow-lg transition-colors active:scale-95 text-lg"
                            >
                                Checkout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CheckoutModal
                isOpen={viewState === 'checking_out'}
                onClose={() => setViewState('menu')}
                onConfirm={handleCheckoutConfirm}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};
