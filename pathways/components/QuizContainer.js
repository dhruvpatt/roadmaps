// components/QuizContainer.js
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import quizData from "@/data/InitialUserQuizData";
import QuestionCard from "./QuestionCard";

const QuizContainer = () => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (answer) => {
    setAnswers((prev) => [...prev, answer]);
    setCurrent((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {current < quizData.length ? (
          <motion.div
            key={quizData[current].id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuestionCard
              data={quizData[current]}
              onAnswer={handleAnswer}
            />
          </motion.div>
        ) : (
          <div className="text-center mt-10">
            <h2 className="text-2xl font-semibold">Thanks for completing the quiz!</h2>
            <pre className="mt-4 text-left text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(answers, null, 2)}
            </pre>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizContainer;
