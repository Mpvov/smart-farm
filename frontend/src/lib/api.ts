const API_BASE = '/api/v1';

export interface LiveTelemetryPacket {
  zone_id: number;
  metric: string;
  value: number;
  timestamp: string;
}

function getStoredAccessToken(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('sf_access_token') : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getStoredAccessToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `HTTP error ${res.status}`);
  }

  return res.json();
}

// PROTOTYPE transport (xem docs/decisions/0001-tech-stack.md): SSE tam thoi ho tro UI/UX;
// chua chot giao thuc realtime chinh thuc. Khi doi sang WebSocket/MQTT/Polling chi thay ham nay.
export function subscribeZoneTelemetry(
  zoneId: number,
  onPacket: (packet: LiveTelemetryPacket) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/zones/${zoneId}/telemetry/stream`);

  eventSource.addEventListener('telemetry', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data) as LiveTelemetryPacket;
      onPacket(data);
    } catch (err) {
      console.error('Realtime stream parse error', err);
    }
  });

  return () => {
    eventSource.close();
  };
}
