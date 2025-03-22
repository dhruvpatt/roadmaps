// components/QuizContainer.js
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QuestionCard from "./QuestionCard";

const QuizContainer = ({ questions }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (answerObj) => {
    setAnswers((prev) => [...prev, answerObj]);
    setCurrentStep((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {currentStep < questions.length ? (
          <motion.div
            key={currentStep}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuestionCard
              data={questions[currentStep]}
              onAnswer={handleAnswer}
            />
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-10"
          >
            <h2 className="text-2xl font-semibold">You're all set!</h2>
            <p className="mt-2 text-gray-600">Thanks for completing the quiz.</p>

            <pre className="mt-4 text-left text-sm bg-gray-100 p-3 rounded overflow-x-auto max-h-60">
              {JSON.stringify(answers, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizContainer;
