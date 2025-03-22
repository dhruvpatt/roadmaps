import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import QuestionCard from "./QuestionCard";
import InitialUserQuizData from "../data/InitialUserQuizData";

const QuizContainer = ({ questions }) => {
  const router = useRouter();
  const [questionList, setQuestionList] = useState(questions);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const isLastStep = currentStep === questionList.length - 1;

  const handleAnswer = (answerObj) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentStep] = answerObj;
    setAnswers(updatedAnswers);
  
    // If this is the first question ("Student or Teacher?")
    if (currentStep === 0 && answerObj.answer) {
      const branch = InitialUserQuizData.find(
        (q) => q.branch === answerObj.answer
      );
  
      if (branch) {
        // Combine the initial question and the selected branch
        const updatedQuestionList = [InitialUserQuizData[0], ...branch.questions];
        setQuestionList(updatedQuestionList);
  
        // ✅ Move to next question immediately after branching
        setCurrentStep(1);
  
        return;
      }
    }
  
    // ✅ On final question, trigger completion
    if (currentStep + 1 === questionList.length) {
      setCurrentStep((prev) => prev + 1);
      setQuizComplete(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (quizComplete) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [quizComplete, router]);

  const progress = ((currentStep + 1) / questionList.length) * 100;

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {currentStep < questionList.length ? (
          <motion.div
            key={currentStep}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white p-8 rounded-lg shadow-md text-amber-900 space-y-6">
              <QuestionCard
                data={questionList[currentStep]}
                onAnswer={handleAnswer}
                defaultAnswer={answers[currentStep]?.answer}
                showNext={!isLastStep && questionList[currentStep].type === "text"}
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
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-lg shadow-md text-center text-amber-900"
          >
            <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
            <p className="text-lg text-gray-700 mb-6">
              Thanks for completing the quiz.
              <br />
              Redirecting you to your dashboard...
            </p>

            <div className="text-left bg-amber-50 p-4 rounded-md shadow-inner max-h-60 overflow-y-auto text-sm text-amber-800">
              <pre>{JSON.stringify(answers, null, 2)}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizContainer;
