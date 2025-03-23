// data/InitialUserQuizData.js

const InitialUserQuizData = [
  {
    questions: [
      {
        id: 1,
        type: "dropdown",
        question: "What grade are you in?",
        options: [
          "Kindergarten",
          "1st Grade",
          "2nd Grade",
          "3rd Grade",
          "4th Grade",
          "5th Grade",
          "6th Grade",
          "7th Grade",
          "8th Grade",
          "9th Grade",
          "10th Grade",
          "11th Grade",
          "12th Grade"
        ]
      },
      {
        id: 2,
        type: "text",
        question: "What are some of your hobbies?"
      },
      {
        id: 3,
        type: "multiple",
        question: "Do you find yourself struggling to pay attention in class?",
        options: ["Yes", "Sometimes", "No"]
      },
      {
        id: 4,
        type: "multiple",
        question:
          "Do letters and numbers ever make it hard to understand what you're working on?",
        options: ["Yes", "Sometimes", "No"]
      },
      {
        id: 5,
        type: "multiple",
        question: "Do you prefer videos, text, or interactive content?",
        options: ["Videos", "Text", "Interactive Activities", "No Preference"]
      },
      {
        id: 6,
        type: "text",
        question: "Is there anything else you'd like help with? Feel free to put your personal preferences here and tell us about how you learn best. The more information you give us, the better we can personalize your modules to fit your needs."
      }
    ]
  },
];

export default InitialUserQuizData;
