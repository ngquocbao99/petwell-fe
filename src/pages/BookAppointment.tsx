import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import { FaPaw, FaHospital, FaStethoscope, FaClock, FaMoneyBillWave } from "react-icons/fa";

interface Pet {
    _id: string;
    petName: string;
    species: string;
    breed?: string;
    age?: number;
    weight?: number;
}

interface Clinic {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
}

interface Service {
    _id: string;
    name: string;
    price?: number;
    description?: string;
    clinicId?: {
        _id: string;
        name: string;
    };
}

const BookAppointment = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const defaultServiceId = searchParams.get("serviceId");
    const defaultClinicId = searchParams.get("clinicId");
    const user = useSelector((state: any) => state.user);

    const [clinicId, setClinicId] = useState(defaultClinicId || "");
    const [serviceId, setServiceId] = useState(defaultServiceId || "");
    const [petId, setPetId] = useState("");
    const [symptoms, setSymptoms] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");  // Để lưu giờ cuộc hẹn
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentType, setPaymentType] = useState("deposit");

    const [pets, setPets] = useState<Pet[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Tính ngày min và max cho input date
    const today = new Date();
    const minDate = today.toISOString().split("T")[0];
    const maxDateObj = new Date(today);
    maxDateObj.setDate(today.getDate() + 7);
    const maxDate = maxDateObj.toISOString().split("T")[0];

    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            try {
                const [clinicRes, serviceRes, petRes] = await Promise.all([
                    Axios({ ...SummaryApi.clinic.list }),
                    Axios({ ...SummaryApi.service.list }),
                    Axios({
                        url: `/api/v1/pets/view-all-pet-customer?userId=${user.userId}`,
                        method: "get",
                    }),
                ]);

                setClinics(clinicRes.data?.data || []);
                setServices(serviceRes.data?.data || []);
                setPets(petRes.data?.data || []);

                // --- Auto select from URL params if available ---
                // Pet
                const defaultPetId = searchParams.get("petId");
                if (defaultPetId && petRes.data?.data?.find((p: Pet) => p._id === defaultPetId)) {
                    setPetId(defaultPetId);
                    setSelectedPet(petRes.data.data.find((p: Pet) => p._id === defaultPetId));
                }
                // Clinic
                if (defaultClinicId && clinicRes.data?.data?.find((c: Clinic) => c._id === defaultClinicId)) {
                    setClinicId(defaultClinicId);
                }
                // Service
                if (defaultServiceId && serviceRes.data?.data?.find((s: Service) => s._id === defaultServiceId)) {
                    setServiceId(defaultServiceId);
                    setSelectedService(serviceRes.data.data.find((s: Service) => s._id === defaultServiceId));
                    // Nếu service có clinicId khác với clinic đang chọn thì cập nhật lại clinic
                    const service = serviceRes.data.data.find((s: Service) => s._id === defaultServiceId);
                    if (service?.clinicId?._id && service.clinicId._id !== defaultClinicId) {
                        setClinicId(service.clinicId._id);
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load data. Please try again later.");
            } finally {
                setDataLoading(false);
            }
        };

        if (!user?.userId) {
            toast.error("Please login to book an appointment");
            navigate("/auth/login");
            return;
        }

        fetchData();
        // eslint-disable-next-line
    }, [user?.userId, navigate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        setAppointmentDate(selectedDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTime = e.target.value;
        setAppointmentTime(selectedTime);
    };

    const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPetId = e.target.value;
        setPetId(newPetId);
        const pet = pets.find(p => p._id === newPetId);
        setSelectedPet(pet || null);
    };

    const handleClinicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClinicId = e.target.value;
        setClinicId(newClinicId);
        // Lọc danh sách dịch vụ thuộc clinic mới
        const filteredServices = services.filter(s => s.clinicId?._id === newClinicId);
        if (filteredServices.length > 0) {
            setServiceId(filteredServices[0]._id);
            setSelectedService(filteredServices[0]);
        } else {
            setServiceId("");
            setSelectedService(null);
        }
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newServiceId = e.target.value;
        setServiceId(newServiceId);
        const service = services.find(s => s._id === newServiceId);
        setSelectedService(service || null);
        if (service?.clinicId?._id && service.clinicId._id !== clinicId) {
            setClinicId(service.clinicId._id);
        }
    };

    const handleSubmit = async () => {
        if (!petId) {
            toast.error("Please select a pet");
            return;
        }

        if (!clinicId) {
            toast.error("Please select a clinic");
            return;
        }

        if (!serviceId) {
            toast.error("Please select a service");
            return;
        }

        if (!appointmentDate || !appointmentTime) {
            toast.error("Please select both appointment date and time");
            return;
        }

        if (!symptoms.trim()) {
            toast.error("Please describe symptoms or reason for visit");
            return;
        }

        // Format date and time to DD/MM/YYYYTHH:mm
        const formattedDate = new Date(appointmentDate);
        const datePart = `${formattedDate.getDate().toString().padStart(2, '0')}/${(formattedDate.getMonth() + 1).toString().padStart(2, '0')}/${formattedDate.getFullYear()}`;
        const dateTime = `${datePart}T${appointmentTime}`;

        const data = {
            customerId: user.userId,
            petId: petId,
            doctorId: "",
            clinicId: clinicId,
            serviceId: serviceId,
            appointment_date: dateTime,
            symptoms: symptoms,
            status: "pending",
            paymentMethod: paymentMethod,
            paymentType: paymentType,
            depositAmount: 100000, // Số tiền đặt cọc cố định là 100.000 VNĐ
            totalAmount: paymentMethod === "cash" ? (selectedService?.price || 0) : undefined
        };

        setLoading(true);

        try {
            const res = await Axios({
                ...SummaryApi.bookAppopintment,
                data: data,
            });

            if (res.data.success) {
                toast.success("Appointment booked successfully! Please make the payment to confirm the appointment.");

                if (paymentMethod === "cash") {
                    navigate("/");
                } else if (paymentMethod === "vnpay") {
                    const appointmentId = res.data.data._id;
                    const paymentResponse = await Axios({
                        ...SummaryApi.paymentAppointment(appointmentId),
                        params: { paymentType: paymentType }
                    });
                    const paymentLink = paymentResponse.data.data.paymentUrl;
                    window.location.href = paymentLink;
                }
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Server error occurred";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    if (dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user?.userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full mx-auto p-6">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-red-500 text-xl font-semibold mb-2">
                            Please login to book an appointment
                        </div>
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Login Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <h2 className="text-3xl font-bold text-white text-center">
                            Book an Appointment
                        </h2>
                        <p className="text-orange-100 text-center mt-2">
                            Please fill in all the information below
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Pet Selection */}
                        <div className="mb-8">
                            <div className="flex items-center mb-4">
                                <FaPaw className="text-orange-500 text-xl mr-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Select Your Pet</h3>
                            </div>
                            <select
                                value={petId}
                                onChange={handlePetChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            >
                                <option value="" disabled>Please select your pet</option>
                                {pets.length === 0 ? (
                                    <option disabled>No pets found. Please add a pet first.</option>
                                ) : (
                                    pets.map((pet: Pet) => (
                                        <option key={pet._id} value={pet._id}>
                                            {pet.petName} - {pet.species} {pet.breed && `(${pet.breed})`}
                                            {pet.age && `, ${pet.age} years old`}
                                        </option>
                                    ))
                                )}
                            </select>

                            {/* Display selected pet details */}
                            {selectedPet && (
                                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-gray-800 mb-2">Selected Pet Details:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Name:</span>
                                            <span className="ml-2 font-medium">{selectedPet.petName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Species:</span>
                                            <span className="ml-2 font-medium">{selectedPet.species}</span>
                                        </div>
                                        {selectedPet.breed && (
                                            <div>
                                                <span className="text-gray-600">Breed:</span>
                                                <span className="ml-2 font-medium">{selectedPet.breed}</span>
                                            </div>
                                        )}
                                        {selectedPet.age && (
                                            <div>
                                                <span className="text-gray-600">Age:</span>
                                                <span className="ml-2 font-medium">{selectedPet.age} years old</span>
                                            </div>
                                        )}
                                        {selectedPet.weight && (
                                            <div>
                                                <span className="text-gray-600">Weight:</span>
                                                <span className="ml-2 font-medium">{selectedPet.weight} kg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Clinic Selection */}
                        <div className="mb-8">
                            <div className="flex items-center mb-4">
                                <FaHospital className="text-orange-500 text-xl mr-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Select Clinic</h3>
                            </div>
                            <select
                                value={clinicId}
                                onChange={handleClinicChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            >
                                {clinics.map((clinic: Clinic) => (
                                    <option key={clinic._id} value={clinic._id}>
                                        {clinic.name} {clinic.address && `- ${clinic.address}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Service Selection */}
                        <div className="mb-8">
                            <div className="flex items-center mb-4">
                                <FaStethoscope className="text-orange-500 text-xl mr-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Select Service</h3>
                            </div>
                            <select
                                value={serviceId}
                                onChange={handleServiceChange}
                                disabled={!clinicId}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {!clinicId ? (
                                    <option disabled>Please select a clinic first</option>
                                ) : (
                                    services
                                        .filter((service: Service) => service.clinicId?._id === clinicId)
                                        .map((service: Service) => (
                                            <option key={service._id} value={service._id}>
                                                {service.name} {service.price && `- ${service.price.toLocaleString()} ₫`}
                                            </option>
                                        ))
                                )}
                            </select>
                            {selectedService && (
                                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <h4 className="font-semibold text-gray-800 mb-2">Service Details:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Service Name:</span>
                                            <span className="ml-2 font-medium">{selectedService.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Price:</span>
                                            <span className="ml-2 font-medium">{selectedService.price?.toLocaleString()} ₫</span>
                                        </div>
                                        {selectedService.description && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Description:</span>
                                                <span className="ml-2 font-medium">{selectedService.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Appointment Details */}
                        <div className="mb-8">
                            <div className="flex items-center mb-4">
                                <FaClock className="text-orange-500 text-xl mr-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Appointment Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={handleDateChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                    min={minDate}
                                    max={maxDate}
                                />
                                <select
                                    value={appointmentTime}
                                    onChange={handleTimeChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                >
                                    <option value="">Select appointment time</option>
                                    {(() => {
                                        // Nếu ngày chọn là hôm nay, chỉ cho chọn giờ lớn hơn giờ hiện tại
                                        if (appointmentDate === minDate) {
                                            const nowHour = today.getHours();
                                            const nowMinute = today.getMinutes();
                                            return ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].filter(time => {
                                                const [h, m] = time.split(":").map(Number);
                                                return h > nowHour || (h === nowHour && m > nowMinute);
                                            }).map((time) => (
                                                <option key={time} value={time}>{time}</option>
                                            ));
                                        } else {
                                            return ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((time) => (
                                                <option key={time} value={time}>{time}</option>
                                            ));
                                        }
                                    })()}
                                </select>
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="mb-8">
                            <textarea
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                placeholder="Please describe your pet's symptoms or the reason for this appointment..."
                                rows={4}
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-8">
                            <div className="flex items-center mb-4">
                                <FaMoneyBillWave className="text-orange-500 text-xl mr-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Payment Method</h3>
                            </div>
                            <div className="space-y-4">
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="vnpay">VNPay</option>
                                </select>

                                {paymentMethod === "vnpay" && (
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <h4 className="font-semibold text-gray-800 mb-3">Payment Type</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    value="deposit"
                                                    checked={paymentType === "deposit"}
                                                    onChange={(e) => setPaymentType(e.target.value)}
                                                    className="form-radio text-orange-500"
                                                    disabled={!selectedService}
                                                />
                                                <span className="text-gray-700">Pay Deposit (100.000 ₫)</span>
                                            </label>
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    value="full"
                                                    checked={paymentType === "full"}
                                                    onChange={(e) => setPaymentType(e.target.value)}
                                                    className="form-radio text-orange-500"
                                                    disabled={!selectedService}
                                                />
                                                <span className="text-gray-700">
                                                    Pay Full Amount ({selectedService ? `${selectedService.price?.toLocaleString()} ₫` : 'Chọn dịch vụ'})
                                                </span>
                                            </label>
                                        </div>
                                        {!selectedService && (
                                            <div className="text-sm text-red-500 mt-2">Vui lòng chọn dịch vụ để chọn hình thức thanh toán</div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="px-8 py-3 bg-white text-orange-500 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || pets.length === 0}
                                        className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            "Confirm Booking"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookAppointment;


