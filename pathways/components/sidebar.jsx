import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, BookOpen, Users, LogOut, Settings } from "lucide-react"; // add Settings icon
import withAuth from "@/lib/with_auth";

const Sidebar = ({user}) => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <aside className="hidden sm:flex flex-col w-64 h-[calc(100vh-4rem)] fixed top-16 left-0 border-r bg-white">
      {/* Sidebar Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Home className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Dashboard</span>
        </Link>
        {/* <Link
          href="/pathways"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <BookOpen className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Pathways</span>
        </Link> */}
        <Link
          href="/classrooms"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Users className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Classrooms</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Settings</span>
        </Link>
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

export default withAuth(Sidebar);