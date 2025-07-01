import fetchWithAuth from "../fetch_with_auth";

// Fetch a page of assignments for a classroom
export async function fetchAssignments({
  classroomId,
  page = 1,
  pageSize = 10,
  search="",
  signal = undefined,
}) {
  if (!classroomId) throw new Error("classroomId is required");

  const url = `/api/classroom/${classroomId}/assignments/?page=${page}&search=${search}&page_size=${pageSize}`;

  const res = await fetchWithAuth(url, { signal });
  if (!res.ok) throw new Error("Failed to fetch assignments");

  const data = await res.json();
  const results = Array.isArray(data) ? data : (data.results || []);
  const assignments = results.map(a => ({ ...a, type: "assignment" }));

  return {
    assignments,
    next: data.next ?? null,
    previous: data.previous ?? null,
    count: data.count ?? assignments.length,
  };
}