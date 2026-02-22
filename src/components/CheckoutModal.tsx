import React, { useState } from 'react';
import { X, CheckCircle, Banknote, QrCode } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useTranslation } from 'react-i18next';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentMethod: 'khqr' | 'cash', guestName: string, specialRequests: string) => void;
    isSubmitting: boolean;
}

type CheckoutStep = 'select_payment' | 'simulate_aba';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting
}) => {
    // 1. Pull directly from global state, no prop drilling!
    const { cart, getTotal } = useCartStore();
    const total = getTotal();
    const { t, i18n } = useTranslation();

    const [paymentMethod, setPaymentMethod] = useState<'khqr' | 'cash'>('khqr');
    const [step, setStep] = useState<CheckoutStep>('select_payment');
    const [guestName, setGuestName] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    if (!isOpen) return null;

    const handlePrimaryAction = () => {
        if (paymentMethod === 'khqr' && step === 'select_payment') {
            setStep('simulate_aba'); // Show the ABA loading screen while backend hashes
            onConfirm('khqr', guestName, specialRequests);
        } else {
            onConfirm(paymentMethod, guestName, specialRequests);
        }
    };

    const resetAndClose = () => {
        setStep('select_payment');
        onClose();
    };

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'km' : 'en');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-[#FAF9F6] w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 relative max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 m-0 tracking-tight">
                            {step === 'simulate_aba' ? t('checkout.simulate_aba_title') : t('checkout.title')}
                        </h2>
                        <p className="font-sans text-sm font-medium text-gray-500 mt-1 cursor-pointer hover:text-gray-800 transition-colors" onClick={toggleLanguage}>
                            {step === 'simulate_aba' ? t('checkout.simulate_aba_subtitle') : t('checkout.subtitle')} • <span>🌐 {i18n.language === 'en' ? 'KM' : 'EN'}</span>
                        </p>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2 -mr-2 -mt-2 bg-white text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm border border-gray-100"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {step === 'select_payment' ? (
                    <>
                        {/* Order Summary Scrollable Area */}
                        <div className="flex-1 overflow-y-auto min-h-[100px] mb-8 pr-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('checkout.order_summary')}</h3>
                            <div className="space-y-4">
                                {cart.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-base border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                        <span className="text-gray-800 font-medium">{i18n.language === 'en' ? item.nameEn : item.nameKm}</span>
                                        <span className="font-bold text-gray-900">${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Personalization Fields */}
                            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t('checkout.guest_name_label')}</label>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder={t('checkout.guest_name_placeholder')}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t('checkout.special_requests_label')}</label>
                                    <textarea
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        placeholder={t('checkout.special_requests_placeholder')}
                                        rows={2}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Area (Sticky) */}
                        <div className="pt-2 bg-[#FAF9F6]">
                            <div className="flex justify-between items-end mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <span className="text-sm font-bold tracking-wide text-gray-500 uppercase">{t('checkout.total')}</span>
                                <span className="text-3xl font-black text-[#D4AF37] leading-none">${total.toFixed(2)}</span>
                            </div>

                            <div className="space-y-3 mb-8">
                                <label
                                    className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'khqr'
                                        ? 'border-[#D4AF37] bg-yellow-50/30'
                                        : 'border-white bg-white shadow-sm hover:border-gray-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="khqr"
                                        checked={paymentMethod === 'khqr'}
                                        onChange={() => setPaymentMethod('khqr')}
                                        className="hidden"
                                    />
                                    <div className={`p-2.5 rounded-full mr-4 ${paymentMethod === 'khqr' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <QrCode size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-base">KHQR / ABA</div>
                                        <div className="text-xs text-gray-500 font-sans mt-0.5">ស្កេនបង់ប្រាក់</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'khqr' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-gray-300'}`}>
                                        {paymentMethod === 'khqr' && <CheckCircle className="text-white" size={14} />}
                                    </div>
                                </label>

                                <label
                                    className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cash'
                                        ? 'border-[#D4AF37] bg-yellow-50/30'
                                        : 'border-white bg-white shadow-sm hover:border-gray-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cash"
                                        checked={paymentMethod === 'cash'}
                                        onChange={() => setPaymentMethod('cash')}
                                        className="hidden"
                                    />
                                    <div className={`p-2.5 rounded-full mr-4 ${paymentMethod === 'cash' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Banknote size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-base">Cash</div>
                                        <div className="text-xs text-gray-500 font-sans mt-0.5">សាច់ប្រាក់សុទ្ធ</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cash' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-gray-300'}`}>
                                        {paymentMethod === 'cash' && <CheckCircle className="text-white" size={14} />}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </>
                ) : (
                    /* SIMULATED ABA DEEP LINK STEP */
                    <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-[#0052CC] rounded-full border-t-transparent animate-spin"></div>
                            <div className="bg-[#0052CC] text-white font-bold tracking-tighter w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg">
                                ABA
                            </div>
                        </div>
                        <div className="text-center mb-4">
                            <p className="text-2xl font-black text-gray-900 mb-2">Redirecting to Pay</p>
                            <p className="text-base font-medium text-gray-500 mb-2">Amount: <span className="text-[#D4AF37] font-bold">${total.toFixed(2)}</span></p>
                        </div>
                        <div className="bg-blue-50 text-blue-800 text-sm px-5 py-4 rounded-xl font-medium w-full text-center border border-blue-100 leading-relaxed max-w-xs">
                            Simulating secure handoff to ABA Mobile App. Please wait...
                        </div>
                    </div>
                )}

                {step === 'select_payment' && (
                    <button
                        onClick={handlePrimaryAction}
                        disabled={isSubmitting || cart.length === 0}
                        className="w-full bg-gray-900 hover:bg-black text-white border-none p-5 rounded-2xl font-bold text-lg cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-900/20"
                    >
                        <span>
                            {isSubmitting ? 'Processing...' :
                                paymentMethod === 'khqr' ? 'Pay with ABA Mobile' : 'Order with Cash'}
                        </span>
                        {!isSubmitting && (
                            <span className="text-xs font-sans font-normal text-gray-400 mt-1.5 uppercase tracking-wider">
                                {paymentMethod === 'khqr' ? 'ទូទាត់តាម ABA' : 'បន្តការទូទាត់'}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
