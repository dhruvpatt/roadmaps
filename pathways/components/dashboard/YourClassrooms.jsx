import React, { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";
import HorizontalScroller from "@/components/dashboard/HorizontalScroller";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function YourClassrooms() {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) return;
    setUser(usr);

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${backendUrl}/get-user-classrooms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: usr.id })
        });

        const data = await res.json();
        setClassrooms(data.results || data);
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
