import axios from 'axios';

// axios インスタンスを作成
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

// リクエストインターセプター - トークンを自動付与
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター - トークン期限切れ時の処理
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      // トークンが無効な場合、ログイン画面にリダイレクト
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;