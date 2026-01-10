import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgPattern from '@assets/bg-login.png';
import Axios from '@utils/Axios';
import SummaryApi from '@common/SummarryAPI';
import toast, { Toaster } from 'react-hot-toast';
import AxiosToastError from '@utils/AxiosToastError';

const Register = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));

        // Validate password on change
        if (name === 'password') {
            const passwordError = validatePassword(value);
            setErrors(prev => ({ ...prev, password: passwordError }));
        }

        // Validate confirm password on change
        if (name === 'confirmPassword') {
            const confirmError = value !== data.password ? 'Passwords do not match' : '';
            setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
    };

    const isValid = Object.values(data).every((v) => v.trim() !== '') &&
        Object.values(errors).every((error) => error === '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordError = validatePassword(data.password);
        if (passwordError) {
            setErrors(prev => ({ ...prev, password: passwordError }));
            toast.error(passwordError);
            return;
        }

        if (data.password !== data.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            toast.error('Confirmation password does not match!');
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.register,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    password: data.password
                }
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Registration successful! Please log in.');
                setTimeout(() => {
                    navigate('/auth/login');
                }, 2000)
            }
            if (!response.data.success) {
                const errorMessage = response.data.message || 'Registration failed. Please try again.';
                toast.error(errorMessage);
                return;
            }
        } catch (err: any) {
            if (err.response) {
                const errorMessage = err.response.data?.message || 'Registration failed. Please try again.';
                toast.error(errorMessage);
            } else if (err.request) {
                toast.error('Cannot connect to server. Please check your internet connection.');
            } else {
                toast.error('An error occurred. Please try again later.');
            }
            console.error('Registration error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-orange-50 ">
            <Toaster position="top-center" reverseOrder={false} />
            <img
                src={bgPattern}
                alt="Pet Pattern"
                className="absolute opacity-10 w-full h-full object-cover"
            />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl px-10 py-12 space-y-6 border border-gray-100"
            >
                <h2 className="text-3xl font-bold text-center text-orange-500">Register Account</h2>

                {[
                    { label: 'Full Name', name: 'fullName', placeholder: 'Enter your full name', type: 'text' },
                    { label: 'Email', name: 'email', placeholder: 'Enter your email', type: 'email' },
                    { label: 'Phone Number', name: 'phone', placeholder: 'Enter your phone number', type: 'text' },
                    {
                        label: 'Password',
                        name: 'password',
                        placeholder: 'Create a password (min 6 chars, uppercase, lowercase, number, special char)',
                        type: 'password',
                        error: errors.password
                    },
                    {
                        label: 'Confirm Password',
                        name: 'confirmPassword',
                        placeholder: 'Re-enter your password',
                        type: 'password',
                        error: errors.confirmPassword
                    }
                ].map((field) => (
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">{field.label}</label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={data[field.name as keyof typeof data]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            required
                            className={`w-full px-4 py-2 rounded-lg border ${'error' in field && field.error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-100'
                                } focus:ring-2 transition text-sm shadow-sm`}
                        />
                        {'error' in field && field.error && (
                            <p className="text-red-500 text-xs mt-1">{field.error}</p>
                        )}
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={!isValid}
                    className={`w-full py-3 rounded-lg text-white font-semibold transition ${isValid
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    Register
                </button>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <a href="/auth/login" className="text-orange-500 font-medium hover:underline">
                        Login
                    </a>
                </p>
            </form>
        </div>
    );
};

export default Register;
