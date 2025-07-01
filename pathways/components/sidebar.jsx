import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Users,
  LogOut,
  Settings,
  Building2 as OrgIcon,
  ChevronLeft,
  ChevronRight,
  Landmark
} from "lucide-react";
import withAuth from "@/lib/with_auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils"; // utility to combine classNames
import { useSidebar } from "@/contexts/SidebarContext";


const Sidebar = ({ user }) => {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5 text-gray-600" /> },
    { href: "/classrooms", label: "Classrooms", icon: <Users className="w-5 h-5 text-gray-600" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5 text-gray-600" /> },
  ];

  if (user?.role === "org_admin") {
    navItems.splice(1, 0, {
      href: "/organization",
      label: "Organization",
      icon: <OrgIcon className="w-5 h-5 text-gray-600" />,
    });
  }

  return (
    <aside
      className={cn(
        "hidden sm:flex flex-col h-[calc(100vh-4rem)] fixed top-16 left-0 border-gray-200 rounded shadow-sm bg-white shadow transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="relative border-gray-200 rounded shadow-sm bg-amber-50 px-3 py-2 flex items-center gap-2">
        {/* Icon + Org Name */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-2 mt-1 mb-1 bg-white rounded-3xl shadow">
            <Landmark className="w-5 h-5 text-amber-600" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="org-name"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-semibold text-amber-800 truncate max-w-[150px]"
              >
                {user?.organization?.name || "My Organization"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Button - absolutely positioned to avoid shifting */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 "
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>


      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 pt-2">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-amber-50 transition-all"
          >
            {icon}
            <motion.span
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                scale: collapsed ? 0.95 : 1,
                width: collapsed ? 0 : "auto",
              }}
              className={cn(
                "text-lg text-gray-700 origin-left whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out",
                collapsed ? "max-w-0" : "max-w-full"
              )}
            >
              {label}
            </motion.span>
          </Link>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-amber-50 text-left"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
          <motion.span
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              scale: collapsed ? 0.95 : 1,
              width: collapsed ? 0 : "auto",
            }}
            className={cn(
              "text-lg text-gray-700 origin-left whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out",
              collapsed ? "max-w-0" : "max-w-full"
            )}
          >
            Logout
          </motion.span>
        </button>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-gray-200 rounded shadow-sm bg-gray-50 text-xs text-gray-600">
          <p>
            Empowering personalized and accessible learning experiences — built to
            support teachers and elevate every student.
          </p>
        </div>
      )}
    </aside>
  );
};

export default withAuth(Sidebar);
