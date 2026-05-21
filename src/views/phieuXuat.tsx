import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { useAuthStore } from "../context/useAuthStore";
import { formatDate, formatCurrency } from "../utils/customFunction";
import AddBtn from "../components/common/addBtn";
import ReloadBtn from "../components/common/reloadBtn";
import { showSuccess,showError } from "../utils/notify";

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

  const [masterForm, setMasterForm] = useState({
    madoitac: "",
    mavandon3pl: "",
    ghi_chu: "",
    tienchietkhau: 0,
    tiendathanhtoan: 0,
  });

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
            value={item.mathuoc}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                mathuoc: e.target.value,
              };
              setChiTietData(updatedData);
              handleChonThuoc(updatedData[index]);
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
            value={item.malo}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                malo: e.target.value,
              };
              setChiTietData(updatedData);
              handleChonLoHoacDonVi(updatedData[index]);
            }}
            className='w-full px-2 py-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm'
            disabled={!item.mathuoc}
            required
          >
            <option value='' disabled>
              - Lô -
            </option>
            {getLoTheoThuoc(item.mathuoc).map((lo) => (
              <option key={lo.malo} value={lo.malo}>
                {lo.solo} (HSD: {formatDate(lo.hansudung)})
              </option>
            ))}
          </select>
        </td>
        <td className='p-2 align-top'>
          <select
            value={item.madonvitinh}
            onChange={(e) => {
              const updatedData = [...chiTietData];
              updatedData[index] = {
                ...item,
                madonvitinh: e.target.value,
              };
              setChiTietData(updatedData);
              handleChonLoHoacDonVi(updatedData[index]);
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
                updatedData[index] = {
                  ...item,
                  soluongthucte: Number(e.target.value),
                };
                setChiTietData(updatedData);
              }}
              onBlur={() => kiemTraSoLuong(item)}
              type='number'
              disabled={!item.malo || !item.madonvitinh}
              className='w-full px-4 py-2 border rounded-md text-sm text-center font-black shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              style={{
                backgroundColor:
                  !item.malo || !item.madonvitinh ? "#f3f4f6" : "#eff6ff",
                color: !item.malo || !item.madonvitinh ? "#d1d5db" : "#1e40af",
              }}
            />
            {item.malo && (
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
              onChange={(e) => {
                const updatedData = [...chiTietData];
                updatedData[index] = {
                  ...item,
                  phantramlai: Number(e.target.value),
                };
                setChiTietData(updatedData);
                tinhDonGiaBan(updatedData[index]);
              }}
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
      },
    ]);
  };

  const xoaDong = (index: number) => {
    setChiTietData(chiTietData.filter((_, i) => i !== index));
  };

  const getDonViTheoThuoc = (mathuoc: any) =>
    danhSachDonVi.filter((dv: any) => dv.mathuoc === mathuoc);

  const getLoTheoThuoc = (mathuoc: any) =>
    danhSachLo.filter(
      (lo: any) =>
        lo.mathuoc === mathuoc &&
        lo.tonkhadung > 0 &&
        String(lo.trangthai || "").toLowerCase() === "sansangban",
    );

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
      const selectedSet = new Set(
        chiTietData
          .filter((row: any) => row !== currentItem && row.mathuoc)
          .map((row: any) => row.mathuoc),
      );
      return danhSachThuocCoTheXuat.filter(
        (t: any) => !selectedSet.has(t.mathuoc),
      );
    },
    [chiTietData, danhSachThuocCoTheXuat],
  );

  const generateTrackingId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const base = `VNPOST-${yyyy}${mm}${dd}-${randomPart}`;
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

  const handleChonLoHoacDonVi = (item: any) => {
    const index = chiTietData.indexOf(item);
    const updatedData = [...chiTietData];

    let giaGocCoBan = 0;
    if (item.malo) {
      const lo: any = danhSachLo.find((l: any) => l.malo === item.malo);
      giaGocCoBan = lo
        ? Number(lo.gianhapgannhat) || Number(lo.gianhap) || 0
        : 0;
    }

    let heSo = 1;
    if (item.madonvitinh) {
      const dv: any = danhSachDonVi.find(
        (d: any) => d.madonvitinh === item.madonvitinh,
      );
      heSo = dv ? Number(dv.hesoquydoi) : 1;
    }

    const gianhap = giaGocCoBan * heSo;
    const dongia = Number(gianhap) * (1 + Number(item.phantramlai) / 100);

    updatedData[index] = {
      ...item,
      soluongthucte: 1,
      gianhap,
      dongia,
    };
    setChiTietData(updatedData);
  };

  const tinhDonGiaBan = (item: any) => {
    const index = chiTietData.indexOf(item);
    const updatedData = [...chiTietData];
    updatedData[index] = {
      ...item,
      dongia: Number(item.gianhap) * (1 + Number(item.phantramlai) / 100),
    };
    setChiTietData(updatedData);
  };

  const getMaxQty = (item: any) => {
    if (!item.malo || !item.madonvitinh) return 0;
    const lo: any = danhSachLo.find((l: any) => l.malo === item.malo);
    const dv: any = danhSachDonVi.find(
      (d: any) => d.madonvitinh === item.madonvitinh,
    );
    if (!lo || !dv) return 0;
    return Math.floor(lo.tonkhadung / dv.hesoquydoi);
  };

  const kiemTraSoLuong = (item: any) => {
    const index = chiTietData.indexOf(item);
    const updatedData = [...chiTietData];
    let val = parseInt(item.soluongthucte);
    if (isNaN(val) || val < 1) {
      updatedData[index] = { ...item, soluongthucte: 1 };
      setChiTietData(updatedData);
      return;
    }
    const max = getMaxQty(item);
    if (max > 0 && val > max) {
      updatedData[index] = { ...item, soluongthucte: max };
    } else {
      updatedData[index] = { ...item, soluongthucte: val };
    }
    setChiTietData(updatedData);
  };

  const khachHangDuocChon = useMemo(() => {
    if (!masterForm.madoitac) return null;
    return (
      danhSachKhachHang.find((k: any) => k.madoitac === masterForm.madoitac) ||
      null
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
    if (!kh) return { phanTram: 0, tenHang: "Khách Mới" };

    if (kh.solangiaodich_thanhcong >= 10)
      return { phanTram: 5, tenHang: "Khách VIP" };
    if (kh.solangiaodich_thanhcong >= 5)
      return { phanTram: 2, tenHang: "Khách Thân Thiết" };
    return { phanTram: 0, tenHang: "Khách Thường" };
  }, [khachHangDuocChon]);

  useEffect(() => {
    if (mucChietKhau.phanTram > 0) {
      setMasterForm((prev) => ({
        ...prev,
        tienchietkhau: (tongTienHang * mucChietKhau.phanTram) / 100,
      }));
    } else {
      setMasterForm((prev) => ({
        ...prev,
        tienchietkhau: 0,
      }));
    }
  }, [tongTienHang, mucChietKhau]);

  const tongGiaTriDon = useMemo(
    () => Math.max(0, tongTienHang - Number(masterForm.tienchietkhau)),
    [tongTienHang, masterForm.tienchietkhau],
  );

  const tienConNo = useMemo(
    () => Math.max(0, tongGiaTriDon - Number(masterForm.tiendathanhtoan)),
    [tongGiaTriDon, masterForm.tiendathanhtoan],
  );

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
      const donHangData = {
        madoitac: masterForm.madoitac,
        mataikhoan: authStore.user?.mataikhoan,
        loaidonhang: "xuat",
        mavandon3pl: masterForm.mavandon3pl,
        tonggiatri: tongGiaTriDon,
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
          malo: item.malo,
          madonvitinh: item.madonvitinh,
          soluongyeucau: item.soluongthucte,
          soluongthucte: item.soluongthucte,
          dongia: item.dongia,
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

  const khachCanTraModal = useMemo(
    () => Math.max(0, tongTienHangModal - chietKhauModal),
    [tongTienHangModal, chietKhauModal],
  );

  const vietQrUrl = useMemo(() => {
    if (!selectedDonHang) return "";
    const amount = Math.round(khachCanTraModal || 0);
    const addInfo = `Thanh toan don hang XUAT${selectedDonHang.madonhang}`;
    const base =
      import.meta.env.VITE_VIETQR || "https://api.vietqr.io/image/970436-1042328265-wp5fFpl.jpg?accountName=TRAN%20TUAN%20DAT";
    return `${base}&amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
  }, [selectedDonHang, khachCanTraModal]);

  const handlePrint = () => {
    window.print();
  };


  useEffect(() => {
    getData();
  }, []);

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

          <div className='grid grid-cols-12 gap-6'>
            <div className='col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4'>
              <h3 className='font-bold text-gray-700 border-b pb-2 uppercase text-sm'>
                Thông tin
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
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-white ${
                        mucChietKhau.phanTram > 0
                          ? "bg-orange-500"
                          : "bg-gray-400"
                      }`}
                    >
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
                    placeholder='VNPOST-YYYYMMDD-XXXX'
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

              <div className='pt-4 border-t border-dashed space-y-3'>
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
                    {mucChietKhau.phanTram > 0 && (
                      <span className='text-[10px] text-orange-600 font-bold'>
                        (-{mucChietKhau.phanTram}%)
                      </span>
                    )}
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

                <div>
                  <label className='block text-[10px] font-bold text-blue-600 mb-1 uppercase'>
                    Đã thanh toán (VND):
                  </label>
                  <input
                    value={masterForm.tiendathanhtoan}
                    onChange={(e) =>
                      setMasterForm({
                        ...masterForm,
                        tiendathanhtoan: Number(e.target.value),
                      })
                    }
                    type='number'
                    min='0'
                    className='w-full px-3 py-2 border-2 border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-right font-bold outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div className='flex justify-between items-center text-sm bg-gray-100 p-2 rounded-lg border border-gray-200'>
                  <span className='text-gray-600 font-bold text-[11px] uppercase'>
                    Nợ đơn này:
                  </span>
                  <span className='font-black text-gray-800'>
                    {formatCurrency(tienConNo)}
                  </span>
                </div>
              </div>
            </div>

            <div className='col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-200'>
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

              <div className='overflow-x-auto min-h-[400px]'>
                <table className='w-full text-left'>
                  <thead>
                    <tr className='text-[11px] text-gray-500 uppercase border-b bg-gray-50'>
                      <th className='p-3 min-w-[200px] font-bold'>Tên Thuốc</th>
                      <th className='p-3 min-w-[220px] font-bold'>Lô & HSD</th>
                      <th className='p-3 min-w-[150px] font-bold'>
                        ĐV Quy Đổi
                      </th>
                      <th className='p-3 min-w-[120px] text-center font-bold text-blue-600'>
                        SL Xuất
                      </th>
                      <th className='p-3 min-w-[150px] text-right font-bold'>
                        Giá Vốn
                      </th>
                      <th className='p-3 min-w-[100px] text-center font-bold'>
                        % Lãi
                      </th>
                      <th className='p-3 min-w-[150px] text-right text-red-600 font-bold'>
                        Đơn Giá
                      </th>
                      <th className='p-3 w-10'></th>
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
        <div className="flex gap-4">
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
                <th className='p-4 font-semibold'>Phải Thu</th>
                <th className='p-4 font-semibold'>Công Nợ Khách</th>
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

      {/* Detail Modal */}
      {showDetailModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden'>
          <div className='print-area w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-200'>
            <div className='flex items-center justify-between px-6 py-4 border-b'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>
                  Chi tiết Phiếu Xuất
                </h3>
                {selectedDonHang && (
                  <p className='text-xs text-gray-500'>
                    Mã đơn: #{selectedDonHang.madonhang} ·{" "}
                    {formatDate(selectedDonHang.ngaytao)}
                  </p>
                )}
              </div>
              <button
                onClick={closeDetailModal}
                className='print-hidden w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200'
              >
                ×
              </button>
            </div>

            <div className='p-6 space-y-6'>
              <div className='grid grid-cols-12 gap-6'>
                <div className='col-span-8'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='font-bold text-gray-700 uppercase text-sm'>
                      Danh sách hàng hóa
                    </h4>
                    <span className='text-xs text-gray-400'>Đơn xuất kho</span>
                  </div>
                  <div className='overflow-x-auto border rounded-xl'>
                    <table className='w-full text-left text-sm'>
                      <thead>
                        <tr className='bg-gray-50 text-gray-500 uppercase text-[11px]'>
                          <th className='p-3 font-bold'>Thuốc</th>
                          <th className='p-3 font-bold'>Số lượng</th>
                          <th className='p-3 font-bold'>Đơn giá</th>
                          <th className='p-3 font-bold text-right'>
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingDetail ? (
                          <tr>
                            <td
                              colSpan={4}
                              className='p-4 text-center text-gray-400'
                            >
                              Đang tải chi tiết...
                            </td>
                          </tr>
                        ) : chiTietDonHang.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className='p-4 text-center text-gray-400'
                            >
                              Không có dữ liệu.
                            </td>
                          </tr>
                        ) : (
                          chiTietDonHang.map((ct, idx) => (
                            <tr key={idx} className='border-t'>
                              <td className='p-3 font-medium text-gray-700'>
                                {ct.tenthuoc || ct.mathuoc}
                              </td>
                              <td className='p-3'>{ct.soluongthucte}</td>
                              <td className='p-3 text-gray-600'>
                                {formatCurrency(ct.dongia)}
                              </td>
                              <td className='p-3 text-right font-semibold text-gray-800'>
                                {formatCurrency(ct.soluongthucte * ct.dongia)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className='col-span-4 space-y-4'>
                  <div className='border rounded-xl p-4 bg-gray-50'>
                    <h4 className='font-bold text-gray-700 uppercase text-xs mb-3'>
                      Tổng kết tài chính
                    </h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Tổng tiền hàng</span>
                        <span className='font-semibold text-gray-800'>
                          {formatCurrency(tongTienHangModal)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Chiết khấu</span>
                        <span className='font-semibold text-orange-600'>
                          - {formatCurrency(chietKhauModal)}
                        </span>
                      </div>
                      <div className='flex justify-between border-t pt-2'>
                        <span className='font-bold text-gray-700'>
                          Khách cần trả
                        </span>
                        <span className='font-black text-red-600'>
                          {formatCurrency(khachCanTraModal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='border rounded-xl p-4 bg-white'>
                    <h4 className='font-bold text-gray-700 uppercase text-xs mb-3'>
                      VietQR thanh toán
                    </h4>
                    <div className='flex flex-col items-center gap-3'>
                      {vietQrUrl && (
                        <img
                          src={vietQrUrl}
                          alt='VietQR'
                          className='w-48 h-48 rounded-lg border'
                        />
                      )}
                      {selectedDonHang && (
                        <p className='text-[11px] text-gray-500 text-center'>
                          Nội dung chuyển khoản:{" "}
                          <strong>
                            Thanh toan don hang XUAT
                            {selectedDonHang.madonhang}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='print-hidden flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl'>
              <button
                onClick={closeDetailModal}
                className='px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300'
              >
                Đóng
              </button>
              <button
                onClick={handlePrint}
                className='px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700'
              >
                Xuất PDF / In Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
    </div>
  );
}
