import fetchWithAuth from "../fetch_with_auth";

export async function saveMaterial({
  data,
  editingMaterial = null,
  classroomId = null,
}) {
  const originalContent = Array.isArray(data.content) ? data.content : [];

  // Extract and remove "title" content block
  const titleItem = originalContent.find(item => item.type === "title");
  const extractedTitle = titleItem?.text?.trim();

  // Remove title block + strip all `id` fields
  const filteredContent = originalContent
    .filter(item => item.type !== "title")
    .map(({ id, ...rest }) => rest);

  // Remove blob-only files (not saved)
  const nonBlobContent = filteredContent.filter(
    item => !(item.type === "file" && item.url?.startsWith("blob:"))
  );

  const files = originalContent.filter(
    item => item.type === "file" && item.file instanceof File
  );

  const typeKeys = [...new Set(
    filteredContent.map(item => item.type)
  )];

  const hasFile = files.length > 0;

  const formData = new FormData();

  if (extractedTitle) {
    formData.append("title", extractedTitle);
  }

  typeKeys.forEach(key => formData.append("type_keys", key));

  if (!editingMaterial) {
    formData.append("classroom", classroomId);
  }

  formData.append("content", JSON.stringify(nonBlobContent));

  files.forEach(fileItem => {
    formData.append("files", fileItem.file);
  });

  const endpoint = editingMaterial
    ? `/api/classroom/materials/${editingMaterial.id}/`
    : `/api/classroom/materials/create/`;

  const method = editingMaterial ? "PUT" : "POST";

  const jsonBody = {
    content: nonBlobContent,
    type_keys: typeKeys,
    ...(extractedTitle ? { title: extractedTitle } : {}),
    ...(editingMaterial ? {} : { classroom: classroomId }),
  };

  const response = await fetchWithAuth(endpoint, {
    method,
    body: hasFile ? formData : JSON.stringify(jsonBody),
    headers: hasFile ? undefined : { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to ${editingMaterial ? "update" : "create"} material`);
  }

  return await response.json();
}

// Fetch a single page of materials for a classroom
export async function fetchMaterials({
  classroomId,
  search=null,
  page = 1,
  pageSize = 10,
  signal = undefined,
}) {
  if (!classroomId) throw new Error("classroomId is required");
  let searchString = ""
  if (search) {
    searchString = `&search=${search}`
  }

  console.log("search string", searchString)
  const url = `/api/classroom/materials/?classroom=${classroomId}${searchString}&page=${page}&page_size=${pageSize}`;
  console.log(url)
  const res = await fetchWithAuth(url, { signal });
  if (!res.ok) throw new Error("Failed to fetch materials");

  const data = await res.json();
  // Normalize results: ensure you always get an array (handles pagination and plain arrays)
  const results = Array.isArray(data) ? data : (data.results || []);
  // Add type field to each post for stream rendering
  const materials = results.map(mat => ({ ...mat, type: "material" }));

  return {
    materials,
    // For pagination
    next: data.next ?? null,
    previous: data.previous ?? null,
    count: data.count ?? materials.length,
  };
}

export async function deleteMaterial(materialId) {
  const res = await fetchWithAuth(`/api/classroom/materials/${materialId}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete material");
  return true;
}




