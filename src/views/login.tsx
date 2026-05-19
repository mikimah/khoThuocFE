import { useState,useEffect } from "react";
import { useAuthStore } from "../context/useAuthStore";
import { showSuccess } from "../utils/notify";
import { useNavigate } from "react-router-dom";


export default function LoginView() {
    const [tendangnhap, setTendangnhap] = useState('');
    const [matkhau, setMatkhau] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const authStore = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            // Gọi function login từ authStore
            await authStore.login(tendangnhap, matkhau);
            showSuccess("Đăng nhập thành công");
            navigate("/",{replace: true}); // Redirect về trang chính
        } catch (error) {
            setErrorMessage(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };



  return (
    <>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg w-96">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-600">PharmaManager</h1>
                <p className="text-gray-500 mt-2">Hệ thống quản lý kho thuốc</p>
            </div>

            {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
                    <input value={tendangnhap} onChange={(e) => setTendangnhap(e.target.value)} type="text" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
                    <input value={matkhau} onChange={(e) => setMatkhau(e.target.value)} type="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg">
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
            </div>
        </div>
    </>
  );
}
