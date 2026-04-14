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