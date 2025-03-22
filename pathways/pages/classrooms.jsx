import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"

const Classrooms = () => {
   return (
        <div className="flex flex-col bg-gray-100 min-h-screen">
                   <Navbar />
                   <div className="flex flex-1">
                       <Sidebar />
                       <div className="flex-1 p-16">
                           <h1 className="text-black text-4xl font-bold">Welcome Back, Teacher</h1>
                           <p className="text-gray-600 text-2xl mb-8">Continue your teaching journey</p>
                       </div>
                       
                   </div>
       
                   
               </div>
   )
}

export default Classrooms;