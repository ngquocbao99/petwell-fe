import { useState } from 'react';
import bgPattern from '@assets/bg-login.png';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Axios from '@utils/Axios';
import SummaryApi from '@common/SummarryAPI';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const validateEmail = (email: string) => {
        if (!email.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Invalid email format";
        return "";
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setError(validateEmail(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateEmail(email);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.forgotPassword,
                data: { email },
                headers: { 'Content-Type': 'application/json' }
            });

            if (response?.data?.succes === true) {
                toast.success(response.data.message || "OTP has been sent to your email.");
                navigate("/auth/verify-otp", { state: { email } });
            } else {
                toast.error(response?.data?.message || "Failed to send OTP.");
            }
        } catch (error) {
            toast.error("This email is not registered in the system.");
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
                noValidate
            >
                <h2 className="text-2xl font-bold text-center text-orange-500 mb-6">
                    Forgot Password
                </h2>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-4 py-2 border rounded focus:outline-none ${error
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:border-orange-500'
                            }`}
                        placeholder="Enter your email"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded transition"
                >
                    Send OTP
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Remember your password?
                    <a href="/auth/login" className="text-orange-500 hover:underline ml-1">Sign In</a>
                </p>
            </form>
        </div>
    );
};

export default ForgotPassword;
