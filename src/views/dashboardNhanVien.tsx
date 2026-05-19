import { useAuthStore } from "../context/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { formatCurrency } from "../utils/customFunction"
import { showSuccess,showError } from "../utils/notify";

export default function DashboardNhanVienView() {
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
        setIsLoading(false);
        } catch (error) {
            showError('Lỗi tải Dashboard nhân viên:');
            console.log(error);
        }finally{
            setIsLoading(false);
        }
    }

    function getTenViTri(id:any){
        if (!id) return 'Chưa xếp kệ';
        const vt = tatCaViTri.find((v: any) => v.mavitri === id);
        if (vt) return `${vt.makhuvuc} - ${vt.day} - ${vt.ke} - ${vt.tang}`;
        return 'Chưa xếp kệ';
    }

    // 1. Lấy tất cả đơn hàng của RIÊNG nhân viên này
    const donHangCuaToi = useMemo(() => {
        const myId = user?.mataikhoan;
        return tatCaDonHang.filter((dh: any) => dh.mataikhoan === myId);
    }, [user, tatCaDonHang]);

    // 2. Top 5 đơn hàng mới nhất của tôi
    const top5DonHang = useMemo(() => {
    return [...donHangCuaToi]
        .sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
        .slice(0, 5);
    }, [donHangCuaToi]);

    // 3. Tính doanh số cá nhân (Chỉ tính đơn XUẤT đã DỰYỆT trong tháng hiện tại)
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

    // 4. Đếm số đơn chờ duyệt
    const soDonDangCho = useMemo(() => {
    return donHangCuaToi.filter((dh: any) => dh.trangthai === 'choduyet').length;
    }, [donHangCuaToi]);

    // 5. Cảnh báo đơn bị từ chối (Mới nhất)
    const donBiTuChoi = useMemo(() => {
    return donHangCuaToi.filter((dh: any) => dh.trangthai === 'huy').slice(0, 3);
    }, [donHangCuaToi]);



    // Kết quả tìm kiếm
    const ketQuaTraCuu = useMemo(() => {
        if (!searchLookup.trim()) return [];
        const search = searchLookup.toLowerCase();
        return tatCaLoThuoc.filter((lo: any) => 
            lo.tenthuoc?.toLowerCase().includes(search)
        );
    }, [searchLookup, tatCaLoThuoc]);

    // Cảnh báo sắp hết hạn
    const canhBaoSapHetHan = useMemo(() => {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return tatCaLoThuoc.filter((lo: any) => {
            const hansudung = new Date(lo.hansudung);
            return hansudung <= thirtyDaysLater && hansudung > now;
        });
    }, [tatCaLoThuoc]);

    // Cảnh báo sắp hết hàng
    const canhBaoSapHetHang = useMemo(() => {
        return tatCaLoThuoc.filter((lo: any) => Number(lo.tonkhadung || 0) < 10);
    }, [tatCaLoThuoc]);


    useEffect(() => {
        getData();
    }, []);

    return (<>
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chào, <span className="text-blue-600">{ authStore.user?.tendangnhap }</span>!</h1>
                    <p className="text-sm text-gray-500 mt-1">Hôm nay bạn có <span className="font-bold text-orange-600">{ soDonDangCho }</span> đơn hàng đang chờ Admin duyệt.</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngày hiện tại</p>
                    <p className="font-bold text-gray-700">{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) }</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="text-blue-100 text-xs font-bold uppercase">Doanh số tháng này (Đã duyệt)</h3>
                    <p className="text-3xl font-black mt-2">{ formatCurrency(doanhSoThanhCong) }</p>
                    <div className="mt-4 flex items-center text-[11px] bg-white/10 w-fit px-2 py-1 rounded">
                    ✨ Chỉ tính các đơn đã hoàn thành
                    </div>
                </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-gray-400 text-xs font-bold uppercase">Đơn hàng của tôi</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-3xl font-black text-gray-800">{ donHangCuaToi.length } <span className="text-sm font-normal text-gray-400">tổng số</span></p>
                    <div className="text-right">
                        <p className="text-orange-500 font-bold text-sm">{ soDonDangCho } chờ duyệt</p>
                        <p className="text-red-500 font-bold text-sm">{ donHangCuaToi.filter(d => d.trangthai === 'huy').length } bị từ chối</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Tra cứu nhanh tồn kho</h3>
                <div className="relative">
                <input 
                    value={searchLookup}
                    onChange={(e) => setSearchLookup(e.target.value)}
                    type="text" 
                    placeholder="Gõ tên thuốc cần tìm..." 
                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <span className="absolute right-3 top-2.5">🔍</span>
                </div>
                
                {ketQuaTraCuu.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-xl border z-50 overflow-hidden">
                        {ketQuaTraCuu.map((item: any) => (
                            <div key={item.malo} className="p-3 border-b hover:bg-blue-50 cursor-default transition">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-800 text-sm">{item.tenthuoc}</span>
                                    <span className="text-blue-600 font-bold text-xs">SL: {item.tonkhadung}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Lô: <span className="font-medium text-gray-700 mr-2">{item.solo}</span> | 
                                    Vị trí: <span className="font-semibold text-indigo-600">{getTenViTri(item.mavitri)}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">📌 Giao dịch gần đây của bạn</h2>
                <button 
                    onClick={() => getData()}
                    className="text-xs text-blue-600 font-bold transition-all duration-200 hover:text-blue-700 hover:underline hover:scale-[1.03] active:scale-100"
                >
                    Làm mới 🔄
                </button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                        <th className="px-6 py-3 font-bold">Mã Đơn</th>
                        <th className="px-6 py-3 font-bold">Loại</th>
                        <th className="px-6 py-3 font-bold">Đối Tác</th>
                        <th className="px-6 py-3 font-bold text-right">Tổng Tiền</th>
                        <th className="px-6 py-3 font-bold text-center">Trạng Thái</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {top5DonHang.length > 0 ? (
                        top5DonHang.map((dh: any) => (
                            <tr key={dh.madonhang} className="hover:bg-blue-50/30 transition">
                                <td className="px-6 py-4 font-black text-gray-700">#{ dh.madonhang }</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                        dh.loaidonhang === 'nhap' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
                                    }`}>
                                        { dh.loaidonhang === 'nhap' ? 'Nhập' : 'Xuất' }
                                    </span>
                                </td>
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
                            <td colSpan={5} className="p-10 text-center text-gray-400 text-sm">Bạn chưa có giao dịch nào.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
                {donBiTuChoi.length > 0 && (
                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                        <h3 className="text-red-700 font-bold text-sm mb-3 flex items-center gap-2">
                            ⚠️ Đơn hàng bị từ chối
                        </h3>
                        <div className="space-y-3">
                            {donBiTuChoi.map((dh: any) => (
                                <div key={dh.madonhang} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-gray-800 text-xs">Đơn #{ dh.madonhang }</span>
                                        <span className="text-[9px] text-gray-400">{new Date(dh.ngaytao).toLocaleDateString() }</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1">Đối tác: { dh.tendoitac }</p>
                                    <p className="text-[10px] text-red-600 font-medium italic mt-1">Lý do: Vui lòng kiểm tra lại công nợ hoặc giá.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-800 font-bold text-sm mb-4">Cảnh báo kho hàng</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-orange-500 uppercase mb-2">💊 Lô thuốc cận date (30 ngày)</p>
                            {canhBaoSapHetHan.length > 0 ? (
                                <div className="space-y-2">
                                    {canhBaoSapHetHan.map((lo: any) => (
                                        <div key={lo.malo} className="flex justify-between items-center text-xs p-2 bg-orange-50 rounded">
                                            <span className="font-medium text-gray-700">{lo.tenthuoc}</span>
                                            <span className="font-bold text-orange-600">{new Date(lo.hansudung).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 italic">Không có lô thuốc nào sắp hết hạn.</p>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-red-500 uppercase mb-2">📉 Thuốc sắp hết hàng (Tồn &lt; 10)</p>
                            {canhBaoSapHetHang.length > 0 ? (
                                <div className="space-y-2">
                                    {canhBaoSapHetHang.map((lo: any) => (
                                        <div key={lo.malo} className="flex justify-between items-center text-xs p-2 bg-red-50 rounded">
                                            <span className="font-medium text-gray-700">{lo.tenthuoc} ({lo.solo})</span>
                                            <span className="font-black text-red-600">{lo.tonkhadung}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 italic">Tồn kho đang ở mức an toàn.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
            </div>
        </div>

        </>
    );
}
