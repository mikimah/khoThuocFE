import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useAuthStore } from "../context/useAuthStore";
import { formatCurrency } from "../utils/customFunction";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import EditBtn from "../components/common/editBtn";
import DeleteBtn from "../components/common/deleteBtn";
import ConfirmBox from "../components/common/confirmBox";
import { showSuccess, showError } from "../utils/notify";
import { Phone,Mail } from "lucide-react";

export default function DoiTacView() {
  const authStore = useAuthStore();
  const [danhSachDoiTac, setDanhSachDoiTac] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("TatCa"); // TatCa | NhaCungCap | KhachHang

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDelete, setIsDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const defaultForm = {
    tendoitac: "",
    masothue: "",
    loaidoitac: "NhaCungCap",
    diachi: "",
    sodienthoai: "",
    email: "",
    trangthai: "Dang hop tac",
    tongnohientai: 0,
  };
  const [formData, setFormData] = useState({ ...defaultForm });

  // --- TẢI DỮ LIỆU ---
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get("/doitac");
      setDanhSachDoiTac(res.data || []);
    } catch (error) {
      showError("Lỗi tải dữ liệu đối tác:");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LỌC DỮ LIỆU TỔNG HỢP (Theo Tab + Text) ---
  const displayedDoiTac = useMemo(() => {
    let filtered = danhSachDoiTac;

    // 1. Lọc theo Tab
    if (activeTab !== "TatCa") {
      filtered = filtered.filter((dt: any) => dt.loaidoitac === activeTab);
    }

    // 2. Lọc theo ô tìm kiếm
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (dt: any) =>
          (dt.tendoitac || "").toLowerCase().includes(query) ||
          (dt.sodienthoai || "").includes(query) ||
          (dt.email || "").toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [danhSachDoiTac, activeTab, searchQuery]);

  function renderItems(items: any[]) {
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={6} className='p-8 text-center text-gray-500'>
            Chưa có dữ liệu đối tác.
          </td>
        </tr>
      );
    }

    return items.map((dt: any) => (
      <tr key={dt.madoitac} className='border-b hover:bg-gray-50'>
        <td className='p-4 text-gray-500 font-medium'>#{dt.madoitac}</td>
        <td className='p-4'>
          <div className='font-bold text-gray-800'>{dt.tendoitac}</div>
          <div className='text-xs text-gray-500 mt-1'>
            MST: {dt.masothue || "---"}
          </div>
          <div className='mt-1'>
            {dt.loaidoitac === "NhaCungCap" ? (
              <span className='bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold'>
                Nhà Cung Cấp
              </span>
            ) : (
              <span className='bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold'>
                Khách Hàng
              </span>
            )}
          </div>
        </td>
        <td className='p-4 text-sm text-gray-600'>
          <div className='flex items-center gap-1'>
            <Phone className='w-4' /> {dt.sodienthoai || "---"}
          </div>
          <div className='flex items-center gap-1 mt-1'>
            <Mail className='w-4' /> {dt.email || "---"}
          </div>
        </td>
        <td className='p-4 text-sm'>
          {dt.loaidoitac === "KhachHang" && (
            <div
              className={
                dt.tongnohientai > 0
                  ? "font-medium text-red-600"
                  : "font-medium text-gray-500"
              }
            >
              Công Nợ của khách hàng: {formatCurrency(dt.tongnohientai)}
            </div>
          )}
          {dt.loaidoitac === "NhaCungCap" && (
            <div
              className={
                dt.tongnohientai > 0
                  ? "font-medium text-red-600"
                  : "font-medium text-gray-500"
              }
            >
              Công Nợ phải trả: {formatCurrency(dt.tongnohientai)}
            </div>
          )}
          <div
            className={`text-xs text-gray-500 ${dt.loaidoitac === "KhachHang" ? "mt-1" : ""}`}
          >
            {dt.solangiaodich_thanhcong || 0} GD thành công
          </div>
        </td>
        <td className='p-4'>
          <span
            className={`font-medium text-sm flex items-center gap-1 ${
              dt.trangthai === "Dang hop tac"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dt.trangthai === "Dang hop tac" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {dt.trangthai === "Dang hop tac" ? "Hợp tác" : "Ngừng"}
          </span>
        </td>
        <td className='p-4'>
          <div className='flex gap-3'>
            {authStore.isAdmin() && (
              <>
                <EditBtn func={() => openEditModal(dt)} />
                <DeleteBtn func={() => setIsDelete(dt.madoitac)} />
              </>
            )}
          </div>
        </td>
      </tr>
    ));
  }

  // --- XỬ LÝ MODAL ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      ...defaultForm,
      loaidoitac: activeTab === "KhachHang" ? "KhachHang" : "NhaCungCap",
    });
    setShowModal(true);
  };

  const openEditModal = (dt: any) => {
    setIsEditMode(true);
    setEditingId(dt.madoitac);
    setFormData({ ...dt });
    setShowModal(true);
  };

  const normalizePhone = (val: string) => (val || "").replace(/\D/g, "");
  const isValidPhone = (val: string) => /^(\d{8}|\d{10})$/.test(val);
  const isValidEmail = (val: string) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val || "");

  // --- XỬ LÝ FORM CHANGE ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // --- LƯU & XÓA ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authStore.isAdmin()) {
      showError("Bạn không có quyền chỉnh sửa đối tác");
      return;
    }

    if (!formData.tendoitac || !formData.loaidoitac) {
      showError("Vui lòng nhập Tên đối tác và Loại đối tác!");
      return;
    }

    const phone = normalizePhone(formData.sodienthoai);
    const email = (formData.email || "").trim();
    const diachi = (formData.diachi || "").trim();

    if (!phone || !email) {
      showError("Số điện thoại và email không được để trống!");
      return;
    }

    if (!diachi) {
      showError("Địa chỉ không được để trống!");
      return;
    }

    if (!isValidPhone(phone)) {
      showError("Số điện thoại phải có 8 hoặc 10 chữ số!");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Email phải có tên miền sau @");
      return;
    }

    // KIỂM TRA ĐỊNH DẠNG MÃ SỐ THUẾ
    const mst = (formData.masothue || "").trim();
    if (mst && !/^(\d{10}|\d{13})$/.test(mst)) {
      showError(
        "LỖI: Mã số thuế phải bao gồm ĐÚNG 10 hoặc 13 CHỮ SỐ liên tiếp!",
      );
      return;
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        ...formData,
        masothue: mst,
        sodienthoai: phone,
        email: email,
      };

      if (isEditMode) {
        await api.put(`/doitac/${editingId}`, dataToSend);
      } else {
        await api.post("/doitac", dataToSend);
      }
      setShowModal(false);
      getData();
      showSuccess("Thao tác thành công");
    } catch (error: any) {
      console.log(error.message || "Thao tác thất bại");
      showError("Thao tác thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!authStore.isAdmin()) {
      showError("Bạn không có quyền xóa đối tác");
      return;
    }

    try {
      await api.delete(`/doitac/${id}`);
      getData();
      showSuccess("Đã xóa đối tác!");
    } catch (error: any) {
      console.log(error.message || "Xóa thất bại");
      showError(error.message || "Xóa thất bại");
    } finally {
      setIsDelete(null);
    }
  };

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>Quản lý Đối tác</h2>

        <div className='flex gap-4 items-center'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm tên, SĐT, email...'
          />
          {authStore.isAdmin() && (
            <AddBtn func={openAddModal} placeholder='+ Thêm đối tác mới' />
          )}

          <ReloadBtn func={getData} />
        </div>
      </div>

      {/* Tabs */}
      <div className='flex border-b mb-4'>
        <button
          onClick={() => setActiveTab("TatCa")}
          className={`px-6 py-3  font-medium text-sm transition hover:cursor-pointer ${
            activeTab === "TatCa"
              ? "border-blue-600 text-blue-600 font-bold border-b-2"
              : "text-gray-500 hover:text-gray-700 hover:scale-[1.05]"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setActiveTab("NhaCungCap")}
          className={`px-6 py-3 font-medium text-sm transition flex items-center gap-2 hover:cursor-pointer${
            activeTab === "NhaCungCap"
              ? "border-purple-600 text-purple-600 font-bold border-b-2 "
              : " text-gray-500 hover:text-gray-700 hover:scale-[1.05]"
          }`}
        >
          Nhà Cung Cấp
        </button>
        <button
          onClick={() => setActiveTab("KhachHang")}
          className={`px-6 py-3  font-medium text-sm transition flex items-center gap-2 hover:cursor-pointer ${
            activeTab === "KhachHang"
              ? "border-green-600 text-green-600 font-bold border-b-2"
              : "text-gray-500 hover:text-gray-700 hover:scale-[1.05]"
          }`}
        >
          Khách Hàng
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-600 text-sm border-b'>
                <th className='p-4 font-semibold w-16'>Mã</th>
                <th className='p-4 font-semibold'>Tên Đối tác</th>
                <th className='p-4 font-semibold'>Liên hệ</th>
                <th className='p-4 font-semibold'>Công nợ & Giao dịch</th>
                <th className='p-4 font-semibold'>Trạng thái</th>
                <th className='p-4 font-semibold'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(displayedDoiTac)}</tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[700px] max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-800'>
                {isEditMode ? "Cập nhật Đối tác" : "Thêm Đối tác mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className='text-gray-400 hover:text-gray-600 font-bold text-2xl leading-none'
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Tên đối tác (*)
                  </label>
                  <input
                    name='tendoitac'
                    value={formData.tendoitac}
                    onChange={handleFormChange}
                    type='text'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Loại đối tác (*)
                  </label>
                  <select
                    name='loaidoitac'
                    value={formData.loaidoitac}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white'
                  >
                    <option value='NhaCungCap'>Nhà Cung Cấp</option>
                    <option value='KhachHang'>Khách Hàng</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Số điện thoại
                  </label>
                  <input
                    name='sodienthoai'
                    value={formData.sodienthoai}
                    onChange={handleFormChange}
                    type='text'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Email
                  </label>
                  <input
                    name='email'
                    value={formData.email}
                    onChange={handleFormChange}
                    type='text'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Mã số thuế
                  </label>
                  <input
                    name='masothue'
                    value={formData.masothue}
                    onChange={handleFormChange}
                    type='text'
                    maxLength={13}
                    placeholder='Nhập 10 hoặc 13 số...'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Trạng thái hợp tác
                  </label>
                  <select
                    name='trangthai'
                    value={formData.trangthai}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white'
                  >
                    <option value='Dang hop tac'>Đang hợp tác</option>
                    <option value='Ngung hop tac'>Ngừng hợp tác</option>
                  </select>
                </div>
              </div>

              <div
                className={`grid gap-4 ${formData.loaidoitac === "KhachHang" ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Địa chỉ
                  </label>
                  <input
                    name='diachi'
                    value={formData.diachi}
                    onChange={handleFormChange}
                    type='text'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>

                {formData.loaidoitac === "KhachHang" && (
                  <div>
                    <label className='block text-sm font-bold text-red-600 mb-1'>
                      Công nợ khách hàng (VND)
                    </label>
                    <input
                      name='tongnohientai'
                      value={formData.tongnohientai}
                      onChange={handleFormChange}
                      type='number'
                      min='0'
                      placeholder='Nhập để cấn trừ nợ...'
                      className='w-full px-3 py-2 border-2 border-red-300 bg-red-50 text-red-700 font-bold rounded-lg focus:ring-2 focus:ring-red-400 outline-none transition'
                    />
                  </div>
                )}
                {formData.loaidoitac === "NhaCungCap" && (
                  <div>
                    <label className='block text-sm font-bold text-red-600 mb-1'>
                      Công nợ của ta (VND)
                    </label>
                    <input
                      name='tongnohientai'
                      value={formData.tongnohientai}
                      onChange={handleFormChange}
                      type='number'
                      min='0'
                      placeholder='Nhập để cấn trừ nợ...'
                      className='w-full px-3 py-2 border-2 border-red-300 bg-red-50 text-red-700 font-bold rounded-lg focus:ring-2 focus:ring-red-400 outline-none transition'
                    />
                  </div>
                )}
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
                      : "Lưu thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDelete && (
        <ConfirmBox
          message='Bạn có chắc chắn muốn xóa đối tác này?'
          onConfirm={() => handleDelete(isDelete)}
          onCancel={() => setIsDelete(null)}
        />
      )}
    </div>
  );
}
