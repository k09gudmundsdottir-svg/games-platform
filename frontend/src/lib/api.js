const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body = null, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const playerId = localStorage.getItem('player_id');
  if (playerId) {
    headers['X-Player-ID'] = playerId;
  }

  const config = {
    method,
    headers,
    ...options,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      // response body not JSON
    }
    throw new ApiError(
      data?.detail || data?.message || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

const api = {
  get: (path, options) => request('GET', path, null, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  delete: (path, options) => request('DELETE', path, null, options),

  // Room endpoints
  rooms: {
    create: (data) => api.post('/rooms', data),
    join: (roomCode, data) => api.post(`/rooms/${roomCode}/join`, data),
    get: (roomCode) => api.get(`/rooms/${roomCode}`),
    leave: (roomCode) => api.post(`/rooms/${roomCode}/leave`),
    toggleReady: (roomCode) => api.post(`/rooms/${roomCode}/ready`),
    start: (roomCode) => api.post(`/rooms/${roomCode}/start`),
    updateSettings: (roomCode, settings) => api.patch(`/rooms/${roomCode}/settings`, settings),
  },

  // Game endpoints
  games: {
    getState: (roomCode) => api.get(`/games/${roomCode}/state`),
    move: (roomCode, move) => api.post(`/games/${roomCode}/move`, move),
    resign: (roomCode) => api.post(`/games/${roomCode}/resign`),
  },
};

export { ApiError };
export default api;
