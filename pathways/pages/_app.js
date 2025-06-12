import DashboardLayout from "../components/DashboardLayout";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/useAuth";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const noLayoutRoutes = ["/", "/login", "/signup"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);

  const Page = <Component {...pageProps} />;

  return (
    <div className="min-h-screen w-full bg-animated-gradient">
      <AuthProvider>
        {shouldUseLayout ? <DashboardLayout>{Page}</DashboardLayout> : Page}
      </AuthProvider>
    </div>
  );
}
