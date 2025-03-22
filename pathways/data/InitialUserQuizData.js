// data/InitialUserQuizData.js

const InitialUserQuizData = [
  {
    id: 1,
    type: "multiple",
    question: "Are you a student or a teacher?",
    options: ["Student", "Teacher"]
  },
  {
    id: "student",
    branch: "Student",
    questions: [
      {
        id: 2,
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
        id: 3,
        type: "text",
        question: "What are some of your hobbies?"
      },
      {
        id: 4,
        type: "multiple",
        question: "Do you find yourself struggling to pay attention in class?",
        options: ["Yes", "Sometimes", "No"]
      },
      {
        id: 5,
        type: "multiple",
        question:
          "Do letters and numbers ever make it hard to understand what you're working on?",
        options: ["Yes", "Sometimes", "No"]
      },
      {
        id: 6,
        type: "multiple",
        question: "Do you prefer videos, text, or interactive content?",
        options: ["Videos", "Text", "Interactive Activities", "No Preference"]
      },
      {
        id: 7,
        type: "text",
        question: "Is there anything else you'd like help with?"
      }
    ]
  },
  {
    id: "teacher",
    branch: "Teacher",
    questions: [
      {
        id: 2,
        type: "multiple",
        question: "What grade(s) do you teach?",
        options: [
          "Elementary",
          "Middle School",
          "High School",
          "College/University",
          "Multiple Grades"
        ]
      },
      {
        id: 3,
        type: "text",
        question: "What topics/subjects do you teach?"
      },
      {
        id: 4,
        type: "text",
        question: "What are your interests or specialties?"
      },
      {
        id: 5,
        type: "multiple",
        question: "Do you work with special needs or neurodivergent students?",
        options: ["Yes", "Sometimes", "No"]
      },
      {
        id: 6,
        type: "multiple",
        question: "What challenges do your students face most often?",
        options: [
          "Attention issues",
          "Reading difficulties",
          "Math struggles",
          "Lack of motivation",
          "Other"
        ]
      },
      {
        id: 7,
        type: "text",
        question:
          "How would you like an AI assistant to support your teaching?"
      }
    ]
  }
];

export default InitialUserQuizData;
