import { forwardRef } from 'react';
import type { MenuItem } from './MenuCard';
import { UtensilsCrossed } from 'lucide-react';

interface ReceiptTemplateProps {
    orderId: string;
    roomId: string;
    cart: MenuItem[];
    total: number;
    paymentMethod: 'khqr' | 'cash';
    timestamp: Date;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
    ({ orderId, roomId, cart, total, paymentMethod, timestamp }, ref) => {
        return (
            <div
                ref={ref}
                className="w-[380px] p-8 pb-12 font-sans relative overflow-hidden flex flex-col items-center"
                style={{ position: 'absolute', top: '-10000px', left: '-10000px', backgroundColor: '#ffffff', color: '#111827' }} // Hide from view but keep rendered
            >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12" style={{ color: '#111827' }}>
                    <UtensilsCrossed size={160} />
                </div>

                {/* Header */}
                <div className="text-center w-full mb-6 border-b pb-6 relative z-10" style={{ borderColor: '#e5e7eb' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#111827', color: '#D4AF37' }}>
                        <UtensilsCrossed size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-1 uppercase" style={{ color: '#111827' }}>Hotel God-Tier</h1>
                    <p className="text-sm font-medium tracking-widest uppercase" style={{ color: '#6b7280' }}>Phnom Penh, Cambodia</p>
                    <p className="font-sans text-xs mt-1" style={{ color: '#9ca3af' }}>សណ្ឋាគារលំដាប់កំពូល</p>
                </div>

                {/* Meta Data */}
                <div className="w-full text-sm font-medium mb-6 flex flex-col gap-1 relative z-10" style={{ color: '#6b7280' }}>
                    <div className="flex justify-between">
                        <span>Date <span className="font-sans">កាលបរិច្ឆេទ</span></span>
                        <span className="font-bold" style={{ color: '#111827' }}>{timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Order <span className="font-sans">លេខកូដ</span></span>
                        <span className="font-bold" style={{ color: '#111827' }}>#{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Room <span className="font-sans">បន្ទប់</span></span>
                        <span className="font-black text-base" style={{ color: '#111827' }}>{roomId}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="w-full flex-1 mb-8 relative z-10">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3 border-b pb-2" style={{ color: '#9ca3af', borderColor: '#e5e7eb' }}>
                        <span>Description</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold leading-none" style={{ color: '#111827' }}>{item.nameEn}</div>
                                    <div className="text-[10px] font-sans mt-0.5" style={{ color: '#6b7280' }}>{item.nameKm}</div>
                                </div>
                                <div className="font-bold" style={{ color: '#111827' }}>${item.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="w-full border-t-2 border-dashed pt-4 mb-8 relative z-10" style={{ borderColor: '#d1d5db' }}>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                            Payment <span className="font-sans text-xs block">ការទូទាត់</span>
                        </div>
                        <div className="font-bold uppercase" style={{ color: '#111827' }}>
                            {paymentMethod === 'khqr' ? 'KHQR / ABA' : 'CASH / សាច់ប្រាក់'}
                        </div>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                        <div className="text-base font-black uppercase tracking-widest" style={{ color: '#111827' }}>
                            Total <span className="font-sans text-sm inline-block ml-1" style={{ color: '#6b7280' }}>សរុប</span>
                        </div>
                        <div className="text-2xl font-black" style={{ color: '#D4AF37' }}>${total.toFixed(2)}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center w-full relative z-10">
                    <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>Thank you for dining with us!</p>
                    <p className="font-sans text-xs" style={{ color: '#6b7280' }}>សូមអរគុណសម្រាប់ការគាំទ្រ!</p>
                </div>
            </div>
        );
    }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
