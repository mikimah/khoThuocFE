import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import Chart from "react-apexcharts";
import { formatCurrency } from "../utils/customFunction";
import ReloadBtn from "../components/common/reloadBtn";
import { showSuccess, showError } from "../utils/notify";

export default function BaoCaoView() {
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");

  const [tongQuan, setTongQuan] = useState({
    doanhthu: 0,
    tongvon: 0,
    loinhuan: 0,
    sodonhang: 0,
  });

  const [bieuDo, setBieuDo] = useState<any[]>([]);
  const [chiTietGiaoDich, setChiTietGiaoDich] = useState<any[]>([]);
  const [danhSachDoitac, setDanhSachDoitac] = useState<any[]>([]);
  const [danhSachThuoc, setDanhSachThuoc] = useState<any[]>([]);
  const [selectedDoitac, setSelectedDoitac] = useState("");
  const [selectedThuoc, setSelectedThuoc] = useState("");

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [resDT, resThuoc]: any = await Promise.all([
          api.get("/doitac"),
          api.get("/thuoc"),
        ]);
        setDanhSachDoitac(resDT?.data || []);
        setDanhSachThuoc(resThuoc?.data || []);
      } catch (e) {
        console.error("Lỗi lấy danh sách đối tác/thuốc", e);
      }
    };
    fetchDropdowns();
  }, []);

  const chartSeries = useMemo(
    () => [
      {
        name: "Doanh thu",
        type: "column",
        data: bieuDo.map((item: any) => Number(item.doanhthu || 0)),
      },
      {
        name: "Lợi nhuận",
        type: "line",
        data: bieuDo.map((item: any) => Number(item.loinhuan || 0)),
      },
    ],
    [bieuDo],
  );

  // --- CHART OPTIONS ---
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        stacked: false,
        toolbar: { show: false },
      },
      stroke: { width: [0, 3], curve: "smooth" },
      plotOptions: {
        bar: { columnWidth: "50%" },
      },
      dataLabels: { enabled: false },
      colors: ["#6366F1", "#14B8A6"], // Indigo và Teal sang trọng hơn
      xaxis: {
        categories: bieuDo.map((item: any) => item.ngay),
        labels: { style: { colors: "#6B7280" } },
      },
      yaxis: [
        {
          axisTicks: { show: true },
          axisBorder: { show: true },
          labels: {
            formatter: (val: number) => `${Math.round(val / 1000)}k`,
            style: { colors: "#3B82F6" },
          },
        },
        {
          opposite: true,
          axisTicks: { show: true },
          axisBorder: { show: true },
          labels: {
            formatter: (val: number) => `${Math.round(val / 1000)}k`,
            style: { colors: "#F97316" },
          },
        },
      ],
      grid: { borderColor: "#E5E7EB" },
      legend: { position: "top", horizontalAlign: "right" },
      tooltip: {
        y: {
          formatter: (val: number) => formatCurrency(val),
        },
      },
    }),
    [bieuDo],
  );

  const monthlyData = useMemo(() => {
    const bucket = new Map<string, { doanhthu: number; loinhuan: number }>();
    for (const item of bieuDo) {
      const key = String(item.ngay || "").slice(0, 7);
      if (!key) continue;
      const current = bucket.get(key) || {
        doanhthu: 0,
        loinhuan: 0,
      };
      current.doanhthu += Number(item.doanhthu || 0);
      current.loinhuan += Number(item.loinhuan || 0);
      bucket.set(key, current);
    }
    return Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([thang, values]) => ({ thang, ...values }));
  }, [bieuDo]);

  const monthlySeries = useMemo(
    () => [
      {
        name: "Doanh thu",
        type: "column",
        data: monthlyData.map((item) => item.doanhthu),
      },
      {
        name: "Lợi nhuận",
        type: "line",
        data: monthlyData.map((item) => item.loinhuan),
      },
    ],
    [monthlyData],
  );

  const monthlyOptions = useMemo(
    () => ({
      chart: {
        height: 320,
        type: "line",
        toolbar: { show: false },
      },
      stroke: { width: [0, 3], curve: "smooth" },
      dataLabels: { enabled: false },
      colors: ["#8B5CF6", "#10B981"], // Tím Violet và Xanh ngọc
      xaxis: {
        categories: monthlyData.map((item) => item.thang),
        labels: { style: { colors: "#6B7280" } },
      },
      yaxis: [
        {
          labels: {
            formatter: (val: number) => `${Math.round(val / 1000)}k`,
            style: { colors: "#6B7280" },
          },
        },
        {
          opposite: true,
          labels: {
            formatter: (val: number) => `${Math.round(val / 1000)}k`,
            style: { colors: "#6B7280" },
          },
        },
      ],
      grid: { borderColor: "#E5E7EB" },
      legend: { position: "top", horizontalAlign: "right" },
      tooltip: {
        y: {
          formatter: (val: number) => formatCurrency(val),
        },
      },
    }),
    [monthlyData],
  );

  const buildParams = () => {
    const params: Record<string, string> = {};
    if (tuNgay) params.tuNgay = tuNgay;
    if (denNgay) params.denNgay = denNgay;
    if (selectedDoitac) params.madoitac = selectedDoitac;
    if (selectedThuoc) params.mathuoc = selectedThuoc;
    return params;
  };

  const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

  const applyRange = (start: Date, end: Date) => {
    setTuNgay(toDateInput(start));
    setDenNgay(toDateInput(end));
    setSelectedQuarter("");
    getData(start, end);
  };

  const applyLastDays = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    applyRange(start, end);
  };

  const applyThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    applyRange(start, end);
  };

  const applyLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    applyRange(start, end);
  };

  const applyThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    applyRange(start, end);
  };

  const applyQuarter = (quarter: number, year: number) => {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    applyRange(start, end);
  };

  const handleQuarterChange = (value: string) => {
    if (!value) return;
    const [yearStr, qStr] = value.split("-");
    const year = Number(yearStr);
    const quarter = Number(qStr.replace("Q", ""));
    if (year && quarter) applyQuarter(quarter, year);
  };

  const unwrapData = (res: any) =>
    res && typeof res === "object" && "data" in res ? res.data : res;

  const getData = async (startDate?: Date, endDate?: Date) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const params = buildParams();
      // Ghi đè tham số nếu được truyền trực tiếp (tránh React state update chậm)
      if (startDate) params.tuNgay = toDateInput(startDate);
      if (endDate) params.denNgay = toDateInput(endDate);

      const [resTongQuan, resBieuDo, resChiTiet]: any = await Promise.all([
        api.get("/thongke/tongquan", { params }),
        api.get("/thongke/bieudo", { params }),
        api.get("/thongke/chitiet", { params }),
      ]);

      if (resTongQuan?.success === false)
        throw new Error(resTongQuan?.message || "Lỗi tổng quan");
      if (resBieuDo?.success === false)
        throw new Error(resBieuDo?.message || "Lỗi biểu đồ");

      const tongQuanData = unwrapData(resTongQuan) || {
        doanhthu: 0,
        tongvon: 0,
        loinhuan: 0,
        sodonhang: 0,
      };
      const bieuDoData = unwrapData(resBieuDo) || [];
      const chiTietData = unwrapData(resChiTiet) || [];

      setTongQuan(tongQuanData);
      setBieuDo(Array.isArray(bieuDoData) ? bieuDoData : []);
      setChiTietGiaoDich(Array.isArray(chiTietData) ? chiTietData : []);
    } catch (error: any) {
      setErrorMsg(error?.message || "Không thể tải dữ liệu báo cáo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    setSelectedQuarter("");
    getData();
  };

  const handlePrint = () => {
    window.print();
  };

  // Load data on mount
  useEffect(() => {
    getData();
  }, []);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  return (
    <div
      className={
        "bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen print-area"
      }
    >
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>
            Báo cáo Doanh thu & Lợi nhuận
          </h2>
          <p className='text-sm text-gray-500 mt-1'>
            Tổng quan hiệu quả kinh doanh theo thời gian
          </p>
        </div>
      </div>

      <div className='bg-gray-50 border border-gray-200 rounded-xl mb-5 p-3 flex items-end gap-3 print-hidden w-full overflow-x-auto whitespace-nowrap'>
        <div>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Từ ngày
          </label>
          <input
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            type='date'
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]'
          />
        </div>

        <div>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Đến ngày
          </label>
          <input
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            type='date'
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]'
          />
        </div>

        <div>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Theo quý
          </label>
          <select
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              handleQuarterChange(e.target.value);
            }}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 w-[110px]'
          >
            <option value=''>Chọn quý</option>
            {years.map((year) => (
              <optgroup key={year} label={`Năm ${year}`}>
                <option value={`${year}-Q1`}>Q1 / {year}</option>
                <option value={`${year}-Q2`}>Q2 / {year}</option>
                <option value={`${year}-Q3`}>Q3 / {year}</option>
                <option value={`${year}-Q4`}>Q4 / {year}</option>
              </optgroup>
            ))}
          </select>
        </div>

        <div className='w-px h-10 bg-gray-300 mx-1 shrink-0 hidden md:block'></div>

        <div>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Lọc Đối Tác
          </label>
          <select
            value={selectedDoitac}
            onChange={(e) => setSelectedDoitac(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 w-[190px]'
          >
            <option value=''>Tất cả</option>
            {danhSachDoitac.map((dt) => (
              <option key={dt.madoitac} value={dt.madoitac}>
                {dt.tendoitac}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
            Lọc Thuốc
          </label>
          <select
            value={selectedThuoc}
            onChange={(e) => setSelectedThuoc(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 w-[190px]'
          >
            <option value=''>Tất cả</option>
            {danhSachThuoc.map((t) => (
              <option key={t.mathuoc} value={t.mathuoc}>
                {t.tenthuoc}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => getData()}
          className='px-5 py-2 h-[38px] bg-blue-600 text-white rounded-lg shadow-sm text-sm hover:bg-blue-700 font-bold transition ml-auto shrink-0 whitespace-nowrap'
        >
          Lọc Dữ Liệu
        </button>
        <button
          onClick={handlePrint}
          className='px-4 py-2 h-[38px] bg-gray-800 text-white rounded-lg shadow-sm text-sm hover:bg-gray-700 font-bold transition shrink-0 whitespace-nowrap flex items-center gap-2'
          title='In báo cáo hoặc Lưu file PDF'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
            />
          </svg>
          Xuất PDF
        </button>
      </div>

      {errorMsg && (
        <div className='mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold'>
          {errorMsg}
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8'>
        {/* Card Doanh Thu */}
        <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow'>
          <div className='flex flex-col'>
            <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider'>
              Tổng doanh thu
            </p>
            <p className='text-2xl font-black text-gray-800 mt-2 tracking-tight'>
              {formatCurrency(tongQuan.doanhthu)}
            </p>
          </div>
        </div>

        {/* Card Tổng Vốn */}
        <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow'>
          <div className='flex flex-col'>
            <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider'>
              Tổng vốn (Tiền nhập)
            </p>
            <p className='text-2xl font-black text-gray-800 mt-2 tracking-tight'>
              {formatCurrency(tongQuan.tongvon)}
            </p>
          </div>
        </div>

        {/* Card Lợi Nhuận */}
        <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-teal-500 hover:shadow-md transition-shadow'>
          <div className='flex flex-col'>
            <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider'>
              Lợi nhuận gộp
            </p>
            <p className='text-2xl font-black text-teal-600 mt-2 tracking-tight'>
              {formatCurrency(tongQuan.loinhuan)}
            </p>
          </div>
        </div>

        {/* Card Số Đơn Hàng */}
        <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-slate-700 hover:shadow-md transition-shadow'>
          <div className='flex flex-col'>
            <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider'>
              Số đơn xuất kho
            </p>
            <p className='text-2xl font-black text-gray-800 mt-2 tracking-tight'>
              {tongQuan.sodonhang}{" "}
              <span className='text-sm font-medium text-gray-400 tracking-normal'>
                đơn
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <div className='bg-white border border-gray-200 rounded-2xl shadow-sm p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-bold text-gray-800 uppercase text-sm'>
              Biểu đồ Doanh thu & Lợi nhuận
            </h3>
            <span className='text-xs text-gray-400'>Theo ngày</span>
          </div>
          {isLoading ? (
            <div className='h-[350px] flex items-center justify-center text-gray-400'>
              Đang tải biểu đồ...
            </div>
          ) : bieuDo.length === 0 ? (
            <div className='h-[350px] flex items-center justify-center text-gray-400'>
              Không có dữ liệu biểu đồ.
            </div>
          ) : (
            <Chart
              options={chartOptions}
              series={chartSeries}
              type='line'
              height={350}
            />
          )}

          <div className='mt-6'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='font-bold text-gray-800 uppercase text-xs'>
                So sánh theo tháng
              </h4>
              <span className='text-xs text-gray-400'>Tổng hợp</span>
            </div>
            {isLoading ? (
              <div className='h-[320px] flex items-center justify-center text-gray-400'>
                Đang tải biểu đồ tháng...
              </div>
            ) : monthlyData.length === 0 ? (
              <div className='h-[320px] flex items-center justify-center text-gray-400'>
                Không có dữ liệu theo tháng.
              </div>
            ) : (
              <Chart
                type='line'
                height={320}
                options={monthlyOptions}
                series={monthlySeries}
              />
            )}
          </div>
        </div>
      </div>

      <div className='mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5'>
        <h3 className='text-md font-bold text-gray-800 mb-4 tracking-wide uppercase'>
          {selectedDoitac || selectedThuoc
            ? "Chi tiết giao dịch đã lọc"
            : "Lịch sử giao dịch gần đây"}
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm whitespace-nowrap'>
            <thead className='bg-gray-50 text-gray-500 uppercase text-[11px] font-bold'>
              <tr>
                <th className='px-4 py-3 rounded-tl-lg'>Mã Đơn</th>
                <th className='px-4 py-3'>Ngày Tạo</th>
                <th className='px-4 py-3'>Loại Đơn</th>
                <th className='px-4 py-3'>Đối Tác</th>
                <th className='px-4 py-3 text-right'>Giá Trị</th>
                <th className='px-4 py-3 rounded-tr-lg text-center'>
                  Trạng Thái
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {chiTietGiaoDich.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                chiTietGiaoDich.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className='hover:bg-gray-50/50 transition-colors'
                  >
                    <td className='px-4 py-3 font-medium text-blue-600'>
                      #{item.madonhang}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>
                      {new Date(item.ngaytao).toLocaleDateString("vi-VN")}
                    </td>
                    <td className='px-4 py-3'>
                      {item.loaidonhang === "nhap" ? (
                        <span className='text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded'>
                          Nhập kho
                        </span>
                      ) : (
                        <span className='text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded'>
                          Xuất kho
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-gray-800 max-w-[250px] truncate'>
                      {item.tendoitac || "-"}
                    </td>
                    <td className='px-4 py-3 text-right font-bold text-gray-900'>
                      {formatCurrency(Number(item.giatri || 0))}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {item.trangthai === "hoanthanh" ? (
                        <span className='text-xs text-emerald-600 font-medium'>
                          Hoàn thành
                        </span>
                      ) : (
                        <span className='text-xs text-blue-600 font-medium'>
                          Đã duyệt
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
