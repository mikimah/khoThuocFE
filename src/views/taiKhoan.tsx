import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useAuthStore } from "../context/useAuthStore";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";

export default function TaiKhoanView() {
  const authStore = useAuthStore();
  const [danhSachTK, setDanhSachTK] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- MODAL CẤP MỚI ---
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tendangnhap: "",
    matkhau: "",
    vaitro: "NhanVien",
  });

  // --- MODAL ĐỔI MẬT KHẨU ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    mataikhoan: null as number | null,
    tendangnhap: "",
    matKhauCu: "",
    matKhauMoi: "",
  });

  // --- LOAD DATA ---
  const getData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get("/taikhoan");
      setDanhSachTK(res.data || []);
    } catch (error) {
      console.error("Lỗi tải tài khoản:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    return items.length > 0 ? (
      items.map((tk) => (
        <tr key={tk.mataikhoan} className='border-b hover:bg-gray-50'>
          <td className='p-4 text-gray-500 font-medium'>#{tk.mataikhoan}</td>
          <td className='p-4 text-gray-800 font-bold'>{tk.tendangnhap}</td>
          <td className='p-4'>
            <span
              className={`px-2 py-1 rounded-md text-xs font-bold border ${
                tk.vaitro.toLowerCase() === "admin"
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
              }`}
            >
              {tk.vaitro}
            </span>
          </td>
          <td className='p-4 flex gap-3'>
            <button
              onClick={() => openPasswordModal(tk)}
              className='text-blue-600 hover:underline font-medium text-sm'
            >
              Đổi Pass
            </button>
            <button
              onClick={() => handleDelete(tk.mataikhoan)}
              className='text-red-600 hover:underline font-medium text-sm'
            >
              Xóa
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={4} className='p-8 text-center text-gray-500'>
          Không tìm thấy tài khoản.
        </td>
      </tr>
    );
  }

  const displayedTK = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return danhSachTK;
    return danhSachTK.filter((tk: any) =>
      tk.tendangnhap.toLowerCase().includes(query),
    );
  }, [danhSachTK, searchQuery]);

  // --- HÀM TẠO TÀI KHOẢN ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tendangnhap || !formData.matkhau) {
      alert("Vui lòng nhập đủ thông tin!");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/taikhoan", formData);
      alert("Cấp tài khoản thành công!");
      setShowModal(false);
      setFormData({
        tendangnhap: "",
        matkhau: "",
        vaitro: "NhanVien",
      });
      getData();
    } catch (error: any) {
      alert(error.message || "Lỗi hệ thống");
    } finally {
      setIsSaving(false);
    }
  };

  // --- MỞ MODAL ĐỔI PASS ---
  const openPasswordModal = (tk: any) => {
    setPasswordData({
      mataikhoan: tk.mataikhoan,
      tendangnhap: tk.tendangnhap,
      matKhauCu: "",
      matKhauMoi: "",
    });
    setShowPasswordModal(true);
  };

  // --- HÀM ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.matKhauCu || !passwordData.matKhauMoi) {
      alert("Vui lòng nhập đủ mật khẩu cũ và mới!");
      return;
    }

    try {
      await api.put(`/taikhoan/doimatkhau/${passwordData.mataikhoan}`, {
        matKhauCu: passwordData.matKhauCu,
        matKhauMoi: passwordData.matKhauMoi,
      });
      alert("Đã đổi mật khẩu thành công!");
      setShowPasswordModal(false);
    } catch (error: any) {
      alert(error.message || "Không thể đổi mật khẩu");
    }
  };

  // --- HÀM XÓA TÀI KHOẢN ---
  const handleDelete = async (id: number) => {
    if (id === authStore.user?.mataikhoan) {
      alert("Cảnh báo: Bạn không thể tự xóa tài khoản mà mình đang đăng nhập!");
      return;
    }

    if (id === 0 || id === 1) {
      alert(
        "Cảnh báo: Tài khoản Quản trị viên gốc được hệ thống bảo vệ, không thể xóa!",
      );
      return;
    }

    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác!",
      )
    ) {
      try {
        await api.delete(`/taikhoan/${id}`);
        getData();
      } catch (error: any) {
        alert(error.message || "Xóa thất bại");
      }
    }
  };

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    getData();
  }, []);

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>Quản lý Tài khoản</h2>
        <div className='flex gap-4 items-center'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm tên đăng nhập...'
          />
          <AddBtn
            func={() => setShowModal(true)}
            placeholder='Cấp tài khoản mới'
          />
        </div>
      </div>

      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-600 text-sm border-b'>
                <th className='p-4 font-semibold'>Mã TK</th>
                <th className='p-4 font-semibold'>Tên đăng nhập</th>
                <th className='p-4 font-semibold'>Vai trò</th>
                <th className='p-4 font-semibold'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(displayedTK)}</tbody>
          </table>
        </div>
      )}

      {/* MODAL CẤP TÀI KHOẢN MỚI */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-full max-w-[400px]'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-800'>
                Cấp tài khoản mới
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className='text-gray-400 hover:text-gray-600 font-bold text-xl'
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tên đăng nhập (*)
                </label>
                <input
                  value={formData.tendangnhap}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tendangnhap: e.target.value,
                    })
                  }
                  type='text'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Mật khẩu (*)
                </label>
                <input
                  value={formData.matkhau}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      matkhau: e.target.value,
                    })
                  }
                  type='password'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Vai trò hệ thống
                </label>
                <select
                  value={formData.vaitro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vaitro: e.target.value,
                    })
                  }
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                >
                  <option value='NhanVien'>Nhân viên kho</option>
                  <option value='Admin'>Quản trị viên (Admin)</option>
                </select>
              </div>
              <div className='flex justify-end gap-3 mt-8 pt-4 border-t'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={isSaving}
                  className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400'
                >
                  {isSaving ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-full max-w-[400px]'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-800'>
                Đổi Pass:{" "}
                <span className='text-blue-600'>
                  {passwordData.tendangnhap}
                </span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className='text-gray-400 hover:text-gray-600 font-bold text-xl'
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Mật khẩu cũ (*)
                </label>
                <input
                  value={passwordData.matKhauCu}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      matKhauCu: e.target.value,
                    })
                  }
                  type='password'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Mật khẩu mới (*)
                </label>
                <input
                  value={passwordData.matKhauMoi}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      matKhauMoi: e.target.value,
                    })
                  }
                  type='password'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
              </div>
              <div className='flex justify-end gap-3 mt-8 pt-4 border-t'>
                <button
                  type='button'
                  onClick={() => setShowPasswordModal(false)}
                  className='px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700'
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
