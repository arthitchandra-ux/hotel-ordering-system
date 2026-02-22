import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Hardcoded translations for now to avoid loading files asynchronously in MVP
const resources = {
    en: {
        translation: {
            checkout: {
                title: "Checkout",
                subtitle: "Review your order",
                simulate_aba_title: "Opening ABA App...",
                simulate_aba_subtitle: "Redirecting...",
                order_summary: "Your Order",
                guest_name_label: "Guest Name (Optional)",
                guest_name_placeholder: "e.g. John Doe",
                special_requests_label: "Special Requests",
                special_requests_placeholder: "No spicy, extra napkins...",
                total: "Total",
                pay_aba: "Pay with ABA Mobile",
                pay_cash: "Order with Cash",
                processing: "Processing..."
            },
            order: {
                received: "Order Received!",
                delivering: "Delivering to",
                download_receipt: "Download Receipt",
                order_more: "Order More"
            }
        }
    },
    km: {
        translation: {
            checkout: {
                title: "ពិនិត្យនិងទូទាត់ប្រាក់",
                subtitle: "ពិនិត្យមើលការបញ្ជាទិញរបស់អ្នក",
                simulate_aba_title: "កំពុងភ្ជាប់ទៅ ABA Mobile...",
                simulate_aba_subtitle: "កំពុងបញ្ជូនបន្ត...",
                order_summary: "ការកម្ម៉ង់របស់អ្នក",
                guest_name_label: "ឈ្មោះភ្ញៀវ (ជាជម្រើស)",
                guest_name_placeholder: "ឧ. សុខ",
                special_requests_label: "សំណើពិសេស",
                special_requests_placeholder: "មិនហឹរ សូមបន្ថែមក្រដាសជូតមាត់...",
                total: "សរុប",
                pay_aba: "ទូទាត់តាម ABA",
                pay_cash: "បន្តការទូទាត់ជាសាច់ប្រាក់",
                processing: "កំពុងដំណើរការ..."
            },
            order: {
                received: "ទទួលបានការបញ្ជាទិញ!",
                delivering: "បញ្ជូនទៅកាន់",
                download_receipt: "ទាញយកវិក្កយបត្រ",
                order_more: "កម្ម៉ង់បន្ថែម"
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en", // default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
