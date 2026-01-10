import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Axios from '@utils/Axios';
import SummaryApi from '@common/SummarryAPI';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import bgPattern from '@assets/bg-login.png'; 

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            toast.error("Invalid token!");
            setLoading(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await Axios({ ...SummaryApi.verifyEmail(token) });

                if (response.data.success) {
                    toast.success("Email has been verified!");
                    setVerified(true);
                    setTimeout(() => navigate('/auth/login'), 1000);
                } else {
                    toast.error(response.data.message || "Verification failed.");
                }
            } catch {
                toast.error("Error verifying email.");
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-orange-50 px-4 overflow-hidden">
            {/* Background Image Layer */}
            <img
                src={bgPattern}
                alt="Pattern"
                className="absolute w-full h-full object-cover opacity-10"
            />

            {/* Content Card */}
            <div className="relative z-10 bg-white p-10 rounded-xl shadow-2xl text-center max-w-md w-full border border-orange-100">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="animate-spin text-orange-400 w-10 h-10" />
                        <p className="text-gray-600 text-lg">	Verifying email...</p>
                    </div>
                ) : verified ? (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle className="text-green-500 w-12 h-12" />
                        <h2 className="text-2xl font-bold text-green-600">Verification successful!</h2>
                        <p className="text-gray-600 text-sm">	Redirecting to login page...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="text-red-500 w-12 h-12" />
                        <h2 className="text-2xl font-bold text-red-600">Verification failed!</h2>
                        <p className="text-gray-600 text-sm">Invalid or expired link.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
