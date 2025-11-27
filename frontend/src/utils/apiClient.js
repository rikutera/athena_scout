import axios from 'axios';



const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// リクエストインターセプター - トークンを自動付与 & アクティビティ更新
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // APIリクエストのたびに最終アクティビティを更新
    localStorage.setItem('lastActivity', Date.now().toString());

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
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('loginTime');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
