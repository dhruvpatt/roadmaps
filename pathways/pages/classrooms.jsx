import withAuth from "@/lib/with_auth";
import ClassroomList from "@/components/classrooms/ClassroomList";

const Classrooms = ({ user }) => {
  return (
    <div className="flex-1 p-6 text-gray-800">
      <ClassroomList user={user} />
    </div>
  );
};

export default withAuth(Classrooms);
