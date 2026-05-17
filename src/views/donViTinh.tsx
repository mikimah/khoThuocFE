import { useState, useEffect } from "react";
import { useAuthStore } from "../context/useAuthStore";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";
import api from "../services/api";

export default function DonViTinhView() {
  const authStore = useAuthStore();
  const [danhSachDonVi, setDanhSachDonVi] = useState([]);
  const [danhSachThuoc, setDanhSachThuoc] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const defaultForm = { mathuoc: "", tendonvi: "", hesoquydoi: 1 };
  const [formData, setFormData] = useState({ ...defaultForm });

  // --- TẢI DỮ LIỆU ---

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resDV, resThuoc]: any = await Promise.all([
        api.get("/donvitinh"),
        api.get("/thuoc"),
      ]);
      setDanhSachDonVi(resDV.data || []);
      setDanhSachThuoc(resThuoc.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={5} className='p-8 text-center text-gray-500'>
            {searchQuery
              ? "Không tìm thấy kết quả phù hợp."
              : "Chưa có dữ liệu quy đổi."}
          </td>
        </tr>
      );
    } else {
      return items.map((dv) => (
        <tr key={dv.madonvitinh} className='border-b hover:bg-gray-50'>
          <td className='p-4 text-gray-500 font-medium'>#{dv.madonvitinh}</td>
          <td className='p-4 text-blue-600 font-bold'>{dv.tendonvi}</td>
          <td className='p-4 text-gray-700 font-medium'>x {dv.hesoquydoi}</td>
          <td className='p-4 text-gray-800 font-medium'>
            {dv.tenthuoc || `THUOC-${dv.mathuoc}`}
          </td>
          <td className='p-4 flex gap-3'>
            {authStore.isAdmin() && (
              <>
                <button
                  onClick={() => openEditModal(dv)}
                  className='text-blue-600 hover:underline font-medium text-sm'
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(dv.madonvitinh)}
                  className='text-red-600 hover:underline font-medium text-sm'
                >
                  Xóa
                </button>
              </>
            )}
          </td>
        </tr>
      ));
    }
  }

  // --- HÀM TÌM KIẾM ---

  const displayedDonVi = danhSachDonVi.filter(
    (dv) =>
      (dv.tendonvi || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()) ||
      (dv.tenthuoc || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
  );

  // --- XỬ LÝ MODAL ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (dv: any) => {
    setIsEditMode(true);
    setEditingId(dv.madonvitinh);
    setFormData({
      mathuoc: dv.mathuoc,
      tendonvi: dv.tendonvi,
      hesoquydoi: dv.hesoquydoi,
    });
    setShowModal(true);
  };

  // --- LƯU (THÊM / SỬA) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authStore.isAdmin()) {
      alert("Bạn không có quyền chỉnh sửa đơn vị tính");
      return;
    }

    if (!formData.mathuoc || !formData.tendonvi || !formData.hesoquydoi) {
      alert("Vui lòng nhập đủ thông tin (*)");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/donvitinh/${editingId}`, formData);
      } else {
        await api.post("/donvitinh", formData);
      }
      setShowModal(false);
      getData();
    } catch (error: any) {
      alert(error.message || "Thao tác thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  // --- XÓA ---
  const handleDelete = async (id: number) => {
    if (!authStore.isAdmin()) {
      alert("Bạn không có quyền xóa đơn vị tính");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn vị quy đổi này?")) {
      return;
    }

    try {
      await api.delete(`/donvitinh/${id}`);
      getData();
    } catch (error: any) {
      alert(error.message || "Xóa thất bại");
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "hesoquydoi" ? Number(value) : value,
    }));
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Cấu hình Đơn vị quy đổi
        </h2>

        <div className='flex gap-4 items-center'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm đơn vị, thuốc...'
          />

          {authStore.isAdmin() && (
            <AddBtn func={openAddModal} placeholder='+ Thêm đơn vị quy đổi' />
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-600 text-sm border-b'>
                <th className='p-4 font-semibold'>Mã ĐV</th>
                <th className='p-4 font-semibold'>Tên Đơn vị</th>
                <th className='p-4 font-semibold'>Hệ số quy đổi</th>
                <th className='p-4 font-semibold'>Áp dụng cho Thuốc</th>
                <th className='p-4 font-semibold'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(displayedDonVi)}</tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[450px] max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-800'>
                {isEditMode ? "Cập nhật Đơn vị" : "Thêm Đơn vị quy đổi"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className='text-gray-400 hover:text-gray-600 font-bold text-2xl leading-none'
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Chọn thuốc áp dụng (*)
                </label>
                <select
                  name='mathuoc'
                  value={formData.mathuoc}
                  onChange={handleFormChange}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                  required
                  disabled={isEditMode}
                >
                  <option value=''>-- Chọn thuốc --</option>
                  {danhSachThuoc.map((t: any) => (
                    <option key={t.mathuoc} value={t.mathuoc}>
                      [#{t.mathuoc}] {t.tenthuoc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tên đơn vị quy đổi (*)
                </label>
                <select
                  name='tendonvi'
                  value={formData.tendonvi}
                  onChange={handleFormChange}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                  required
                >
                  <option value=''>-- Chọn đơn vị quy đổi --</option>
                  <option value='Hộp'>Hộp</option>
                  <option value='Thùng'>Thùng</option>
                  <option value='Vỉ'>Vỉ</option>
                  <option value='Kiện'>Kiện</option>
                  <option value='Lốc'>Lốc</option>
                  <option value='Bịch'>Bịch</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Hệ số quy đổi (*)
                </label>
                <input
                  type='number'
                  name='hesoquydoi'
                  value={formData.hesoquydoi}
                  onChange={handleFormChange}
                  min='1'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
                <p className='text-[11px] text-gray-500 mt-1'>
                  Ví dụ: Đơn vị cơ bản là Viên, 1 Thùng có 2400 viên thì nhập
                  2400.
                </p>
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
                  {isSaving
                    ? "Đang lưu..."
                    : isEditMode
                      ? "Cập nhật"
                      : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
