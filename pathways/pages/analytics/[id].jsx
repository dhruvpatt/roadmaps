import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RecommendedActions from "@components/analytics/RecommendedActions";
import Back from "@components/Back";

// Mock function to simulate fetching
const fetchStudentAnalytics = (id) => {
    return {
        id,
        name: "Alice Johnson",
        avgGrade: 92,
        totalTime: 45,
        assignmentsCompleted: 10,
        engagementScore: 98,
        weeklyData: [
            {
                week: 1,
                recommendedAction: true,
                summary: {
                    avgGrade: 89,
                    timeSpent: 10,
                    completedAssignments: 3,
                },
                assessments: {
                    assignments: [
                        {
                            title: "Assignment 1",
                            score: 85,
                            feedback: "Good job, but revise Q2 and Q4.",
                            submission: "assignment1_alice.pdf",
                            issues: ["Missed Q2", "Incorrect explanation on Q4"],
                            questions: [
                                {
                                    question: "What is the powerhouse of the cell?",
                                    studentAnswer: "Chloroplast",
                                    correctAnswer: "Mitochondria",
                                    result: "Incorrect",
                                },
                                {
                                    question: "Define osmosis.",
                                    studentAnswer: "Movement of water across a membrane",
                                    correctAnswer:
                                        "Movement of water through a semipermeable membrane from high to low concentration",
                                    result: "Partial",
                                },
                            ],
                        },
                    ],
                    tests: [],
                    homework: [],
                    checkIn: {
                        conversation: [
                            {
                                role: "teacher",
                                message: "How was your first week?",
                            },
                            {
                                role: "student",
                                message: "Pretty good! Struggled with some of the biology terms.",
                            },
                            {
                                role: "teacher",
                                message: "Got it. We’ll review those next session.",
                            },
                        ],
                    },
                },
            },
            {
                week: 2,
                summary: {
                    avgGrade: 94,
                    timeSpent: 12,
                    completedAssignments: 4,
                },
                assessments: {
                    assignments: [
                        {
                            title: "Assignment 2",
                            score: 93,
                            feedback: "Well done!",
                            submission: "assignment2_alice.pdf",
                            issues: [],
                            questions: [
                                {
                                    question: "Explain photosynthesis.",
                                    studentAnswer: "Conversion of light energy into chemical energy.",
                                    correctAnswer: "Conversion of light energy into chemical energy in chloroplasts",
                                    result: "Correct",
                                },
                            ],
                        },
                    ],
                    tests: [
                        {
                            title: "Quiz 1",
                            score: 90,
                            feedback: "Strong performance",
                            submission: "quiz1_alice.pdf",
                            issues: [],
                            questions: [
                                {
                                    question: "What is ATP?",
                                    studentAnswer: "A molecule that carries energy",
                                    correctAnswer: "Adenosine triphosphate, a molecule that carries energy",
                                    result: "Correct",
                                },
                            ],
                        },
                    ],
                    homework: [],
                    checkIn: {
                        conversation: [
                            {
                                role: "teacher",
                                message: "Did the second week feel easier?",
                            },
                            {
                                role: "student",
                                message: "Yes! I liked the photosynthesis lesson.",
                            },
                        ],
                    },
                },
            },
        ],
    };
};


export default function StudentAnalyticsPage() {
    const router = useRouter();
    const { id } = router.query; const [data, setData] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const analytics = fetchStudentAnalytics(id);
        setData(analytics);
    }, [id]);



    const toggleExpand = (week) => {
        setExpanded((prev) => ({ ...prev, [week]: !prev[week] }));
    };

    if (!data) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-full mx-auto py-6 px-6">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <Back></Back>

                <h2 className="text-2xl font-bold text-gray-900">{data.name}'s Analytics</h2>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-xl font-bold text-green-600">{data.avgGrade}%</div>
                            <div className="text-sm text-gray-700">Avg Grade</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-xl font-bold text-blue-600">{data.totalTime}h</div>
                            <div className="text-sm text-gray-700">Total Time</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-xl font-bold text-purple-600">{data.assignmentsCompleted}</div>
                            <div className="text-sm text-gray-700">Assignments</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-xl font-bold text-orange-600">{data.engagementScore}%</div>
                            <div className="text-sm text-gray-700">Engagement</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recommended Actions */}
                <RecommendedActions title="Overall Recommended Actions" />


                {/* Weekly Breakdown */}
                {data.weeklyData.map((weekData, i) => (
                    <Card key={i} className="rounded-xl border border-gray-200">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => toggleExpand(weekData.week)}>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">Week {weekData.week}</h4>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                                            Avg Grade: {weekData.summary.avgGrade}%
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                            Time: {weekData.summary.timeSpent}h
                                        </span>
                                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                                            Completed: {weekData.summary.completedAssignments}
                                        </span>
                                        {weekData.recommendedAction && (
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                                                Recommended Action
                                            </span>
                                        )}

                                    </div>
                                </div>
                                {expanded[weekData.week] ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                            </div>

                            {expanded[weekData.week] && (
                                <div className="space-y-6">
                                    {weekData.recommendedAction && <RecommendedActions title="Week Recommended Actions" />}

                                    {/* Assignments */}
                                    <div>
                                        <h5 className="text-md font-semibold text-gray-800 mb-3">Assignments</h5>
                                        {weekData.assessments.assignments.length > 0 ? (
                                            <div className="grid gap-3">
                                                {weekData.assessments.assignments.map((a, idx) => (
                                                    <Card key={idx} className="p-4 shadow-sm border border-gray-200 rounded-xl cursor-pointer" onClick={() => setSelectedItem(a)}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm font-medium text-gray-800">{a.title}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 bg-gray-200 rounded-full overflow-hidden h-2">
                                                                    <div
                                                                        className={`h-full ${a.score >= 90 ? 'bg-green-500' : a.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                        style={{ width: `${a.score}%` }}
                                                                    ></div>
                                                                </div>
                                                                <Badge
                                                                    className={`text-xs px-2 py-1 rounded-full ${a.score >= 90 ? 'bg-green-100 text-green-700' : a.score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                                        }`}
                                                                >
                                                                    {a.score}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-600">{a.feedback}</div>
                                                        <div className="mt-1 text-xs text-gray-500">Submission: {a.submission}</div>
                                                        <div className="mt-1 text-xs text-gray-500">Issues: {a.issues.join(', ')}</div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400">None</div>
                                        )}
                                    </div>

                                    {/* Tests */}
                                    <div>
                                        <h5 className="text-md font-semibold text-gray-800 mb-3">Tests</h5>
                                        {weekData.assessments.tests.length > 0 ? (
                                            <div className="grid gap-3">
                                                {weekData.assessments.tests.map((t, idx) => (
                                                    <Card key={idx} className="p-4 shadow-sm border border-gray-200 rounded-xl cursor-pointer" onClick={() => setSelectedItem(t)}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm font-medium text-gray-800">{t.title}</div>
                                                            <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{t.score}%</Badge>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-600">{t.feedback}</div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400">None</div>
                                        )}
                                    </div>

                                    {/* Homework */}
                                    <div>
                                        <h5 className="text-md font-semibold text-gray-800 mb-3">Homework</h5>
                                        <div className="text-sm text-gray-400">None</div>
                                    </div>

                                    {/* Check-in */}
                                    <div>
                                        <h5 className="text-md font-semibold text-gray-800 mb-2">Check-in</h5>
                                        <Card className="p-3 bg-blue-50 border-blue-100 border rounded-lg text-sm text-blue-900 mb-2 cursor-pointer flex justify-between items-center" onClick={() => setSelectedItem(weekData.assessments.checkIn)}>
                                            <p className="italic truncate flex-1">
                                                {weekData.assessments.checkIn.conversation?.[1]?.message || 'No conversation found'}
                                            </p>
                                            <span className="ml-4 text-xs text-blue-700 font-medium">Click to expand</span>
                                        </Card>

                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* Dialog for Details */}
                <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                    <DialogContent className="max-w-2xl bg-white text-black rounded-lg shadow-lg p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold mb-2">{selectedItem?.title || 'Details'}</DialogTitle>
                        </DialogHeader>

                        {/* Conversation View */}
                        {selectedItem?.conversation ? (
                            <div className="space-y-4 text-sm">
                                {selectedItem.conversation.map((msg, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg ${msg.role === 'teacher' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-900'}`}>
                                        <strong className="block mb-1 capitalize">{msg.role}</strong>
                                        <p>{msg.message}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-800 mb-6">
                                    <div>
                                        <div className="font-semibold">Score</div>
                                        <div>{selectedItem?.score}%</div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Feedback</div>
                                        <div>{selectedItem?.feedback}</div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Submission</div>
                                        <div>{selectedItem?.submission}</div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Issues</div>
                                        <div>{selectedItem?.issues?.join(', ')}</div>
                                    </div>
                                </div>

                                {selectedItem?.questions && (
                                    <div>
                                        <h4 className="text-lg font-semibold mb-4">Question Breakdown</h4>
                                        <div className="space-y-4">
                                            {selectedItem.questions.map((q, i) => (
                                                <div key={i} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="font-medium mb-1">Q{i + 1}: {q.question}</div>
                                                    <div className="text-sm"><span className="font-semibold">Student Answer:</span> {q.studentAnswer}</div>
                                                    <div className="text-sm"><span className="font-semibold">Correct Answer:</span> {q.correctAnswer}</div>
                                                    <div className={`text-sm font-semibold mt-1 inline-block px-2 py-1 rounded-full ${q.result === 'Correct' ? 'bg-green-100 text-green-800' : q.result === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {q.result}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );


}
