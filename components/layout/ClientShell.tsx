"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { AssistantProvider } from "@/context/AssistantContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { initAnalytics } from "@/lib/analytics";
import TopBar from "./TopBar";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import ShopAssistant from "./ShopAssistant";
import CartDrawer from "@/components/cart/CartDrawer";
import CartToast from "@/components/cart/CartToast";
import InstallPrompt from "./InstallPrompt";
import { EmailCapturePopup } from "@/components/tienda/EmailCapturePopup";
import { PushPermissionPrompt } from "@/components/tienda/PushPermissionPrompt";
import { ReferralBanner } from "@/components/tienda/ReferralBanner";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Scroll al tope cada vez que cambia la ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Inicializar sistema de analytics
  useEffect(() => {
    initAnalytics();
  }, []);

  // Aplicar tema guardado al cargar
  useEffect(() => {
    try {
      const tema = localStorage.getItem("shop_theme");
      if (tema === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch {}
  }, []);

  return (
    <SessionProvider>
      <CartProvider>
        <AssistantProvider>
          <ReviewsProvider>
            <ReferralBanner />
            <TopBar />
            <Header />
            <main className="min-h-[calc(100vh-7rem)]">{children}</main>
            <Footer />
            <BottomNav />
            <ShopAssistant />
            <CartDrawer />
            <CartToast />
            {pathname === "/auth/registro" && <InstallPrompt />}
            <EmailCapturePopup />
            <PushPermissionPrompt />
          </ReviewsProvider>
        </AssistantProvider>
      </CartProvider>
    </SessionProvider>
  );
}
