import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import bgPattern from '@assets/bg-login.png';
import toast, { Toaster } from 'react-hot-toast';
import Axios from '@utils/Axios';
import SummaryApi from '@common/SummarryAPI';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    });

    const validatePassword = (password: string) => {
        if (password.length < 6) return "Password must be at least 6 characters long";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
        return "";
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);

        // Validate password on change
        const passwordError = validatePassword(value);
        setErrors(prev => ({ ...prev, password: passwordError }));

        // Validate confirm password on change
        if (confirmPassword) {
            const confirmError = value !== confirmPassword ? 'Passwords do not match' : '';
            setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);

        // Validate confirm password on change
        const confirmError = value !== password ? 'Passwords do not match' : '';
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    };

    const isValid = otp && password && confirmPassword &&
        Object.values(errors).every((error) => error === '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || !password || !confirmPassword) {
            return toast.error("Please fill in all fields.");
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setErrors(prev => ({ ...prev, password: passwordError }));
            toast.error(passwordError);
            return;
        }

        if (password !== confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            toast.error("Passwords do not match.");
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.verifyOtpAndResetPassword,
                headers: { 'Content-Type': 'application/json' },
                data: { email, otp, newPassword: password }
            });

            if (response.data.succes) {
                toast.success("Password reset successfully.");
                navigate("/auth/login");
            } else {
                toast.error(response.data.message || "Invalid OTP or error occurred.");
            }
        } catch (error) {
            toast.error("Invalid OTP.");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative"
            style={{
                background: 'linear-gradient(135deg, #fdf1e6 0%, #fdebd0 100%)',
            }}
        >
            <Toaster position="top-center" reverseOrder={false} />

            <img
                src={bgPattern}
                alt="Pattern"
                className="absolute opacity-10 w-full h-full object-cover"
            />

            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative z-10"
            >
                <h2 className="text-2xl font-bold text-center text-orange-500 mb-6">
                    Verify OTP & Reset Password
                </h2>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">OTP Code</label>
                    <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-orange-500"
                        placeholder="Enter 6-digit OTP"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition ${errors.password
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-100'
                            }`}
                        placeholder="Create a password (min 6 chars, uppercase, lowercase, number, special char)"
                        required
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition ${errors.confirmPassword
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-100'
                            }`}
                        placeholder="Confirm new password"
                        required
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isValid}
                    className={`w-full font-semibold py-2 rounded transition ${isValid
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-gray-400 cursor-not-allowed text-gray-600'
                        }`}
                >
                    Reset Password
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Back to
                    <a href="/auth/login" className="text-orange-500 hover:underline ml-1">Login</a>
                </p>
            </form>
        </div>
    );
};

export default VerifyOTP;
