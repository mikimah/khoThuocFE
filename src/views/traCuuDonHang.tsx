import { useState, useMemo } from "react";
import { formatCurrency } from "../utils/customFunction";
import api from "../services/api";
import { Box } from "lucide-react";


interface OrderData {
  madonhang: string;
  tendoitac: string;
  ngaytao: string;
  mavandon3pl: string;
  trangthai: string;
  tonggiatri: number;
  tiendathanhtoan: number;
  chitiet: Array<{
    tenthuoc: string;
    soluongthucte: number;
    dongia: number;
    thanhtien: number;
  }>;
}

export default function TraCuuDonHangView() {
  const [sodienthoai, setSodienthoai] = useState("");
  const [mavandon3pl, setMavandon3pl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sodienthoai.trim() && !mavandon3pl.trim()) {
      setErrorMsg("Vui lòng nhập Số điện thoại hoặc Mã vận đơn!");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setOrderData(null);

    try {
      const response = await api.post(`/donhang/tracuu-congkhai`, {
        sodienthoai: sodienthoai.trim() || null,
        mavandon3pl: mavandon3pl.trim() || null,
      });

      setOrderData(response.data.data);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.message ||
          "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin!",
      );
    } finally {
      setIsLoading(false);
    }
  };



  const tienConNo = useMemo(() => {
    if (!orderData) return 0;
    return Math.max(
      0,
      Number(orderData.tonggiatri) - Number(orderData.tiendathanhtoan || 0),
    );
  }, [orderData]);

  const vietQrUrl = useMemo(() => {
    if (!orderData || tienConNo <= 0) return "";
    const amount = Math.round(tienConNo);
    const addInfo = `Thanh toan don hang XUAT${orderData.madonhang}`;
    const base =
      import.meta.env.VITE_VIETQR_API || "https://api.vietqr.io/v2/qr/static?type=pay&account=0351000778617";
    return `${base}&amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
  }, [orderData, tienConNo]);

  const step = useMemo(() => {
    if (!orderData) return 0;
    const status = orderData.trangthai;
    if (status === "huy") return -1;
    if (status === "choduyet") return 1;
    if (status === "daduyet") return 2;
    if (status === "hoanthanh") return 3;
    return 1;
  }, [orderData]);

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 py-12'>
      {/* Header / Logo */}
      <div className='mb-8 text-center'>
        <div className='w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto shadow-lg mb-3'>
          <Box />
        </div>
        <h1 className='text-3xl font-black text-gray-800 tracking-tight'>
          Tra Cứu Đơn Hàng
        </h1>
        <p className='text-gray-500 mt-2 text-sm'>
          Theo dõi trạng thái và thanh toán dễ dàng
        </p>
      </div>

      {/* KHUNG TÌM KIẾM */}
      <div className='w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100'>
        <form onSubmit={handleSearch} className='p-6 sm:p-8 space-y-5'>
          {errorMsg && (
            <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100'>
              {errorMsg}
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5'>
                Mã vận đơn (Tracking)
              </label>
              <input
                value={mavandon3pl}
                onChange={(e) => setMavandon3pl(e.target.value)}
                type='text'
                placeholder='VD: VNPOST-...'
                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-gray-700'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5'>
                Số điện thoại đặt hàng
              </label>
              <input
                value={sodienthoai}
                onChange={(e) => setSodienthoai(e.target.value)}
                type='tel'
                placeholder='09xxxx...'
                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-gray-700'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2'
          >
            {isLoading && (
              <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            )}
            {isLoading ? "Đang tra cứu..." : "Tra cứu ngay"}
          </button>
        </form>
      </div>

      {/* KHUNG KẾT QUẢ */}
      {orderData && (
        <div className='w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up'>
          {/* Banner Trạng thái */}
          <div className='p-6 sm:p-8 bg-slate-800 text-white flex flex-wrap justify-between items-center gap-4'>
            <div>
              <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>
                Mã đơn hàng nội bộ
              </p>
              <h2 className='text-3xl font-black'>#{orderData.madonhang}</h2>
              <p className='text-sm text-slate-300 mt-2'>
                Khách hàng:{" "}
                <span className='font-bold text-white'>
                  {orderData.tendoitac}
                </span>
              </p>
            </div>
            <div className='text-right'>
              <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>
                Ngày đặt hàng
              </p>
              <p className='font-semibold'>
                {new Date(orderData.ngaytao).toLocaleString("vi-VN")}
              </p>
              {orderData.mavandon3pl && (
                <p className='mt-2 text-sm'>
                  Mã Vận Đơn:{" "}
                  <span className='bg-blue-500 text-white px-2 py-0.5 rounded font-mono'>
                    {orderData.mavandon3pl}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Timeline Tracking */}
          <div className='px-6 py-10 sm:px-12 border-b'>
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-widest mb-8 text-center'>
              Tiến trình đơn hàng
            </h3>

            {step === -1 ? (
              <div className='text-center p-6 bg-red-50 rounded-2xl border border-red-100'>
                <span className='text-4xl'>❌</span>
                <h4 className='text-xl font-bold text-red-600 mt-3'>
                  Đơn hàng đã bị hủy
                </h4>
                <p className='text-gray-500 text-sm mt-1'>
                  Rất tiếc, đơn hàng này đã bị từ chối hoặc hủy bỏ.
                </p>
              </div>
            ) : (
              <div className='relative flex justify-between'>
                {/* Line background */}
                <div className='absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0'></div>
                {/* Line progress */}
                <div
                  className='absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-700'
                  style={{
                    width: step === 1 ? "10%" : step === 2 ? "50%" : "100%",
                  }}
                ></div>

                {/* Bước 1 */}
                <div className='relative z-10 flex flex-col items-center'>
                  <div
                    className={`w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors ${
                      step >= 1
                        ? "bg-blue-500 text-white shadow-blue-200"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    }`}
                  >
                    1
                  </div>
                  <p
                    className={`mt-3 text-xs font-bold ${
                      step >= 1 ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    Đã tiếp nhận
                  </p>
                </div>

                {/* Bước 2 */}
                <div className='relative z-10 flex flex-col items-center'>
                  <div
                    className={`w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors ${
                      step >= 2
                        ? "bg-blue-500 text-white shadow-blue-200"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    }`}
                  >
                    2
                  </div>
                  <p
                    className={`mt-3 text-xs font-bold ${
                      step >= 2 ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    Đã xuất kho
                  </p>
                </div>

                {/* Bước 3 */}
                <div className='relative z-10 flex flex-col items-center'>
                  <div
                    className={`w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors ${
                      step >= 3
                        ? "bg-blue-500 text-white shadow-blue-200"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    }`}
                  >
                    3
                  </div>
                  <p
                    className={`mt-3 text-xs font-bold ${
                      step >= 3 ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    Hoàn thành
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3'>
            {/* Chi tiết sản phẩm */}
            <div className='md:col-span-2 p-6 sm:p-8 bg-gray-50/50'>
              <h3 className='font-bold text-gray-800 uppercase text-sm mb-4'>
                Chi tiết mặt hàng
              </h3>
              <div className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
                <table className='w-full text-left text-sm'>
                  <thead className='bg-gray-50 border-b'>
                    <tr className='text-xs text-gray-500 uppercase'>
                      <th className='p-4 font-bold'>Sản phẩm</th>
                      <th className='p-4 font-bold text-center'>Số lượng</th>
                      <th className='p-4 font-bold text-right'>Đơn giá</th>
                      <th className='p-4 font-bold text-right'>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {orderData.chitiet?.map((item, index) => (
                      <tr key={index} className='hover:bg-gray-50'>
                        <td className='p-4 font-medium text-gray-800'>
                          {item.tenthuoc}
                        </td>
                        <td className='p-4 text-center text-blue-600 font-bold'>
                          {item.soluongthucte}
                        </td>
                        <td className='p-4 text-right text-gray-500'>
                          {formatCurrency(item.dongia)}
                        </td>
                        <td className='p-4 text-right font-bold text-gray-800'>
                          {formatCurrency(item.thanhtien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Thanh toán & QR */}
            <div className='p-6 sm:p-8 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col justify-between'>
              <div className='space-y-4 mb-8'>
                <h3 className='font-bold text-gray-800 uppercase text-sm mb-4'>
                  Tổng thanh toán
                </h3>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Tổng giá trị đơn</span>
                  <span className='font-bold text-gray-700'>
                    {formatCurrency(orderData.tonggiatri)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Đã thanh toán</span>
                  <span className='font-bold text-green-600'>
                    - {formatCurrency(orderData.tiendathanhtoan)}
                  </span>
                </div>
                <div className='flex justify-between items-center pt-3 border-t border-gray-200'>
                  <span className='font-bold text-gray-800'>Khách cần trả</span>
                  <span className='text-2xl font-black text-red-600'>
                    {formatCurrency(tienConNo)}
                  </span>
                </div>
              </div>

              {tienConNo > 0 && vietQrUrl ? (
                <div className='bg-blue-50 rounded-2xl p-4 flex flex-col items-center border border-blue-100'>
                  <p className='text-xs font-bold text-blue-800 uppercase mb-3 text-center'>
                    Quét QR Thanh Toán
                  </p>
                  <div className='bg-white p-2 rounded-xl shadow-sm'>
                    <img
                      src={vietQrUrl}
                      alt='VietQR'
                      className='w-40 h-40 object-contain rounded-lg mix-blend-multiply'
                    />
                  </div>
                  <p
                    className='text-[10px] text-gray-500 mt-3 text-center w-full truncate'
                    title={`Sẽ được tự động điền khi quét`}
                  >
                    ND: Thanh toan don hang XUAT{orderData.madonhang}
                  </p>
                </div>
              ) : tienConNo === 0 ? (
                <div className='bg-green-50 rounded-2xl p-6 text-center border border-green-100'>
                  <div className='w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3'>
                    ✓
                  </div>
                  <h4 className='font-bold text-green-700'>Đã thanh toán đủ</h4>
                  <p className='text-xs text-green-600 mt-1'>
                    Cảm ơn bạn đã giao dịch!
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
