// File: pages/_app.tsx or pages/_app.jsx

import DashboardLayout from "../components/DashboardLayout";
import "../styles/globals.css";

// Import Toastify styles
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/useAuth";
import ErudaDevTools from "@components/devtools";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/", "/login", "/signup"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);

  const Page = <Component {...pageProps} />;

  return (
    <div className="min-h-screen w-full bg-animated-gradient">
      <ErudaDevTools />
      <AuthProvider>
        {shouldUseLayout ? <DashboardLayout>{Page}</DashboardLayout> : Page}
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      </AuthProvider>
    </div>
  );
}
