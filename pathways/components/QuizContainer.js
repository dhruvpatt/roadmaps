// components/QuizContainer.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import QuestionCard from "./QuestionCard";
import backendUrl from "@/backendUrl";

const QuizContainer = ({ questions, quizId, moduleId }) => {
  const router = useRouter();
  const [questionList, setQuestionList] = useState(questions);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isLastStep = currentStep === questionList.length - 1;

  const handleAnswer = (answerObj) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentStep] = answerObj;
    setAnswers(updatedAnswers);

    if (isLastStep) {
      handleSubmit(updatedAnswers);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (finalAnswers) => {
    setSubmitting(true);

    if (moduleId && quizId) {
      const formattedAnswers = {};
      finalAnswers.forEach((ans) => {
        formattedAnswers[ans.id] = ans.answer;
      });
      console.log(formattedAnswers)
      try {
        const res = await fetch(`${backendUrl}/api/evaluate-quiz/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quiz_id: quizId,
            answers: formattedAnswers,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          router.push({
            pathname: `/quiz-results/${quizId}`,
            query: { moduleId },
          });
        } else {
          console.error("Evaluation failed:", data.error);
        }
      } catch (err) {
        console.error("Submission error:", err);
      }
    }
    else {
      router.push("/dashboard")
    }


  };

  const progress = ((currentStep + 1) / questionList.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 h-full max-h-4xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white p-8 rounded-lg shadow-md text-amber-900 space-y-6 w-full">
            <QuestionCard
              data={questionList[currentStep]}
              onAnswer={handleAnswer}
              defaultAnswer={answers[currentStep]?.answer}
              showNext={!isLastStep && questionList[currentStep]?.type === "text"}
            />

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-sm font-medium text-amber-700 hover:text-amber-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <span className="text-sm text-gray-500">
                Question {currentStep + 1} of {questionList.length}
              </span>
            </div>

            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {submitting && (
        <p className="mt-4 text-center text-sm text-gray-600">
          Submitting answers...
        </p>
      )}
    </div>
  );
};

export default QuizContainer;
