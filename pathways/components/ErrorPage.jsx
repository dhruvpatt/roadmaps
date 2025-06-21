import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ code, title, message, details, redirectTo = "/dashboard" }) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md w-full">
        <Image
          src={`/${code}.png`}
          alt={`${title} Illustration`}
          width={260}
          height={260}
          className="mx-auto mb-4"
        />

        <h1 className="text-3xl font-bold text-black">{title}</h1>
        <p className="text-gray-700 mt-2">{message}</p>

        {details && (
          <div className="mt-4">
            <button
              className="text-sm text-amber-600 hover:underline"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
            {showDetails && (
              <pre className="text-left bg-gray-100 text-sm text-gray-600 mt-2 p-2 rounded shadow-sm border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                {details}
              </pre>
            )}
          </div>
        )}

        <Button
          variant="default"
          size="lg"
          className="mt-6 bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-300 rounded-2xl border border-orange-800"
          onClick={() => router.push(redirectTo)}
        >
          Back to Dashboard
        </Button>
      </div>
    </main>
  );
}
