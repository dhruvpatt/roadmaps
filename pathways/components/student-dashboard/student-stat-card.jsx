// student-stat-card.jsx
export default function StudentStatCard({ title, value, Icon, message }) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex flex-col justify-between">
        <div>
          <p className="text-black text-lg font-semibold">{title}</p>
          <div className="flex flex-row justify-between mt-2 text-amber-600">
            <p className="text-black text-3xl font-black">{value}</p>
            <Icon />
          </div>
        </div>
        <p className="mt-4 text-gray-800">{message}</p>
      </div>
    )
  }
  