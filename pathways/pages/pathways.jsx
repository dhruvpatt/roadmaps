import React from "react"
import PathwayGrid from "@/components/pathways/PathwayGrid";
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"


export default function Pathways() {
  const router = useRouter()
  const [user, setUser] = useState({});


  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem("user"));
    if (!usr) {
      router.push("/login");
    }
    setUser(usr);
  }, []);


  return (
    <PathwayGrid/>
  )
}
