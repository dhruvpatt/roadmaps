import { useRouter } from "next/router";

export default function BoardDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">Board Post #{id}</h1>
      <p className="mt-2 text-gray-600">Details coming soon...</p>
    </div>
  );
}
