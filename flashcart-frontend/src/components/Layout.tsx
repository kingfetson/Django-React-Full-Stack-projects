// app/layout.tsx (Root layout - server component)
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
// import './globals.css';

export const metadata: Metadata = {
  title: "FlashCart Pro - Best Electronics Store in Kenya",
  description: "Shop quality electronics, office supplies, accessories & kitchenware.",
  keywords: "ecommerce, kenya, electronics, shopping, flashcart",
  authors: [{ name: "FlashCart Pro" }],
  openGraph: {
    title: "FlashCart Pro",
    description: "Your one-stop shop for quality products",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}