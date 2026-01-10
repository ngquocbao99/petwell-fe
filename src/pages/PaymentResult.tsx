import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Axios from '@utils/Axios'
import SummaryApi from '@common/SummarryAPI';

const PaymentResult = () => {
    const [status, setStatus] = useState('');
    const [appointmentId, setAppointmentId] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        let appointmentIdParam = params.get('appointmentId');
        let paymentTypeParam = params.get('paymentType');
        const vnpTxnRef = params.get('vnp_TxnRef');

        // Nếu thiếu appointmentId hoặc paymentType, parse từ vnp_TxnRef
        if ((!appointmentIdParam || !paymentTypeParam) && vnpTxnRef) {
            const [id, type] = vnpTxnRef.split('_');
            if (!appointmentIdParam) appointmentIdParam = id;
            if (!paymentTypeParam) paymentTypeParam = type;
        }
        setAppointmentId(appointmentIdParam || '');
        setPaymentType(paymentTypeParam || '');

        // Gọi API backend xác thực kết quả thanh toán
        if (appointmentIdParam && paymentTypeParam) {
            const backendUrl = `http://localhost:5000/api/v1/payment/payment-result?appointmentId=${appointmentIdParam}&paymentType=${paymentTypeParam}&${params.toString()}`;
            verifyWithBackend(backendUrl);
        } else {
            setLoading(false);
            setStatus('failed');
            setError('Missing appointmentId or paymentType');
        }
    }, [location]);

    const verifyWithBackend = async (backendUrl: string) => {
        setLoading(true);
        try {
            const response = await Axios.get(backendUrl);
            if (response.data.success) {
                setStatus('success');
            } else {
                setStatus('failed');
                setError(response.data.message || 'Payment verification failed');
            }
        } catch (err: any) {
            setStatus('failed');
            setError(err.response?.data?.message || 'Something went wrong while verifying the payment');
        } finally {
            setLoading(false);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRetryPayment = () => {
        if (appointmentId) {
            navigate(`/appointment/${appointmentId}/payment`);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-8 text-center">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="mt-4 text-gray-600">Verifying your payment...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {status === 'success' ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Green Header Section */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center text-white">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                            <p className="text-green-100 text-lg">Your appointment has been confirmed</p>
                        </div>

                        {/* Content Section */}
                        <div className="px-8 py-8">
                            {/* Appointment Confirmed */}
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Appointment Confirmed</h3>
                                    <p className="text-gray-600">Appointment ID: #{appointmentId.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Thank you message */}
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-900">Thank you for choosing PetWell!</h3>
                                </div>
                                <p className="text-gray-600 leading-relaxed">
                                    We've sent a confirmation email with your appointment details.
                                    Our team is excited to care for your beloved pet.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/dashboard/appointment')}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    View My Appointments
                                </button>
                                <button
                                    onClick={handleGoHome}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Red Header Section */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-12 text-center text-white">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Payment Failed!</h1>
                            <p className="text-red-100 text-lg">Unfortunately, your payment could not be processed</p>
                        </div>

                        {/* Content Section */}
                        <div className="px-8 py-8">
                            {/* Error Message */}
                            <div className="text-center mb-8">
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {error || 'Unfortunately, your payment could not be processed.'}
                                </p>
                                {appointmentId && (
                                    <p className="text-sm text-gray-500">
                                        Appointment ID: #{appointmentId.slice(-8).toUpperCase()}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {appointmentId && (
                                    <button
                                        onClick={handleRetryPayment}
                                        className="w-full flex items-center justify-center px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Try Again
                                    </button>
                                )}
                                <button
                                    onClick={handleGoHome}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Back to Home
                                </button>
                            </div>  
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;