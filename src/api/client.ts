import type {
  SWMSAssignment,
  QRAdminListResult,
  QROptionsResult,
  QRCreateResult,
  QRGenerateSinglePayload,
} from '../types';

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:8000';

export interface ApiError {
  message: string;
  status?: number;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the SWMS server. Please check your connection and try again.');
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? (data.detail[0]?.msg ?? data.detail[0]?.detail ?? 'Invalid request')
          : data?.message;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  token: string;
  user: SWMSAssignment;
  message?: string;
}

export const authLogin = (username: string, password: string) =>
  apiFetch<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const authMe = (token: string) => apiFetch<LoginResult>('/api/auth/me', { token });

// ── Dashboard / Checkpoints ──────────────────────────────────────────────────────────────

export const fetchDashboard = (token: string) => apiFetch<any>('/api/swms/dashboard', { token });

/** Fetch ALL live SWMS household records + stats from Neon PostgreSQL (/api/swms/data). */
export const fetchSWMSData = (token: string) => apiFetch<any>('/api/swms/data', { token });

/** Grounded SWMS Copilot predictive audit — deterministic analytics on live Neon household records (/api/swms/ai-audit). */
export const fetchSWMSAIAudit = (token: string) =>
  apiFetch<any>('/api/swms/ai-audit', {
    method: 'POST',
    token,
  });

export const resolveCheckpoint = (token: string, qrId: string) =>
  apiFetch<any>(`/api/swms/checkpoint/${encodeURIComponent(qrId)}`, { token });

export interface CollectionSubmitPayload {
  qrId: string;
  status: 'Collected' | 'Not Collected';
  remarks?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export const submitCollection = (token: string, payload: CollectionSubmitPayload) =>
  apiFetch<any>('/api/swms/collection/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });

// ── QR Checkpoint Management (Admin) ──────────────────────────────────────────────────────

export const adminQROptions = (
  token: string,
  zone?: string,
  ward?: string,
): Promise<QROptionsResult> => {
  const params = new URLSearchParams();
  if (zone) params.set('zone', zone);
  if (ward) params.set('ward', ward);
  const qs = params.toString();
  return apiFetch<QROptionsResult>(`/api/admin/qr/options${qs ? `?${qs}` : ''}`, { token });
};

export const adminQRZones = (token: string, zone?: string): Promise<QRAdminListResult> => {
  const params = new URLSearchParams();
  if (zone) params.set('zone', zone);
  const qs = params.toString();
  return apiFetch<QRAdminListResult>(`/api/admin/qr/zones${qs ? `?${qs}` : ''}`, { token });
};

export const adminQRGenerateSingle = (
  token: string,
  payload: QRGenerateSinglePayload,
): Promise<QRCreateResult> =>
  apiFetch<QRCreateResult>('/api/admin/qr/generate/single', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });

export const adminQRGenerateZone = (token: string, zone: string): Promise<QRCreateResult> =>
  apiFetch<QRCreateResult>('/api/admin/qr/generate/zone', {
    method: 'POST',
    body: JSON.stringify({ zone }),
    token,
  });

/** Absolute URL for the dynamically generated QR PNG. The image encodes ONLY the QR id (public). */
export const qrImageUrl = (qrId: string, size = 14) =>
  `${API_BASE}/api/admin/qr/image?qrId=${encodeURIComponent(qrId)}&size=${size}`;

/** Absolute URL that downloads the QR PNG (use with an anchor/link click). */
export const qrImageDownloadUrl = (qrId: string, size = 20) =>
  `${API_BASE}/api/admin/qr/image?qrId=${encodeURIComponent(qrId)}&size=${size}&download=1`;

/** ZIP download of every QR image in a zone (admin). */
export const adminQRDownloadAll = (token: string, zone: string): Promise<Blob> =>
  fetch(`${API_BASE}/api/admin/qr/download-all?zone=${encodeURIComponent(zone)}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) {
      let detail = `Download failed (${res.status})`;
      try {
        const data = await res.json();
        if (typeof data?.detail === 'string') detail = data.detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }
    return res.blob();
  });