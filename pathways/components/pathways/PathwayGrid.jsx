import React from "react"

import PathwayCard from "@/components/pathways/PathwaysCard"
import { useRouter } from "next/navigation"
import CreatePathwayModal from "@/components/modals/CreatePathwayModal"
import { useState, useEffect } from "react"
import backendUrl from "@/backendUrl"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pathways({ title = "Your Pathways", classroom, updatePathwaysNumber }) {
    const router = useRouter()
    const [showPathwayModal, setShowPathwayModal] = useState(false);
    const [user, setUser] = useState({});
    const [pathways, setPathways] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedPathway, setSelectedPathway] = useState(null);


    const handleEdit = (pathway) => {
        setSelectedPathway(pathway);
        setShowPathwayModal(true);
    };

    const handleDelete = async (pathway) => {
        if (!window.confirm(`Are you sure you want to delete "${pathway.title}"?`)) return;

        try {
            const res = await fetch(`${backendUrl}/api/pathways/${pathway.id}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            fetchPathways(user, page, searchQuery); // Refresh the list
        } catch (err) {
            console.error("Error deleting pathway", err);
            alert("Failed to delete pathway. Try again.");
        }
    };


    useEffect(() => {
        const usr = JSON.parse(localStorage.getItem("user"));
        if (!usr) {
            router.push("/login");
        }
        setUser(usr);

        const savedQuery = localStorage.getItem("searchQuery") || "";
        setSearchQuery(savedQuery);
        fetchPathways(usr, 1, savedQuery);
    }, []);

    const fetchPathways = async (usr, pageNum = 1, query = "") => {
        console.log(classroom)
        if (pageNum < 1 || pageNum > totalPages) return;
        setLoading(true);
        try {
            const body = {
                user_id: usr.id,
            };
            if (classroom) {
                body.classroom_id = classroom.id;
            }

            const res = await fetch(`${backendUrl}/api/pathways?user_id=${usr.id}&page=${pageNum}&search=${query}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            console.log("User", usr)
            setPathways(data.results);
            setTotalPages(Math.max(1, Math.ceil(data.count / 15)));
            setPage(pageNum);
            console.log(data.count)
            updatePathwaysNumber?.(data.count);
        } catch (err) {
            console.error("Failed to fetch pathways", err);
        } finally {
            setLoading(false);
        }
    };


    const createPathway = async (data) => {
        try {
            const res = await fetch(`${backendUrl}/generate-pathway/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const ret = await res.json();
            console.log("ret", ret);
            fetchPathways(user, 1, searchQuery);
            return ret?.pathway;
        } catch (error) {
            console.error("Failed to create pathway", error);
        }
    }

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        localStorage.setItem("searchQuery", query);
        fetchPathways(user, 1, query);
    }

    return (
        <div className="flex-1 p-6 text-gray-800">
            <h1 className="text-black text-3xl md:text-4xl font-bold mb-2">
                {title}
            </h1>
            <p className="text-gray-600 text-lg md:text-2xl mb-8">
                View and manage your personalized learning pathways
            </p>

            <input
                type="text"
                placeholder="Search pathways..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.role == "teacher" || classroom?.id == null ? (<button
                    onClick={() => setShowPathwayModal(true)}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:bg-amber-100 cursor-pointer transition"
                >
                    <p className="text-sm md:text-base font-medium text-gray-600">
                        + Create a new learning pathway
                    </p>
                </button>) : (<></>)}


                {loading ? (
                    <div className="col-span-full text-center py-10">Loading...</div>
                ) : pathways.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 italic py-10">No pathways found.</div>
                ) : (
                    pathways.map((pathway) => (
                        <PathwayCard
                            key={pathway.id}
                            title={pathway.title}
                            progress={pathway.progress}
                            chapters={Array.isArray(pathway.chapters) ? pathway.chapters.length : 0}
                            onViewClick={() => router.push(`/pathways/${pathway.id}`)}
                            user={user}
                            published={pathway.published}
                            pathwayId={pathway.id}
                            onEdit={() => handleEdit(pathway)}
                            onDelete={() => handleDelete(pathway)}
                        />
                    ))
                )}
            </div>

            <div className="mt-6 flex justify-center space-x-4 text-gray-800">
                <button
                    onClick={() => fetchPathways(user, page - 1, searchQuery)}
                    disabled={page <= 1}
                    className="p-2 rounded bg-gray-200 disabled:opacity-50"
                >
                    <ChevronLeft />
                </button>
                <span className="self-center">Page {page} of {totalPages}</span>
                <button
                    onClick={() => fetchPathways(user, page + 1, searchQuery)}
                    disabled={page >= totalPages}
                    className="p-2 rounded bg-gray-200 disabled:opacity-50"
                >
                    <ChevronRight />
                </button>
            </div>

            <CreatePathwayModal
                isOpen={showPathwayModal }
                onClose={() => {
                    setShowPathwayModal(false);
                    setSelectedPathway(null);
                }}
                onUpdate={async (id, data) => {
                    const res = await fetch(`${backendUrl}/api/pathways/${id}/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) throw new Error("Update failed");
                    const updated = await res.json();
                    fetchPathways(user, page, searchQuery);
                    return updated.id;
                }}
                onCreate={async (data) => {
                    const pathway = await createPathway(data);
                    if (pathway) {
                        setShowPathwayModal(false);
                        fetchPathways(user, page, searchQuery);
                    }
                    return pathway;
                }}
                user={user}
                pathway={selectedPathway}
                classroom={classroom}
            />

        </div>
    )
}
