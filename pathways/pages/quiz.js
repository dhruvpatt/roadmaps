// pages/quiz.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import QuizContainer from "../components/QuizContainer";
import InitialUserQuizData from "../data/InitialUserQuizData";

export default function QuizPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState(null);

    useEffect(() => {
        const { id } = router.query;

        if (!id) return;

        if (id === "-1") {
            // Load default onboarding questionnaire
            const defaultQuiz = [InitialUserQuizData[0]]; // start with first question
            setQuestions(defaultQuiz);
        } else {
            setQuestions(null) //TODO: fetch from db
        }
    }, [router.query]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
            {questions ? (
                <QuizContainer questions={questions} />
            ) : (
                <p className="text-center text-amber-900">Loading quiz...</p>
            )}
        </div>
    );
}
