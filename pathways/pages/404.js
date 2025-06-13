// pages/404.tsx
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-4">
        <Image src="/404.png" alt="Page Not Found" width={260} height={260} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-black">Page Not Found</h1>
        <p className="text-gray-700 mt-2">The page you’re looking for doesn’t exist.</p>

        <Button
          variant="default"
          size="lg"
          className="mt-6 bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-300 rounded-2xl border border-orange-800"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </main>
  );
}
