import React, { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";
import HorizontalScroller from "@/components/dashboard/HorizontalScroller";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Image from "next/image";

export default function YourClassrooms({ updateClassroomCount }) {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false); // NEW

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) return;
    setUser(usr);

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/classrooms?user_id=${usr.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        setClassrooms(data.results || data);
        updateClassroomCount?.(data.results.length || data.length);
      } catch (error) {
        console.error("Failed to fetch classrooms", error);
      }
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="space-y-8">
      {classrooms.length === 0 ? (
        <div className="text-center mt-8 relative flex flex-col items-center">
          <div
            className="relative group"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Image
              src="/confused.png"
              alt="No Classrooms"
              width={160}
              height={160}
              className="mx-auto cursor-pointer"
            />
            {showTooltip && (
              <div className="absolute top-0 mt-2 w-max bg-white text-sm text-gray-700 border border-gray-200 rounded shadow-md px-4 py-2 z-10">
                To create a classroom, press the <span className="font-bold">+</span> icon!
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-4">No classrooms yet. Let's get started!</p>
        </div>
      ) : (
        <HorizontalScroller
          title="Your Classrooms"
          items={classrooms}
          renderItem={(classroom) => (
            <div key={classroom.id} className="w-[280px] flex-shrink-0">
              <DashboardCard
                id={classroom.id}
                title={classroom.name}
                subtitle={`Code: ${classroom.join_id}`}
                type="classroom"
                user={user}
                buttonText="View"
              />
            </div>
          )}
        />
      )}
    </div>
  );
}
