// src/api/auth.js など

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// ログイン関数の例
export async function login(username, password) {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { username, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // ← これ重要
      }
    );

    return response.data; // { success, token, user } など
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// ユーザー情報取得の例
export async function fetchMe(token) {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true, // ← これ重要
    });
    return response.data;
  } catch (error) {
    console.error('Fetch user error:', error);
    throw error;
  }
}
