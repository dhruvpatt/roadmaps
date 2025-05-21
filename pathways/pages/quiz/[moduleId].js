// pages/quiz/[moduleId].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import QuizContainer from "@/components/QuizContainer";
import backendUrl from "@/backendUrl";
import { createServerSearchParamsForServerPage } from "next/dist/server/request/search-params";

export default function QuizPage() {
  const router = useRouter();
  const { moduleId, mandatoryQuiz } = router.query;
  console.log("Mandatory Quiz:", mandatoryQuiz, moduleId);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!moduleId) return;

    const generateQuiz = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) {
          setError("User not found in local storage.");
          return;
        }

        const res = await fetch(`${backendUrl}/api/gen-quiz/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            module_id: moduleId,
            user_id: user.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to generate quiz.");
          return;
        }

        setQuiz(data.quiz);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        setError("Something went wrong while loading the quiz.");
      } finally {
        setLoading(false);
      }
    };

    const fetchQuiz = async () => {
      console.log("Fetching quiz data...");
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/quizzes/${moduleId}/`);
        if (!res.ok){
          const data = await res.json();
          setError(data.error || "Failed to fetch quiz.");
          return;
        }
        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Fetched quiz data:", data);
        setQuiz(data);
        setLoading(false);
      } catch (err){
        console.error("Error fetching quiz:", err);
        setError("Failed to fetch quiz data.");
      }
    }
    if (mandatoryQuiz){
      fetchQuiz();  
    } else{
      generateQuiz();
    }
    
  }, [moduleId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-900 text-sm">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-100 px-4">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      {quiz?.questions ? (
        <QuizContainer questions={quiz.questions} quizId={quiz.id} moduleId={moduleId} />
      ) : (
        <p className="text-amber-900">No quiz questions found.</p>
      )}
    </div>
  );
}
