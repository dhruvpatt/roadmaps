import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import AssistantWidget from "@/components/AssistantWidget";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

function LayoutContent({ children }) {
  const { collapsed } = useSidebar();

  return (
    <div className={`pt-16 ${collapsed ? "pl-0" : "pl-64"} min-h-screen bg-gray-100 transition-all duration-300 ease-in-out`}>
      {children}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <Navbar />
      <Sidebar />
      <AssistantWidget />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
