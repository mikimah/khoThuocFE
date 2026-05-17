import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import Chart from "react-apexcharts";
import { formatCurrency } from "../utils/customFunction";

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
  const [topThuoc, setTopThuoc] = useState<any[]>([]);



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
      colors: ["#3B82F6", "#F97316"],
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
      colors: ["#6366F1", "#10B981"],
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
    return params;
  };

  const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

  const applyRange = (start: Date, end: Date) => {
    setTuNgay(toDateInput(start));
    setDenNgay(toDateInput(end));
    setSelectedQuarter("");
    loadData(start, end);
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

  const loadData = async (startDate?: Date, endDate?: Date) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const params = buildParams();
      const [resTongQuan, resBieuDo, resTop]: any = await Promise.all([
        api.get("/thongke/tongquan", { params }),
        api.get("/thongke/bieudo", { params }),
        api.get("/thongke/top-thuoc", { params }),
      ]);

      if (resTongQuan?.success === false)
        throw new Error(resTongQuan?.message || "Lỗi tổng quan");
      if (resBieuDo?.success === false)
        throw new Error(resBieuDo?.message || "Lỗi biểu đồ");
      if (resTop?.success === false)
        throw new Error(resTop?.message || "Lỗi top thuốc");

      const tongQuanData = unwrapData(resTongQuan) || {
        doanhthu: 0,
        tongvon: 0,
        loinhuan: 0,
        sodonhang: 0,
      };
      const bieuDoData = unwrapData(resBieuDo) || [];
      const topData = unwrapData(resTop) || [];

      setTongQuan(tongQuanData);
      setBieuDo(Array.isArray(bieuDoData) ? bieuDoData : []);
      setTopThuoc(Array.isArray(topData) ? topData : []);
    } catch (error: any) {
      setErrorMsg(error?.message || "Không thể tải dữ liệu báo cáo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    setSelectedQuarter("");
    loadData();
  };

  const handlePrint = () => {
    window.print();
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  return (
    <div className={'bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen print-area'}>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>
            📊 Báo cáo Doanh thu & Lợi nhuận
          </h2>
          <p className='text-sm text-gray-500 mt-1'>
            Tổng quan hiệu quả kinh doanh theo thời gian
          </p>
        </div>

        <div className='bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap gap-3 items-end print-hidden'>
          <div>
            <label className='block text-[11px] font-bold text-gray-500 uppercase mb-1'>
              Từ ngày
            </label>
            <input
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              type='date'
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'
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
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'
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
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'
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
          <button
            onClick={handleFilter}
            disabled={isLoading}
            className='h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition disabled:bg-gray-400'
          >
            Lọc dữ liệu
          </button>
          <button
            onClick={handlePrint}
            className='h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition'
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 mb-6 print-hidden'>
        <button
          onClick={() => applyLastDays(7)}
          className='px-3 py-1.5 text-xs font-bold rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition'
        >
          7 ngày
        </button>
        <button
          onClick={() => applyLastDays(30)}
          className='px-3 py-1.5 text-xs font-bold rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition'
        >
          30 ngày
        </button>
        <button
          onClick={applyThisMonth}
          className='px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition'
        >
          Tháng này
        </button>
        <button
          onClick={applyLastMonth}
          className='px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition'
        >
          Tháng trước
        </button>
        <button
          onClick={applyThisYear}
          className='px-3 py-1.5 text-xs font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition'
        >
          Năm nay
        </button>
      </div>

      {errorMsg && (
        <div className='mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold'>
          {errorMsg}
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8'>
        <div className='bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-blue-500 uppercase'>
                Tổng doanh thu
              </p>
              <p className='text-2xl font-black text-blue-700 mt-2'>
                {formatCurrency(tongQuan.doanhthu)}
              </p>
            </div>
            <div className='w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl'>
              💰
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-amber-500 uppercase'>
                Tổng vốn
              </p>
              <p className='text-2xl font-black text-amber-700 mt-2'>
                {formatCurrency(tongQuan.tongvon)}
              </p>
            </div>
            <div className='w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl'>
              📦
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-emerald-500 uppercase'>
                Lợi nhuận gộp
              </p>
              <p className='text-2xl font-black text-emerald-700 mt-2'>
                {formatCurrency(tongQuan.loinhuan)}
              </p>
            </div>
            <div className='w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl'>
              📈
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-slate-500 uppercase'>
                Số đơn hàng
              </p>
              <p className='text-2xl font-black text-slate-700 mt-2'>
                {tongQuan.sodonhang}
              </p>
            </div>
            <div className='w-12 h-12 rounded-full bg-slate-600 text-white flex items-center justify-center text-xl'>
              🧾
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5'>
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

        <div className='bg-white border border-gray-200 rounded-2xl shadow-sm p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-bold text-gray-800 uppercase text-sm'>
              Top thuốc bán chạy
            </h3>
            <span className='text-xs text-gray-400'>Theo doanh thu</span>
          </div>

          {isLoading ? (
            <div className='h-[350px] flex items-center justify-center text-gray-400'>
              Đang tải danh sách...
            </div>
          ) : topThuoc.length === 0 ? (
            <div className='h-[350px] flex items-center justify-center text-gray-400'>
              Không có dữ liệu.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='text-[11px] text-gray-500 uppercase border-b'>
                    <th className='py-2'>Thuốc</th>
                    <th className='py-2 text-right'>SL</th>
                    <th className='py-2 text-right'>Doanh thu</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {topThuoc.map((row) => (
                    <tr key={row.mathuoc} className='hover:bg-gray-50'>
                      <td className='py-2'>
                        <p className='font-medium text-gray-700'>
                          {row.tenthuoc}
                        </p>
                        <p className='text-[10px] text-gray-400'>
                          {row.mathuoc}
                        </p>
                      </td>
                      <td className='py-2 text-right text-blue-600 font-bold'>
                        {row.tongsoluong}
                      </td>
                      <td className='py-2 text-right font-semibold text-gray-700'>
                        {formatCurrency(row.doanhthu)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
