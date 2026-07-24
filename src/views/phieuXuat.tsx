import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { useAuthStore } from "../context/useAuthStore";
import { formatDate, formatCurrency } from "../utils/customFunction";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import { showSuccess, showError } from "../utils/notify";
import { ScanQrCode, X } from "lucide-react";

export default function PhieuXuatView() {
  const authStore = useAuthStore();
  const [danhSachDonHang, setDanhSachDonHang] = useState<any[]>([]);
  const [danhSachKhachHang, setDanhSachKhachHang] = useState<any[]>([]);
  const [danhSachThuoc, setDanhSachThuoc] = useState<any[]>([]);
  const [danhSachDonVi, setDanhSachDonVi] = useState<any[]>([]);
  const [danhSachLo, setDanhSachLo] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonHang, setSelectedDonHang] = useState<any | null>(null);
  const [chiTietDonHang, setChiTietDonHang] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    const element = document.getElementById("reader-xuat");
    if (!element) return;
    const scanner = new Html5QrcodeScanner(
      "reader-xuat",
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const width = Math.floor(viewfinderWidth * 0.8);
          const height = Math.floor(viewfinderHeight * 0.3);
          return {
            width: width < 250 ? 250 : width,
            height: height < 100 ? 100 : height,
          };
        },
        videoConstraints: { facingMode: "environment" },
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
        rememberLastUsedCamera: false,
        showTorchButtonIfSupported: true,
        disableFlip: true,
      },
      false,
    );

    scanner.render(success, error);

    function success(result: any) {
      scanner.clear().catch((err) => console.error("Lỗi đóng camera:", err));
      setShowQrScanner(false);
      const decodedString = (result || "").trim();
      handleBarcodeSearch(decodedString);
    }

    function error(errorMessage: any) {
      // console.warn(errorMessage);
    }
  }, [showQrScanner, danhSachDonHang]);

  const handleBarcodeSearch = (code: string) => {
    if (!code) return;
    const found = danhSachDonHang.find(
      (dh: any) =>
        (dh.mavandon3pl || "").toLowerCase() === code.toLowerCase() ||
        String(dh.madonhang) === code,
    );
    if (found) {
      openDetailModal(found);
    } else {
      showError("Không tìm thấy hóa đơn nào khớp với mã vạch: " + code);
    }
  };

  const [masterForm, setMasterForm] = useState({
    madoitac: "",
    mavandon3pl: "",
    ghi_chu: "",
    tienchietkhau: 0,
    tiendathanhtoan: 0,
  });

  // --- THANH TOÁN ---
  const [hinhThucThanhToan, setHinhThucThanhToan] = useState<
    "roi" | "no" | "tratruoc"
  >("roi");
  const [soTienDaTra, setSoTienDaTra] = useState<number>(0);

  const [chiTietData, setChiTietData] = useState<any[]>([]);

  const getData = async () => {
    setIsLoading(true);
    try {
      const [resDH, resDT, resThuoc, resDV, resLo]: any = await Promise.all([
        api.get("/donhang/loai/xuat"),
        api.get("/doitac/loai/KhachHang"),
        api.get("/thuoc"),
        api.get("/donvitinh"),
        api.get("/lothuoc"),
      ]);
      setDanhSachDonHang(resDH.data || []);
      setDanhSachKhachHang(
        (resDT.data || []).filter((dt: any) => dt.trangthai === "Dang hop tac"),
      );
      setDanhSachThuoc(
        (resThuoc.data || []).filter((t: any) => Number(t.trangthai) === 1),
      );
      setDanhSachDonVi(resDV.data || []);
      setDanhSachLo(
        (resLo.data || []).filter(
          (lo: any) =>
            String(lo.trangthai || "").toLowerCase() === "sansangban",
        ),
      );
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      showError("Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  function renderItems(items: any[]) {
    return items.map((item, index) => (
      <tr key={index} className='border-b border-dashed hover:bg-gray-50'>
        <td className='p-2 align-top'>
          <select
            value={item.mathuoc || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                mathuoc: selectedId,
                malo: "",
              };
              setChiTietData(updatedData);
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            required
          >
            <option value='' disabled>
              -- Thuốc --
            </option>
            {getThuocOptionsForRow(item).map((t) => (
              <option key={t.mathuoc} value={t.mathuoc}>
                {t.tenthuoc}
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top'>
          <select
            value={item.malo || ""}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                malo: e.target.value,
              };
              handleChonLoHoacDonVi(index, updatedData[index]);
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            disabled={!item.mathuoc}
            required
          >
            <option value='' disabled>
              - Lô -
            </option>
            {getLoOptionsForRow(item, item.mathuoc).map((lo: any) => (
              <option key={lo.malo} value={lo.malo}>
                {lo.solo} (HSD: {formatDate(lo.hansudung)})
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top'>
          <select
            value={item.madonvitinh || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;
              setChiTietData((prev) => {
                const updatedData = [...prev];
                updatedData[index] = {
                  ...updatedData[index],
                  madonvitinh: selectedValue,
                };
                setTimeout(
                  () => handleChonLoHoacDonVi(index, updatedData[index]),
                  0,
                );
                return updatedData;
              });
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            disabled={!item.mathuoc}
            required
          >
            <option value='' disabled>
              -- ĐV --
            </option>
            {getDonViTheoThuoc(item.mathuoc).map((dv) => (
              <option key={dv.madonvitinh} value={dv.madonvitinh}>
                {dv.tendonvi} ( x{dv.hesoquydoi})
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top'>
          <div className='flex flex-col items-center'>
            <input
              value={item.soluongthucte}
              onChange={(e) => {
                const updatedData = [...chiTietData];
                updatedData[index] = { ...item, soluongthucte: e.target.value };
                setChiTietData(updatedData);
              }}
              onBlur={() => kiemTraSoLuong(index)}
              type='number'
              disabled={!item.malo || !item.madonvitinh}
              className='w-full px-4 py-2 border rounded-md text-sm text-center font-black shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              style={{
                backgroundColor:
                  !item.malo || !item.madonvitinh ? "#f3f4f6" : "#eff6ff",
                color: !item.malo || !item.madonvitinh ? "#d1d5db" : "#1e40af",
              }}
            />
            {item.malo && item.madonvitinh && (
              <div className='text-[10px] mt-1 font-bold text-gray-400'>
                Tối đa: {getMaxQty(item)}
              </div>
            )}
          </div>
        </td>
        <td className='p-2 align-top'>
          <div className='w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-800 text-sm text-right font-black shadow-inner'>
            {formatCurrency(item.gianhap)}
          </div>
        </td>
        <td className='p-2 align-top'>
          <div className='relative'>
            <input
              value={item.phantramlai}
              onChange={(e) => tinhDonGiaBan(index, Number(e.target.value))}
              type='number'
              className='w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
            <span className='absolute right-1 top-2.5 text-[10px] font-bold text-gray-400'>
              %
            </span>
          </div>
        </td>
        <td className='p-2 text-right align-top'>
          <span className='font-black text-red-600 text-md block pt-1'>
            {formatCurrency(item.dongia)}
          </span>
        </td>
        {/* CỘT TY LỆ CK */}
        <td className='p-2 align-top'>
          <div className='relative'>
            <input
              value={item.tylechietchkhau ?? 0}
              onChange={(e) => {
                const tyle = Number(e.target.value);
                setChiTietData((prev) => {
                  const updated = [...prev];
                  const sl = Number(updated[index].soluongthucte) || 0;
                  const dg = Number(updated[index].dongia) || 0;
                  const tienCK = dg * sl * (tyle / 100);
                  updated[index] = {
                    ...updated[index],
                    tylechietchkhau: tyle,
                    tienchietchkhau: tienCK,
                  };
                  return updated;
                });
              }}
              type='number'
              min='0'
              max='100'
              className='w-full px-2 py-2 border border-orange-300 bg-orange-50 rounded-md text-sm text-center font-bold text-orange-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
            <span className='absolute right-1 top-2.5 text-[10px] font-bold text-orange-400'>
              %
            </span>
          </div>
        </td>
        {/* CỘT THÀNH TIỀN */}
        <td className='p-2 text-right align-top'>
          <span className='font-black text-green-700 text-sm block pt-1'>
            {formatCurrency(
              Math.max(
                0,
                Number(item.dongia) * Number(item.soluongthucte) -
                  Number(item.tienchietchkhau || 0),
              ),
            )}
          </span>
          {Number(item.tienchietchkhau) > 0 && (
            <span className='text-[10px] text-orange-500 font-bold block'>
              -{formatCurrency(item.tienchietchkhau)} CK
            </span>
          )}
        </td>
        <td className='p-2 text-center align-top pt-3'>
          <button
            onClick={() => xoaDong(index)}
            className='text-gray-400 hover:text-red-500 font-bold text-xl transition'
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
      mavandon3pl: "",
      ghi_chu: "",
      tienchietkhau: 0,
      tiendathanhtoan: 0,
    });
    setChiTietData([]);
    setHinhThucThanhToan("roi");
    setSoTienDaTra(0);
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const themDongChiTiet = () => {
    setChiTietData([
      ...chiTietData,
      {
        mathuoc: "",
        madonvitinh: "",
        malo: "",
        soluongthucte: 1,
        gianhap: 0,
        phantramlai: 10,
        dongia: 0,
        tylechietchkhau: 0,
        tienchietchkhau: 0,
      },
    ]);
  };

  const xoaDong = (index: number) => {
    setChiTietData(chiTietData.filter((_, i) => i !== index));
  };

  const getDonViTheoThuoc = (mathuoc: any) => {
    if (!mathuoc) return [];
    // 🛠️ Ép cả 2 về String để đảm bảo so sánh chính xác bất kể API trả về số hay chuỗi
    return danhSachDonVi.filter(
      (dv: any) => String(dv.mathuoc) === String(mathuoc),
    );
  };

  const getLoTheoThuoc = (mathuoc: any) => {
    if (!mathuoc) return [];
    return danhSachLo
      .filter(
        (lo: any) =>
          String(lo.mathuoc) === String(mathuoc) &&
          lo.tonkhadung > 0 &&
          String(lo.trangthai || "").toLowerCase() === "sansangban",
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.hansudung).getTime() - new Date(b.hansudung).getTime(),
      );
  };

  const danhSachThuocCoTheXuat = useMemo(() => {
    const availableSet = new Set(
      danhSachLo
        .filter(
          (lo: any) =>
            lo.tonkhadung > 0 &&
            String(lo.trangthai || "").toLowerCase() === "sansangban",
        )
        .map((lo: any) => lo.mathuoc),
    );
    return danhSachThuoc.filter((t: any) => availableSet.has(t.mathuoc));
  }, [danhSachLo, danhSachThuoc]);

  const getThuocOptionsForRow = useCallback(
    (currentItem: any) => {
      // Cho phép chọn lại cùng 1 loại thuốc trên nhiều dòng khác nhau
      return danhSachThuocCoTheXuat;
    },
    [danhSachThuocCoTheXuat],
  );

  const getLoOptionsForRow = useCallback(
    (currentItem: any, mathuoc: any) => {
      if (!mathuoc) return [];
      
      // Lấy tất cả các lô hiện có của thuốc này
      const allLots = getLoTheoThuoc(mathuoc);
      
      // Lấy danh sách các mã lô đã được chọn ở CÁC DÒNG KHÁC
      const selectedLots = new Set(
        chiTietData
          .filter((row: any) => row !== currentItem && row.malo)
          .map((row: any) => String(row.malo))
      );

      // Loại bỏ các lô đã được chọn ở dòng khác
      return allLots.filter((lo: any) => !selectedLots.has(String(lo.malo)));
    },
    [chiTietData, danhSachLo]
  );

  const generateTrackingId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const base = `DP-${yyyy}${mm}${dd}-${randomPart}`;
    const existed = danhSachDonHang.some(
      (d: any) => String(d.mavandon3pl || "").toUpperCase() === base,
    );
    return existed ? `${base}-${Math.floor(Math.random() * 9)}` : base;
  };

  const handleAutoTracking = () => {
    setMasterForm({
      ...masterForm,
      mavandon3pl: generateTrackingId(),
    });
  };

  const handleChonThuoc = (item: any) => {
    const index = chiTietData.indexOf(item);
    const updatedData = [...chiTietData];
    updatedData[index] = {
      ...item,
      madonvitinh: "",
      malo: "",
      soluongthucte: 1,
      gianhap: 0,
      dongia: 0,
    };
    setChiTietData(updatedData);
  };

  // ĐÃ SỬA: Nhận trực tiếp (index, item) và ép String toàn bộ
  // ĐÃ SỬA: Chuẩn hóa phép tính hệ số quy đổi để không bị nhân giá lên gấp 10 lần
  const handleChonLoHoacDonVi = useCallback(
    (index: number, itemPassed?: any) => {
      setChiTietData((prev) => {
        const updated = [...prev];
        const targetItem = itemPassed || updated[index];
        if (!targetItem) return prev;

        let giaGocCoBan = 0;
        if (targetItem.malo) {
          const lo: any = danhSachLo.find(
            (l: any) => String(l.malo) === String(targetItem.malo),
          );
          giaGocCoBan = lo
            ? Number(lo.gianhapgannhat) || Number(lo.gianhap) || 0
            : 0;
        }

        // LUẬT PHÉP TÍNH: Giá trong bảng lô thường là giá của đơn vị lớn (Hộp/Thùng).
        // Nếu người dùng chọn đơn vị có hệ số lớn, ta KHÔNG nhân thêm hệ số nữa để tránh phóng đại giá.
        let heSo = 1;
        if (targetItem.madonvitinh) {
          const dv: any = danhSachDonVi.find(
            (d: any) =>
              String(d.madonvitinh) === String(targetItem.madonvitinh),
          );
          // Nếu tìm thấy đơn vị quy đổi, kiểm tra xem có cần chia nhỏ hay giữ nguyên tùy cấu trúc DB của bạn
          // Trường hợp này ta đưa về heSo = 1 nếu giá lô đã là giá hộp
          heSo = 1;
        }

        const gianhapMoi = giaGocCoBan * heSo;
        const phantram = Number(targetItem.phantramlai) || 0;
        const dongiaMoi = gianhapMoi * (1 + phantram / 100);

        updated[index] = {
          ...targetItem,
          gianhap: gianhapMoi,
          dongia: dongiaMoi,
        };

        return updated;
      });
    },
    [danhSachLo, danhSachDonVi],
  );

  // 🔥 1. VÁ LỖI CRASH KHI CHỌN "ĐƠN VỊ CƠ BẢN" VÀ ÉP KIỂU STRING
  const getMaxQty = (item: any) => {
    if (!item.malo || !item.madonvitinh) return 0;

    const lo: any = danhSachLo.find(
      (l: any) => String(l.malo) === String(item.malo),
    );
    if (!lo) return 0;

    let heSo = 1; // Mặc định hệ số của 'base' là 1
    if (item.madonvitinh !== "base") {
      const dv: any = danhSachDonVi.find(
        (d: any) => String(d.madonvitinh) === String(item.madonvitinh),
      );
      if (dv) heSo = Number(dv.hesoquydoi);
    }

    return Math.floor(Number(lo.tonkhadung) / heSo);
  };

  // 🔥 2. XÓA BỎ INDEXOF - TRUYỀN TRỰC TIẾP INDEX VÀO ĐỂ BẢO VỆ STATE
  const kiemTraSoLuong = (index: number) => {
    setChiTietData((prev) => {
      const updatedData = [...prev];
      const currentItem = updatedData[index];

      let val = parseInt(currentItem.soluongthucte);
      if (isNaN(val) || val < 1) val = 1;

      const max = getMaxQty(currentItem);
      if (max > 0 && val > max) val = max; // Ép về mức tối đa nếu gõ lố

      updatedData[index] = { ...currentItem, soluongthucte: val };
      return updatedData;
    });
  };

  // (Đã xóa hàm tinhDonGiaBan vì ta sẽ tính trực tiếp trong onChange cho mượt)
  // 🔥 HÀM TÍNH ĐƠN GIÁ BÁN (An toàn với State, không dùng indexOf)
  const tinhDonGiaBan = (index: number, phantramlaiMoi: number) => {
    setChiTietData((prev) => {
      const updatedData = [...prev];
      const currentItem = updatedData[index];

      updatedData[index] = {
        ...currentItem,
        phantramlai: phantramlaiMoi,
        // Tự động tính giá bán ngay khi % lãi thay đổi
        dongia: Number(currentItem.gianhap) * (1 + phantramlaiMoi / 100),
      };

      return updatedData;
    });
  };

  const khachHangDuocChon = useMemo(() => {
    if (!masterForm.madoitac) return null;
    return (
      danhSachKhachHang.find(
        (k: any) => String(k.madoitac) === String(masterForm.madoitac),
      ) || null
    );
  }, [masterForm.madoitac, danhSachKhachHang]);

  const tongTienNhap = useMemo(
    () =>
      chiTietData.reduce(
        (sum, item) => sum + Number(item.soluongthucte) * Number(item.gianhap),
        0,
      ),
    [chiTietData],
  );

  const tongTienLai = useMemo(
    () =>
      chiTietData.reduce((sum, item) => {
        const laiMoiDonVi =
          Number(item.gianhap) * (Number(item.phantramlai) / 100);
        return sum + Number(item.soluongthucte) * laiMoiDonVi;
      }, 0),
    [chiTietData],
  );

  const tongTienHang = useMemo(
    () => tongTienNhap + tongTienLai,
    [tongTienNhap, tongTienLai],
  );

  const mucChietKhau = useMemo(() => {
    const kh = khachHangDuocChon;
    if (!kh) return { tenHang: "Khách Mới" };

    if (kh.solangiaodich_thanhcong >= 10) return { tenHang: "Khách VIP" };
    if (kh.solangiaodich_thanhcong >= 5) return { tenHang: "Khách Thân Thiết" };
    return { tenHang: "Khách Thường" };
  }, [khachHangDuocChon]);

  const tongGiaTriDon = useMemo(
    () => Math.max(0, tongTienHang - Number(masterForm.tienchietkhau)),
    [tongTienHang, masterForm.tienchietkhau],
  );

  const tienConNo = useMemo(() => {
    if (hinhThucThanhToan === "roi") return 0;
    if (hinhThucThanhToan === "no") return tongGiaTriDon;
    return Math.max(0, tongGiaTriDon - Number(soTienDaTra));
  }, [tongGiaTriDon, hinhThucThanhToan, soTienDaTra]);

  const tongNoDuKien = useMemo(() => {
    if (!khachHangDuocChon) return 0;
    return Number(khachHangDuocChon.tongnohientai) + tienConNo;
  }, [khachHangDuocChon, tienConNo]);

  const isVuotHanMuc = useMemo(() => {
    const kh = khachHangDuocChon;
    if (!kh || kh.hanmucno === 0) return false;
    return tongNoDuKien > kh.hanmucno;
  }, [khachHangDuocChon, tongNoDuKien]);

  const canhBaoLanh = useMemo(() => {
    return chiTietData.some((item) => {
      if (!item.mathuoc) return false;
      const thuoc: any = danhSachThuoc.find(
        (t: any) => t.mathuoc === item.mathuoc,
      );
      return (
        thuoc &&
        thuoc.dieukienbaoquan &&
        thuoc.dieukienbaoquan.toLowerCase().includes("2°c - 8°c")
      );
    });
  }, [chiTietData, danhSachThuoc]);

  const handleSaveDonHang = async () => {
    if (!masterForm.madoitac || chiTietData.length === 0) {
      showError("Vui lòng chọn khách hàng và thêm mặt hàng!");
      return;
    }

    if (
      !masterForm.mavandon3pl ||
      String(masterForm.mavandon3pl).trim() === ""
    ) {
      showError("Vui lòng nhập hoặc tự tạo Mã vận đơn!");
      return;
    }

    if (isVuotHanMuc) {
      const xacNhan = window.confirm(
        "CẢNH BÁO: Khách hàng đã vượt hạn mức công nợ! Bạn có chắc chắn muốn lưu đơn để trình Admin duyệt không?",
      );
      if (!xacNhan) return;
    }

    try {
      setIsLoading(true);

      // Tính tiendathanhtoan dựa theo hình thức thanh toán
      let tiendathanhtoanFinal = 0;
      if (hinhThucThanhToan === "roi") tiendathanhtoanFinal = tongGiaTriDon;
      else if (hinhThucThanhToan === "no") tiendathanhtoanFinal = 0;
      else tiendathanhtoanFinal = Math.min(soTienDaTra, tongGiaTriDon);

      const donHangData = {
        madoitac: masterForm.madoitac,
        mataikhoan: authStore.user?.mataikhoan,
        loaidonhang: "xuat",
        mavandon3pl: masterForm.mavandon3pl,
        tonggiatri: tongGiaTriDon,
        tienchietkhau: masterForm.tienchietkhau,
        tiendathanhtoan: tiendathanhtoanFinal,
        trangthai: "choduyet",
        ghi_chu: masterForm.ghi_chu,
      };
      const resMaster: any = await api.post("/donhang", donHangData);
      const newDonHangId = resMaster.data.madonhang_moi;
      const promises = chiTietData.map((item) =>
        api.post("/chitietdonhang", {
          madonhang: newDonHangId,
          mathuoc: item.mathuoc,
          malo: item.malo,
          madonvitinh: item.madonvitinh,
          soluongyeucau: item.soluongthucte,
          soluongthucte: item.soluongthucte,
          dongia: item.dongia,
          tylechietchkhau: item.tylechietchkhau || 0,
          tienchietchkhau: item.tienchietchkhau || 0,
        }),
      );
      await Promise.all(promises);
      showSuccess("Tạo Đơn Bán Hàng thành công!");
      closeForm();
      getData();
    } catch (error: any) {
      showError(error.message || "Có lỗi xảy ra khi lưu đơn hàng");
      console.error("Lỗi khi lưu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = async (donHang: any) => {
    setSelectedDonHang(donHang);
    setShowDetailModal(true);
    setIsLoadingDetail(true);
    try {
      const res: any = await api.get(
        `/chitietdonhang/donhang/${donHang.madonhang}`,
      );
      setChiTietDonHang(res.data || []);
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error);
      showError("Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDonHang(null);
    setChiTietDonHang([]);
  };

  const tongTienHangModal = useMemo(
    () =>
      chiTietDonHang.reduce(
        (sum, item) => sum + Number(item.soluongthucte) * Number(item.dongia),
        0,
      ),
    [chiTietDonHang],
  );

  const chietKhauModal = useMemo(
    () => Number(selectedDonHang?.tienchietkhau || 0),
    [selectedDonHang],
  );

  const daThanhToanModal = useMemo(
    () => Number(selectedDonHang?.tiendathanhtoan || 0),
    [selectedDonHang],
  );

  const khachCanTraModal = useMemo(
    () => Math.max(0, tongTienHangModal - chietKhauModal - daThanhToanModal),
    [tongTienHangModal, chietKhauModal, daThanhToanModal],
  );

  const vietQrUrl = useMemo(() => {
    if (!selectedDonHang) return "";
    const amount = Math.round(khachCanTraModal || 0);
    const addInfo = `Thanh toan don hang XUAT${selectedDonHang.madonhang}`;
    const base =
      import.meta.env.VITE_VIETQR ||
      "https://api.vietqr.io/image/970436-1042328265-wp5fFpl.jpg?accountName=TRAN%20TUAN%20DAT";
    return `${base}&amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
  }, [selectedDonHang, khachCanTraModal]);

  const handlePrint = () => {
    if (!selectedDonHang) return;

    const khachHang = danhSachKhachHang.find(
      (kh: any) => kh.madoitac === selectedDonHang.madoitac,
    );

    // Build bảng hàng hóa
    const tableRows = chiTietDonHang
      .map((ct: any, idx: number) => {
        const sl = Number(ct.soluongthucte || 0);
        const dg = Number(ct.dongia || 0);
        const ck = Number(ct.tienchietchkhau || 0);
        const thanhtien = Math.max(0, sl * dg - ck);
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 10px; text-align:center; color:#6b7280;">${idx + 1}</td>
          <td style="padding: 8px 10px; font-weight:600;">${ct.tenthuoc || ct.mathuoc || "---"}</td>
          <td style="padding: 8px 10px; color:#6b7280; font-size:12px;">${ct.solo || ct.solo_tam || "---"}</td>
          <td style="padding: 8px 10px; text-align:center;">${sl}</td>
          <td style="padding: 8px 10px; text-align:right;">${dg.toLocaleString("vi-VN")}đ</td>
          <td style="padding: 8px 10px; text-align:center; color:#f97316;">${Number(ct.tylechietchkhau || 0)}%</td>
          <td style="padding: 8px 10px; text-align:right; font-weight:700; color:#15803d;">${thanhtien.toLocaleString("vi-VN")}đ</td>
        </tr>`;
      })
      .join("");

    const tongTien = tongTienHangModal;
    const chietKhau = chietKhauModal;
    const daTra = Number(selectedDonHang.tiendathanhtoan || 0);
    const conNo = khachCanTraModal;
    const ngayIn = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Phiếu Xuất Kho - Đơn #${selectedDonHang.madonhang}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 13px; color: #1f2937; background: #fff; }
    @page { size: A4; margin: 15mm 15mm 15mm 20mm; }

    /* HEADER */
    .header { display: flex; align-items: center; gap: 18px; border-bottom: 3px double #1e40af; padding-bottom: 14px; margin-bottom: 14px; }
    .logo { width: 80px; height: 80px; object-fit: contain; background: transparent; border: none; mix-blend-mode: multiply; }
    .logo-placeholder { width: 80px; height: 80px; border: 2px dashed #cbd5e1; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8; text-align:center; }
    .pharmacy-info h1 { font-size: 18px; font-weight: 700; color: #1e40af; letter-spacing: 0.5px; }
    .pharmacy-info p { font-size: 11.5px; color: #4b5563; margin-top: 2px; }

    /* TITLE */
    .doc-title { text-align: center; margin: 10px 0 16px; position: relative; }
    .doc-title h2 { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1f2937; }
    .doc-title p { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .barcode-container { position: absolute; top: -10px; right: 20px; text-align: center; }
    .barcode-container img { height: 55px; }

    /* INFO GRID */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 12.5px; }
    .info-grid .label { color: #6b7280; }
    .info-grid .value { font-weight: 600; color: #1f2937; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12.5px; }
    thead tr { background: #1e40af; color: #fff; }
    thead th { padding: 9px 10px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tfoot tr { background: #f1f5f9; font-weight: 700; }
    tfoot td { padding: 9px 10px; border-top: 2px solid #cbd5e1; }

    /* TOTALS + QR */
    .bottom-section { display: flex; gap: 20px; align-items: flex-start; }
    .totals { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 7px 14px; border-bottom: 1px solid #f1f5f9; }
    .totals .row:last-child { border-bottom: none; }
    .totals .row.highlight { background: #eff6ff; font-weight: 700; font-size: 14px; color: #1e40af; }
    .totals .row.debt { background: #fff7ed; font-weight: 700; color: #c2410c; }
    .qr-box { text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; min-width: 148px; }
    .qr-box img { width: 128px; height: 128px; display: block; margin: 0 auto 6px; }
    .qr-box p { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .qr-box strong { color: #1e40af; font-size: 11px; }

    /* FOOTER */
    .footer { margin-top: 18px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px dashed #d1d5db; padding-top: 10px; }
  </style>
</head>
<body>
  <!-- HEADER: Logo + Thông tin nhà thuốc -->
  <div class="header">
    <img src="public/logo.png" alt="Logo" class="logo" />
    <div class="pharmacy-info">
      <h1>CÔNG TY TRÁCH NHIỆM HỮU HẠN DƯỢC PHẨM ĐẠT PHARMA</h1>
      <p>📍 Địa chỉ: 170 YÊN LÃNG</p>
      <p>📞 Điện thoại: 0797938048 &nbsp;|&nbsp; 📧 Email: TUANDAT8048@GMAIL.COM</p>
      <p>🏥 Giấy phép kinh doanh: HCM-0077/ĐĐKD</p>
      <h1>CÔNG TY TNHH DƯỢC PHẨM ĐẠT PHARMA</h1>
      <p>📍 170 YÊN LÃNG | 📞 0797938048</p>
    </div>
  </div>

  <div class="doc-title">
    <h2>PHIẾU XUẤT KHO BÁN HÀNG</h2>
    <p>Mã Hóa Đơn: <strong>#${selectedDonHang.madonhang}</strong> · Ngày in: ${ngayIn}</p>
    ${selectedDonHang.mavandon3pl ? `
    <div class="barcode-container">
      <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${selectedDonHang.mavandon3pl}&includetext=true" alt="Barcode"/>
    </div>
    ` : ''}
  </div>

  <div class="info-grid">
    <span class="label">Khách hàng:</span>
    <span class="value">${khachHang?.tendoitac || selectedDonHang.tendoitac || "---"}</span>
    <span class="label">Điện thoại:</span>
    <span class="value">${khachHang?.sodienthoai || "---"}</span>
    <span class="label">Địa chỉ:</span>
    <span class="value">${khachHang?.diachi || "---"}</span>
    <span class="label">Ghi chú:</span>
    <span class="value">${selectedDonHang.ghi_chu || "---"}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>STT</th><th>Tên thuốc</th><th>Số lô</th><th>SL</th><th>Đơn giá</th><th>CK</th><th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr><td colspan="6" style="text-align:right;">Tổng cộng:</td><td>${tongTien.toLocaleString("vi-VN")}đ</td></tr>
    </tfoot>
  </table>

  <div class="bottom-section">
    <div class="totals">
      <div class="row"><span>Tổng tiền hàng</span><span>${tongTien.toLocaleString("vi-VN")}đ</span></div>
      <div class="row"><span>Chiết khấu</span><span>- ${chietKhau.toLocaleString("vi-VN")}đ</span></div>
      <div class="row"><span>Đã trả</span><span>${daTra.toLocaleString("vi-VN")}đ</span></div>
      <div class="row" style="color:red; font-weight:bold;"><span>Còn nợ</span><span>${conNo.toLocaleString("vi-VN")}đ</span></div>
    </div>
    <div class="qr-box">
      <img src="${vietQrUrl}" alt="QR" onerror="this.style.display='none'"/>
      <p>Quét mã thanh toán</p>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const element = document.getElementById("reader-xuat");
    if (!element || !showQrScanner) return;
    
    const scanner = new Html5QrcodeScanner(
      "reader-xuat",
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const width = Math.floor(viewfinderWidth * 0.8);
          const height = Math.floor(viewfinderHeight * 0.3);
          return {
            width: width < 250 ? 250 : width,
            height: height < 100 ? 100 : height,
          };
        },
        videoConstraints: { facingMode: "environment" },
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
        rememberLastUsedCamera: false,
        showTorchButtonIfSupported: true,
        disableFlip: true,
      },
      false,
    );

    scanner.render(success, error);

    function success(result: any) {
      scanner.clear().catch((err) => console.error("Lỗi đóng camera:", err));
      setShowQrScanner(false);
      const decodedString = (result || "").trim();
      handleBarcodeSearch(decodedString);
    }

    function error(errorMessage: any) {
      // ignore
    }

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [showQrScanner, danhSachDonHang]);

  if (showForm) {
    return (
      <div className='bg-gray-50 -m-6 p-6 min-h-screen'>
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
                Lập Đơn Bán Hàng
              </h2>
            </div>
            <div className='flex gap-4'>
              <div className='flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-200'>
                <div className='text-center px-4 border-r'>
                  <p className='text-[10px] text-gray-500 uppercase font-bold'>
                    Vốn
                  </p>
                  <p className='text-sm font-semibold text-gray-700'>
                    {formatCurrency(tongTienNhap)}
                  </p>
                </div>
                <div className='text-center px-4 border-r'>
                  <p className='text-[10px] text-blue-500 uppercase font-bold'>
                    Lãi
                  </p>
                  <p className='text-sm font-semibold text-blue-600'>
                    + {formatCurrency(tongTienLai)}
                  </p>
                </div>
                <div className='text-center px-4'>
                  <p className='text-[10px] text-red-500 uppercase font-bold'>
                    Tổng Cộng
                  </p>
                  <p className='text-lg font-black text-red-600'>
                    {formatCurrency(tongGiaTriDon)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveDonHang}
                disabled={isLoading}
                className='bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-md transition disabled:bg-gray-400'
              >
                Lưu Đơn
              </button>
            </div>
          </div>

          {canhBaoLanh && (
            <div className='mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 font-medium rounded-lg flex items-center gap-3'>
              <span className='text-xl'>❄️</span>{" "}
              <strong>BẢO QUẢN LẠNH:</strong> Chú ý xuất kèm thùng xốp và đá
              gel!
            </div>
          )}
          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6'>
            <div className='grid grid-cols-2 gap-8'>
              <div className='space-y-4 flex flex-col'>
                <h3 className='font-bold text-gray-700 border-b pb-2 uppercase text-sm'>
                  Thông tin giao dịch
                </h3>
                <div>
                  <label className='block text-xs font-medium text-gray-500 mb-1'>
                    KHÁCH HÀNG (*)
                  </label>
                  <select
                    value={masterForm.madoitac}
                    onChange={(e) =>
                      setMasterForm({
                        ...masterForm,
                        madoitac: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm outline-none'
                    required
                  >
                    <option value='' disabled>
                      -- Chọn --
                    </option>
                    {danhSachKhachHang.map((dt) => (
                      <option key={dt.madoitac} value={dt.madoitac}>
                        {dt.tendoitac}
                      </option>
                    ))}
                  </select>
                </div>

                {khachHangDuocChon && (
                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-3 text-[12px] space-y-1.5'>
                    <div className='flex justify-between items-center border-b border-dashed pb-1 mb-1'>
                      <span className='text-gray-500 font-medium'>
                        Hạng thành viên:
                      </span>
                      <span className='font-bold px-2 py-0.5 rounded text-white bg-blue-500'>
                        {mucChietKhau.tenHang}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Hạn mức nợ:</span>
                      <span className='font-bold'>
                        {khachHangDuocChon.hanmucno > 0
                          ? formatCurrency(khachHangDuocChon.hanmucno)
                          : "Không giới hạn"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Nợ cũ:</span>
                      <span className='font-bold text-red-500'>
                        {formatCurrency(khachHangDuocChon.tongnohientai)}
                      </span>
                    </div>
                    <div className='flex justify-between pt-1 border-t border-gray-200 mt-1'>
                      <span className='text-gray-700 font-bold'>
                        Nợ sau đơn này:
                      </span>
                      <span
                        className={`font-black ${
                          isVuotHanMuc ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {formatCurrency(tongNoDuKien)}
                      </span>
                    </div>
                    {isVuotHanMuc && (
                      <div className='mt-1 text-[10px] text-red-600 font-bold bg-red-100 p-1 rounded text-center'>
                        ⚠️ VƯỢT HẠN MỨC NỢ
                      </div>
                    )}
                  </div>
                )}

                <div className='grid grid-cols-2 gap-4 mt-2 flex-1'>
                  <div>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      TRACKING ID (*)
                    </label>
                    <div className='flex gap-2'>
                      <input
                        value={masterForm.mavandon3pl}
                        onChange={(e) =>
                          setMasterForm({
                            ...masterForm,
                            mavandon3pl: e.target.value,
                          })
                        }
                        type='text'
                        placeholder='DP-YYYY...'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg outline-none'
                      />
                      <button
                        type='button'
                        onClick={handleAutoTracking}
                        className='px-3 py-2 rounded-lg bg-yellow-500 text-white font-bold shadow hover:bg-yellow-600'
                      >
                        ⚡
                      </button>
                    </div>
                  </div>

                  <div className='flex flex-col'>
                    <label className='block text-xs font-medium text-gray-500 mb-1'>
                      GHI CHÚ
                    </label>
                    <textarea
                      value={masterForm.ghi_chu}
                      onChange={(e) =>
                        setMasterForm({ ...masterForm, ghi_chu: e.target.value })
                      }
                      rows={1}
                      placeholder='Ghi chú thêm...'
                      className='w-full h-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none text-sm'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4 flex flex-col'>
                <h3 className='font-bold text-gray-700 border-b pb-2 uppercase text-sm'>
                  Chi tiết thanh toán
                </h3>
                
                <div className='space-y-3'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-500 font-bold uppercase text-[10px]'>
                      Tiền hàng:
                    </span>
                    <span className='font-medium text-gray-800'>
                      {formatCurrency(tongTienHang)}
                    </span>
                  </div>
                  <div>
                    <div className='flex justify-between items-center mb-1'>
                      <label className='text-[10px] font-bold text-gray-500 uppercase'>
                        Chiết khấu (VND):
                      </label>
                    </div>
                    <input
                      value={masterForm.tienchietkhau}
                      onChange={(e) =>
                        setMasterForm({
                          ...masterForm,
                          tienchietkhau: Number(e.target.value),
                        })
                      }
                      type='number'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-right font-bold text-orange-600 outline-none'
                    />
                  </div>
                  <div className='flex justify-between items-center pt-2 border-t text-red-600'>
                    <span className='font-bold text-sm'>KHÁCH PHẢI TRẢ:</span>
                    <span className='font-black text-xl'>
                      {formatCurrency(tongGiaTriDon)}
                    </span>
                  </div>
                </div>

                <div className='border border-blue-200 rounded-xl overflow-hidden mt-auto'>
                  <div className='bg-blue-600 px-3 py-2'>
                    <p className='text-white font-bold text-[11px] uppercase tracking-wide'>
                      💳 Hình thức thanh toán
                    </p>
                  </div>
                  <div className='p-3 space-y-2 bg-blue-50'>
                    <div className='grid grid-cols-3 gap-2'>
                      {(
                        [
                          {
                            key: "roi",
                            label: "✅ Trả RỒI",
                          },
                          {
                            key: "no",
                            label: "📋 Ghi NỢ",
                          },
                          {
                            key: "tratruoc",
                            label: "💵 Trả trước",
                          },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer border transition text-center ${
                            hinhThucThanhToan === opt.key
                              ? "bg-white border-blue-400 shadow-sm"
                              : "border-transparent hover:bg-white/60"
                          }`}
                        >
                          <input
                            type='radio'
                            name='hinhthuc'
                            value={opt.key}
                            checked={hinhThucThanhToan === opt.key}
                            onChange={() => setHinhThucThanhToan(opt.key)}
                            className='accent-blue-600 mb-1'
                          />
                          <span className='text-xs font-bold text-gray-800 leading-tight'>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {hinhThucThanhToan === "tratruoc" && (
                      <div className='pt-1'>
                        <label className='block text-[10px] font-bold text-blue-700 mb-1 uppercase'>
                          Số tiền đã trả (VND):
                        </label>
                        <input
                          type='number'
                          min='0'
                          max={tongGiaTriDon}
                          value={soTienDaTra}
                          onChange={(e) => setSoTienDaTra(Number(e.target.value))}
                          className='w-full px-3 py-2 border-2 border-blue-300 bg-white text-blue-700 rounded-lg text-right font-bold outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    )}

                    <div className='flex justify-between items-center pt-2 border-t border-blue-200 mt-1'>
                      <span className='text-[11px] font-bold text-gray-600 uppercase'>
                        Còn nợ đơn này:
                      </span>
                      <span
                        className={`font-black text-sm ${
                          hinhThucThanhToan === "roi"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {hinhThucThanhToan === "roi"
                          ? "0đ ✓"
                          : hinhThucThanhToan === "no"
                            ? formatCurrency(tongGiaTriDon)
                            : formatCurrency(
                                Math.max(0, tongGiaTriDon - soTienDaTra),
                              )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='grid grid-cols-12 gap-6 mt-5'>
            <div className='col-span-12 bg-white p-5 rounded-xl shadow-sm border border-gray-200'>
              <div className='flex justify-between items-center border-b pb-3 mb-4'>
                <h3 className='font-bold text-gray-700 uppercase text-sm'>
                  Giỏ hàng xuất
                </h3>
                <button
                  onClick={themDongChiTiet}
                  type='button'
                  className='bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold border border-blue-200 transition'
                >
                  + Thêm Thuốc
                </button>
              </div>

              <div className='overflow-hidden min-h-[400px]'>
                <table className='w-full text-left table-fixed'>
                  <thead>
                    <tr className='text-[10px] text-gray-500 uppercase border-b bg-gray-50'>
                      <th className='p-2 w-[18%] font-bold'>Tên Thuốc</th>
                      <th className='p-2 w-[16%] font-bold'>Lô & HSD</th>
                      <th className='p-2 w-[12%] font-bold'>ĐV Quy Đổi</th>
                      <th className='p-2 w-[8%] text-center font-bold text-blue-600'>SL Xuất</th>
                      <th className='p-2 w-[10%] text-right font-bold'>Giá Vốn</th>
                      <th className='p-2 w-[7%] text-center font-bold'>% Lãi</th>
                      <th className='p-2 w-[11%] text-right text-red-600 font-bold'>Đơn Giá</th>
                      <th className='p-2 w-[6%] text-center font-bold text-orange-600'>CK%</th>
                      <th className='p-2 w-[10%] text-right font-bold text-green-700'>Thành Tiền</th>
                      <th className='p-2 w-8'></th>
                    </tr>
                  </thead>
                  <tbody>{renderItems(chiTietData)}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Quản lý Xuất Kho (Bán sỉ)
        </h2>
        <div className='flex gap-4 items-center'>
          <div className='relative flex items-center'>
            <input 
              type="text" 
              placeholder="Nhập mã vạch hóa đơn..." 
              className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-[260px] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeSearch(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <button 
              onClick={() => setShowQrScanner(true)}
              className="absolute right-2 text-gray-400 hover:text-blue-600 transition"
              title="Quét bằng ảnh/camera"
            >
              <ScanQrCode size={20} />
            </button>
          </div>
          <AddBtn func={openForm} placeholder='Tạo Đơn Xuất' />
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
                <th className='p-4 font-semibold'>Mã ĐH</th>
                <th className='p-4 font-semibold'>Khách Hàng</th>
                <th className='p-4 font-semibold'>Tổng Tiền Hàng</th>
                <th className='p-4 font-semibold'>Phải Thu (Công Nợ)</th>
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
                      <span className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded border text-xs font-bold'>
                        Chờ duyệt xuất
                      </span>
                    ) : dh.trangthai === "huy" ? (
                      <span className='bg-red-100 text-red-700 px-2 py-1 rounded border text-xs font-bold'>
                        Đã bị từ chối
                      </span>
                    ) : (
                      <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded border text-xs font-bold'>
                        Đã xuất kho
                      </span>
                    )}
                  </td>
                  <td className='p-4 flex gap-2 justify-center'>
                    <button
                      onClick={() => openDetailModal(dh)}
                      className='px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200'
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CHI TIẾT */}
      {showDetailModal && selectedDonHang && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'>
          <div className='bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden'>
            <div className='bg-gray-100 px-6 py-4 flex justify-between items-center border-b'>
              <div>
                <h3 className='font-bold text-gray-800 text-lg'>
                  Chi Tiết Đơn Hàng #{selectedDonHang.madonhang}
                </h3>
                <p className='text-xs text-gray-500'>
                  Ngày tạo: {formatDate(selectedDonHang.ngaytao)}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className='text-gray-500 hover:bg-gray-200 p-1.5 rounded-lg transition'
              >
                <X size={24} />
              </button>
            </div>

            <div className='p-6 overflow-y-auto flex-1'>
              {isLoadingDetail ? (
                <div className='text-center py-10 text-gray-500'>
                  Đang tải chi tiết...
                </div>
              ) : (
                <div className='space-y-6'>
                  <div className='grid grid-cols-2 gap-6 bg-blue-50 p-4 rounded-xl border border-blue-100'>
                    <div className='space-y-2'>
                      <p className='text-sm text-gray-600 font-medium uppercase'>
                        Thông tin khách hàng
                      </p>
                      <p className='font-bold text-gray-800'>
                        {selectedDonHang.tendoitac}
                      </p>
                      <p className='text-sm text-gray-600'>
                        SĐT: {danhSachKhachHang.find(kh => kh.madoitac === selectedDonHang.madoitac)?.sodienthoai || selectedDonHang.sodienthoai || "---"}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Địa chỉ: {danhSachKhachHang.find(kh => kh.madoitac === selectedDonHang.madoitac)?.diachi || selectedDonHang.diachi || "---"}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm text-gray-600 font-medium uppercase'>
                        Vận đơn & Ghi chú
                      </p>
                      <p className='text-sm font-bold text-blue-700'>
                        Tracking: {selectedDonHang.mavandon3pl || "---"}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Ghi chú: {selectedDonHang.ghi_chu || "---"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className='font-bold text-gray-800 mb-3 uppercase text-sm'>
                      Danh sách hàng hóa xuất
                    </h4>
                    <div className='border rounded-lg overflow-hidden'>
                      <table className='w-full text-left border-collapse text-sm'>
                        <thead>
                          <tr className='bg-gray-100 text-gray-600 border-b'>
                            <th className='p-3 font-semibold'>STT</th>
                            <th className='p-3 font-semibold'>Thuốc</th>
                            <th className='p-3 font-semibold'>Lô</th>
                            <th className='p-3 font-semibold text-center'>SL</th>
                            <th className='p-3 font-semibold text-right'>Đơn giá</th>
                            <th className='p-3 font-semibold text-center'>CK(%)</th>
                            <th className='p-3 font-semibold text-right'>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chiTietDonHang.map((ct, idx) => {
                            const sl = Number(ct.soluongthucte || 0);
                            const dg = Number(ct.dongia || 0);
                            const ck = Number(ct.tienchietchkhau || 0);
                            const thanhtien = Math.max(0, sl * dg - ck);
                            return (
                              <tr key={idx} className='border-b hover:bg-gray-50'>
                                <td className='p-3 text-center text-gray-500'>
                                  {idx + 1}
                                </td>
                                <td className='p-3 font-bold text-gray-800'>
                                  {ct.tenthuoc || ct.mathuoc}
                                </td>
                                <td className='p-3 text-gray-500 text-xs'>
                                  {ct.solo || ct.solo_tam || "---"}
                                </td>
                                <td className='p-3 text-center font-medium'>{sl}</td>
                                <td className='p-3 text-right text-gray-600'>
                                  {dg.toLocaleString("vi-VN")}đ
                                </td>
                                <td className='p-3 text-center text-orange-500'>
                                  {Number(ct.tylechietchkhau || 0)}%
                                </td>
                                <td className='p-3 text-right font-bold text-green-600'>
                                  {thanhtien.toLocaleString("vi-VN")}đ
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='bg-gray-50 px-6 py-4 border-t flex justify-between items-center'>
              <div className='text-sm text-gray-500 space-y-1'>
                <p>
                  Tổng tiền hàng:{" "}
                  <span className='font-bold text-gray-800'>
                    {formatCurrency(tongTienHangModal)}
                  </span>
                </p>
                <p>
                  Chiết khấu hóa đơn:{" "}
                  <span className='font-bold text-orange-600'>
                    -{formatCurrency(chietKhauModal)}
                  </span>
                </p>
                <p>
                  Đã thanh toán trước:{" "}
                  <span className='font-bold text-green-600'>
                    {formatCurrency(selectedDonHang.tiendathanhtoan || 0)}
                  </span>
                </p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-gray-500 font-bold uppercase mb-1'>
                  Khách phải trả (Còn nợ)
                </p>
                <p className='text-2xl font-black text-red-600'>
                  {formatCurrency(khachCanTraModal)}
                </p>
              </div>
            </div>

            <div className='px-6 py-3 bg-white border-t flex justify-end gap-3'>
              <button
                onClick={handlePrint}
                className='px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition'
              >
                In Phiếu Xuất Kho
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className='px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg shadow hover:bg-gray-300 transition'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUÉT MÃ VẠCH (CAMERA / TẢI ẢNH) */}
      {showQrScanner && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative'>
            <div className='bg-gray-100 px-4 py-3 flex justify-between items-center border-b'>
              <h3 className='font-bold text-gray-800'>
                Quét mã vạch Hóa đơn
              </h3>
              <button
                onClick={() => setShowQrScanner(false)}
                className='text-gray-500 hover:bg-gray-200 p-1 rounded transition'
              >
                <X size={20} />
              </button>
            </div>
            <div className='p-4'>
              <p className='text-xs text-gray-500 mb-2 text-center'>Đưa mã vạch vào khung hình hoặc chọn tải ảnh lên</p>
              <div id='reader-xuat'></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
