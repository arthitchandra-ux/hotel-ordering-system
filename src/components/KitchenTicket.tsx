import { forwardRef } from 'react';
import type { MenuItem } from './MenuCard';
import { ChefHat } from 'lucide-react';

interface KitchenTicketProps {
    orderId: string;
    roomId: string;
    cart: MenuItem[];
    specialRequests?: string;
    timestamp: Date;
}

export const KitchenTicket = forwardRef<HTMLDivElement, KitchenTicketProps>(
    ({ orderId, roomId, cart, specialRequests, timestamp }, ref) => {
        // Kitchen tickets only care about items, qtys, and requests, not prices.
        return (
            <div
                ref={ref}
                className="bg-white text-black w-[300px] p-6 font-mono relative overflow-hidden flex flex-col items-center"
                style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}
            >
                {/* Header */}
                <div className="text-center w-full mb-4 border-b-2 border-dashed border-black pb-4 relative z-10">
                    <div className="mx-auto mb-2 flex justify-center">
                        <ChefHat size={32} className="text-black" />
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-1">KITCHEN TICKET</h1>
                    <p className="text-sm font-bold uppercase">Order: #{orderId}</p>
                </div>

                {/* Meta Data */}
                <div className="w-full text-base font-bold mb-4 relative z-10 border-b-2 border-dashed border-black pb-4">
                    <div className="flex justify-between mb-1">
                        <span>ROOM:</span>
                        <span className="text-2xl font-black">{roomId}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                        <span>TIME:</span>
                        <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="w-full flex-1 mb-6 relative z-10">
                    <div className="flex flex-col gap-4">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-lg font-black leading-tight border-b border-gray-200 pb-2">
                                <span className="mr-2">1x</span>
                                <div className="flex-1 text-right">
                                    <div className="uppercase">{item.nameEn}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Special Requests Section */}
                {specialRequests && (
                    <div className="w-full border-t-4 border-black pt-4 mb-4 relative z-10">
                        <div className="text-sm font-black uppercase tracking-widest bg-black text-white px-2 py-1 inline-block mb-2">
                            SPECIAL REQUESTS:
                        </div>
                        <p className="text-lg font-bold border-l-4 border-black pl-3 py-1">
                            {specialRequests}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center w-full relative z-10 mt-auto pt-4">
                    <p className="font-bold text-sm">*** END OF TICKET ***</p>
                </div>
            </div>
        );
    }
);

KitchenTicket.displayName = 'KitchenTicket';
