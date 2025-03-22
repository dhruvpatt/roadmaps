// StudentStats.jsx
import { BookOpen } from "lucide-react"
import StudentStatCard from "./student-stat-card"
import {useState, useEffect} from 'react'

export default function StudentStats() {
  const [analytics, setAnalytics] = useState({})
  return (
    <div className="grid grid-cols-3 gap-8">
      <StudentStatCard
        title="Pathways in progress"
        value="3"
        Icon={BookOpen}
        message="You are currently enrolled in 3 pathways"
      />
      <StudentStatCard
        title="Completed Pathways"
        value="2"
        Icon={BookOpen}
        message="You have completed 2 pathways"
      />
      <StudentStatCard
        title="Total Pathways"
        value="5"
        Icon={BookOpen}
        message="You have a total of 5 pathways"
      />
    </div>
  )
}
