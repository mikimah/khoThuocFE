import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/customFunction";
import ReloadBtn from "../components/common/reloadBtn";

export default function DuyetDonHangView() {
  const [danhSachTong, setDanhSachTong] = useState<any[]>([]);
  const [danhSachDonVi, setDanhSachDonVi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterLoai, setFilterLoai] = useState("all"); // all | nhap | xuat | kiemke

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // --- TẢI DỮ LIỆU ---
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resDH, resPKK, resDV]: any = await Promise.all([
        api.get("/donhang"),
        api.get("/phieukiemke"),
        api.get("/donvitinh"),
      ]);

      setDanhSachDonVi(resDV.data || []);

      // CHỈ LỌC NHỮNG ĐƠN HÀNG ĐANG CHỜ DUYỆT
      const dhChoDuyet = resDH.data.filter(
        (dh: any) => dh.trangthai === "choduyet",
      );

      // CHỈ LỌC NHỮNG PHIẾU KIỂM KÊ ĐANG CHỜ DUYỆT
      const pkkChoDuyet = (resPKK.data || [])
        .filter(
          (p: any) => p.trangthai === "dangkhiemke" || p.trangthai === "Draft",
        )
        .map((p: any) => ({
          madonhang: p.maphieu,
          loaidonhang: "kiemke",
          tendoitac: p.nguoitao,
          tonggiatri: 0,
          ngaytao: p.ngaykiemke,
          trangthai: "choduyet",
        }));

      // Gộp chung 2 mảng chờ duyệt và sắp xếp
      const combined = [...dhChoDuyet, ...pkkChoDuyet].sort(
        (a, b) => new Date(a.ngaytao).getTime() - new Date(b.ngaytao).getTime(),
      );
      setDanhSachTong(combined);
    } catch (error) {
      console.error("Lỗi tải dữ liệu kiểm duyệt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    return items.length > 0 ? (
      items.map((item: any) => (
        <tr
          key={item.madonhang}
          className='border-b hover:bg-gray-50 transition'
        >
          <td className='p-4 font-black text-gray-800'>#{item.madonhang}</td>
          <td className='p-4'>
            {item.loaidonhang === "nhap" && (
              <span className='px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 rounded uppercase'>
                📦 Nhập Kho
              </span>
            )}
            {item.loaidonhang === "xuat" && (
              <span className='px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 rounded uppercase'>
                🚚 Xuất Kho
              </span>
            )}
            {item.loaidonhang === "kiemke" && (
              <span className='px-2.5 py-1 bg-orange-50 text-orange-700 font-bold text-[10px] border border-orange-200 rounded uppercase'>
                ⚖️ Kiểm Kê
              </span>
            )}
          </td>
          <td className='p-4 font-medium text-gray-700'>{item.tendoitac}</td>
          <td className='p-4'>
            {item.loaidonhang !== "kiemke" ? (
              <span className='font-black text-red-600'>
                {formatCurrency(item.tonggiatri)}
              </span>
            ) : (
              <span className='text-orange-600 font-bold text-sm italic'>
                Đối soát hàng hóa
              </span>
            )}
          </td>
          <td className='p-4 text-gray-500 text-sm font-medium'>
            {formatDate(item.ngaytao)}
          </td>

          <td className='p-4 flex gap-2 justify-center'>
            <button
              onClick={() => openDetail(item)}
              className='px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition'
            >
              Chi tiết
            </button>

            {item.loaidonhang === "kiemke" ? (
              <>
                <button
                  onClick={() => handleDuyetKiemKe(item.madonhang)}
                  className='px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded shadow-sm transition'
                >
                  Duyệt
                </button>
                <button
                  onClick={() => handleHuyKiemKe(item.madonhang)}
                  className='px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded transition'
                >
                  Từ chối
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    handleDuyetDonHang(item.madonhang, item.loaidonhang)
                  }
                  className='px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded shadow-sm transition'
                >
                  Duyệt
                </button>
                <button
                  onClick={() => handleHuyDonHang(item.madonhang)}
                  className='px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded transition'
                >
                  Từ chối
                </button>
              </>
            )}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={6} className='p-20 text-center'>
          <div className='text-6xl mb-4'>🎉</div>
          <h3 className='text-xl font-bold text-gray-700 mb-1'>Inbox Zero!</h3>
          <p className='text-gray-500 text-sm'>
            Tuyệt vời, không còn yêu cầu nào đang chờ bạn phê duyệt.
          </p>
        </td>
      </tr>
    );
  }

  // --- LỌC DỮ LIỆU TỔNG HỢP (Theo Tab + Text) ---
  const filteredDanhSach = useMemo(() => {
    if (filterLoai === "all") return danhSachTong;
    return danhSachTong.filter((item) => item.loaidonhang === filterLoai);
  }, [danhSachTong, filterLoai]);

  // --- XỬ LÝ DUYỆT ĐƠN HÀNG (NHẬP/XUẤT) ---
  const handleDuyetDonHang = async (id: number, loai: string) => {
    const tenLoai = loai === "nhap" ? "Phiếu Nhập" : "Đơn Xuất";
    if (
      !window.confirm(
        `Xác nhận DUYỆT ${tenLoai} #${id}? Kho và công nợ sẽ được cập nhật tự động.`,
      )
    )
      return;

    try {
      await api.put(`/donhang/${id}/trangthai`, { trangthai: "daduyet" });
      alert(`Đã duyệt thành công!`);
      getData();
    } catch (error: any) {
      alert(
        "Lỗi khi duyệt đơn: " +
          (error.response?.data?.message || error.message || "Lỗi hệ thống"),
      );
    }
  };

  // --- XỬ LÝ HỦY / TỪ CHỐI ĐƠN HÀNG ---
  const handleHuyDonHang = async (id: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI / HỦY đơn #${id} này?`))
      return;

    try {
      await api.put(`/donhang/${id}/trangthai`, { trangthai: "huy" });
      alert(`Đã từ chối đơn hàng!`);
      getData();
    } catch (error: any) {
      alert(
        "Lỗi khi hủy đơn: " + (error.response?.data?.message || "Lỗi hệ thống"),
      );
    }
  };

  // --- XỬ LÝ DUYỆT PHIẾU KIỂM KÊ ---
  const handleDuyetKiemKe = async (maphieu: string) => {
    if (
      !window.confirm(
        `Xác nhận duyệt kết quả kiểm kê ${maphieu}? Tồn kho thực tế sẽ được bù trừ ngay lập tức.`,
      )
    )
      return;

    try {
      await api.put(`/phieukiemke/${maphieu}/trangthai`, {
        trangthai: "hoanthanh",
      });
      alert(`Đã hoàn tất kiểm kê và cập nhật kho!`);
      getData();
    } catch (error: any) {
      alert(
        "Lỗi khi duyệt phiếu kiểm kê: " +
          (error.response?.data?.message || "Lỗi hệ thống"),
      );
    }
  };

  // --- XỬ LÝ HỦY PHIẾU KIỂM KÊ ---
  const handleHuyKiemKe = async (maphieu: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn TỪ CHỐI phiếu kiểm kê ${maphieu} này?`,
      )
    )
      return;

    try {
      await api.put(`/phieukiemke/${maphieu}/trangthai`, { trangthai: "huy" });
      alert(`Đã từ chối phiếu kiểm kê!`);
      getData();
    } catch (error: any) {
      alert(
        "Lỗi khi từ chối phiếu kiểm kê: " +
          (error.response?.data?.message || "Lỗi hệ thống"),
      );
    }
  };

  // --- HELPER FUNCTIONS ---
  const normalizeMaster = (data: any) => (Array.isArray(data) ? data[0] : data);

  const openDetail = async (item: any) => {
    setIsLoadingDetail(true);
    setSelectedMaster(null);
    setSelectedDetails([]);
    setShowDetailModal(true);

    try {
      if (item.loaidonhang === "kiemke") {
        const [resMaster, resDetails]: any = await Promise.all([
          api.get(`/phieukiemke/${item.madonhang}`),
          api.get(`/chitietkiemke/phieu/${item.madonhang}`),
        ]);

        const master = normalizeMaster(resMaster.data) || {};
        setSelectedMaster({ ...master, loaidonhang: "kiemke" });
        setSelectedDetails(resDetails.data || []);
      } else {
        const [resMaster, resDetails]: any = await Promise.all([
          api.get(`/donhang/${item.madonhang}`),
          api.get(`/chitietdonhang/donhang/${item.madonhang}`),
        ]);

        const master = normalizeMaster(resMaster.data) || {};
        setSelectedMaster({ ...master, loaidonhang: item.loaidonhang });
        setSelectedDetails(resDetails.data || []);
      }
    } catch (error: any) {
      alert(
        "Lỗi khi tải chi tiết: " +
          (error.response?.data?.message || error.message || "Lỗi hệ thống"),
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedMaster(null);
    setSelectedDetails([]);
  };

  const isKiemKeSelected = selectedMaster?.loaidonhang === "kiemke";

  const getTenDonVi = (row: any) => {
    if (row?.tendonvi || row?.donvi) return row.tendonvi || row.donvi;
    const ma = row?.madonvitinh;
    if (!ma) return "---";
    const dv = danhSachDonVi.find((d: any) => d.madonvitinh === ma);
    return dv?.tendonvi || ma || "---";
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

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-3'>
          <h2 className='text-2xl font-bold text-gray-800'>
            Trung Tâm Kiểm Duyệt
          </h2>
          <span className='bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-sm'>
            {danhSachTong.length} Yêu cầu
          </span>
        </div>

        <div className='flex justify-center gap-4'>
          <div className='flex bg-gray-100 p-1 rounded-lg border'>
            {["all", "nhap", "xuat", "kiemke"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterLoai(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                  filterLoai === tab
                    ? "bg-white shadow " +
                      (tab === "nhap"
                        ? "text-purple-600"
                        : tab === "xuat"
                          ? "text-blue-600"
                          : tab === "kiemke"
                            ? "text-orange-600"
                            : "text-gray-800")
                    : "text-gray-500"
                }`}
              >
                {tab === "all"
                  ? "Tất cả"
                  : tab === "nhap"
                    ? "Nhập kho"
                    : tab === "xuat"
                      ? "Xuất kho"
                      : "Kiểm kê"}
              </button>
            ))}
          </div>

          <ReloadBtn func={getData} />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className='text-center py-10 text-gray-500'>
          Đang tải danh sách chờ duyệt...
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-gray-50 text-gray-600 text-sm border-b'>
                <th className='p-4 font-semibold'>Mã Phiếu/Đơn</th>
                <th className='p-4 font-semibold'>Phân Loại</th>
                <th className='p-4 font-semibold'>Đối Tác / Người tạo</th>
                <th className='p-4 font-semibold'>Giá Trị / Ghi chú</th>
                <th className='p-4 font-semibold'>Thời gian tạo</th>
                <th className='p-4 font-semibold text-center'>Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderItems(filteredDanhSach)}</tbody>
          </table>
        </div>
      )}

      {/* Modal Chi tiết */}
      {showDetailModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col border border-gray-100'>
            {/* Header */}
            <div className='px-6 py-4 border-b flex items-center justify-between bg-gray-50'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>
                  Chi tiết{" "}
                  {selectedMaster?.loaidonhang === "kiemke"
                    ? "Phiếu Kiểm Kê"
                    : selectedMaster?.loaidonhang === "nhap"
                      ? "Phiếu Nhập"
                      : "Đơn Xuất"}
                  <span className='text-blue-600'>
                    #{selectedMaster?.madonhang || selectedMaster?.maphieu}
                  </span>
                </h3>
                <p className='text-xs text-gray-500 mt-1'>
                  Tổng quan & danh sách chi tiết
                </p>
              </div>
              <button
                onClick={closeDetail}
                className='text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition'
              >
                ×
              </button>
            </div>

            {/* Content */}
            {isLoadingDetail ? (
              <div className='p-16 text-center text-gray-500'>
                Đang tải chi tiết...
              </div>
            ) : (
              <div className='p-6 flex-1 space-y-6'>
                {/* Info Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200'>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Mã Phiếu/Đơn
                    </p>
                    <p className='font-bold text-gray-800'>
                      #{selectedMaster?.madonhang || selectedMaster?.maphieu}
                    </p>
                  </div>
                  {!isKiemKeSelected && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase font-bold'>
                        Đối tác
                      </p>
                      <p className='font-bold text-gray-800'>
                        {selectedMaster?.tendoitac || "---"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Người lập phiếu
                    </p>
                    <p className='font-bold text-gray-800'>
                      {selectedMaster?.tendangnhap ||
                        selectedMaster?.nguoitao ||
                        "---"}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase font-bold'>
                      Ngày tạo
                    </p>
                    <p className='font-bold text-gray-800'>
                      {formatDate(
                        selectedMaster?.ngaytao ||
                          selectedMaster?.ngaykiemke ||
                          new Date(),
                      )}
                    </p>
                  </div>
                  {!isKiemKeSelected && (
                    <div>
                      <p className='text-xs text-gray-500 uppercase font-bold'>
                        Hóa đơn GTGT / Vận đơn
                      </p>
                      <p className='font-bold text-gray-800'>
                        {selectedMaster?.sohoadongtgt ||
                          selectedMaster?.mavandon3pl ||
                          "---"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Details Table */}
                <div className='bg-white border rounded-xl overflow-hidden shadow-sm'>
                  <div className='px-5 py-3 border-b bg-gray-50'>
                    <h4 className='font-bold text-gray-800 uppercase text-sm'>
                      Danh sách hàng hóa chi tiết
                    </h4>
                  </div>

                  <div className='overflow-x-auto'>
                    <table className='w-full text-left'>
                      <thead>
                        <tr className='text-[11px] text-gray-500 uppercase bg-gray-50 border-b'>
                          {!isKiemKeSelected ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <th className='px-5 py-3 font-bold'>Lô thuốc</th>
                              <th className='px-5 py-3 font-bold text-right'>
                                Tồn hệ thống
                              </th>
                              <th className='px-5 py-3 font-bold text-right'>
                                Số đếm thực tế
                              </th>
                              <th className='px-5 py-3 font-bold text-right'>
                                Chênh lệch
                              </th>
                              <th className='px-5 py-3 font-bold'>Lý do</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {selectedDetails.length > 0 ? (
                          selectedDetails.map((row: any, idx: number) =>
                            !isKiemKeSelected ? (
                              <tr
                                key={idx}
                                className='hover:bg-gray-50 transition'
                              >
                                <td className='px-5 py-3 text-sm font-medium text-gray-800'>
                                  {row.tenthuoc || row.tenThuoc || "---"}
                                </td>
                                <td className='px-5 py-3 text-sm text-gray-600 font-bold'>
                                  {row.solo ||
                                    row.solo_tam ||
                                    row.malo ||
                                    "---"}
                                </td>
                                <td className='px-5 py-3 text-sm text-gray-600'>
                                  {getTenDonVi(row)}
                                </td>
                                <td className='px-5 py-3 text-sm text-right text-blue-600 font-bold'>
                                  {row.soluongthucte ?? row.soluongyeucau ?? 0}
                                </td>
                                <td className='px-5 py-3 text-sm text-right text-gray-700'>
                                  {formatCurrency(
                                    row.dongia ?? row.gianhap ?? 0,
                                  )}
                                </td>
                                <td className='px-5 py-3 text-sm text-right font-black text-gray-800'>
                                  {formatCurrency(
                                    Number(
                                      row.soluongthucte ??
                                        row.soluongyeucau ??
                                        0,
                                    ) * Number(row.dongia ?? row.gianhap ?? 0),
                                  )}
                                </td>
                              </tr>
                            ) : (
                              <tr
                                key={idx}
                                className='hover:bg-gray-50 transition'
                              >
                                <td className='px-5 py-3 text-sm font-bold text-gray-800'>
                                  {row.solo || row.malo || "---"}
                                </td>
                                <td className='px-5 py-3 text-sm text-right text-gray-500'>
                                  {getTonHeThong(row) ?? "---"}
                                </td>
                                <td className='px-5 py-3 text-sm text-right font-bold text-blue-600'>
                                  {getSoDemThucTe(row) ?? "---"}
                                </td>
                                <td
                                  className={`px-5 py-3 text-sm text-right font-black ${
                                    Number(row.soluong_tru) > 0
                                      ? "text-red-600"
                                      : Number(row.soluong_tru) < 0
                                        ? "text-green-600"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {Number(row.soluong_tru) > 0
                                    ? `-${row.soluong_tru}`
                                    : Number(row.soluong_tru) < 0
                                      ? `+${Math.abs(row.soluong_tru)}`
                                      : "0"}
                                </td>
                                <td className='px-5 py-3 text-sm text-gray-600 italic'>
                                  {row.lydo || "---"}
                                </td>
                              </tr>
                            ),
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={isKiemKeSelected ? 5 : 6}
                              className='px-5 py-8 text-center text-gray-400 italic'
                            >
                              Không có dữ liệu chi tiết.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                {!isKiemKeSelected && (
                  <div className='flex justify-end mt-6'>
                    <div className='w-80 bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm'>
                      <div className='flex justify-between mb-3 text-sm text-orange-600 font-medium'>
                        <span>Chiết khấu:</span>
                        <span>
                          - {formatCurrency(selectedMaster?.tienchietkhau || 0)}
                        </span>
                      </div>
                      <div className='flex justify-between mb-3 text-sm text-blue-700 font-black border-t border-gray-200 pt-3'>
                        <span>Cần thanh toán:</span>
                        <span>
                          {formatCurrency(selectedMaster?.tonggiatri || 0)}
                        </span>
                      </div>
                      <div className='flex justify-between mb-3 text-sm text-green-600 font-bold'>
                        <span>Đã thanh toán (Đã trả):</span>
                        <span>
                          -{" "}
                          {formatCurrency(selectedMaster?.tiendathanhtoan || 0)}
                        </span>
                      </div>
                      <div className='flex justify-between font-black text-red-600 text-lg border-t border-gray-200 pt-3 mt-1'>
                        <span>Công nợ phiếu này:</span>
                        <span>
                          {formatCurrency(
                            Math.max(
                              0,
                              (selectedMaster?.tonggiatri || 0) -
                                (selectedMaster?.tiendathanhtoan || 0),
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
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
