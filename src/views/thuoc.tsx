import { useAuthStore } from "../context/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import FilterNum2 from "../components/common/filterNum2";
import ConfirmBox from "../components/common/confirmBox";
import EditBtn from "../components/common/editBtn";
import DeleteBtn from "../components/common/deleteBtn";
import api from "../services/api";
import { showSuccess, showError } from "../utils/notify";

export default function ThuocView() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDelete, setIsDelete] = useState(null);
  const [tatCaThuoc, setTatCaThuoc] = useState([]);
  const [filterValue, setFilterValue] = useState("tatca");
  const [filterValue2, setFilterValue2] = useState("0");
  const [filterValue3, setFilterValue3] = useState("tatca");
  const authStore = useAuthStore();

  const [formData, setFormData] = useState({
    mathuoc: null,
    tenthuoc: "",
    sodangky: "",
    donvicoban: "",
    dieukienbaoquan: "",
    trangthai: 1,
    mota: "",
  });

  // Tải dữ liệu
  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setIsLoading(true);
    try {
      const res = await api.get("/thuoc");
      setTatCaThuoc(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách thuốc:", error);
      showError("Lỗi tải danh sách thuốc");
    } finally {
      setIsLoading(false);
    }
  }

  // Lọc danh sách theo tìm kiếm
  const displayedThuoc = useMemo(() => {
    let filtered = tatCaThuoc;

    switch (filterValue) {
      case "Vỉ":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Hộp":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Lọ":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Chai":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Tuýp":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Gói":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Ống":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      case "Thùng":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.donvicoban === filterValue,
        );
        break;
      default:
        break;
    }

    switch (filterValue2) {
      case "Nơi khô ráo, dưới 30°C":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Nơi khô ráo, tránh ánh sáng, dưới 30°C":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Bảo quản dưới 25°C":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Bảo quản lạnh (2°C - 8°C)":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Nhiệt độ dưới 30°C, không được đóng băng":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      case "Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C":
        filtered = filtered.filter(
          (thuoc: any) => thuoc.dieukienbaoquan === filterValue2,
        );
        break;
      default:
        break;
    }

    if (filterValue3 == "1") {
      filtered = filtered.filter(
        (thuoc: any) => thuoc.trangthai === Number(filterValue3),
      );
    } else if (filterValue3 == "0") {
      filtered = filtered.filter(
        (thuoc: any) => thuoc.trangthai === Number(filterValue3),
      );
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (thuoc: any) =>
          thuoc.tenthuoc.toLowerCase().includes(query) ||
          String(thuoc.mathuoc).toLowerCase().includes(query) ||
          thuoc.sodangky.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [tatCaThuoc, searchQuery, filterValue, filterValue2, filterValue3]);

  function openAddModal() {
    setIsEditMode(false);
    setFormData({
      mathuoc: null,
      tenthuoc: "",
      sodangky: "",
      donvicoban: "",
      dieukienbaoquan: "",
      trangthai: 1,
      mota: "",
    });
    setShowModal(true);
  }

  function openEditModal(thuoc: any) {
    setIsEditMode(true);
    setFormData({
      mathuoc: thuoc.mathuoc,
      tenthuoc: thuoc.tenthuoc,
      sodangky: thuoc.sodangky || "",
      donvicoban: thuoc.donvicoban,
      dieukienbaoquan: thuoc.dieukienbaoquan || "",
      trangthai: thuoc.trangthai,
      mota: thuoc.mota || "",
    });
    setShowModal(true);
  }

  function handleFormChange(e: any) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "trangthai" ? Number(value) : value,
    }));
  }

  async function handleSave(e: any) {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/thuoc/${formData.mathuoc}`, formData);
      } else {
        await api.post("/thuoc", formData);
      }
      setShowModal(false);
      showSuccess(
        isEditMode ? "Cập nhật thuốc thành công" : "Thêm thuốc thành công",
      );
      getData();
    } catch (error) {
      console.error("Lỗi lưu thuốc:", error);
      showError(error.message || "Lỗi khi lưu dữ liệu");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(mathuoc: string) {
    try {
      await api.delete(`/thuoc/${mathuoc}`);
      getData();
      showSuccess("Đã xóa thuốc!");
    } catch (error) {
      console.error("Lỗi xóa thuốc:", error);
      showError(error.message || "Lỗi khi xóa dữ liệu");
    } finally {
      setIsDelete(null);
    }
  }

  function renderItems(items: any[]) {
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={7} className='p-8 text-center text-gray-500'>
            {searchQuery
              ? "Không tìm thấy thuốc phù hợp."
              : "Chưa có dữ liệu thuốc nào trong kho."}
          </td>
        </tr>
      );
    }

    return items.map((thuoc) => (
      <tr key={thuoc.mathuoc} className='border-b hover:bg-gray-50'>
        <td className='p-4 font-medium text-gray-800'>#{thuoc.mathuoc}</td>
        <td className='p-4 text-blue-600 font-medium'>{thuoc.tenthuoc}</td>
        <td className='p-4 text-gray-600'>{thuoc.sodangky || "---"}</td>
        <td className='p-4 text-gray-600 font-medium'>{thuoc.donvicoban}</td>
        <td className='p-4 text-gray-500 text-sm'>
          {thuoc.dieukienbaoquan || "---"}
        </td>
        <td className='p-4'>
          <span
            className={`px-2 py-1 rounded-md text-xs font-bold ${
              thuoc.trangthai === 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {thuoc.trangthai === 1 ? "Kinh doanh" : "Ngừng KD"}
          </span>
        </td>
        <td className='p-4 flex items-center gap-2'>
          {authStore.isAdmin() && (
            <>
              <EditBtn func={() => openEditModal(thuoc)} />
              <DeleteBtn func={() => setIsDelete(thuoc.mathuoc)} />
            </>
          )}
        </td>
      </tr>
    ));
  }

  return (
    <>
      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-800'>Danh mục Thuốc</h2>
          <div className='flex gap-4 items-center'>
            <SearchInput
              searchValue={searchQuery}
              func={setSearchQuery}
              placeholder='Tìm theo tên, mã, SĐK...'
            />

            {authStore.isAdmin() && (
              <AddBtn func={openAddModal} placeholder='+ Thêm thuốc mới' />
            )}

            <FilterNum2
              itemTitle={["Đơn vị", "Bảo quản", "Trạng thái"]}
              itemList={[
                [
                  { name: "Tất cả", value: "tatca" },
                  { name: "Viên", value: "Viên" },
                  { name: "Vỉ", value: "Vỉ" },
                  { name: "Hộp", value: "Hộp" },
                  { name: "Lọ", value: "Lọ" },
                  { name: "Chai", value: "Chai" },
                  { name: "Tuýp", value: "Tuýp" },
                  { name: "Gói", value: "Gói" },
                  { name: "Ống", value: "Ống" },
                  { name: "Thùng", value: "Thùng" },
                ],
                [
                  { name: "Tất cả", value: "0" },
                  {
                    name: "Nơi khô ráo, dưới 30°C",
                    value: "Nơi khô ráo, dưới 30°C",
                  },
                  {
                    name: "Nơi khô ráo, tránh ánh sáng, dưới 30°C",
                    value: "Nơi khô ráo, tránh ánh sáng, dưới 30°C",
                  },
                  { name: "Bảo quản dưới 25°C", value: "Bảo quản dưới 25°C" },
                  {
                    name: "Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C",
                    value: "Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C",
                  },
                  {
                    name: "Bảo quản lạnh (2°C - 8°C)",
                    value: "Bảo quản lạnh (2°C - 8°C)",
                  },
                  {
                    name: "Nhiệt độ dưới 30°C, không được đóng băng",
                    value: "Nhiệt độ dưới 30°C, không được đóng băng",
                  },
                  {
                    name: "Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C",
                    value: "Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C",
                  },
                ],
                [
                  { name: "Tất cả", value: "tatca" },
                  { name: "Kinh doanh", value: "1" },
                  { name: "Ngừng KD", value: "0" },
                ],
              ]}
              func={[setFilterValue, setFilterValue2, setFilterValue3]}
              filterValue={[filterValue, filterValue2, filterValue3]}
            />

            <ReloadBtn func={getData} />
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
                  <th className='p-4 font-semibold'>Mã</th>
                  <th className='p-4 font-semibold'>Tên Thuốc</th>
                  <th className='p-4 font-semibold'>Số ĐK</th>
                  <th className='p-4 font-semibold'>ĐV Cơ Bản</th>
                  <th className='p-4 font-semibold'>Bảo Quản</th>
                  <th className='p-4 font-semibold'>Trạng Thái</th>
                  <th className='p-4 font-semibold'>Thao tác</th>
                </tr>
              </thead>
              <tbody>{renderItems(displayedThuoc)}</tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-xl font-bold text-gray-800'>
                  {isEditMode ? "Cập nhật thông tin thuốc" : "Thêm thuốc mới"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className='text-gray-400 hover:text-gray-600 font-bold text-xl'
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Tên thuốc (*)
                  </label>
                  <input
                    type='text'
                    name='tenthuoc'
                    value={formData.tenthuoc}
                    onChange={handleFormChange}
                    placeholder='Nhập tên thuốc...'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                    required
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Số đăng ký
                    </label>
                    <input
                      type='text'
                      name='sodangky'
                      value={formData.sodangky}
                      onChange={handleFormChange}
                      placeholder='VD: VD-12345-19'
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Đơn vị cơ bản (*)
                    </label>
                    <select
                      name='donvicoban'
                      value={formData.donvicoban}
                      onChange={handleFormChange}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                      required
                    >
                      <option value=''>-- Chọn đơn vị --</option>
                      <option value='Viên'>Viên</option>
                      <option value='Vỉ'>Vỉ</option>
                      <option value='Hộp'>Hộp</option>
                      <option value='Lọ'>Lọ</option>
                      <option value='Chai'>Chai</option>
                      <option value='Tuýp'>Tuýp</option>
                      <option value='Gói'>Gói</option>
                      <option value='Ống'>Ống</option>
                      <option value='Thùng'>Thùng</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Điều kiện bảo quản
                    </label>
                    <select
                      name='dieukienbaoquan'
                      value={formData.dieukienbaoquan}
                      onChange={handleFormChange}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                    >
                      <option value=''>-- Chọn điều kiện bảo quản --</option>
                      <option value='Nơi khô ráo, dưới 30°C'>
                        Nơi khô ráo, dưới 30°C
                      </option>
                      <option value='Nơi khô mát, dưới 30°C'>
                        Nơi khô mát, dưới 30°C
                      </option>
                      <option value='Nơi khô ráo, tránh ánh sáng, dưới 30°C'>
                        Nơi khô ráo, tránh ánh sáng, dưới 30°C
                      </option>
                      <option value='Bảo quản dưới 25°C'>
                        Bảo quản dưới 25°C
                      </option>
                      <option value='Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C'>
                        Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C
                      </option>
                      <option value='Bảo quản lạnh (2°C - 8°C)'>
                        Bảo quản lạnh (2°C - 8°C)
                      </option>
                      <option value='Nhiệt độ dưới 30°C, không được đóng băng'>
                        Nhiệt độ dưới 30°C, không được đóng băng
                      </option>
                      <option value='Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C'>
                        Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Trạng thái
                    </label>
                    <select
                      name='trangthai'
                      value={formData.trangthai}
                      onChange={handleFormChange}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white'
                    >
                      <option value={1}>Đang kinh doanh</option>
                      <option value={0}>Ngừng kinh doanh</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Mô tả thêm
                  </label>
                  <textarea
                    name='mota'
                    value={formData.mota}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder='Chỉ định, chống chỉ định, lưu ý...'
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none'
                  />
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
                    className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2'
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
            message='Bạn có chắc chắn muốn xóa thuốc này?'
            onConfirm={() => handleDelete(isDelete)}
            onCancel={() => setIsDelete(null)}
          />
        )}
      </div>
    </>
  );
}
