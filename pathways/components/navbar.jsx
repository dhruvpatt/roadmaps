'use client'

import React from "react";
import { Bell, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/useAuth";
import withAuth from "@/lib/with_auth";


const Navbar = ({user}) => {
  const router = useRouter();
  const [role, setRole] = useState("");

  

  useEffect(() => {
    if (user?.role) {
      setRole(user.role.charAt(0).toUpperCase() + user.role.slice(1)); // Capitalize
    }
  }, []);

  const handleClick = () => {
    router.push("../settings");
  };

  const handlelogoClick = () => {
    router.push("../dashboard");
  }


  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between border-b bg-white px-4 shadow">
      {/* Left: Brand */}
      <div className="flex items-center">
        <button type="button" onClick={handlelogoClick}>
          <div className="flex items-center gap-1 text-xl font-bold cursor-pointer">
            <img src="/logo.png" className="h-12 w-auto"></img>
            <span className="text-amber-600 text-2xl">Path</span>
            <span className="text-gray-900 text-2xl">ways</span>
          </div>
        </button>

      </div>


      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        {role && (
          <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded">
            {role}
          </span>
        )}
        {/* Notification Bell */}
        <button
          type="button"
          className="text-gray-600 hover:text-gray-800 focus:outline-none cursor-pointer"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Profile / Avatar (placeholder) */}
        <button
          type="button"
          onClick={handleClick}
          className="relative flex items-center justify-center w-8 h-8 
                     rounded-full bg-amber-100 text-amber-600 font-semibold 
                     hover:bg-amber-200 focus:outline-none cursor-pointer"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

export default withAuth(Navbar);
