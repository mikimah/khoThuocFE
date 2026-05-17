import { useAuthStore } from "../context/useAuthStore"
import { useState, useEffect } from "react"
import { formatCurrency } from "../utils/customFunction"
import { Link } from "react-router-dom"
import api from "../services/api"

export default function DashboardAdmin() {
    const [isLoading, setIsLoading] = useState(true);
    const authStore = useAuthStore();
    const [danhSachDonMoiNhat, setDanhSachDonMoiNhat] = useState([]);
    const [tongThuocTrongKho, setTongThuocTrongKho] = useState(0);
    const [soDonChoDuyet, setSoDonChoDuyet] = useState(0);
    const [tongDoanhThu, setTongDoanhThu] = useState(0);



    async function getData(){
        setIsLoading(true);
        try {
            // Kéo dữ liệu từ 3 bảng quan trọng nhất để tính toán
            const [resDH, resPKK, resLoThuoc]: any = await Promise.all([
                api.get('/donhang'),
                api.get('/phieukiemke'),
                api.get('/lothuoc')
            ]);

            const donHangData = resDH.data || [];
            const pkkData = resPKK.data || [];
            const loThuocData = resLoThuoc.data || [];

            // 1. Tính TỔNG THUỐC TRONG KHO (Cộng dồn tất cả tồn thực tế trên kệ)
            const tongThuoc = loThuocData.reduce((sum: number, lo: any) => sum + Number(lo.tonthucte || 0), 0);
            setTongThuocTrongKho(tongThuoc);

            // 2. Tính TỔNG DOANH THU (Chỉ cộng tiền của các Đơn Xuất đã được Duyệt)
            const tongThuNhap = donHangData
                .filter((dh: any) => dh.loaidonhang === 'xuat' && dh.trangthai === 'daduyet')
                .reduce((sum: number, dh: any) => sum + Number(dh.tonggiatri || 0), 0);
            setTongDoanhThu(tongThuNhap);

            // 3. Tính SỐ ĐƠN CHỜ DUYỆT (Bao gồm Đơn Nhập/Xuất chờ duyệt + Phiếu Kiểm Kê chờ duyệt)
            const soDHChoDuyet = donHangData.filter((dh: any) => dh.trangthai === 'choduyet').length;
            const soKiemKeChoDuyet = pkkData.filter((p: any) => p.trangthai === 'dangkhiemke' || p.trangthai === 'Draft').length;
            setSoDonChoDuyet(soDHChoDuyet + soKiemKeChoDuyet);

            // 4. Lấy 5 giao dịch mới nhất cho Bảng Lịch sử (bao gồm cả nhập và xuất)
            const donMoiNhat = [...donHangData]
                .sort((a: any, b: any) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
                .slice(0, 5);
            setDanhSachDonMoiNhat(donMoiNhat);

        } catch (error) {
            console.error('Lỗi tải Dashboard:', error);
        } finally {
            setIsLoading(false);
        }        
    }

    function renderItems(item: any[]) {
        // Nếu không có dữ liệu
        if (!item || item.length === 0) {
            return (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                        Chưa có giao dịch nào được ghi nhận.
                    </td>
                </tr>
            );
        }
        // Render danh sách
        return item.map((dh) => (
            <tr key={dh.madonhang} className="border-b border-dashed hover:bg-gray-50">
                <td className="px-6 py-4 font-black text-gray-800">#{dh.madonhang}</td>
                <td className="px-6 py-4">
                    <span className={`font-bold text-[10px] uppercase px-2 py-1 rounded border inline-block ${
                        String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap'
                            ? 'text-purple-600 bg-purple-50 border-purple-200'
                            : 'text-blue-600 bg-blue-50 border-blue-200'
                    }`}>
                        {String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap' ? '📦 Nhập Kho' : '🚚 Xuất Kho'}
                    </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">{dh.tendoitac}</td>
                <td className="px-6 py-4 text-right font-black text-red-600">{formatCurrency(dh.tonggiatri)}</td>
                <td className="px-6 py-4 text-center">
                    {dh.trangthai === 'choduyet' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Chờ duyệt</span>}
                    {dh.trangthai === 'daduyet' && <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Hoàn thành</span>}
                    {dh.trangthai !== 'choduyet' && dh.trangthai !== 'daduyet' && <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">Đã hủy</span>}
                </td>
            </tr>
        ));
    }


    // Gọi API khi component mount
    useEffect(() => {
        getData();
    }, []);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">
                    Chào mừng trở lại, <span className="text-blue-600">{authStore.user?.tendangnhap}</span>!
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">Admin Dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
                <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-blue-500 hover:shadow-md transition">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Tổng Tồn Kho (Thực tế)</h3>
                    <p className="text-3xl font-black text-gray-800 mt-2">{tongThuocTrongKho.toLocaleString('vi-VN')} <span className="text-sm font-medium text-gray-400">đơn vị</span></p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-orange-500 hover:shadow-md transition relative overflow-hidden">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Yêu Cầu Chờ Phê Duyệt</h3>
                    <p className="text-3xl font-black text-orange-600 mt-2">{soDonChoDuyet}</p>
                    {soDonChoDuyet > 0 && (
                        <Link to="/duyet-don" className="absolute top-6 right-6 text-sm font-bold text-orange-500 hover:underline">
                            Xử lý ngay →
                        </Link>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-green-500 hover:shadow-md transition">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Tổng Doanh Thu Ghi Nhận</h3>
                    <p className="text-3xl font-black text-green-600 mt-2">{formatCurrency(tongDoanhThu)}</p>
                </div>

            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">📌 5 Giao dịch gần nhất</h2>
                    <Link to="/lich-su-don-hang" className="text-sm text-blue-600 font-bold hover:underline">Xem toàn bộ lịch sử</Link>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-gray-500">Đang đồng bộ dữ liệu hệ thống...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[12px] text-gray-500 uppercase border-b bg-white">
                                    <th className="px-6 py-3 font-bold">Mã Đơn</th>
                                    <th className="px-6 py-3 font-bold">Phân Loại</th>
                                    <th className="px-6 py-3 font-bold">Đối Tác</th>
                                    <th className="px-6 py-3 font-bold text-right">Tổng Tiền</th>
                                    <th className="px-6 py-3 font-bold text-center">Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderItems(danhSachDonMoiNhat)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
