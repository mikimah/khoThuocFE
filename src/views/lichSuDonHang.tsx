import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/customFunction";
import ReloadBtn from "../components/common/reloadBtn";
import { Search } from "lucide-react";
import { showSuccess,showError } from "../utils/notify";

export default function LichSuDonHangView() {
  const [danhSachDonHang, setDanhSachDonHang] = useState<any[]>([]);
  const [danhSachDonVi, setDanhSachDonVi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLoai, setFilterLoai] = useState("all"); // all | nhap | xuat
  const [filterTrangThai, setFilterTrangThai] = useState("all"); // all | choduyet | daduyet | huy

  // --- STATE CHO MODAL CHI TIẾT ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resDH, resDV]: any = await Promise.all([
        api.get("/donhang"),
        api.get("/donvitinh"),
      ]);
      setDanhSachDonHang(resDH.data || []);
      setDanhSachDonVi(resDV.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu lịch sử đơn hàng:", error);
      showError("Lỗi tải dữ liệu lịch sử đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    return items.length > 0 ? (
      items.map((dh) => (
        <tr
          key={dh.madonhang}
          className='border-b border-dashed hover:bg-gray-50 transition'
        >
          <td className='p-4 font-black text-gray-800'>#{dh.madonhang}</td>
          <td className='p-4'>
            <span
              className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                String(dh.loaidonhang || "")
                  .trim()
                  .toLowerCase() === "nhap"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {String(dh.loaidonhang || "")
                .trim()
                .toLowerCase() === "nhap"
                ? "📦 Nhập"
                : "🚚 Xuất"}
            </span>
          </td>

          <td className='p-4'>
            <div className='flex items-center gap-2'>
              <div className='w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600'>
                {dh.tendangnhap ? dh.tendangnhap.charAt(0).toUpperCase() : "U"}
              </div>
              <span className='font-medium text-gray-700 text-sm'>
                {dh.tendangnhap || `TK#${dh.mataikhoan}`}
              </span>
            </div>
          </td>

          <td className='p-4 text-gray-700 font-medium text-sm'>
            {dh.tendoitac}
          </td>
          <td className='p-4 text-red-600 font-bold text-right'>
            {formatCurrency(dh.tonggiatri)}
          </td>
          <td className='p-4 text-gray-500 text-xs font-medium'>
            {formatDate(dh.ngaytao)}
          </td>

          <td className='p-4 text-center'>
            {dh.trangthai === "choduyet" ? (
              <span className='inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-[11px] font-bold rounded'>
                Đợi duyệt
              </span>
            ) : dh.trangthai === "daduyet" ? (
              <span className='inline-block px-2 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded'>
                Đã duyệt
              </span>
            ) : (
              <span className='inline-block px-2 py-1 bg-gray-100 text-gray-500 text-[11px] font-bold rounded'>
                Đã hủy
              </span>
            )}
          </td>

          <td className='p-4 text-center'>
            <button
              onClick={() => openDetail(dh)}
              className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition'
            >
              Chi tiết
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={8} className='p-16 text-center text-gray-400'>
          <span className='text-4xl block mb-2'>📭</span>
          <p className='text-sm'>
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
          </p>
        </td>
      </tr>
    );
  }

  function renderItems2(items: any[]) {
    return items.length > 0 ? (
      items.map((row, idx) => (
        <tr key={idx} className='hover:bg-gray-50 transition'>
          <td className='px-5 py-3 text-sm font-medium text-gray-800'>
            {row.tenthuoc || row.tenThuoc || "---"}
          </td>
          <td className='px-5 py-3 text-sm text-gray-600 font-bold'>
            {row.solo || row.solo_tam || row.malo || "---"}
          </td>
          <td className='px-5 py-3 text-sm text-gray-600'>
            {getTenDonVi(row)}
          </td>
          <td className='px-5 py-3 text-sm text-right text-blue-600 font-bold'>
            {row.soluongthucte ?? row.soluongyeucau ?? 0}
          </td>
          <td className='px-5 py-3 text-sm text-right text-gray-700'>
            {formatCurrency(row.dongia ?? row.gianhap ?? 0)}
          </td>
          <td className='px-5 py-3 text-sm text-right font-black text-gray-800'>
            {formatCurrency(
              Number(row.soluongthucte ?? row.soluongyeucau ?? 0) *
                Number(row.dongia ?? row.gianhap ?? 0),
            )}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={6} className='px-5 py-8 text-center text-gray-400 italic'>
          Không có dữ liệu chi tiết.
        </td>
      </tr>
    );
  }

  // --- LOGIC LỌC ĐA TẦNG ---
  const filteredDonHang = useMemo(() => {
    return danhSachDonHang
      .filter((dh: any) => {
        // 1. Lọc theo Text (Mã ĐH, Tên Khách/NCC)
        const query = searchQuery.trim().toLowerCase();
        const matchText =
          !query ||
          String(dh.madonhang).includes(query) ||
          (dh.tendoitac && dh.tendoitac.toLowerCase().includes(query));

        // 2. Lọc theo Loại (Nhập / Xuất)
        const loai = String(dh.loaidonhang || "")
          .trim()
          .toLowerCase();
        const matchLoai = filterLoai === "all" || loai === filterLoai;

        // 3. Lọc theo Trạng thái
        const matchTrangThai =
          filterTrangThai === "all" || dh.trangthai === filterTrangThai;

        return matchText && matchLoai && matchTrangThai;
      })
      .sort(
        (a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime(),
      ); // Sắp xếp mới nhất lên đầu
  }, [danhSachDonHang, searchQuery, filterLoai, filterTrangThai]);

  const normalizeMaster = (data: any) => (Array.isArray(data) ? data[0] : data);

  // --- HÀM MỞ CHI TIẾT ---
  const openDetail = async (dh: any) => {
    setShowDetailModal(true);
    setIsLoadingDetail(true);
    setSelectedMaster(null);
    setSelectedDetails([]);

    try {
      const [resMaster, resDetails]: any = await Promise.all([
        api.get(`/donhang/${dh.madonhang}`),
        api.get(`/chitietdonhang/donhang/${dh.madonhang}`),
      ]);

      const master = normalizeMaster(resMaster.data) || {};
      setSelectedMaster({ ...master, loaidonhang: dh.loaidonhang });
      setSelectedDetails(resDetails.data || []);
    } catch (error: any) {
      console.log(
        "Lỗi tải chi tiết: " +
          (error.response?.data?.message || error.message || "Lỗi hệ thống"),
      );
      showError("Lỗi tải chi tiết đơn hàng");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedMaster(null);
    setSelectedDetails([]);
  };

  const getTenDonVi = (row: any) => {
    if (row?.tendonvi || row?.donvi) return row.tendonvi || row.donvi;
    const ma = row?.madonvitinh;
    if (!ma) return "---";
    const dv = danhSachDonVi.find((d: any) => d.madonvitinh === ma);
    return dv?.tendonvi || ma || "---";
  };

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    getData();
  }, []);

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
           Lịch sử Giao dịch
        </h2>
        <ReloadBtn func={getData} />
      </div>

      <div className='flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200'>
        <div className='flex-1 min-w-[200px]'>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Tìm kiếm
          </label>
          <div className='relative'>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type='text'
              placeholder='Tìm mã đơn, tên đối tác...'
              className='w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500'
            />
            <span className='absolute right-3 top-[45%] transform -translate-y-1/2 text-gray-400'><Search className="inline-block w-5 h-5" /></span>
          </div>
        </div>

        <div className='w-48'>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Phân loại
          </label>
          <select
            value={filterLoai}
            onChange={(e) => setFilterLoai(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>Tất cả</option>
            <option value='nhap'>📦 Phiếu Nhập Kho</option>
            <option value='xuat'>🚚 Đơn Xuất Kho</option>
          </select>
        </div>

        <div className='w-48'>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Trạng thái
          </label>
          <select
            value={filterTrangThai}
            onChange={(e) => setFilterTrangThai(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>Tất cả trạng thái</option>
            <option value='choduyet'>⏳ Chờ duyệt</option>
            <option value='daduyet'>✅ Đã hoàn thành</option>
            <option value='huy'>❌ Đã hủy</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải lịch sử giao dịch...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='text-xs text-gray-500 uppercase border-b bg-white'>
                <th className='p-4 font-bold'>Mã ĐH</th>
                <th className='p-4 font-bold'>Loại</th>
                <th className='p-4 font-bold'>Người Lập Phiếu</th>
                <th className='p-4 font-bold'>Đối Tác</th>
                <th className='p-4 font-bold text-right'>Tổng Tiền</th>
                <th className='p-4 font-bold'>Ngày Tạo</th>
                <th className='p-4 font-bold text-center'>Trạng Thái</th>
                <th className='p-4 font-bold text-center'>Hành Động</th>
              </tr>
            </thead>
            <tbody>{renderItems(filteredDonHang)}</tbody>
          </table>
        </div>
      )}

      {/* Modal Chi tiết */}
      {showDetailModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100'>
            <div className='px-6 py-4 border-b flex items-center justify-between bg-gray-50'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>
                  Chi tiết{" "}
                  {selectedMaster?.loaidonhang === "nhap"
                    ? "Phiếu Nhập"
                    : "Đơn Xuất"}{" "}
                  <span className='text-blue-600'>
                    #{selectedMaster?.madonhang}
                  </span>
                </h3>
              </div>
              <button
                onClick={closeDetail}
                className='text-gray-400 hover:text-red-500 text-2xl font-bold transition'
              >
                ×
              </button>
            </div>

            {isLoadingDetail ? (
              <div className='p-10 text-center text-gray-500'>
                Đang tải chi tiết...
              </div>
            ) : (
              <div className='p-6 overflow-y-auto flex-1 space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200'>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Đối tác
                    </p>
                    <p className='font-bold text-gray-800'>
                      {selectedMaster?.tendoitac || "---"}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Người lập phiếu
                    </p>
                    <p className='font-bold text-gray-800'>
                      {selectedMaster?.tendangnhap || "---"}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Ngày tạo
                    </p>
                    <p className='font-bold text-gray-800'>
                      {formatDate(selectedMaster?.ngaytao || Date.now())}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Trạng thái
                    </p>
                    {selectedMaster?.trangthai === "choduyet" ? (
                      <span className='text-yellow-600 font-bold text-sm'>
                        ⏳ Chờ duyệt
                      </span>
                    ) : selectedMaster?.trangthai === "daduyet" ? (
                      <span className='text-green-600 font-bold text-sm'>
                        ✅ Đã duyệt
                      </span>
                    ) : (
                      <span className='text-gray-500 font-bold text-sm'>
                        ❌ Đã hủy
                      </span>
                    )}
                  </div>
                </div>

                <div className='bg-white border rounded-xl overflow-hidden'>
                  <div className='px-5 py-3 border-b bg-gray-50'>
                    <h4 className='font-bold text-gray-800 uppercase text-sm'>
                      Danh sách hàng hóa
                    </h4>
                  </div>

                  <div className='overflow-x-auto'>
                    <table className='w-full text-left'>
                      <thead>
                        <tr className='text-[11px] text-gray-500 uppercase bg-gray-50 border-b'>
                          <th className='px-5 py-3 font-bold'>Tên thuốc</th>
                          <th className='px-5 py-3 font-bold'>Số lô</th>
                          <th className='px-5 py-3 font-bold'>Đơn vị</th>
                          <th className='px-5 py-3 font-bold text-right'>
                            Số lượng
                          </th>
                          <th className='px-5 py-3 font-bold text-right'>
                            Đơn giá
                          </th>
                          <th className='px-5 py-3 font-bold text-right'>
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {renderItems2(selectedDetails)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className='flex justify-end'>
                  <div className='w-80 bg-gray-50 p-4 rounded-xl border border-gray-200'>
                    <div className='flex justify-between mb-2 text-sm text-orange-600 font-medium'>
                      <span>Chiết khấu:</span>
                      <span>
                        - {formatCurrency(selectedMaster?.tienchietkhau || 0)}
                      </span>
                    </div>
                    <div className='flex justify-between mb-2 text-sm text-blue-600 font-bold border-t pt-2'>
                      <span>Cần thanh toán:</span>
                      <span>
                        {formatCurrency(selectedMaster?.tonggiatri || 0)}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm text-green-600 font-bold'>
                      <span>Đã thanh toán (Đã trả):</span>
                      <span>
                        - {formatCurrency(selectedMaster?.tiendathanhtoan || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='px-6 py-4 border-t bg-gray-50 flex justify-end'>
              <button
                onClick={closeDetail}
                className='px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
