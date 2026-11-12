const BASE = process.env.REACT_APP_API_URL || '';

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('server ไม่ได้ตอบเป็น JSON');
  }
  if (!res.ok) {
    const err = new Error(data.error || 'เกิดข้อผิดพลาด');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const listCategories = () => apiFetch('/api/categories');

export const listProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/products${qs ? `?${qs}` : ''}`);
};

export const getProduct = (id) => apiFetch(`/api/products/${id}`);

export const createProduct = (token, body) =>
  apiFetch('/api/products', { method: 'POST', body, token });

export const updateProduct = (token, id, body) =>
  apiFetch(`/api/products/${id}`, { method: 'PUT', body, token });

export const deleteProduct = (token, id) =>
  apiFetch(`/api/products/${id}`, { method: 'DELETE', token });

export const register = (body) => apiFetch('/api/auth/register', { method: 'POST', body });

export const login = async (body) => {
  const data = await apiFetch('/api/auth/login', { method: 'POST', body });
  if (data && data.token) {
    localStorage.setItem('shopmart.session', JSON.stringify({
      token: data.token,
      member: data.member || data.user
    }));
  }
  return data;
};

export const getCart = (token) => apiFetch('/api/cart', { token });
export const setCartQty = (token, productId, qty) =>
  apiFetch(`/api/cart/${productId}`, { method: 'PUT', body: { qty }, token });

export const formatBaht = (satang) =>
  (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ฿';

export const checkout = (token, body) =>
  apiFetch('/api/orders', { method: 'POST', body, token });

export const createPaymentIntent = (token) =>
  apiFetch('/api/payments/intent', { method: 'POST', token });

export const confirmOrder = (token, body) =>
  apiFetch('/api/orders/confirm', { method: 'POST', body, token });