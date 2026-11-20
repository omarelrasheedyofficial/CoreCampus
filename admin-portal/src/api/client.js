import { supabase } from './supabaseClient.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, { method = 'GET', body, responseType = 'json' } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payloadBody;
  if (body instanceof FormData) {
    payloadBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payloadBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, { method, headers, body: payloadBody });
  } catch {
    throw new ApiError('Cannot reach the CampusCore server. Please try again.', 0);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const fallback = [502, 503, 504].includes(response.status)
      ? 'The CampusCore server is temporarily unavailable. Please try again.'
      : `Request failed (${response.status}).`;
    throw new ApiError(error.message || fallback, response.status);
  }

  if (responseType === 'blob') {
    return { blob: await response.blob(), filename: filenameFrom(response.headers.get('Content-Disposition')) };
  }
  return response.json().catch(() => ({}));
}

function filenameFrom(disposition = '') {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : 'download';
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
