import React from "react";
import Link from "next/link";
import { Home, BookOpen, Users, BarChart2, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen border-r bg-white">
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
          <span className="text-gray-700">My Pathways</span>
        </Link>
        <Link
          href="/classrooms"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Users className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Classrooms</span>
        </Link>
        <Link
          href="/progress"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <BarChart2 className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Progress</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-50"
        >
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Settings</span>
        </Link>
      </nav>
    </aside>
  );
}
