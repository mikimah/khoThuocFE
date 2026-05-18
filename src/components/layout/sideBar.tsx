import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../context/useAuthStore';
import styles from '../../styles/sideBar.module.css';
import { ChartColumnBig,Pill,Scale,Boxes,Handshake,Box,Truck,CircleCheck,Clipboard,ScrollText,Users,ChartNoAxesCombined } from 'lucide-react';

export default function SideBar() {
    const authStore = useAuthStore();

    const handleLogout = () => {
        authStore.logout();
    };

    return (
    <>
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-slate-800 text-white flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-slate-700">
                <h1 className="text-2xl font-bold text-blue-400">Pharma<span className="text-white">Manager</span></h1>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <NavLink to={'/'} 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <ChartColumnBig className="inline-block w-5 h-5 mr-2" /> Tổng quan
                </NavLink>
                <NavLink to="/thuoc" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <Pill className="inline-block w-5 h-5 mr-2" /> Danh mục Thuốc
                </NavLink>
                <NavLink to="/don-vi-tinh" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <Scale className="inline-block w-5 h-5 mr-2" /> Đơn vị tính
                </NavLink>
                <NavLink to="/lo-thuoc" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <Boxes className="inline-block w-5 h-5 mr-2" /> Quản lý Lô
                </NavLink>
                <NavLink to="/doi-tac" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <Handshake className="inline-block w-5 h-5 mr-2" /> Đối tác
                </NavLink>

                {!authStore.isAdmin() && <NavLink to="/nhap-kho" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                    <Box className="inline-block w-5 h-5 mr-2" /> Nhập kho
                </NavLink>}
                {!authStore.isAdmin() && <NavLink to="/xuat-kho" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                    <Truck className="inline-block w-5 h-5 mr-2" /> Xuất kho
                </NavLink>}

                {authStore.isAdmin() && <NavLink to="/duyet-don" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <CircleCheck className="inline-block w-5 h-5 mr-2" /> Duyệt đơn hàng
                </NavLink>}

                <NavLink to="/kiem-ke" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                    <Clipboard className="inline-block w-5 h-5 mr-2" /> Kiểm kê
                </NavLink>

                {authStore.isAdmin() && <NavLink to="/lich-su-don-hang" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <ScrollText className="inline-block w-5 h-5 mr-2" /> Lịch sử giao dịch
                </NavLink>}
                {authStore.isAdmin() && <NavLink to="/tai-khoan" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                    <Users className="inline-block w-5 h-5 mr-2" /> Tài khoản
                </NavLink>}
                {authStore.isAdmin() && <NavLink to="/bao-cao" 
                    className={({ isActive }) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>
                <ChartNoAxesCombined className="inline-block w-5 h-5 mr-2" /> Báo cáo Doanh thu
                </NavLink>}
            </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
                <h2 className="text-xl font-semibold text-gray-800">Hệ thống Quản lý Kho</h2>
                
                <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold uppercase">
                    { authStore.user?.tendangnhap?.charAt(0) || 'U' }
                    </div>
                    <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700 leading-tight">
                        { authStore.user?.tendangnhap || 'Người dùng' }
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                        { authStore.isAdmin() ? 'Quản trị viên' : 'Nhân viên' }
                    </span>
                    </div>
                </div>

                <button onClick={handleLogout} className="px-4 py-1.5 text-sm bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition">
                    Đăng xuất
                </button>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                <Outlet />
            </main>

 
            </div>
        </div>
    </>
    );
};


