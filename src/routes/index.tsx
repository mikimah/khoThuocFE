import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginView from '../views/login';
import SideBar from '../components/layout/sideBar';
import DashboardAdminView from '../views/dashboardAdmin';
import DashboardKhoView from '../views/dashboardKho';       // ĐÃ THÊM
import DashboardSalesView from '../views/dashboardSales';   // ĐÃ SỬA
import ThuocView from '../views/thuoc';
import DonViTinhView from '../views/donViTinh';
import LoThuocView from '../views/loThuoc';
import DoiTacView from '../views/doiTac';
import DuyetDonHangView from '../views/duyetDonHang';
import KiemKeView from '../views/kiemKe';
import LichSuDonHangView from '../views/lichSuDonHang';
import TaiKhoanView from '../views/taiKhoan';
import BaoCaoView from '../views/baoCao';
import TraCuuDonHangView from '../views/traCuuDonHang';
import { useAuthStore } from '../context/useAuthStore';
import PhieuNhapView from '../views/phieuNhap';
import PhieuXuatView from '../views/phieuXuat';

// --- ĐÃ NÂNG CẤP BỘ ĐỊNH TUYẾN 3 VAI TRÒ ---
function DashboardWrapper() {
  const authStore = useAuthStore();
  const role = authStore.user?.vaitro?.toLowerCase();

  if (role === 'admin') return <DashboardAdminView />;
  if (role === 'kho') return <DashboardKhoView />;
  return <DashboardSalesView />;
}

function LoginWrapper(){
  const authStore = useAuthStore();
  return authStore.isAuthenticated() ? <Navigate to="/" replace /> : <LoginView />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginWrapper />,
  },
  {
    path: '/tra-cuu',
    element: <TraCuuDonHangView />,
  },
  {
    path: '/',
    element: <ProtectedRoute><SideBar /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardWrapper /> },
      { path: 'thuoc', element: <ThuocView /> },
      { path: 'don-vi-tinh', element: <DonViTinhView /> },
      { path: 'lo-thuoc', element: <LoThuocView /> },
      { path: 'doi-tac', element: <DoiTacView /> },
      { path: 'duyet-don', element: <DuyetDonHangView /> },
      { path: 'kiem-ke', element: <KiemKeView /> },
      { path: 'lich-su-don-hang', element: <LichSuDonHangView /> },
      { path: 'tai-khoan', element: <TaiKhoanView /> },
      { path: 'bao-cao', element: <BaoCaoView /> },
      { path: 'nhap-kho', element: <PhieuNhapView /> },
      { path: 'xuat-kho', element: <PhieuXuatView /> }
    ]
  }
]);

export default router;