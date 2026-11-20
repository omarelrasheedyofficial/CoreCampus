import { apiRequest, saveBlob } from './client.js';

export async function fetchSectionMaterials(sectionId) {
  const { materials } = await apiRequest(`/lab-sections/${encodeURIComponent(sectionId)}/materials`);
  return materials;
}

export async function uploadSectionMaterial(sectionId, { title, file }) {
  const form = new FormData();
  form.append('title', title);
  form.append('file', file);
  const { material } = await apiRequest(`/lab-sections/${encodeURIComponent(sectionId)}/materials`, {
    method: 'POST',
    body: form,
  });
  return material;
}

export async function renameMaterial(materialId, title) {
  const { material } = await apiRequest(`/materials/${materialId}`, { method: 'PATCH', body: { title } });
  return material;
}

export async function deleteMaterial(materialId) {
  await apiRequest(`/materials/${materialId}`, { method: 'DELETE' });
}

export async function downloadMaterial(materialId) {
  const { blob, filename } = await apiRequest(`/materials/${materialId}/download`, { responseType: 'blob' });
  saveBlob(blob, filename);
}
