import { useAuthStore } from "../context/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { formatCurrency } from "../utils/customFunction";
import { showError } from "../utils/notify";

export default function DashboardSalesView() {
    const [isLoading, setIsLoading] = useState(true);
    const authStore = useAuthStore();
    const user = authStore.user;
    const [tatCaDonHang, setTatCaDonHang] = useState([]);
    const [tatCaLoThuoc, setTatCaLoThuoc] = useState([]);
    const [tatCaThuoc, setTatCaThuoc] = useState([]);
    const [searchLookup, setSearchLookup] = useState("");

    async function getData(){
        setIsLoading(true);
        try{
            const [resDH, resLo, resThuoc]: any = await Promise.all([
                api.get('/donhang'),
                api.get('/lothuoc'),
                api.get('/thuoc')
            ]);
            setTatCaDonHang(resDH.data || []);
            setTatCaLoThuoc(resLo.data || []);
            setTatCaThuoc(resThuoc.data || []);
        } catch (error) {
            showError('Lỗi tải Dashboard Sales');
        } finally {
            setIsLoading(false);
        }
    }

    const donHangCuaToi = useMemo(() => {
        const myId = user?.mataikhoan;
        return tatCaDonHang.filter((dh: any) => dh.mataikhoan === myId);
    }, [user, tatCaDonHang]);

    const top5DonHang = useMemo(() => {
        return [...donHangCuaToi]
            .sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
            .slice(0, 5);
    }, [donHangCuaToi]);

    const doanhSoThanhCong = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let sum = 0;
        donHangCuaToi.forEach((dh: any) => {
            const ngayTao = new Date(dh.ngaytao);
            if (dh.loaidonhang === 'xuat' && dh.trangthai === 'daduyet' && 
                ngayTao.getMonth() === currentMonth && ngayTao.getFullYear() === currentYear) {
                sum += Number(dh.tonggiatri || 0);
            }
        });
        return sum;
    }, [donHangCuaToi]);

    const soDonDangCho = useMemo(() => {
        return donHangCuaToi.filter((dh: any) => dh.trangthai === 'choduyet').length;
    }, [donHangCuaToi]);

    const donBiTuChoi = useMemo(() => {
        return donHangCuaToi.filter((dh: any) => dh.trangthai === 'huy').slice(0, 3);
    }, [donHangCuaToi]);

    const ketQuaTraCuu = useMemo(() => {
        if (!searchLookup.trim()) return [];
        const search = searchLookup.toLowerCase();
        return tatCaLoThuoc.filter((lo: any) => 
            lo.tenthuoc?.toLowerCase().includes(search)
        );
    }, [searchLookup, tatCaLoThuoc]);

    useEffect(() => {
        getData();
    }, []);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chào Sales, <span className="text-blue-600">{ authStore.user?.tendangnhap }</span>!</h1>
                    <p className="text-sm text-gray-500 mt-1">Hôm nay bạn có <span className="font-bold text-orange-600">{ soDonDangCho }</span> đơn hàng đang chờ Admin duyệt.</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngày hiện tại</p>
                    <p className="font-bold text-gray-700">{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) }</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="text-blue-100 text-xs font-bold uppercase">Doanh số cá nhân tháng này</h3>
                    <p className="text-3xl font-black mt-2">{ formatCurrency(doanhSoThanhCong) }</p>
                    <div className="mt-4 flex items-center text-[11px] bg-white/10 w-fit px-2 py-1 rounded">
                    ✨ Chỉ tính các đơn xuất đã hoàn thành
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-400 text-xs font-bold uppercase">Tiến độ chốt đơn</h3>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-black text-gray-800">{ donHangCuaToi.length } <span className="text-sm font-normal text-gray-400">phiếu tạo</span></p>
                        <div className="text-right">
                            <p className="text-orange-500 font-bold text-sm">{ soDonDangCho } chờ duyệt</p>
                            <p className="text-red-500 font-bold text-sm">{ donHangCuaToi.filter(d => d.trangthai === 'huy').length } bị từ chối</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Tra cứu số lượng chào khách</h3>
                    <div className="relative">
                        <input 
                            value={searchLookup}
                            onChange={(e) => setSearchLookup(e.target.value)}
                            type="text" 
                            placeholder="Gõ tên thuốc để xem hàng khả dụng..." 
                            className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <span className="absolute right-3 top-2.5">🔍</span>
                    </div>
                    
                    {ketQuaTraCuu.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-xl border z-50 overflow-hidden max-h-60 overflow-y-auto">
                            {ketQuaTraCuu.map((item: any) => (
                                <div key={item.malo} className="p-3 border-b hover:bg-blue-50 cursor-default transition">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-800 text-sm">{item.tenthuoc}</span>
                                        <span className="text-blue-600 font-bold text-xs">Khả dụng: {item.tonkhadung}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Lô: <span className="font-medium">{item.solo}</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800">📌 Giao dịch xuất hàng gần đây</h2>
                        <button onClick={() => getData()} className="text-xs text-blue-600 font-bold transition-all hover:underline">Làm mới 🔄</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                                    <th className="px-6 py-3 font-bold">Mã Đơn</th>
                                    <th className="px-6 py-3 font-bold">Khách Hàng</th>
                                    <th className="px-6 py-3 font-bold text-right">Tổng Tiền</th>
                                    <th className="px-6 py-3 font-bold text-center">Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {top5DonHang.length > 0 ? (
                                top5DonHang.map((dh: any) => (
                                    <tr key={dh.madonhang} className="hover:bg-blue-50/30 transition">
                                        <td className="px-6 py-4 font-black text-gray-700">#{ dh.madonhang }</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{ dh.tendoitac }</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">{ formatCurrency(dh.tonggiatri) }</td>
                                        <td className="px-6 py-4 text-center">
                                            {dh.trangthai === 'choduyet' && <span className="text-orange-600 text-[10px] font-bold">⏳ Chờ duyệt</span>}
                                            {dh.trangthai === 'daduyet' && <span className="text-green-600 text-[10px] font-bold">✅ Thành công</span>}
                                            {dh.trangthai !== 'choduyet' && dh.trangthai !== 'daduyet' && <span className="text-red-500 text-[10px] font-bold">❌ Bị từ chối</span>}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-gray-400 text-sm">Bạn chưa chốt được đơn nào.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {donBiTuChoi.length > 0 && (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <h3 className="text-red-700 font-bold text-sm mb-3 flex items-center gap-2">⚠️ Đơn hàng bị Admin từ chối</h3>
                            <div className="space-y-3">
                                {donBiTuChoi.map((dh: any) => (
                                    <div key={dh.madonhang} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 text-xs">Đơn #{ dh.madonhang }</span>
                                            <span className="text-[9px] text-gray-400">{new Date(dh.ngaytao).toLocaleDateString() }</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">Khách: { dh.tendoitac }</p>
                                        <p className="text-[10px] text-red-600 font-medium italic mt-1">Lý do: Xem lại công nợ khách hàng hoặc giá chốt.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}