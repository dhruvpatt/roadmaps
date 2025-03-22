const mockRoadmap = {
    id: "roadmap-001",
    title: "Intro to Math",
    owner: "Tina Trent",
    mode: "casual",
    grade: "6-8",
    learningGoals: ["Understand basic algebra", "Solve simple equations"],
    details: "A roadmap to build foundational math skills.",
    chapters: [
        {
            id: "chapter-0",
            name: "Home",
            test: false,
            prereq: [],
            next: ["chapter-1"], // optional, if you want to track chapter-to-chapter
            modules: [
                {
                    id: "module-home",
                    name: "Welcome to Your Pathway",
                    chapter: "chapter-0",
                    status: 100,
                    prereq: [],
                    next: ["module-0", "module-1", "module-2"], // connects to all chapter 1 modules
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Getting Started", "Overview of your journey"]
                }
            ]
        },
        {
            id: "chapter-1",
            name: "Basics",
            test: true,
            prereq: [],
            next: ["chapter-2"],
            modules: [
                {
                    id: "module-0",
                    name: "Math Foundations",
                    chapter: "chapter-1",
                    status: 80,
                    prereq: [],
                    next: ["module-1", "module-2"],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Counting", "Basic symbols"]
                },
                {
                    id: "module-1",
                    name: "Numbers & Operations",
                    chapter: "chapter-1",
                    status: 60,
                    prereq: ["module-0"],
                    next: ["module-3", "module-4", "module-5"],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Recognize integers", "Perform basic operations"]
                },
                {
                    id: "module-2",
                    name: "Intro to Algebra",
                    chapter: "chapter-1",
                    status: 40,
                    prereq: ["module-0"],
                    next: ["module-3", "module-4", "module-5"],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Understand variables", "Simple expressions"]
                }
            ]
        },
        {
            id: "chapter-2",
            name: "Equations",
            test: false,
            prereq: ["chapter-1"],
            next: ["chapter-3"],
            modules: [
                {
                    id: "module-3",
                    name: "Linear Equations",
                    chapter: "chapter-2",
                    status: 30,
                    prereq: ["module-1", "module-2"],
                    next: ["module-6"],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Solve for x", "Use linear formulas"]
                },
                {
                    id: "module-4",
                    name: "Graphs",
                    chapter: "chapter-2",
                    status: 10,
                    prereq: ["module-1", "module-2"],
                    next: ["module-7"],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Graph functions", "Read coordinates"]
                },
                {
                    id: "module-5",
                    name: "Word Problems",
                    chapter: "chapter-2",
                    status: 0,
                    prereq: ["module-1", "module-2"],
                    next: [],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Extract variables", "Translate problems"]
                }
            ]
        },
        {
            id: "chapter-3",
            name: "Advanced Concepts",
            test: true,
            prereq: ["chapter-2"],
            next: [],
            modules: [
                {
                    id: "module-6",
                    name: "Quadratics",
                    chapter: "chapter-3",
                    status: 0,
                    prereq: ["module-3"],
                    next: [],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Understand x²", "Solve quadratic equations"]
                },
                {
                    id: "module-7",
                    name: "Functions",
                    chapter: "chapter-3",
                    status: 0,
                    prereq: ["module-3"],
                    next: [],
                    owner: "student-a",
                    content: [],
                    learningGoals: ["Understand f(x)", "Use function notation"]
                }
            ]
        }
    ]
};

export default mockRoadmap;