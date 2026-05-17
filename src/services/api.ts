import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Đảm bảo đúng port Backend của bạn
  headers: {
    'Content-Type': 'application/json'
  }
});

// KẺ CHẶN ĐƯỜNG CHIỀU ĐI (Tự động đính kèm Token)
api.interceptors.request.use(
  (config) => {
    // Lấy token từ túi (localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn thẻ bài
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// KẺ CHẶN ĐƯỜNG CHIỀU VỀ (Xử lý dữ liệu và lỗi)
api.interceptors.response.use(
  (response) => {
    // Chỉ lấy phần data trả về cho gọn
    return response.data;
  },
  (error) => {
    // Nếu lỗi là 401 (Hết hạn Token hoặc chưa đăng nhập)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Đá văng ra trang đăng nhập
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Trả ra message lỗi mượt mà cho các file .vue bắt
    return Promise.reject(error.response?.data || { message: 'Lỗi kết nối máy chủ' });
  }
);

export default api;