import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, BookOpen, Users, LogOut } from "lucide-react";

export default function Sidebar() {

  // const [user, setUser] = useState(null);

  // useEffect(() => {
  //   const usr = JSON.parse(localStorage.getItem("user"));
  //   setUser(usr);
  // }, []);
  const router = useRouter();
  const handleLogout = () => {
    // Clear any stored user/session data
    localStorage.removeItem("user");
    // Redirect to login page
    router.push("/");
  };

  return (
    <aside className="hidden sm:flex flex-col w-64 border-r bg-white">
      {/* Sidebar Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Home className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Dashboard</span>
        </Link>
        <Link
          href="/pathways"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <BookOpen className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Pathways</span>
        </Link>
        <Link
          href="/classrooms"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Users className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Classrooms</span>
        </Link>
        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full p-2 rounded-md hover:bg-amber-50 text-left"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Logout</span>
        </button>
      </nav>

      {/* Mission Statement */}
      <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
        <p>
          Empowering personalized and accessible learning experiences — built to
          support teachers and elevate every student, especially those with
          learning differences.

        </p>
      </div>
    </aside>
  );
}
