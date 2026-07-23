import { useState, useEffect } from "react";
import { useAuthStore } from "../context/useAuthStore";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import EditBtn from "../components/common/editBtn";
import DeleteBtn from "../components/common/deleteBtn";
import ConfirmBox from "../components/common/confirmBox";
import api from "../services/api";
import { showSuccess, showError } from "../utils/notify";

export default function ViTriKhoView() {
  const authStore = useAuthStore();
  const [danhSachViTri, setDanhSachViTri] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDelete, setIsDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const defaultForm = { ma_toado: "", ten_vitri: "", loai_baoquan: "THUONG" };
  const [formData, setFormData] = useState({ ...defaultForm });

  // --- TẢI DỮ LIỆU ---
  const getData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get("/vitrikho");
      setDanhSachViTri(res.data || []);
    } catch (error) {
      showError("Lỗi tải dữ liệu vị trí kho");
      console.log(error);
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
              ? "Không tìm thấy vị trí kho nào."
              : "Chưa có dữ liệu sơ đồ kho."}
          </td>
        </tr>
      );
    } else {
      return items.map((vt) => (
        <tr key={vt.mavitri} className='border-b hover:bg-gray-50'>
          <td className='p-4 text-gray-500 font-medium'>#{vt.mavitri}</td>
          <td className='p-4 text-blue-600 font-bold uppercase'>{vt.ma_toado}</td>
          <td className='p-4 text-gray-700 font-medium'>{vt.ten_vitri}</td>
          <td className='p-4 text-gray-600'>
            {vt.loai_baoquan === "THUONG" ? "Thường (Nhiệt độ phòng)" 
            : vt.loai_baoquan === "LANH" ? "Lạnh (2-8°C)"
            : vt.loai_baoquan === "BIETTRU" ? "Khu biệt trữ" : "Thường (Nhiệt độ phòng)"}
          </td>
          <td className='p-4 flex gap-3 '>
            {authStore.isAdmin() && (
              <>
                <EditBtn func={() => openEditModal(vt)} />
                <DeleteBtn func={() => setIsDelete(vt.mavitri)} />
              </>
            )}
          </td>
        </tr>
      ));
    }
  }

  // --- HÀM TÌM KIẾM ---
  const displayedViTri = danhSachViTri.filter(
    (vt: any) =>
      (vt.ma_toado || "").toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (vt.ten_vitri || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // --- XỬ LÝ MODAL ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (vt: any) => {
    setIsEditMode(true);
    setEditingId(vt.mavitri);
    setFormData({
      ma_toado: vt.ma_toado,
      ten_vitri: vt.ten_vitri,
      loai_baoquan: vt.loai_baoquan || "THUONG",
    });
    setShowModal(true);
  };

  // --- LƯU (THÊM / SỬA) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authStore.isAdmin()) {
      showError("Bạn không có quyền chỉnh sửa vị trí kho");
      return;
    }

    if (!formData.ma_toado || !formData.ten_vitri) {
      showError("Vui lòng nhập Mã tọa độ và Tên vị trí (*)");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/vitrikho/${editingId}`, formData);
      } else {
        await api.post("/vitrikho", formData);
      }
      setShowModal(false);
      showSuccess(`Đã ${isEditMode ? "cập nhật" : "thêm"} vị trí kho!`);
      getData();
    } catch (error: any) {
      console.log(error.message || "Thao tác thất bại");
      showError(error.message || "Thao tác thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  // --- XÓA ---
  const handleDelete = async (id: number) => {
    if (!authStore.isAdmin()) {
      alert("Bạn không có quyền xóa vị trí kho");
      return;
    }

    try {
      await api.delete(`/vitrikho/${id}`);
      showSuccess("Đã xóa vị trí kho!");
      getData();
    } catch (error: any) {
      console.log(error.message || "Xóa thất bại");
      showError(error.message + "" || "Xóa thất bại");
    } finally {
      setIsDelete(null);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          Cấu hình Vị trí Kệ / Sơ đồ Kho
        </h2>

        <div className='flex gap-4 items-center'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm mã tọa độ, tên kệ...'
          />

          {authStore.isAdmin() && (
            <AddBtn func={openAddModal} placeholder='+ Thêm vị trí kệ' />
          )}

          <ReloadBtn func={getData} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải dữ liệu sơ đồ kho...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-600 text-sm border-b'>
                <th className='p-4 font-semibold'>ID</th>
                <th className='p-4 font-semibold'>Mã Tọa Độ</th>
                <th className='p-4 font-semibold'>Tên Kệ / Vị trí</th>
                <th className='p-4 font-semibold'>Điều kiện bảo quản</th>
                <th className='p-4 font-semibold'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(displayedViTri)}</tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[450px] max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-800'>
                {isEditMode ? "Cập nhật Vị trí Kệ" : "Thêm Vị trí Kệ"}
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
                  Mã tọa độ vật lý (*)
                </label>
                <input
                  type='text'
                  name='ma_toado'
                  value={formData.ma_toado}
                  onChange={handleFormChange}
                  placeholder='VD: A1, B2, TANG-1'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none uppercase'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tên Vị trí / Kệ (*)
                </label>
                <input
                  type='text'
                  name='ten_vitri'
                  value={formData.ten_vitri}
                  onChange={handleFormChange}
                  placeholder='VD: Kệ thuốc biệt dược, Tủ lạnh số 2'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Điều kiện bảo quản
                </label>
                <select
                  name='loai_baoquan'
                  value={formData.loai_baoquan}
                  onChange={handleFormChange}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                >
                  <option value='THUONG'>Thường (Nhiệt độ phòng)</option>
                  <option value='LANH'>Lạnh (2-8°C)</option>
                  <option value='BIETTRU'>Khu biệt trữ (Chờ kiểm định)</option>
                </select>
              </div>

              <div className='flex gap-3 pt-4 border-t'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='flex-1 px-4 py-2 border text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={isSaving}
                  className='flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
                >
                  {isSaving ? "Đang lưu..." : "Lưu Vị Trí"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDelete !== null && (
        <ConfirmBox
          title='Xác nhận xóa'
          message='Bạn có chắc chắn muốn xóa vị trí/kệ này khỏi sơ đồ kho không?'
          onConfirm={() => handleDelete(isDelete)}
          onCancel={() => setIsDelete(null)}
        />
      )}
    </div>
  );
}
