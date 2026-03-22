const API_BASE = 'http://localhost:5002';

export const api = {
  async get(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return await res.json();

    } catch (err) {
      console.error('GET Error:', err);
      throw err;
    }
  },

  async post(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }

      return await res.json();

    } catch (err) {
      console.error('POST Error:', err);
      throw err;
    }
  },
};