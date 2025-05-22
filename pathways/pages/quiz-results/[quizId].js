// pages/quiz-results/[quizId].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";
import Back from "@components/Back";

export default function QuizResultsPage() {
  const router = useRouter();
  const { quizId, moduleId } = router.query;
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchResults = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/get-quiz-results/${quizId}/`);
        const data = await res.json();
        if (res.ok) setResults(data);
        else console.error("Failed to fetch results");
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchResults();
  }, [quizId]);

  const handleRetry = () => {
    router.push(`/quiz/${quizId}`);
  };

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-amber-800">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white px-6 py-12">
      <div className="w-full max-w-6xl bg-white border border-amber-200 p-10 rounded-2xl shadow-xl space-y-10 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">🎓 Quiz Results</h1>
          <p className="text-xl text-gray-700">
            You scored{" "}
            <span className="text-3xl font-bold text-amber-700">{results.score}</span> out of{" "}
            <span className="font-semibold">{results.total}</span>
          </p>
        </div>
  
        {/* Missed Questions */}
        {results.failed_questions.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold text-amber-800 border-b pb-2 mb-4">
              Questions you missed:
            </h2>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.failed_questions.map((q, i) => (
                <div
                  key={i}
                  className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <p className="font-semibold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                  <p className="text-sm text-green-700 mb-1">
                    ✅ Correct Answer: <span className="font-medium">{q.solution}</span>
                  </p>
                  <p className="text-sm text-red-600">
                    ❌ Your Answer: <span className="font-medium">{q.answer || "No answer provided"}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-green-600 text-xl font-semibold">
            Perfect score! 🎉 You're a rockstar!
          </div>
        )}
  
        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4 flex-wrap">
          <button
            onClick={handleRetry}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium shadow hover:shadow-md transition-all"
          >
            Retry Quiz
          </button>
          <Back></Back>
        </div>
      </div>
    </div>
  );
  
  
  
}
