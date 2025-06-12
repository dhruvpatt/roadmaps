import React, { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";
import HorizontalScroller from "@/components/dashboard/HorizontalScroller";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { fetchCurrentUser } from "@/lib/auth";
import { getCookie } from "@/lib/csrf";
export default function YourClassrooms({ updateClassroomCount }) {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const usr = fetchCurrentUser();
    console.log("Current user:", usr);
    setUser(usr);
    if (!usr) {
      console.error("User not found");
      // window.location.href = "/login"; // Redirect to login if user is not found
      return;
    }

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/classroom`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          credentials: "include",
        });

        const data = await res.json();
        console.log("Fetched classrooms:", data);
        setClassrooms(data.results || data);
        updateClassroomCount?.(data.results.length || data.length); // for classrooms
      } catch (error) {
        console.error("Failed to fetch classrooms", error);
      }
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="space-y-8">
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
    </div>
  );
}
