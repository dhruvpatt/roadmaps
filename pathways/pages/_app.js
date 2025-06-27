import { useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/useAuth";
import ErudaDevTools from "@components/devtools";

import AssistantWidget from "@/components/AssistantWidget"; // 👈 import

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/", "/login", "/signup"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);

  const Page = <Component {...pageProps} />;

  // useEffect(() => {
  //   const resizeObserver = new ResizeObserver((entries) => {
  //     console.log("[ResizeObserver] Triggered:", entries.length)

  //     for (const entry of entries) {
  //       const el = entry.target
  //       console.log("[Observed Element]:", el)

  //       // Only animate if element is visible
  //       if (el.offsetParent !== null) {
  //         console.log("[Animating Element]:", el)
  //         el.animate(
  //           [
  //             { transform: "scale(0.98)", opacity: 0.95 },
  //             { transform: "scale(1)", opacity: 1 },
  //           ],
  //           {
  //             duration: 250,
  //             easing: "ease-out",
  //           }
  //         )
  //       }
  //     }
  //   })

  //   // Observe existing .resizable elements
  //   const initial = document.querySelectorAll(".resizable")
  //   console.log("[Initial .resizable count]:", initial.length)
  //   initial.forEach((el) => {
  //     console.log("[Observing Initial Element]:", el)
  //     resizeObserver.observe(el)
  //   })

  //   // MutationObserver to detect dynamically added .resizable elements
  //   const mutationObserver = new MutationObserver((mutations) => {
  //     mutations.forEach((mutation) => {
  //       mutation.addedNodes.forEach((node) => {
  //         if (!(node instanceof HTMLElement)) return

  //         if (node.classList.contains("resizable")) {
  //           console.log("[New .resizable Detected]:", node)
  //           resizeObserver.observe(node)
  //         }

  //         // Check for nested resizable elements
  //         const nested = node.querySelectorAll?.(".resizable")
  //         nested?.forEach((nestedEl) => {
  //           console.log("[Nested .resizable Detected]:", nestedEl)
  //           resizeObserver.observe(nestedEl)
  //         })
  //       })
  //     })
  //   })

  //   mutationObserver.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //   })

  //   return () => {
  //     resizeObserver.disconnect()
  //     mutationObserver.disconnect()
  //   }
  // }, [])



  return (
    <div className="min-h-screen w-full bg-animated-gradient">
      <ErudaDevTools />
      <AuthProvider>
        {shouldUseLayout ? (
          <>
            <DashboardLayout>{Page}</DashboardLayout>
            <AssistantWidget /> {/* 👈 add here */}
          </>
        ) : (
          Page
        )}
      </AuthProvider>
    </div>
  );
}

