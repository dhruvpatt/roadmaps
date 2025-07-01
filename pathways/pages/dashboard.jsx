import { useEffect, useState } from "react";

import DashboardStats from "@/components/dashboard/DashboardStats";
import ClassroomList from "@/components/classrooms/ClassroomList";
import withAuth from "@/lib/with_auth";
import QuickActions from "@/components/dashboard/DashboardQuickActions";
import RecentActivity from "@/components/dashboard/DashboardRecentActivity";
import CreateClassroomModal from "@components/modals/CreateClassroomModal";

const Dashboard = ({ user }) => {
  const [classroomCount, setClassroomCount] = useState(0);
  const [randomImage, setRandomImage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);


  useEffect(() => {
    const images = ["writing.png", "thinking.png", "dancing.png", "cheering.png"];
    const selected = images[Math.floor(Math.random() * images.length)];
    setRandomImage(`/` + selected);
  }, []);

  return (
    <>
      <div className="max-w-6xl w-full mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center text-center align justify-between mt-5 mb-6">
          <div>
            <h1 className="text-black text-3xl md:text-4xl font-bold text-center md:text-left">
              Welcome Back {user?.first_name}
            </h1>
            <p className="text-gray-600 text-lg md:text-2xl text-center md:text-left">
              {user?.role === "student" || user?.role === "parent"
                ? "Continue your learning journey"
               : "Continue your teaching journey"}
            </p>
          </div>

          {randomImage && (
            <img
              src={randomImage}
              alt="Welcome visual"
              className="w-32 h-32 mt-4 mr-10 md:mt-0 md:ml-6 object-contain"
            />
          )}
        </div>

        {classroomCount > 0 && (
          <>
            <DashboardStats user={user} classroomCount={classroomCount} />
            <QuickActions user={user} onCreateClassroomClick={() => setShowCreateModal(true)} />
            <RecentActivity />
          </>
        )}

        <ClassroomList
          user={user}
          updateClassroomCount={setClassroomCount}
        />
      </div>

      {showCreateModal && (
        <CreateClassroomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={() => {
            setShowCreateModal(false);
          }}
          user={user}
        />
      )}

    </>
  );
};

export default withAuth(Dashboard);
