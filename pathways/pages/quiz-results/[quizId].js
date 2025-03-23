// pages/quiz-results/[quizId].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import backendUrl from "@/backendUrl";

export default function QuizResultsPage() {
  const router = useRouter();
  const { quizId } = router.query;
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
      <div className="max-w-xl w-full bg-amber-50 border border-amber-200 p-8 rounded-lg shadow-md text-amber-900 space-y-4">
        <h1 className="text-2xl font-bold">Quiz Results</h1>
        <p>
          Score: <span className="font-semibold">{results.score}</span> / {results.total}
        </p>

        {results.failed_questions.length > 0 ? (
          <div className="mt-4 space-y-2">
            <h2 className="text-lg font-medium">Questions you missed:</h2>
            <ul className="list-disc list-inside space-y-1">
              {results.failed_questions.map((q, i) => (
                <li key={i}>
                  <p className="font-medium">{q.question}</p>
                  <p className="text-sm text-gray-700">
                    Correct Answer: {q.solution}
                  </p>
                  <p className="text-sm text-gray-600">
                    Your Answer: {q.answer || "No answer provided"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-green-600 font-medium">Perfect score! 🎉</p>
        )}

        <div className="pt-6">
          <button
            onClick={handleRetry}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition duration-200"
          >
            Retry Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
