import { create } from 'zustand';
import api from '../services/api'; // Điều chỉnh lại đường dẫn cho đúng project React của bạn

// 1. Định nghĩa kiểu dữ liệu cho User
interface User {
  tendangnhap: string;
  vaitro: string;
  [key: string]: any; // Cho phép các trường khác nếu có
}

// 2. Định nghĩa kiểu dữ liệu cho Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  login: (tendangnhap: string, matkhau: string) => Promise<void>;
  logout: () => void;
}

// 3. Tạo Store bằng Zustand
export const useAuthStore = create<AuthState>((set, get) => ({
  // Khởi tạo state từ localStorage (giúp F5 không mất login)
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  // Getters trong Zustand được viết dưới dạng hàm
  isAuthenticated: () => !!get().token,
  
  isAdmin: () => get().user?.vaitro?.toLowerCase() === 'admin',

  // Actions
  login: async (tendangnhap: string, matkhau: string) => {
    // Validate input
    if (!tendangnhap || !matkhau) {
      throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu');
    }

    try {
      const res = await api.post('/taikhoan/login', { tendangnhap, matkhau });
      
      const { token, user } = res.data;

      // Lưu vào State
      set({ token, user });

      // Lưu vào LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect sau khi đăng nhập thành công
      window.location.href = '/';
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    // Xóa trong State
    set({ user: null, token: null });

    // Xóa trong LocalStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}));