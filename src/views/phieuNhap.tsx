import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useAuthStore } from "../context/useAuthStore";
import {
  formatDate,
  formatCurrency,
  extractLeadingNum,
  extractLoCode,
  extractDate,
  extractPrice,
  convertYYMMDDToDate,
  addYearsToDate,
  parseMoney,
} from "../utils/customFunction";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import { showSuccess, showError } from "../utils/notify";
import { ScanQrCode, X } from "lucide-react";

export default function PhieuNhapView() {
  const authStore = useAuthStore();
  const [danhSachDonHang, setDanhSachDonHang] = useState<any[]>([]);
  const [danhSachNhaCungCap, setDanhSachNhaCungCap] = useState<any[]>([]);
  const [danhSachThuoc, setDanhSachThuoc] = useState<any[]>([]);
  const [danhSachDonVi, setDanhSachDonVi] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    const element = document.getElementById("reader");
    if (!element) return;
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,

        // 1. 🛠️ Cấu hình lại qrbox thành HÌNH CHỮ NHẬT để dễ quét Barcode nằm ngang hơn
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Chiều rộng vùng quét chiếm 40% khung camera
          const width = Math.floor(viewfinderWidth * 0.8);
          // Chiều cao vùng quét dẹt lại (chỉ chiếm khoảng 30% chiều cao khung camera hoặc cố định tầm 100px - 150px)
          const height = Math.floor(viewfinderHeight * 0.3);

          return {
            width: width < 250 ? 250 : width, // Đảm bảo chiều rộng tối thiểu đủ bao quát mã vạch
            height: height < 100 ? 100 : height,
          };
        },

        videoConstraints: {
          facingMode: "environment",
        },

        // 2. 🛠️ BƯỚC QUAN TRỌNG: Khai báo định dạng Barcode muốn quét
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128, // Chuẩn mã vạch quản lý kho nội bộ cực tốt
          // Html5QrcodeSupportedFormats.EAN_13, // Chuẩn mã vạch thương mại có sẵn trên hộp thuốc
          // Html5QrcodeSupportedFormats.QR_CODE, // Chuẩn mã vạch QR code
        ],

        rememberLastUsedCamera: false,
        showTorchButtonIfSupported: true,
        disableFlip: true,
      },
      false,
    );

    scanner.render(success, error);

    function success(result: any) {
      // 1. Dừng quét an toàn
      scanner.clear().catch((err) => console.error("Lỗi đóng camera:", err));
      setShowQrScanner(false);

      // 2. Tạo một biến để chứa mảng sau khi giải mã chữ -> mảng
      const decodedString = result || "";
      const id = extractLeadingNum(decodedString);
      const loCode = extractLoCode(decodedString);
      const extractedDate = extractDate(decodedString);
      const dateS = convertYYMMDDToDate(extractedDate);
      const yearsAdd = dateS.charAt(Number(extractedDate.slice(-1)));
      const dateE = addYearsToDate(dateS, Number(yearsAdd) || 0);
      const price = parseMoney(extractPrice(decodedString));

      console.log({
        id,
        loCode,
        extractedDate,
        dateS,
        yearsAdd,
        dateE,
        price,
      });

      // 3. Tiến hành map và cập nhật vào State chi tiết phiếu nhập
      try {
        const newItems = {
          mathuoc: id || "",
          madonvitinh: "",
          solo: loCode || "",
          ngaysanxuat: dateS || "",
          hansudung: dateE || "",
          soluongthucte: 1,
          soluongyeucau: 1,
          gianhap: price || 0,
        };

        console.log(newItems);

        // Cập nhật State 1 lần duy nhất
        setChiTietData((prevData) => [...prevData, newItems]);
      } catch (e) {
        console.error("Lỗi khi thêm mục vào danh sách:", e);
        showError("Lỗi khi thêm mục vào danh sách. Vui lòng thử lại.");
      }
    }

    function error(errorMessage: any) {
      console.warn("Code scan error:", errorMessage);
    }
  }, [showQrScanner]);

  const [masterForm, setMasterForm] = useState({
    madoitac: "",
    sohoadongtgt: "",
    tienchietkhau: 0,
    tiendathanhtoan: 0,
  });

  const [chiTietData, setChiTietData] = useState<any[]>([]);

  // --- STATE CHO MODAL CHI TIẾT ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);

  const nhaCungCapDuocChon = useMemo(() => {
    if (!masterForm.madoitac) return null;
    return (
      danhSachNhaCungCap.find(
        (dt: any) => dt.madoitac === masterForm.madoitac,
      ) || null
    );
  }, [masterForm.madoitac, danhSachNhaCungCap]);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resDH, resDT, resThuoc, resDV]: any = await Promise.all([
        api.get("/donhang/loai/nhap"),
        api.get("/doitac/loai/NhaCungCap"),
        api.get("/thuoc"),
        api.get("/donvitinh"),
      ]);

      const donHangData = (resDH.data || []).map((dh: any) => ({
        ...dh,
        tonggiatri: Number(dh.tonggiatri) || 0,
        tienchietkhau: Number(dh.tienchietkhau) || 0,
        tiendathanhtoan: Number(dh.tiendathanhtoan) || 0,
      }));

      setDanhSachDonHang(donHangData);
      setDanhSachNhaCungCap(
        (resDT.data || []).filter((dt: any) => dt.trangthai === "Dang hop tac"),
      );
      setDanhSachThuoc(
        (resThuoc.data || []).filter((t: any) => Number(t.trangthai) === 1),
      );
      setDanhSachDonVi(resDV.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      showError("Không thể tải dữ liệu");
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
        <td className='p-2 align-top'>
          <select
            value={item.mathuoc || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                mathuoc: selectedId,
                madonvitinh: "",
              };
              setChiTietData(updatedData);
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            required
          >
            <option value='' disabled>
              -- Chọn thuốc --
            </option>
            {danhSachThuoc.map((t) => (
              <option key={t.mathuoc} value={t.mathuoc}>
                {t.tenthuoc}
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top'>
          <select
            value={item.madonvitinh || ""}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                madonvitinh: e.target.value,
              };
              setChiTietData(updatedData);
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            disabled={!item.mathuoc}
            required
          >
            <option value='' disabled>
              -- ĐV --
            </option>
            {getDonViTheoThuoc(item.mathuoc).map((dv: any) => (
              <option key={dv.madonvitinh} value={dv.madonvitinh}>
                {dv.tendonvi} ( x{dv.hesoquydoi})
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top flex flex-col gap-1.5'>
          {/* ĐÃ SỬA: Xóa nút sấm sét tự tạo lô, bắt người dùng phải tự nhập */}
          <input
            value={item.solo}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                solo: e.target.value.toUpperCase(), // Tự động viết hoa số lô cho chuyên nghiệp
              };
              setChiTietData(updatedData);
            }}
            type='text'
            placeholder='Nhập đúng số lô trên hộp...'
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            required
          />
          <div className='flex items-center justify-between'>
            <span className='text-[10px] font-bold text-gray-500 w-10'>
              NSX:
            </span>
            <input
              value={item.ngaysanxuat}
              onChange={(e) => {
                const updatedData = [...chiTietData];
                updatedData[index] = {
                  ...item,
                  ngaysanxuat: e.target.value,
                };
                setChiTietData(updatedData);
              }}
              type='date'
              className='w-full ml-1 px-1 py-1 border border-gray-300 rounded-md text-[11px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
              required
            />
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-[10px] font-bold text-gray-500 w-10'>
              HSD:
            </span>
            <input
              value={item.hansudung}
              onChange={(e) => {
                const updatedData = [...chiTietData];
                updatedData[index] = {
                  ...item,
                  hansudung: e.target.value,
                };
                setChiTietData(updatedData);
              }}
              type='date'
              className='w-full ml-1 px-1 py-1 border border-gray-300 rounded-md text-[11px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
              required
            />
          </div>
        </td>
        <td className='p-2 align-top'>
          <input
            value={item.soluongyeucau}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                soluongyeucau: Number(e.target.value),
              };
              setChiTietData(updatedData);
            }}
            type='number'
            min='1'
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center font-bold shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          />
        </td>
        <td className='p-2 align-top'>
          <input
            value={item.soluongthucte}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                soluongthucte: Number(e.target.value),
              };
              setChiTietData(updatedData);
            }}
            onBlur={() => validateSoLuong(item, index)}
            type='number'
            min='1'
            className='w-full px-2 py-2 border border-blue-300 rounded-md text-sm text-center font-black text-blue-700 bg-blue-50 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          />
        </td>
        <td className='p-2 align-top'>
          <input
            value={item.gianhap}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                gianhap: Number(e.target.value),
              };
              setChiTietData(updatedData);
            }}
            type='number'
            min='0'
            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          />
        </td>
        <td className='p-2 align-top text-right'>
          <span className='font-black text-gray-700 text-[15px] block pt-2'>
            {formatCurrency(getLineTotal(item))}
          </span>
        </td>
        <td className='p-2 align-top text-center pt-3'>
          <button
            onClick={() => xoaDong(index)}
            className='text-red-500 hover:text-red-700 font-bold text-2xl transition'
            title='Xóa dòng này'
          >
            ×
          </button>
        </td>
      </tr>
    ));
  }

  const openForm = () => {
    setMasterForm({
      madoitac: "",
      sohoadongtgt: "",
      tienchietkhau: 0,
      tiendathanhtoan: 0,
    });
    setChiTietData([]);
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const openDetail = async (dh: any) => {
    setShowDetailModal(true);
    setIsLoadingDetail(true);
    setSelectedDetails([]);
    setSelectedMaster(null);

    try {
      const [resMaster, resDetails]: any = await Promise.all([
        api.get(`/donhang/${dh.madonhang}`),
        api.get(`/chitietdonhang/donhang/${dh.madonhang}`),
      ]);
      setSelectedMaster(resMaster.data || dh);
      setSelectedDetails(resDetails.data || []);
    } catch (error: any) {
      console.warn("Lỗi tải chi tiết: " + (error.message || "Lỗi hệ thống"));
      showError("Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMaster(null);
    setSelectedDetails([]);
  };

  // ĐÃ SỬA: Hàm themDongChiTiet khởi tạo Số Lô rỗng để ép thủ kho nhập tay
  const themDongChiTiet = () => {
    setChiTietData([
      ...chiTietData,
      {
        mathuoc: "",
        madonvitinh: "",
        solo: "",
        hansudung: "",
        ngaysanxuat: "",
        soluongyeucau: 1,
        soluongthucte: 1,
        gianhap: 0,
      },
    ]);
  };

  const xoaDong = (index: number) => {
    setChiTietData(chiTietData.filter((_, i) => i !== index));
  };

  const getDonViTheoThuoc = (mathuoc: any) => {
    if (!mathuoc) return [];
    return danhSachDonVi.filter(
      (dv: any) => String(dv.mathuoc) === String(mathuoc),
    );
  };

  const validateSoLuong = (item: any, index: number) => {
    if (item.soluongthucte > item.soluongyeucau) {
      showError(
        `LỖI: Số lượng thực nhận (${item.soluongthucte}) không được lớn hơn số lượng trên chứng từ (${item.soluongyeucau})!\nVui lòng lập biên bản thừa hàng nếu NCC giao dư.`,
      );
      const updatedData = [...chiTietData];
      updatedData[index] = { ...item, soluongthucte: item.soluongyeucau };
      setChiTietData(updatedData);
    }
  };

  const tongTienHang = useMemo(() => {
    return chiTietData.reduce((sum, item) => {
      const soLuong = Number(item.soluongthucte) || 0;
      const giaNhap = Number(item.gianhap) || 0;
      return sum + soLuong * giaNhap;
    }, 0);
  }, [chiTietData]);

  const tongTienThanhToan = useMemo(() => {
    return Math.max(0, tongTienHang - Number(masterForm.tienchietkhau));
  }, [tongTienHang, masterForm.tienchietkhau]);

  useEffect(() => {
    setMasterForm((prev) => ({
      ...prev,
      tiendathanhtoan: tongTienThanhToan,
    }));
  }, [tongTienThanhToan]);

  const handleSaveDonHang = async () => {
    if (!masterForm.madoitac || chiTietData.length === 0) {
      showError("Vui lòng chọn Nhà cung cấp và thêm mặt hàng!");
      return;
    }

    // ĐÃ SỬA: Chấp nhận chuỗi Hóa đơn điện tử chuẩn (Ví dụ: 1C26TAA-00001234)
    const soHoaDon = (masterForm.sohoadongtgt || "").trim();
    if (soHoaDon && soHoaDon.length < 5) {
      showError(
        "LỖI: Định dạng Số hóa đơn GTGT không hợp lệ. Vui lòng kiểm tra lại!",
      );
      return;
    }

    if (
      chiTietData.some(
        (item) =>
          !item.madonvitinh ||
          !item.solo ||
          !item.hansudung ||
          !item.ngaysanxuat,
      )
    ) {
      showError(
        "Vui lòng nhập đủ Đơn vị, Số Lô, Ngày sản xuất và Hạn sử dụng cho tất cả hàng hóa!",
      );
      return;
    }

    if (chiTietData.some((item) => item.soluongthucte > item.soluongyeucau)) {
      showError(
        "Lỗi: Tồn tại mặt hàng có số lượng thực nhận lớn hơn chứng từ!",
      );
      return;
    }

    const ngayNhap = new Date();
    const ngayNhapISO = new Date(
      ngayNhap.getFullYear(),
      ngayNhap.getMonth(),
      ngayNhap.getDate(),
    )
      .toISOString()
      .split("T")[0];

    for (const item of chiTietData) {
      const thuoc: any = danhSachThuoc.find(
        (t: any) =>
          t.mathuoc === String(item.mathuoc) || t.mathuoc === item.mathuoc,
      );

      const sodangky = String(thuoc?.sodangky || "").toUpperCase();
      const hsd = new Date(item.hansudung);
      const nsx = new Date(item.ngaysanxuat);

      if (nsx >= hsd) {
        showError(
          `LỖI: Tại mặt hàng [${thuoc?.tenthuoc || "Không rõ"}], Ngày sản xuất phải diễn ra TRƯỚC Hạn sử dụng!`,
        );
        return;
      }

      if (hsd <= ngayNhap) {
        showError(
          `LỖI: Thuốc [${thuoc?.tenthuoc || "Không rõ"}] đã hết hạn sử dụng. Không được phép nhập kho!`,
        );
        return;
      }

      if (sodangky.startsWith("VN") || sodangky.startsWith("VNA")) {
        const thangTuoiTho =
          (hsd.getFullYear() - nsx.getFullYear()) * 12 +
          (hsd.getMonth() - nsx.getMonth());
        const thangTuNgaySanXuat =
          (ngayNhap.getFullYear() - nsx.getFullYear()) * 12 +
          (ngayNhap.getMonth() - nsx.getMonth());

        if (thangTuoiTho <= 36 && thangTuNgaySanXuat > 6) {
          showError(
            `LỖI GSP: Thuốc nhập khẩu [${thuoc?.tenthuoc || "Không rõ"}] có tuổi thọ ${thangTuoiTho} tháng.\nQuy định: Không được nhập kho khi đã quá 6 tháng kể từ Ngày Sản Xuất (Lô này đã qua ${thangTuNgaySanXuat} tháng)!`,
          );
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      const donHangData = {
        madoitac: masterForm.madoitac,
        mataikhoan: authStore.user?.mataikhoan,
        loaidonhang: "nhap",
        sohoadongtgt: masterForm.sohoadongtgt,
        mavandon3pl: null,
        tonggiatri: tongTienThanhToan,
        tienchietkhau: masterForm.tienchietkhau,
        tiendathanhtoan: masterForm.tiendathanhtoan,
        trangthai: "choduyet",
      };

      const resMaster: any = await api.post("/donhang", donHangData);
      const newDonHangId = resMaster.data.madonhang_moi;

      const promises = chiTietData.map((item) =>
        api.post("/chitietdonhang", {
          madonhang: newDonHangId,
          mathuoc: item.mathuoc,
          malo: null,
          solo_tam: item.solo,
          ngaysanxuat_tam: item.ngaysanxuat,
          hansudung_tam: item.hansudung,
          madonvitinh: item.madonvitinh,
          soluongyeucau: item.soluongyeucau,
          soluongthucte: item.soluongthucte,
          dongia: item.gianhap,
          ngaynhap: ngayNhapISO,
        }),
      );

      await Promise.all(promises);
      showSuccess(
        "Tạo Phiếu Nhập thành công! Đang chờ Admin duyệt để cộng tồn kho.",
      );
      closeForm();
      getData();
    } catch (error: any) {
      console.error("Lỗi khi lưu:", error);
      showError(error.message || "Có lỗi xảy ra khi lưu phiếu nhập");
    } finally {
      setIsLoading(false);
    }
  };

  const getLineTotal = (item: any) =>
    (Number(item?.soluongthucte) || 0) *
    (Number(item?.dongia || item?.gianhap) || 0);

  const tongTienHangChiTiet = useMemo(() => {
    return selectedDetails.reduce((sum, item) => sum + getLineTotal(item), 0);
  }, [selectedDetails]);

  useEffect(() => {
    getData();
  }, []);

  const handleScanQRCode = () => {
    // Implement QR code scanning logic here
  };

  if (showForm) {
    return (
      <div className='bg-gray-50 -m-6 p-6 min-h-screen relative'>
        <div className='max-w-[1450px] mx-auto'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4'>
              <button
                onClick={closeForm}
                className='w-10 h-10 bg-white rounded-full shadow flex justify-center items-center text-gray-600 hover:bg-gray-100 font-bold text-xl transition'
              >
                ←
              </button>
              <h2 className='text-2xl font-bold text-gray-800'>
                Tạo Phiếu Nhập Kho Mới
              </h2>
            </div>

            <div className='flex gap-4'>
              <div className='flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-200'>
                <div className='text-center px-4 border-r'>
                  <p className='text-[10px] text-gray-500 uppercase font-bold'>
                    Tổng Tiền Hàng
                  </p>
                  <p className='text-sm font-semibold text-gray-700'>
                    {formatCurrency(tongTienHang)}
                  </p>
                </div>
                <div className='text-center px-4 border-r'>
                  <p className='text-[10px] text-orange-500 uppercase font-bold'>
                    Chiết Khấu (Từ NCC)
                  </p>
                  <p className='text-sm font-semibold text-orange-600'>
                    - {formatCurrency(masterForm.tienchietkhau)}
                  </p>
                </div>
                <div className='text-center px-4'>
                  <p className='text-[10px] text-red-500 uppercase font-bold'>
                    Cần Thanh Toán
                  </p>
                  <p className='text-lg font-black text-red-600'>
                    {formatCurrency(tongTienThanhToan)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveDonHang}
                disabled={isLoading}
                className='bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-md transition disabled:bg-gray-400'
              >
                Lưu Phiếu & Trình Duyệt
              </button>
            </div>
          </div>

          <div className='w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4'>
            <h3 className='font-bold text-gray-700 border-b pb-2 uppercase text-sm'>
              Thông tin Phiếu Nhập
            </h3>
            <div className="flex items-start justify-center  gap-3">

            <div className="flex-[1_1_50%]">
              <div>
                <label className='block text-xs font-medium text-gray-500 mb-1'>
                  CHỌN NHÀ CUNG CẤP (*)
                </label>
                <select
                  value={masterForm.madoitac}
                  onChange={(e) =>
                    setMasterForm({
                      ...masterForm,
                      madoitac: e.target.value,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500'
                  required
                >
                  <option value='' disabled>
                    -- Chọn nhà cung cấp --
                  </option>
                  {danhSachNhaCungCap.map((dt) => (
                    <option key={dt.madoitac} value={dt.madoitac}>
                      {dt.tendoitac}
                    </option>
                  ))}
                </select>
                {nhaCungCapDuocChon && (
                  <div className='mt-2 bg-blue-50 border border-blue-100 p-2 rounded text-[11px] text-gray-700 space-y-1'>
                    <p>
                      <b>Mã số thuế:</b>{" "}
                      <span className='text-blue-700 font-black'>
                        {nhaCungCapDuocChon.masothue || "Chưa cập nhật"}
                      </span>
                    </p>
                    <p className='truncate' title={nhaCungCapDuocChon.diachi}>
                      <b>Địa chỉ:</b> {nhaCungCapDuocChon.diachi || "---"}
                    </p>
                  </div>
                )}
              </div>

              <div className='mt-2'>
                <label className='block text-xs font-medium text-gray-500 mb-1'>
                  SỐ HÓA ĐƠN GTGT
                </label>
                {/* ĐÃ SỬA: Mở rộng ký tự để nhập đúng chuẩn Hóa đơn điện tử */}
                <input
                  value={masterForm.sohoadongtgt}
                  onChange={(e) =>
                    setMasterForm({
                      ...masterForm,
                      sohoadongtgt: e.target.value.toUpperCase(),
                    })
                  }
                  type='text'
                  maxLength={20}
                  placeholder='VD: 1C26TAA-00001234'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase'
                />
              </div>
            </div>

            <div className=' space-y-3 flex-[1_1_50%]'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-500 font-bold uppercase text-[10px]'>
                  Tiền hàng:
                </span>
                <span className='font-medium text-gray-800'>
                  {formatCurrency(tongTienHang)}
                </span>
              </div>
              <div>
                <label className='block text-[10px] font-bold text-gray-500 mb-1 uppercase'>
                  Chiết khấu từ NCC (VND):
                </label>
                <input
                  value={masterForm.tienchietkhau}
                  onChange={(e) =>
                    setMasterForm({
                      ...masterForm,
                      tienchietkhau: Number(e.target.value),
                    })
                  }
                  type='number'
                  min='0'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-right font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-400'
                />
              </div>
              <div className='flex justify-between items-center pt-2 border-t text-red-600 mb-4 bg-red-50 px-2 py-3 rounded'>
                <span className='font-bold text-sm'>CẦN TRẢ NCC:</span>
                <span className='font-black text-xl'>
                  {formatCurrency(tongTienThanhToan)}
                </span>
              </div>

              <div>
                <label className='block text-[10px] font-bold text-blue-600 mb-1 uppercase'>
                  TIỀN ĐÃ TRẢ NCC (VND)
                </label>
                <input
                  value={masterForm.tiendathanhtoan}
                  readOnly
                  type='number'
                  className='w-full px-4 py-3 border-2 border-blue-400 bg-gray-100 text-blue-700 rounded-lg text-right font-black outline-none cursor-not-allowed transition'
                />
              </div>
            </div>
                  </div>
          </div>
          <div className='grid grid-cols-12 gap-6 mt-5'>
            <div className='col-span-12 bg-white p-5 rounded-xl shadow-sm border border-gray-200'>
              <div className='flex justify-between items-center border-b pb-3 mb-4'>
                <h3 className='font-bold text-gray-700 uppercase text-sm'>
                  Chi tiết hàng nhập (Vốn)
                </h3>
                <div className='flex items-center justify-center gap-2'>
                  <button
                    onClick={handleScanQRCode}
                    type='button'
                    className='text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg font-bold border border-blue-200 transition'
                  >
                    <ScanQrCode
                      size={20}
                      onClick={() => setShowQrScanner(true)}
                    />
                  </button>
                  <button
                    onClick={themDongChiTiet}
                    type='button'
                    className='text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold border border-blue-200 transition'
                  >
                    + Thêm dòng
                  </button>
                </div>
              </div>

              <div className='overflow-x-auto min-h-[400px]'>
                <table className='w-full text-left'>
                  <thead>
                    <tr className='text-[11px] text-gray-500 uppercase border-b bg-gray-50/80'>
                      <th className='p-3 min-w-[200px] font-bold rounded-tl-lg'>
                        Tên Thuốc
                      </th>
                      <th className='p-3 min-w-[140px] font-bold'>
                        ĐV Giao Dịch
                      </th>
                      <th className='p-3 min-w-[150px] font-bold'>
                        Tạo Lô Mới / HSD
                      </th>
                      <th className='p-3 min-w-[90px] text-center font-bold'>
                        SL CT
                      </th>
                      <th className='p-3 min-w-[100px] text-center font-bold text-blue-600'>
                        SL Thực
                      </th>
                      <th className='p-3 min-w-[150px] text-right font-bold'>
                        Giá Nhập (Vốn)
                      </th>
                      <th className='p-3 min-w-[150px] text-right font-bold text-gray-700'>
                        Thành Tiền
                      </th>
                      <th className='p-3 w-10 rounded-tr-lg'></th>
                    </tr>
                  </thead>
                  <tbody>{renderItems(chiTietData)}</tbody>
                </table>

                {chiTietData.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-16 text-gray-400 border-b border-dashed'>
                    <p className='text-sm'>
                      Chưa có hàng hóa nào trong phiếu nhập.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showQrScanner && (
          <div className='z-20 flex items-start justify-center absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-black/20'>
            <div
              id='reader'
              className={`w-[60%] mt-5 p-5 h-auto bg-white flex flex-col justify-center items-center `}
            ></div>
            <X
              size={40}
              className='absolute top-4 bg-white rounded-full right-4 cursor-pointer'
              onClick={() => setShowQrScanner(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Quản lý Nhập Kho (Mua hàng)
        </h2>
        <div className='flex gap-4'>
          <AddBtn func={openForm} placeholder='Tạo Phiếu Nhập' />
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
                <th className='p-4 font-semibold'>Mã Phiếu</th>
                <th className='p-4 font-semibold'>Nhà Cung Cấp</th>
                <th className='p-4 font-semibold'>Tổng Tiền (Vốn)</th>
                <th className='p-4 font-semibold'>Công Nợ NCC</th>
                <th className='p-4 font-semibold'>Ngày Tạo</th>
                <th className='p-4 font-semibold'>Trạng Thái</th>
                <th className='p-4 font-semibold text-center'>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {danhSachDonHang.map((dh) => (
                <tr key={dh.madonhang} className='border-b hover:bg-gray-50'>
                  <td className='p-4 font-bold text-gray-800'>
                    #{dh.madonhang}
                  </td>
                  <td className='p-4 text-gray-700 font-medium'>
                    {dh.tendoitac}
                  </td>
                  <td className='p-4 text-red-600 font-bold'>
                    {formatCurrency(dh.tonggiatri)}
                  </td>
                  <td className='p-4 text-gray-500 font-medium'>
                    {formatCurrency(dh.tonggiatri - (dh.tiendathanhtoan || 0))}
                  </td>
                  <td className='p-4 text-gray-500 text-sm'>
                    {formatDate(dh.ngaytao)}
                  </td>
                  <td className='p-4'>
                    {dh.trangthai === "choduyet" ? (
                      <span className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded border border-yellow-200 text-xs font-bold'>
                        Biệt trữ (Chờ duyệt)
                      </span>
                    ) : dh.trangthai === "daduyet" ? (
                      <span className='bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 text-xs font-bold'>
                        Đã duyệt (Nhập kho)
                      </span>
                    ) : dh.trangthai === "huy" ? (
                      <span className='bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 text-xs font-bold'>
                        Đã hủy
                      </span>
                    ) : (
                      <span className='bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 text-xs font-bold'>
                        {dh.trangthai}
                      </span>
                    )}
                  </td>
                  <td className='p-4 flex gap-2 justify-center'>
                    <button
                      onClick={() => openDetail(dh)}
                      className='px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition'
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {danhSachDonHang.length === 0 && (
                <tr>
                  <td colSpan={7} className='p-8 text-center text-gray-500'>
                    Chưa có phiếu nhập kho nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden'>
            <div className='px-6 py-4 border-b flex justify-between items-center bg-gray-50'>
              <h3 className='text-xl font-bold text-gray-800'>
                Chi tiết Phiếu Nhập Kho{" "}
                <span className='text-purple-600'>
                  #{selectedMaster?.madonhang}
                </span>
              </h3>
              <button
                onClick={closeDetailModal}
                className='text-gray-400 hover:text-red-500 font-bold text-2xl transition'
              >
                ×
              </button>
            </div>

            <div className='p-6 overflow-y-auto flex-1'>
              <div className='grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200'>
                <div>
                  <p className='text-xs text-gray-500 font-bold uppercase'>
                    Nhà cung cấp
                  </p>
                  <p className='font-medium text-gray-800'>
                    {selectedMaster?.tendoitac}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 font-bold uppercase'>
                    Người tạo phiếu
                  </p>
                  <p className='font-medium text-gray-800'>
                    {selectedMaster?.tendangnhap || "N/A"}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 font-bold uppercase'>
                    Thời gian tạo
                  </p>
                  <p className='font-medium text-gray-800'>
                    {new Date(selectedMaster?.ngaytao).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 font-bold uppercase'>
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
                <div>
                  <p className='text-xs text-gray-500 font-bold uppercase'>
                    Hóa đơn GTGT
                  </p>
                  <p className='font-medium text-gray-800'>
                    {selectedMaster?.sohoadongtgt || "Không có"}
                  </p>
                </div>
              </div>

              <h4 className='font-bold text-gray-700 uppercase text-sm mb-3 border-b pb-2'>
                Danh sách Hàng hóa Nhập
              </h4>
              {isLoadingDetail ? (
                <div className='py-10 text-center text-gray-500'>
                  Đang tải chi tiết hàng hóa...
                </div>
              ) : (
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-gray-100 text-[11px] text-gray-600 uppercase border-y'>
                      <th className='p-3 font-bold'>Thuốc</th>
                      <th className='p-3 font-bold'>Số Lô</th>
                      <th className='p-3 font-bold'>HSD</th>
                      <th className='p-3 font-bold text-center'>SL CT</th>
                      <th className='p-3 font-bold text-center text-blue-600'>
                        SL Nhận
                      </th>
                      <th className='p-3 font-bold text-right'>Giá Vốn</th>
                      <th className='p-3 font-bold text-right'>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.map((ct, idx) => (
                      <tr key={idx} className='border-b hover:bg-gray-50'>
                        <td className='p-3 font-medium text-gray-800 text-sm'>
                          {ct.tenthuoc}
                        </td>
                        <td className='p-3 font-bold text-gray-600 text-sm'>
                          {ct.solo_tam || ct.malo || "N/A"}
                        </td>
                        <td
                          className={`p-3 text-sm ${
                            new Date(ct.hansudung_tam || ct.hansudung) <=
                            new Date()
                              ? "text-red-500 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {ct.hansudung_tam || ct.hansudung
                            ? new Date(
                                ct.hansudung_tam || ct.hansudung,
                              ).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </td>
                        <td className='p-3 text-center text-sm'>
                          {ct.soluongyeucau}
                        </td>
                        <td className='p-3 text-center font-bold text-blue-600 text-sm'>
                          {ct.soluongthucte}
                        </td>
                        <td className='p-3 text-right text-sm'>
                          {formatCurrency(ct.dongia)}
                        </td>
                        <td className='p-3 text-right font-bold text-red-600 text-sm'>
                          {formatCurrency(ct.soluongthucte * ct.dongia)}
                        </td>
                      </tr>
                    ))}
                    {selectedDetails.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className='p-6 text-center text-gray-500 italic'
                        >
                          Không tìm thấy chi tiết của phiếu này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              <div className='mt-6 flex justify-end'>
                <div className='w-72 bg-gray-50 p-4 rounded-lg border border-gray-200'>
                  <div className='flex justify-between mb-2 text-sm text-gray-600'>
                    <span>Tiền hàng:</span>
                    <span>{formatCurrency(tongTienHangChiTiet)}</span>
                  </div>
                  <div className='flex justify-between mb-2 text-sm text-orange-600'>
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
                  <div className='flex justify-between mb-2 text-sm text-gray-600'>
                    <span>Đã trả NCC:</span>
                    <span>
                      - {formatCurrency(selectedMaster?.tiendathanhtoan || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t bg-gray-50 flex justify-end'>
              <button
                onClick={closeDetailModal}
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
