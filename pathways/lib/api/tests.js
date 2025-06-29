import fetchWithAuth from "../fetch_with_auth";


export async function fetchTests({
  classroomId,
  page = 1,
  pageSize = 10,
  search="",
  signal = undefined,
}) {
  if (!classroomId) throw new Error("classroomId is required");

  const url = `/api/classroom/${classroomId}/tests/?page=${page}&search=${search}&page_size=${pageSize}`;

  const res = await fetchWithAuth(url, { signal });
  if (!res.ok) throw new Error("Failed to fetch tests");

  const data = await res.json();
  const results = Array.isArray(data) ? data : (data.results || []);
  const tests = results.map(t => ({ ...t, type: "test" }));

  return {
    tests,
    next: data.next ?? null,
    previous: data.previous ?? null,
    count: data.count ?? tests.length,
  };
}