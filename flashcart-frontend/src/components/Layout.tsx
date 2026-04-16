"use client";

import Navigation from "./Navigation";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navigation />
      <main className="grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// 3. Add to layout.tsx
export const metadata = {
  title: "FlashCart Pro - Best Electronics Store in Kenya",
  description: "Shop quality electronics, office supplies, accessories & kitchenware. Free shipping on orders over KES 5000.",
  keywords: "ecommerce, kenya, electronics, shopping, flashcart",
  openGraph: {
    title: "FlashCart Pro",
    description: "Your one-stop shop for quality products",
    type: "website",
    locale: "en_KE",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "your-google-verification-code",
  },
}