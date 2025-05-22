import Back from "@components/Back";
import { ArrowLeft, Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClassroomHeader({ title, subtitle, code, onInviteClick }) {
  const router = useRouter();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Left: Back + Title */}
      <div>
        <Back></Back>

        <h1 className="text-3xl font-bold text-gray-900 mt-2">{title}</h1>
        <p className="text-gray-500 text-lg">{subtitle}</p>
      </div>

      {/* Right: Code + Invite */}
      <div className="flex items-center gap-3">
        {/* Code */}
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium text-sm px-4 py-2 rounded-lg">
          <span>Code: {code}</span>
          <button
            onClick={handleCopy}
            className="text-yellow-700 hover:text-yellow-900"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Invite Button */}
        {/* <button
          onClick={onInviteClick}
          className="flex items-center gap-2 bg-black text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-amber-600 transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Students
        </button> */}
      </div>
    </div>
  );
}
