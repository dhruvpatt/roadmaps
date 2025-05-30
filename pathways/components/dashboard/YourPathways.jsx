import React, { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";
import HorizontalScroller from "@/components/dashboard/HorizontalScroller";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function YourPathways({updatePathwayCount}) {
  const [user, setUser] = useState(null);
  const [pathways, setPathways] = useState([]);

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) return;
    setUser(usr);

    const fetchPathways = async () => {
      try {
        const res = await fetch(`${backendUrl}/pathways/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: usr.id })
        });

        const data = await res.json();
        setPathways(data.results || data);
        updatePathwayCount?.(data.results.length || data.length); // for pathways

      } catch (error) {
        console.error("Failed to fetch pathways", error);
      }
    };

    fetchPathways();
  }, []);

  return (
    <HorizontalScroller
      title="Your Pathways"
      items={pathways}
      renderItem={(pathway) => (
        <div key={pathway.id} className="w-[280px] flex-shrink-0">
          <DashboardCard
            id={pathway.id}
            title={pathway.title}
            progress={pathway.progress}
            type="pathways"
            user={user}
            published={pathway.published}
          />
        </div>
      )}
    />
  );
}
