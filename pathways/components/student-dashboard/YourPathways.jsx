import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CourseCard from "./pathway-card";
import { useRouter } from "next/navigation";
import backendUrl from "@/backendUrl";

export default function YourPathways() {
  const scrollRef = useRef(null);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);

  const scrollAmount = 400;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
      return;
    }
    setUser(usr);

    const fetchRoadmaps = async () => {
      try {
        const res = await fetch(`${backendUrl}/get-user-roadmaps/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: usr.id }),
        });
        const data = await res.json();
        console.log("roadmaps", data);
        setCourses(data || []);
      } catch (error) {
        console.error("Failed to fetch roadmaps:", error);
      }
    };

    fetchRoadmaps();
  }, []);

  return (
    <div className="mx-auto max-w-screen-6xl w-full px-4">
      <div className="flex items-center justify-between mt-6 md:mt-8">
        {user && user.role === "student" ? (
          <h2 className="text-black text-2xl md:text-3xl font-black">Your Pathways</h2>
        ) : (
          <h2 className="text-black text-2xl md:text-3xl font-black">Your Pathways</h2>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-500 italic mt-4">You don't have any roadmaps yet.</p>
      ) : (
        <div className="relative mt-4">
          {/* Left Chevron */}
          <button
            onClick={scrollLeft}
            className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10
              bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
          >
            <ChevronLeft className="text-black" />
          </button>

          {/* Scrollable course row */}
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto scroll-smooth"
          >
            <div className="flex space-x-4 pb-2">


              {courses.map((course) => (
                <div key={course.id} className="w-[280px] flex-shrink-0">
                  <CourseCard {...course} user={user} />
                </div>
              ))}
              
            </div>
          </div>

          {/* Right Chevron */}
          <button
            onClick={scrollRight}
            className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10
              bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none"
          >
            <ChevronRight className="text-black" />
          </button>
        </div>
      )}
    </div>
  );
}
