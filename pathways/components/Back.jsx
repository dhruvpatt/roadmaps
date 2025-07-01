import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";


export default function Back() {
    const router = useRouter();

    return (
        <button
            onClick={() => {
                router.push("/dashboard");
            }}
            className="flex items-center mb-5 text-gray-700 hover:text-gray-900 focus:outline-none"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
        </button>
    );
}

