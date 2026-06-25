import { useAuthStore } from "../context/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { formatCurrency } from "../utils/customFunction";
import { showError } from "../utils/notify";

export default function DashboardKhoView() {
    const [isLoading, setIsLoading] = useState(true);
    const authStore = useAuthStore();
    const user = authStore.user;
    const [tatCaDonHang, setTatCaDonHang] = useState([]);
    const [tatCaLoThuoc, setTatCaLoThuoc] = useState([]);
    const [tatCaThuoc, setTatCaThuoc] = useState([]);
    const [tatCaViTri, setTatCaViTri] = useState([]);
    const [searchLookup, setSearchLookup] = useState("");

    async function getData(){
        setIsLoading(true);
        try{
            const [resDH, resLo, resThuoc, resViTri]: any = await Promise.all([
                api.get('/donhang'),
                api.get('/lothuoc'),
                api.get('/thuoc'),
                api.get('/vitrikho') 
            ]);
            setTatCaDonHang(resDH.data || []);
            setTatCaLoThuoc(resLo.data || []);
            setTatCaThuoc(resThuoc.data || []);
            setTatCaViTri(resViTri.data || []);
        } catch (error) {
            showError('Lỗi tải Dashboard thủ kho');
        } finally {
            setIsLoading(false);
        }
    }

    function getTenViTri(id: any) {
        if (!id) return 'Chưa xếp kệ';
        const vt = tatCaViTri.find((v: any) => String(v.mavitri) === String(id));
        if (vt) return `${vt.ma_toado} - ${vt.ten_vitri}`;
        return 'Chưa xếp kệ';
    }
    // Thủ kho xem các đơn NHẬP và XUẤT liên quan đến mình
    const donHangCuaToi = useMemo(() => {
        const myId = user?.mataikhoan;
        return tatCaDonHang.filter((dh: any) => dh.mataikhoan === myId);
    }, [user, tatCaDonHang]);

    const top5DonHang = useMemo(() => {
        return [...donHangCuaToi]
            .sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
            .slice(0, 5);
    }, [donHangCuaToi]);

    // Tổng số lượng thuốc vật lý đang quản lý
    const tongTonKho = useMemo(() => {
        return tatCaLoThuoc.reduce((sum, lo: any) => sum + Number(lo.tonthucte || 0), 0);
    }, [tatCaLoThuoc]);

    const ketQuaTraCuu = useMemo(() => {
        if (!searchLookup.trim()) return [];
        const search = searchLookup.toLowerCase();
        return tatCaLoThuoc.filter((lo: any) => 
            lo.tenthuoc?.toLowerCase().includes(search) || lo.solo?.toLowerCase().includes(search)
        );
    }, [searchLookup, tatCaLoThuoc]);

    const canhBaoSapHetHan = useMemo(() => {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return tatCaLoThuoc.filter((lo: any) => {
            const hansudung = new Date(lo.hansudung);
            return hansudung <= thirtyDaysLater && hansudung > now;
        });
    }, [tatCaLoThuoc]);

    useEffect(() => {
        getData();
    }, []);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chào Thủ kho, <span className="text-blue-600">{ authStore.user?.tendangnhap }</span>!</h1>
                    <p className="text-sm text-gray-500 mt-1">Đảm bảo hàng hóa luôn được xếp đúng vị trí trên kệ.</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngày hiện tại</p>
                    <p className="font-bold text-gray-700">{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) }</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="text-indigo-100 text-xs font-bold uppercase">Tổng Tồn Kho Quản Lý</h3>
                    <p className="text-3xl font-black mt-2">{ tongTonKho.toLocaleString() } <span className="text-sm font-medium text-indigo-200">sản phẩm</span></p>
                    <div className="mt-4 flex items-center text-[11px] bg-white/10 w-fit px-2 py-1 rounded">
                    📦 Quản lý tổng cộng {tatCaLoThuoc.length} lô thuốc
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Tra cứu vị trí vật lý</h3>
                    <div className="relative">
                        <input 
                            value={searchLookup}
                            onChange={(e) => setSearchLookup(e.target.value)}
                            type="text" 
                            placeholder="Gõ tên thuốc hoặc số lô..." 
                            className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                        <span className="absolute right-3 top-2.5">🔍</span>
                    </div>
                    
                    {ketQuaTraCuu.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-xl border z-50 overflow-hidden max-h-60 overflow-y-auto">
                            {ketQuaTraCuu.map((item: any) => (
                                <div key={item.malo} className="p-3 border-b hover:bg-indigo-50 cursor-default transition">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-800 text-sm">{item.tenthuoc}</span>
                                        <span className="text-indigo-600 font-bold text-xs">Tồn: {item.tonthucte}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Lô: <span className="font-medium text-gray-700 mr-2">{item.solo}</span> | 
                                        Vị trí: <span className="font-bold text-red-600">{getTenViTri(item.mavitri)}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Cảnh báo cận Date (30 ngày)</h3>
                    {canhBaoSapHetHan.length > 0 ? (
                        <div className="space-y-2 mt-3 max-h-24 overflow-y-auto">
                            {canhBaoSapHetHan.map((lo: any) => (
                                <div key={lo.malo} className="flex justify-between items-center text-xs p-2 bg-orange-50 rounded border border-orange-100">
                                    <span className="font-medium text-gray-800 truncate w-32">{lo.tenthuoc}</span>
                                    <span className="font-bold text-orange-600 shrink-0">{new Date(lo.hansudung).toLocaleDateString('vi-VN')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic mt-4 text-center">Không có lô nào sắp hết hạn.</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">📌 Giao dịch xử lý kho gần đây</h2>
                    <button onClick={() => getData()} className="text-xs text-indigo-600 font-bold hover:underline">Làm mới 🔄</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                                <th className="px-6 py-3 font-bold">Mã Đơn</th>
                                <th className="px-6 py-3 font-bold">Loại Phiếu</th>
                                <th className="px-6 py-3 font-bold">Đối Tác</th>
                                <th className="px-6 py-3 font-bold text-center">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {top5DonHang.length > 0 ? (
                            top5DonHang.map((dh: any) => (
                                <tr key={dh.madonhang} className="hover:bg-indigo-50/30 transition">
                                    <td className="px-6 py-4 font-black text-gray-700">#{ dh.madonhang }</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                            dh.loaidonhang === 'nhap' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
                                        }`}>
                                            { dh.loaidonhang === 'nhap' ? 'Nhập' : 'Xuất' }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{ dh.tendoitac }</td>
                                    <td className="px-6 py-4 text-center">
                                        {dh.trangthai === 'choduyet' && <span className="text-orange-600 text-[10px] font-bold">⏳ Chờ duyệt</span>}
                                        {dh.trangthai === 'daduyet' && <span className="text-green-600 text-[10px] font-bold">✅ Thành công</span>}
                                        {dh.trangthai !== 'choduyet' && dh.trangthai !== 'daduyet' && <span className="text-red-500 text-[10px] font-bold">❌ Đã hủy</span>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-gray-400 text-sm">Chưa có phiếu nào được tạo.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}