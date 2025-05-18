import { useState } from "react";
import { BookOpen, BarChart2, CircleCheck } from "lucide-react";
import PathwayCard from "@/components/pathways/PathwaysCard";
import { useRouter } from "next/navigation";

export default function OverviewComponentStudent() {
  const router = useRouter();

  const mockPathways = [
    { id: 1, title: "Algebra Fundamentals", progress: 75, chapters: 10 },
    { id: 2, title: "Introduction to Programming", progress: 45, chapters: 8 },
    { id: 3, title: "Physics Mechanics", progress: 20, chapters: 12 },
    { id: 4, title: "Chemistry Basics", progress: 60, chapters: 9 },
    { id: 5, title: "Biology Essentials", progress: 50, chapters: 7 },
  ];

  const totalPathways = 0;
  const averageProgress =0 ;
  const averageGrade = "0%"; // Replace with real logic if needed

  return (
    <div className="space-y-10">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Pathways */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-700 mr-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pathways</p>
            <p className="text-xl font-bold text-gray-900">{totalPathways}</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="p-3 rounded-full bg-blue-100 text-blue-700 mr-4">
              <CircleCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Overall Progress</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(averageProgress)}%</p>
            </div>
          </div>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        {/* Average Grade */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-amber-100 text-amber-700 mr-4">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Average Grade</p>
            <p className="text-xl font-bold text-gray-900">{averageGrade}</p>
          </div>
        </div>
      </div>

      {/* Pathways Grid */}
      <h1 className="text-2xl text-black font-bold ml-4">Your Pathways</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPathways.map((pathway) => (
          <PathwayCard
            key={pathway.id}
            title={pathway.title}
            progress={pathway.progress}
            chapters={pathway.chapters}
            onViewClick={() => router.push(`/pathways/${pathway.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
