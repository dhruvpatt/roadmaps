import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="pt-16 pl-64 min-h-screen bg-gray-100">
        <main className="min-h-screen w-full p-6 bg-animated-gradient">
          {children}
        </main>
      </div>
    </>
  );
}
