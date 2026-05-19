import { create } from "zustand";
import api from "../services/api";
import { showSuccess } from "../utils/notify";

interface User {
  tendangnhap: string;
  vaitro: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  login: (tendangnhap: string, matkhau: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,

  isAuthenticated: () => !!get().token,

  isAdmin: () => get().user?.vaitro?.toLowerCase() === "admin",

  login: async (tendangnhap: string, matkhau: string) => {
    if (!tendangnhap || !matkhau) {
      throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu");
    }

    try {
      const res = await api.post("/taikhoan/login", { tendangnhap, matkhau });
      const { token, user } = res.data;

      set({ token, user });

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));


      return; // Trả về thành công
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Đăng nhập thất bại";
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showSuccess("Đăng xuất thành công");
  },
}));
