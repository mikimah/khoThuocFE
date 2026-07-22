import { useState, useEffect } from "react";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/customFunction";
import SearchInput from "../components/common/searchInput";
import ReloadBtn from "../components/common/reloadBtn";
import FilterNum from "../components/common/filterNum";
import { showSuccess, showError } from "../utils/notify";

export default function LoThuocView() {
  const [danhSachLo, setDanhSachLo] = useState<any[]>([]);
  const [danhSachThuoc, setDanhSachThuoc] = useState<any[]>([]);
  const [danhSachViTri, setDanhSachViTri] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("tatca");

  const defaultForm = {
    solo: "",
    mathuoc: "",
    tonthucte: 0,
    tonkhadung: 0,
    ngaysanxuat: "",
    hansudung: "",
    ngaynhap: "",
    mavitri: "",
    trangthai: "sansangban",
  };

  const [formData, setFormData] = useState({ ...defaultForm });

  // --- TẢI DỮ LIỆU ---
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resLo, resThuoc, resViTri]: any = await Promise.all([
        api.get("/lothuoc"),
        api.get("/thuoc"),
        api.get("/vitrikho"),
      ]);
      setDanhSachLo(resLo.data || []);
      setDanhSachThuoc(resThuoc.data || []);
      setDanhSachViTri(resViTri.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu lô:", error);
      showError("Lỗi tải dữ liệu lô thuốc");
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={7} className='p-10 text-center text-gray-500'>
            Không tìm thấy lô thuốc nào.
          </td>
        </tr>
      );
    }

    return items.map((lo) => (
      <tr key={lo.malo} className='border-b hover:bg-gray-50 transition'>
        <td className='p-4 font-black text-gray-800'>{lo.solo}</td>
        <td className='p-4 font-medium text-blue-700'>{lo.tenthuoc}</td>
        <td className='p-4 text-center'>
          <span className='font-bold text-blue-600'>{lo.tonkhadung}</span>
          <span className='text-gray-400 mx-1'>/</span>
          <span className='font-medium text-gray-600'>{lo.tonthucte}</span>
        </td>
        <td className='p-4 text-right font-bold text-red-600'>
          {formatCurrency(lo.gianhapgannhat || 0)}
        </td>
        <td className='p-4'>
          <span
            className={
              isExpired(lo.hansudung)
                ? "text-red-600 font-bold line-through"
                : isNearExpired(lo.hansudung)
                ? "text-orange-500 font-bold"
                : "text-gray-600"
            }
          >
            {formatDate(lo.hansudung)}
          </span>
          {isNearExpired(lo.hansudung) && (
            <span className='block text-[10px] text-orange-500 font-bold mt-1'>
              ⚠️ Cận date
            </span>
          )}
        </td>
        <td className='p-4'>
          {getTenViTri(lo.mavitri) ? (
            <span className='text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 whitespace-nowrap inline-block'>
              📍 {getTenViTri(lo.mavitri)}
            </span>
          ) : (
            <span className='text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 whitespace-nowrap inline-block'>
              ⏳ Chờ sắp xếp
            </span>
          )}
        </td>
        <td className='p-4'>
          {lo.trangthai === "khoalo" ? (
            <span className='px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase'>
              Khóa (Hết Hạn)
            </span>
          ) : lo.tonkhadung <= 0 ? (
            <span className='px-2 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold rounded uppercase'>
              Hết hàng
            </span>
          ) : lo.trangthai === "biettru" ? (
            <span className='px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase'>
              Biệt trữ
            </span>
          ) : lo.trangthai === "sansangban" ? (
            <span className='px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase'>
              Sẵn sàng bán
            </span>
          ) : null}
        </td>
        <td className='p-4 text-center'>
          <button
            onClick={() => openEditModal(lo)}
            className='text-white bg-gray-400 hover:bg-blue-500 transition-[.25s] rounded p-2 font-bold hover:cursor-pointer text-sm'
          >
            Sắp xếp
          </button>
        </td>
      </tr>
    ));
  }

  // --- TÌM KIẾM ---
  const displayedLo = danhSachLo.filter((lo) => {
    // 1. XỬ LÝ ĐIỀU KIỆN TRẠNG THÁI (filterValue)
    let matchesStatus = true; // Mặc định true nghĩa là nếu "tatca" thì luôn thỏa mãn

    if (filterValue === "sansangban") {
      matchesStatus = String(lo.trangthai || "").toLowerCase() === "sansangban" && lo.tonkhadung > 0;
    } else if (filterValue === "biettru") {
      matchesStatus = String(lo.trangthai || "").toLowerCase() === "biettru" && lo.tonkhadung > 0;
    } else if (filterValue === "hethang") {
      matchesStatus = lo.tonkhadung <= 0 && String(lo.trangthai || "").toLowerCase() !== "khoalo";
    } else if (filterValue === "khoalo") {
      matchesStatus = String(lo.trangthai || "").toLowerCase() === "khoalo";
    }

    // 2. XỬ LÝ ĐIỀU KIỆN TÌM KIẾM CHỮ (searchQuery)
    const matchesSearch =
      (lo.solo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lo.tenthuoc || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Bắt buộc phải thỏa mãn ĐỒNG THỜI cả trạng thái VÀ từ khóa tìm kiếm
    return matchesStatus && matchesSearch;
  });

  // ĐÃ SỬA: LẤY ĐÚNG TÊN CỘT THEO DATABASE (ma_toado) & ÉP KIỂU STRING
  const getTenViTri = (mavitri: any): string | null => {
    if (!mavitri) return null;
    const vt = danhSachViTri.find(
      (v: any) => String(v.mavitri) === String(mavitri),
    );
    if (vt) return vt.ma_toado; // Trả về tọa độ hiển thị cho gọn (VD: A-01-01)
    return null;
  };

  // --- MỞ MODAL CHỈNH SỬA ---
  const openEditModal = (lo: any) => {
    setEditingId(lo.malo);
    setFormData({
      ...lo,
      ngaysanxuat: lo.ngaysanxuat
        ? new Date(lo.ngaysanxuat).toISOString().split("T")[0]
        : "",
      hansudung: lo.hansudung
        ? new Date(lo.hansudung).toISOString().split("T")[0]
        : "",
      tonthucte: Number(lo.tonthucte),
      tonkhadung: Number(lo.tonkhadung),
      mavitri: lo.mavitri || "", // Đảm bảo lấy đúng vị trí hiện tại
    });
    setShowModal(true);
  };

  // --- XỬ LÝ FORM CHANGE ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["tonthucte", "tonkhadung"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  // --- LƯU DỮ LIỆU ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/lothuoc/${editingId}`, formData);
        showSuccess("Cập nhật thông tin lô thành công!");
      }
      setShowModal(false);
      getData();
    } catch (error: any) {
      showError("Có lỗi xảy ra khi lưu dữ liệu");
      console.error("Lỗi khi lưu:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- CHECK HSD ---
  const isExpired = (hansudung: string): boolean => {
    return new Date(hansudung) < new Date();
  };

  const isNearExpired = (hansudung: string): boolean => {
    const today = new Date();
    const expDate = new Date(hansudung);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 90; // Cận date trong vòng 3 tháng (90 ngày)
  };

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Quản lý Lô thuốc & Tồn kho
        </h2>
        <div className='flex justify-center gap-4'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm số lô, tên thuốc...'
          />
          <FilterNum
            filterValue={filterValue}
            func={setFilterValue}
            itemList={[
              { name: "Tất cả", value: "tatca" },
              { name: "Sẵn sàng bán", value: "sansangban" },
              { name: "Biệt trữ", value: "biettru" },
              { name: "Hết hàng", value: "hethang" },
              { name: "Khóa lô", value: "khoalo" },
            ]}
          />
          <ReloadBtn func={getData} />
        </div>
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
              <tr className='bg-gray-50 text-gray-500 text-xs uppercase border-b'>
                <th className='p-4 font-bold'>Số Lô</th>
                <th className='p-4 font-bold'>Thuốc</th>
                <th className='p-4 font-bold text-center'>
                  Tồn Khả dụng / Thực tế
                </th>
                <th className='p-4 font-bold text-right text-red-600'>Giá vốn (Lần nhập cuối)</th>
                <th className='p-4 font-bold'>Hạn sử dụng</th>
                <th className='p-4 font-bold'>Vị trí kho</th>
                <th className='p-4 font-bold'>Trạng Thái</th>
                <th className='p-4 font-bold text-center'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(displayedLo)}</tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto'>
            <h3 className='text-xl font-bold mb-6 text-gray-800'>
              Cập nhật Lô thuốc & Sắp xếp kho
            </h3>

            <form onSubmit={handleSave}>
              <div className='grid grid-cols-2 gap-4'>
                {/* Số lô */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Số lô (*)
                  </label>
                  <input
                    value={formData.solo}
                    type='text'
                    disabled
                    className='w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed'
                  />
                </div>

                {/* Thuốc */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Thuốc (*)
                  </label>
                  <select
                    name='mathuoc'
                    value={formData.mathuoc}
                    disabled
                    className='w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed'
                  >
                    {danhSachThuoc.map((t) => (
                      <option key={t.mathuoc} value={t.mathuoc}>
                        {t.tenthuoc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ngày sản xuất */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Ngày sản xuất (*)
                  </label>
                  <input
                    name='ngaysanxuat'
                    type='date'
                    value={formData.ngaysanxuat}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>

                {/* Hạn sử dụng */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Hạn sử dụng (*)
                  </label>
                  <input
                    name='hansudung'
                    type='date'
                    value={formData.hansudung}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none'
                    required
                  />
                </div>

                {/* Tồn thực tế */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Tồn thực tế
                  </label>
                  <input
                    name='tonthucte'
                    type='number'
                    value={formData.tonthucte}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg font-bold bg-gray-50 outline-none'
                  />
                </div>

                {/* Tồn khả dụng */}
                <div>
                  <label className='block text-sm font-medium text-gray-500 mb-1'>
                    Tồn khả dụng
                  </label>
                  <input
                    name='tonkhadung'
                    type='number'
                    value={formData.tonkhadung}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border rounded-lg font-bold bg-gray-50 outline-none'
                  />
                </div>

                {/* Vị trí kho */}
                <div className='col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-lg'>
                  <label className='block text-sm font-bold text-indigo-700 mb-2'>
                    📍 Xếp hàng lên kệ (Vị trí kho)
                  </label>
                  <select
                    name='mavitri'
                    value={formData.mavitri}
                    onChange={handleFormChange}
                    className='w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none bg-white font-medium text-indigo-900'
                  >
                    <option value=''>-- Chưa sắp xếp vị trí --</option>
                    {/* ĐÃ SỬA: Lấy tên thuộc tính chuẩn từ DB */}
                    {danhSachViTri.map((vt) => (
                      <option key={vt.mavitri} value={vt.mavitri}>
                        [{vt.loai_baoquan}] {vt.ma_toado} - {vt.ten_vitri}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div className='col-span-2'>
                  <label className='block text-sm font-bold text-gray-700 mb-1'>
                    Trạng thái lô
                  </label>
                  {formData.tonkhadung <= 0 ? (
                    <div className='w-full px-3 py-2 border rounded-lg bg-gray-200 text-gray-600 font-bold'>
                      Đã hết hàng (Không thể đổi trạng thái)
                    </div>
                  ) : (
                    <select
                      name='trangthai'
                      value={formData.trangthai}
                      onChange={handleFormChange}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white font-bold'
                    >
                      <option value='sansangban'>Sẵn sàng bán (Đã lên kệ)</option>
                      <option value='biettru'>Biệt trữ (Chờ kiểm/Chờ xếp)</option>
                      <option value='khoalo'>Khóa lô (Lỗi/Hết hạn)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Buttons */}
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
                  className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400'
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
