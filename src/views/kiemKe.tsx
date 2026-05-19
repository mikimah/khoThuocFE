import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useAuthStore } from "../context/useAuthStore";
import SearchInput from "../components/common/searchInput";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import { showSuccess,showError } from "../utils/notify";

export default function KiemKeView() {
  const authStore = useAuthStore();
  const [danhSachPhieu, setDanhSachPhieu] = useState<any[]>([]);
  const [danhSachLo, setDanhSachLo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE CHO MODAL CHI TIẾT ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);

  // Form tạo phiếu mới
  const [masterForm, setMasterForm] = useState({
    maphieu: "",
    ngaykiemke: new Date().toISOString().split("T")[0],
    nguoitao: authStore.user?.tendangnhap || "NhanVien",
    trangthai: "dangkhiemke",
  });

  const [chiTietKiemKe, setChiTietKiemKe] = useState<any[]>([]);

  // --- TẢI DỮ LIỆU ---
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resPhieu, resLo]: any = await Promise.all([
        api.get("/phieukiemke"),
        api.get("/lothuoc"),
      ]);
      setDanhSachPhieu(resPhieu.data || []);
      setDanhSachLo(resLo.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu kiểm kê:", error);
      showError("Lỗi tải dữ liệu kiểm kê");
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    return items.map((item, index) => (
      <tr
        key={index}
        className='border-b border-dashed hover:bg-gray-50 transition'
      >
        <td className='p-2'>
          <select
            value={item.malo}
            onChange={(e) => handleChonLo(index, e.target.value)}
            className='w-full px-2 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500'
          >
            <option value='' disabled>
              -- Chọn lô thuốc --
            </option>
            {danhSachLo.map((lo) => (
              <option key={lo.malo} value={lo.malo}>
                {lo.solo} - {lo.tenthuoc}
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 text-center font-bold text-gray-500'>
          {item.ton_he_thong}
        </td>
        <td className='p-2'>
          <input
            type='number'
            value={item.soluong_thuc_te}
            onChange={(e) => handleSoLuongChange(index, Number(e.target.value))}
            className='w-24 px-2 py-2 border border-blue-300 rounded-md text-center font-black text-blue-700 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-500'
          />
        </td>
        <td className='p-2 text-center'>
          <span
            className={
              item.soluong_tru > 0
                ? "text-red-600"
                : item.soluong_tru < 0
                  ? "text-green-600"
                  : "text-gray-400"
            }
            style={{ fontWeight: "bold" }}
          >
            {item.soluong_tru > 0
              ? `-${item.soluong_tru}`
              : item.soluong_tru < 0
                ? `+${Math.abs(item.soluong_tru)}`
                : "0"}
          </span>
        </td>
        <td className='p-2'>
          <input
            type='text'
            value={item.lydo}
            onChange={(e) => handleLyDoChange(index, e.target.value)}
            placeholder='Lý do lệch...'
            className='w-full px-2 py-2 border rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500'
          />
        </td>
        <td className='p-2 text-center'>
          <button
            onClick={() => xoaDong(index)}
            className='text-gray-300 hover:text-red-500 font-bold text-xl transition'
          >
            ×
          </button>
        </td>
      </tr>
    ));
  }

  const openForm = () => {
    const now = new Date();
    const timestamp = now.getTime();
    setMasterForm((prev) => ({
      ...prev,
      maphieu: `PKK-${timestamp}`,
    }));
    setChiTietKiemKe([]);
    setShowForm(true);
  };

  // --- HÀM MỞ POPUP CHI TIẾT KIỂM KÊ ---
  const openDetail = async (phieu: any) => {
    setSelectedMaster(phieu);
    setShowDetailModal(true);
    setIsLoadingDetail(true);
    setSelectedDetails([]);

    try {
      const res: any = await api.get(`/chitietkiemke/phieu/${phieu.maphieu}`);
      setSelectedDetails(res.data || []);
    } catch (error: any) {
      console.log("Lỗi tải chi tiết kiểm kê: " + (error.message || "Lỗi hệ thống"));
      showError("Lỗi tải chi tiết kiểm kê");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedMaster(null);
    setSelectedDetails([]);
  };

  const themDongKiemKe = () => {
    setChiTietKiemKe((prev) => [
      ...prev,
      {
        malo: "",
        ton_he_thong: 0,
        soluong_thuc_te: 0,
        soluong_tru: 0,
        lydo: "",
      },
    ]);
  };

  const xoaDong = (index: number) => {
    setChiTietKiemKe((prev) => prev.filter((_, i) => i !== index));
  };

  // Khi chọn lô, tự động điền tồn kho hiện tại trong hệ thống
  const handleChonLo = (index: number, value: string) => {
    const loSelected = danhSachLo.find((l: any) => l.malo === value);
    setChiTietKiemKe((prev) => {
      const newData = [...prev];
      newData[index].malo = value;
      if (loSelected) {
        newData[index].ton_he_thong = loSelected.tonthucte;
        tinhToanLech(newData[index]);
      }
      return newData;
    });
  };

  const tinhToanLech = (item: any) => {
    item.soluong_tru = Number(item.ton_he_thong) - Number(item.soluong_thuc_te);
  };

  const handleSoLuongChange = (index: number, value: number) => {
    setChiTietKiemKe((prev) => {
      const newData = [...prev];
      newData[index].soluong_thuc_te = value;
      tinhToanLech(newData[index]);
      return newData;
    });
  };

  const handleLyDoChange = (index: number, value: string) => {
    setChiTietKiemKe((prev) => {
      const newData = [...prev];
      newData[index].lydo = value;
      return newData;
    });
  };

  const getTonHeThong = (row: any) => {
    const val = row?.ton_he_thong ?? row?.tonhethong ?? row?.tonthucte;
    return val === undefined || val === null ? null : Number(val);
  };

  const getSoDemThucTe = (row: any) => {
    const explicit = row?.sodemthucte ?? row?.soluong_thucte;
    if (explicit !== undefined && explicit !== null) return Number(explicit);
    const tonHeThong = getTonHeThong(row);
    if (tonHeThong === null) return null;
    return tonHeThong - Number(row?.soluong_tru || 0);
  };

  const handleSaveKiemKe = async () => {
    if (chiTietKiemKe.length === 0) {
      showError("Vui lòng thêm ít nhất một mặt hàng để kiểm kê!");
      return;
    }

    try {
      setIsLoading(true);
      // 1. Tạo phiếu tổng (Master)
      await api.post("/phieukiemke", masterForm);

      // 2. Tạo chi tiết cho từng dòng
      const promises = chiTietKiemKe.map((item) =>
        api.post("/chitietkiemke", {
          maphieu: masterForm.maphieu,
          malo: item.malo,
          soluong_tru: item.soluong_tru,
          lydo: item.lydo,
        }),
      );

      await Promise.all(promises);
      showSuccess("Đã gửi phiếu kiểm kê! Chờ Admin phê duyệt để cập nhật kho.");
      setShowForm(false);
      getData();
    } catch (error: any) {
      console.log("Lỗi khi lưu phiếu kiểm kê: " + error.message);
      showError("Lỗi khi lưu phiếu kiểm kê");
    } finally {
      setIsLoading(false);
    }
  };

  const displayedPhieu = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return danhSachPhieu;
    return danhSachPhieu.filter(
      (p: any) =>
        p.maphieu.toLowerCase().includes(query) ||
        p.nguoitao.toLowerCase().includes(query),
    );
  }, [danhSachPhieu, searchQuery]);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleString("vi-VN");

  if (showForm) {
    return (
      <div className='bg-gray-50 -m-6 p-6 min-h-screen'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setShowForm(false)}
                className='w-10 h-10 bg-white rounded-full shadow flex justify-center items-center text-gray-600 font-bold hover:bg-gray-100 transition'
              >
                ←
              </button>
              <h2 className='text-2xl font-bold text-gray-800'>
                Lập Phiếu Kiểm Kê Mới
              </h2>
            </div>
            <button
              onClick={handleSaveKiemKe}
              disabled={isLoading}
              className='bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-lg transition disabled:bg-gray-400'
            >
              Gửi Phiếu Duyệt
            </button>
          </div>

          <div className='grid grid-cols-12 gap-6'>
            <div className='col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4'>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>
                  Mã Phiếu Tự Động
                </label>
                <input
                  value={masterForm.maphieu}
                  readOnly
                  className='w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono text-sm text-gray-500'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>
                  Nhân Viên Kiểm Kê
                </label>
                <input
                  value={masterForm.nguoitao}
                  readOnly
                  className='w-full px-3 py-2 bg-gray-50 border rounded-lg font-bold text-blue-600 text-sm'
                />
              </div>
              <div className='p-3 bg-blue-50 rounded-lg border border-blue-100'>
                <p className='text-[11px] text-blue-700 leading-relaxed'>
                  <b>Lưu ý:</b> Sau khi gửi, Admin sẽ kiểm tra lại số lượng lệch
                  trước khi cập nhật tồn kho chính thức.
                </p>
              </div>
            </div>

            <div className='col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-200'>
              <div className='flex justify-between items-center border-b pb-3 mb-4'>
                <h3 className='font-bold text-gray-700 text-sm uppercase'>
                  Danh sách mặt hàng kiểm đếm
                </h3>
                <button
                  onClick={themDongKiemKe}
                  className='bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold border border-blue-200 transition'
                >
                  + Chọn Lô Kiểm Kê
                </button>
              </div>

              <table className='w-full text-left'>
                <thead>
                  <tr className='text-[10px] text-gray-400 uppercase border-b'>
                    <th className='p-3 font-bold w-1/3'>Lô Thuốc</th>
                    <th className='p-3 font-bold text-center'>Tồn HT</th>
                    <th className='p-3 font-bold text-center'>Thực Tế</th>
                    <th className='p-3 font-bold text-center'>Chênh Lệch</th>
                    <th className='p-3 font-bold'>Lý do / Ghi chú</th>
                    <th className='p-3 w-10'></th>
                  </tr>
                </thead>
                <tbody>{renderItems(displayedPhieu)}</tbody>
              </table>
              {chiTietKiemKe.length === 0 && (
                <div className='py-20 text-center text-gray-400 italic text-sm'>
                  Bấm "+ Chọn Lô Kiểm Kê" để bắt đầu nhập dữ liệu đếm thực tế.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Lịch sử Kiểm kê kho
        </h2>
        <div className='flex gap-4'>
          <SearchInput
            searchValue={searchQuery}
            func={setSearchQuery}
            placeholder='Tìm mã phiếu...'
          />
          {!authStore.isAdmin() && (
            <AddBtn func={openForm} placeholder='Lập phiếu kiểm kê mới' />
          )}

          <ReloadBtn func={getData} />
        </div>
      </div>

      {isLoading ? (
        <div className='text-center py-10 text-gray-500 font-medium italic'>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-500 text-xs uppercase border-b'>
                <th className='p-4 font-bold'>Mã Phiếu</th>
                <th className='p-4 font-bold'>Ngày thực hiện</th>
                <th className='p-4 font-bold'>Người tạo</th>
                <th className='p-4 font-bold'>Trạng thái</th>
                <th className='p-4 font-bold text-center'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedPhieu.length > 0 ? (
                displayedPhieu.map((phieu) => (
                  <tr
                    key={phieu.maphieu}
                    className='border-b hover:bg-gray-50 transition'
                  >
                    <td className='p-4 font-bold text-gray-800'>
                      {phieu.maphieu}
                    </td>
                    <td className='p-4 text-gray-600 text-sm'>
                      {formatDate(phieu.ngaykiemke)}
                    </td>
                    <td className='p-4 font-medium text-gray-700'>
                      {phieu.nguoitao}
                    </td>
                    <td className='p-4'>
                      {phieu.trangthai === "hoanthanh" ? (
                        <span className='bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-green-200'>
                          Hoàn thành
                        </span>
                      ) : (
                        <span className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-yellow-200'>
                          Đang đợi duyệt
                        </span>
                      )}
                    </td>
                    <td className='p-4 text-center'>
                      <button
                        onClick={() => openDetail(phieu)}
                        className='px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition'
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='p-10 text-center text-gray-400'>
                    Không tìm thấy dữ liệu kiểm kê nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Chi tiết */}
      {showDetailModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100'>
            <div className='px-6 py-4 border-b flex items-center justify-between bg-gray-50'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>
                  Chi tiết Phiếu Kiểm Kê{" "}
                  <span className='text-orange-600'>
                    #{selectedMaster?.maphieu}
                  </span>
                </h3>
              </div>
              <button
                onClick={closeDetail}
                className='text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition'
              >
                ×
              </button>
            </div>

            {isLoadingDetail ? (
              <div className='p-16 text-center text-gray-500'>
                Đang tải dữ liệu chi tiết...
              </div>
            ) : (
              <div className='p-6 overflow-y-auto flex-1 space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200'>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Nhân viên kiểm kê
                    </p>
                    <p className='font-bold text-gray-800'>
                      {selectedMaster?.nguoitao || "---"}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Thời gian lập phiếu
                    </p>
                    <p className='font-bold text-gray-800'>
                      {formatDate(selectedMaster?.ngaykiemke)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Trạng thái kho
                    </p>
                    {selectedMaster?.trangthai === "hoanthanh" ? (
                      <span className='text-green-600 font-bold text-sm'>
                        ✅ Đã bù trừ kho
                      </span>
                    ) : (
                      <span className='text-yellow-600 font-bold text-sm'>
                        ⏳ Chờ Admin duyệt
                      </span>
                    )}
                  </div>
                </div>

                <div className='bg-white border rounded-xl overflow-hidden shadow-sm'>
                  <div className='px-5 py-3 border-b bg-gray-50'>
                    <h4 className='font-bold text-gray-800 uppercase text-sm'>
                      Danh sách đối soát
                    </h4>
                  </div>

                  <div className='overflow-x-auto'>
                    <table className='w-full text-left'>
                      <thead>
                        <tr className='text-[11px] text-gray-500 uppercase bg-gray-50 border-b'>
                          <th className='px-5 py-3 font-bold'>Lô thuốc</th>
                          <th className='px-5 py-3 font-bold text-center'>
                            Tồn hệ thống
                          </th>
                          <th className='px-5 py-3 font-bold text-center'>
                            Số đếm thực tế
                          </th>
                          <th className='px-5 py-3 font-bold text-center'>
                            Chênh lệch
                          </th>
                          <th className='px-5 py-3 font-bold'>
                            Lý do / Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {selectedDetails.length > 0 ? (
                          selectedDetails.map((row, idx) => (
                            <tr
                              key={idx}
                              className='hover:bg-gray-50 transition'
                            >
                              <td className='px-5 py-3 text-sm font-bold text-gray-800'>
                                {row.solo || row.malo || "---"}
                              </td>
                              <td className='px-5 py-3 text-sm text-center text-gray-500 font-medium'>
                                {getTonHeThong(row) ?? "---"}
                              </td>
                              <td className='px-5 py-3 text-sm text-center font-bold text-blue-600'>
                                {getSoDemThucTe(row) ?? "---"}
                              </td>
                              <td
                                className={`px-5 py-3 text-sm text-center font-black ${
                                  Number(row.soluong_tru) > 0
                                    ? "text-red-600"
                                    : Number(row.soluong_tru) < 0
                                      ? "text-green-600"
                                      : "text-gray-400"
                                }`}
                              >
                                {Number(row.soluong_tru) > 0
                                  ? `-${row.soluong_tru} (Thiếu)`
                                  : Number(row.soluong_tru) < 0
                                    ? `+${Math.abs(row.soluong_tru)} (Dư)`
                                    : "0 (Khớp)"}
                              </td>
                              <td className='px-5 py-3 text-sm text-gray-600 italic'>
                                {row.lydo || "Không có ghi chú"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className='px-5 py-8 text-center text-gray-400 italic'
                            >
                              Không có dữ liệu đối soát.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className='px-6 py-4 border-t bg-gray-50 flex justify-end'>
              <button
                onClick={closeDetail}
                className='px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-sm transition'
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
