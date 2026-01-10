import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Axios from '@utils/Axios';
import { FaTimes, FaCalendarAlt, FaHospital, FaStethoscope, FaPaw, FaMoneyBillWave, FaEdit, FaInfoCircle, FaComments } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SummaryApi from '@common/SummarryAPI';
import React from 'react';
import dayjs from 'dayjs';
import ReviewDialog from "@components/ReviewDialog";
import { useNavigate } from 'react-router-dom';

interface Pet {
  _id: string;
  petName: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
}

interface Appointment {
  _id: string;
  customerId: {
    _id: string;
    email: string;
    fullName: string;
    avatar: string;
    phone?: string;
    address?: string;
  };
  petId: {
    _id: string;
    petName: string;
    species: string;
    breed: string;
    age?: number;
    imageUrl?: string;
  };
  clinicId: {
    _id: string;
    name: string;
    address: string;
    city?: string;
    phone?: string;
    email?: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
  };
  serviceId: {
    _id: string;
    name: string;
    price: number;
    category?: string;
    description?: string;
    imageUrl?: string;
  };
  doctorId?: {
    _id: string;
    fullName?: string;
    // add other doctor fields if needed
  };
  appointment_date: string;
  symptoms: string;
  status: string;
  paymentMethod: string;
  depositAmount: number;
  isDepositPaid: boolean;
  isFullyPaid?: boolean;
  paymentType?: string;
}

const Appointment = () => {
  const user = useSelector((state: any) => state.user);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [appointmentReviews, setAppointmentReviews] = useState<
    Record<string, any>
  >({});

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    appointment_date: '',
    appointment_time: '',
    symptoms: '',
    petId: '',
  });
  const [errors, setErrors] = useState({
    appointment_date: '',
    appointment_time: '',
    symptoms: '',
    petId: '',
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user?.userId) {
      fetchAppointments();
      fetchUserPets();
    }
  }, [user?.userId]);

  const fetchAppointments = async () => {
    try {
      const response = await Axios({
        url: `http://localhost:5000/api/v1/appointment/user-appointments/${user.userId}`,
        method: 'get',
      });
      const appointmentsData = response.data.data;
      setAppointments(appointmentsData);
      await fetchAppointmentReviews(appointmentsData);
    } catch (error) {
      toast.error('Could not load appointments list');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentReviews = async (appointments: Appointment[]) => {
    const reviewMap: Record<string, any> = {};
    await Promise.all(
      appointments.map(async (appt) => {
        if (appt.status === "completed") {
          try {
            const res = await Axios(
              SummaryApi.review.getReviewByAppointmentId(appt._id)
            );
            reviewMap[appt._id] = res.data.data;
          } catch {
            reviewMap[appt._id] = null;
          }
        }
      })
    );
    setAppointmentReviews(reviewMap);
  };

  const fetchUserPets = async () => {
    try {
      const response = await Axios({
        url: `/api/v1/pets/view-all-pet-customer?userId=${user.userId}`,
        method: 'get',
      });
      setPets(response.data.data);
    } catch (error) {
      toast.error('Could not load pets list');
    }
  };

  const handleCancel = (appointmentId: string) => {
    // Find appointment to check time
    const appointment = appointments.find(appt => appt._id === appointmentId);
    if (!appointment) {
      toast.error('Appointment not found');
      return;
    }

    // Only allow cancel at least 1 hour before appointment
    const appointmentDate = new Date(appointment.appointment_date);
    const currentDate = new Date();
    const timeDifference = appointmentDate.getTime() - currentDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 1) {
      toast.error('You cannot cancel the appointment less than 1 hour before the scheduled time');
      return;
    }

    setCancelingId(appointmentId);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a reason for cancellation');
      return;
    }
    try {
      await Axios({
        url: `http://localhost:5000/api/v1/appointment/cancel-appointment/${cancelingId}`,
        method: 'patch',
        data: { cancelReason },
      });
      toast.success('Appointment cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelingId(null);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
    setCancelingId(null);
  };

  const handlePayment = async (appointmentId: string) => {
    setProcessingPayment(appointmentId);
    try {
      const appointmentResponse = await Axios({ ...SummaryApi.appointmentDetails(appointmentId) });
      const appointmentData = appointmentResponse.data?.data;

      if (!appointmentData) {
        toast.error('Could not retrieve appointment information');
        return;
      }

      const { isDepositPaid } = appointmentData;

      if (isDepositPaid) {
        toast.error('This appointment has already been paid');
        return;
      }

      const paymentResponse = await Axios({ ...SummaryApi.paymentAppointment(appointmentId) });
      const paymentUrl = paymentResponse.data?.data?.paymentUrl;

      if (!paymentUrl) {
        toast.error('Could not create payment link');
        return;
      }

      window.location.href = paymentUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not process payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (appointment: Appointment) => {
    if (appointment.status === 'completed') {
      toast.error('Cannot edit a completed appointment');
      return;
    }

    // Only allow editing at least 6 hours before appointment
    const appointmentDate = new Date(appointment.appointment_date);
    const currentDate = new Date();
    const timeDifference = appointmentDate.getTime() - currentDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 6) {
      toast.error('You can only edit the appointment at least 6 hours before the scheduled time');
      return;
    }

    setEditingAppointment(appointment);
    const date = dayjs(appointment.appointment_date);
    setEditForm({
      appointment_date: date.format('YYYY-MM-DD'),
      appointment_time: date.format('HH:mm'),
      symptoms: appointment.symptoms,
      petId: appointment.petId._id,
    });
    setShowEditModal(true);
  };

  const validateForm = () => {
    const newErrors = {
      appointment_date: '',
      appointment_time: '',
      symptoms: '',
      petId: '',
    };
    let isValid = true;

    // Validate appointment date
    if (!editForm.appointment_date) {
      newErrors.appointment_date = 'Please select appointment date';
      isValid = false;
    } else {
      const selectedDate = new Date(editForm.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for date comparison

      if (selectedDate < today) {
        newErrors.appointment_date = 'Appointment date cannot be in the past';
        isValid = false;
      }
    }

    // Validate appointment time
    if (!editForm.appointment_time) {
      newErrors.appointment_time = 'Please select appointment time';
      isValid = false;
    } else {
      const validHours = ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];
      const [hour] = editForm.appointment_time.split(":");
      if (!validHours.includes(hour)) {
        newErrors.appointment_time = 'Invalid appointment time. Available times are between 07:00 and 16:00';
        isValid = false;
      }

      // Check if selected date and time is in the past
      if (editForm.appointment_date && editForm.appointment_time) {
        const selectedDateTime = new Date(`${editForm.appointment_date}T${editForm.appointment_time}`);
        const currentDateTime = new Date();

        if (selectedDateTime <= currentDateTime) {
          newErrors.appointment_time = 'Appointment date and time cannot be in the past';
          isValid = false;
        }
      }
    }

    // Validate symptoms
    if (!editForm.symptoms.trim()) {
      newErrors.symptoms = 'Please enter symptoms';
      isValid = false;
    }

    // Validate pet
    if (!editForm.petId) {
      newErrors.petId = 'Please select a pet';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    if (!validateForm()) {
      return;
    }

    try {
      // Format date and time to DD/MM/YYYYTHH:mm
      const formattedDate = new Date(editForm.appointment_date);
      const datePart = `${formattedDate.getDate().toString().padStart(2, '0')}/${(formattedDate.getMonth() + 1).toString().padStart(2, '0')}/${formattedDate.getFullYear()}`;
      const dateTime = `${datePart}T${editForm.appointment_time}`;

      const response = await Axios({
        url: `http://localhost:5000/api/v1/appointment/update-appointment/${editingAppointment._id}`,
        method: "put",
        data: {
          appointment_date: dateTime,
          symptoms: editForm.symptoms,
          petId: editForm.petId,
          paymentMethod: editingAppointment.paymentMethod,
        },
      });

      if (response.data.success) {
        toast.success("Appointment updated successfully");
        setShowEditModal(false);
        fetchAppointments();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update appointment"
      );
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    setEditForm({
      appointment_date: "",
      appointment_time: "",
      symptoms: "",
      petId: "",
    });
  };

  const handleViewDetails = async (appointmentId: string) => {
    try {
      const res = await Axios({ ...SummaryApi.appointmentDetails(appointmentId) });
      setDetailAppointment(res.data.data);
      setShowDetailModal(true);
    } catch {
      toast.error('Could not get appointment details');
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailAppointment(null);
  };

  const handleOpenChat = async (appointment: Appointment) => {
    try {
      const customerId = appointment.customerId?._id;
      if (!customerId) {
        toast.error('Could not identify customer information');
        return;
      }

      const doctorId = appointment.doctorId?._id;
      if (!doctorId) {
        toast.error('This appointment has not been assigned to a doctor');
        return;
      }

      const clinicId = appointment.clinicId?._id;
      if (!clinicId) {
        toast.error('Could not identify clinic information');
        return;
      }

      const checkResponse = await Axios({
        url: `/api/v1/chat/conversations/check`,
        method: 'get',
        params: {
          customerId,
          doctorId,
          clinicId
        }
      });

      let conversationId = checkResponse.data?.data?._id;
      if (!conversationId) {
        const createResponse = await Axios({
          url: `/api/v1/chat/conversations`,
          method: 'post',
          data: {
            customerId,
            doctorId,
            clinicId,
            appointmentId: appointment._id
          }
        });
        conversationId = createResponse.data?.data?._id;
        if (!conversationId) {
          toast.error('Could not create new conversation');
          return;
        }
      }

      navigate('/chat', {
        state: {
          conversationId,
          appointmentData: appointment
        }
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not open chat!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white text-center">
              Your Appointments
            </h2>
            <div className="flex justify-center mt-4 gap-4">
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 ${activeTab === 'upcoming' ? 'bg-white text-orange-600 shadow' : 'bg-orange-400 text-white'}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Appointments upcoming
              </button>
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 ${activeTab === 'past' ? 'bg-white text-orange-600 shadow' : 'bg-orange-400 text-white'}`}
                onClick={() => setActiveTab('past')}
              >
                Appointments past
              </button>
            </div>
          </div>

          <div className="p-6">
            {!appointments || appointments.length === 0 ? (
              <div className="text-center py-12">
                <img
                  src="/src/assets/nothing here yet.webp"
                  alt="No appointments"
                  className="w-64 h-64 mx-auto mb-6"
                />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Appointments Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You don't have any appointments yet. Book an appointment to get your pet checked and cared for.
                </p>
                <button
                  onClick={() => navigate('/book-appointment')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
                >
                  Book Appointment Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {appointments
                  .filter((appointment) => appointment.status !== "canceled")
                  .filter((appointment) => {
                    if (activeTab === 'upcoming') {
                      // Chỉ hiển thị các lịch chưa completed
                      return appointment.status !== 'completed' && new Date(appointment.appointment_date) >= new Date();
                    } else {
                      // Tab past: chỉ hiển thị các lịch completed
                      return appointment.status === 'completed';
                    }
                  })
                  .sort((a, b) => {
                    if (activeTab === 'past') {
                      return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
                    } else {
                      return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
                    }
                  })
                  .map((appointment) => (
                    <div
                      key={appointment._id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                            <FaPaw className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {appointment?.petId?.petName || 'N/A'}
                            </h3>
                            <p className="text-gray-600">
                              {appointment?.clinicId?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {appointment.status !== "completed" && (
                            <>
                              <button
                                onClick={() => handleEdit(appointment)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit appointment"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleCancel(appointment._id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel appointment"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          {appointment.status !== "completed" &&
                            appointment.status !== "confirmed" &&
                            !appointment.isDepositPaid && (
                              <button
                                onClick={() => handlePayment(appointment._id)}
                                disabled={processingPayment === appointment._id}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaMoneyBillWave />
                                <span>
                                  {processingPayment === appointment._id
                                    ? "Processing..."
                                    : "Pay deposit"}
                                </span>
                              </button>
                            )}
                          <button
                            onClick={() => handleViewDetails(appointment._id)}
                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <FaInfoCircle />
                          </button>
                          <button
                            onClick={() => handleOpenChat(appointment)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chat with doctor"
                          >
                            <FaComments />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <FaCalendarAlt className="text-orange-500" />
                          <span className="text-gray-700">
                            {formatDate(appointment.appointment_date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaHospital className="text-orange-500" />
                          <span className="text-gray-700">
                            {appointment?.clinicId?.address || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaStethoscope className="text-orange-500" />
                          <span className="text-gray-700">
                            {appointment?.serviceId?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaPaw className="text-orange-500" />
                          <span className="text-gray-700">
                            {appointment?.petId?.breed || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                              {appointment.status === "confirmed" || appointment.isDepositPaid
                                ? (
                                  appointment.isFullyPaid
                                    ? `Deposit paid: ${appointment?.serviceId?.price?.toLocaleString() || 0} ₫`
                                    : `Deposit paid: ${appointment?.depositAmount?.toLocaleString() || 0} ₫`
                                )
                                : appointment.status}
                            </span>
                            {appointment.status === "pending" && !appointment.isDepositPaid && (
                              <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                Deposit not paid
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Payment method:
                            </p>
                            <p className="font-medium text-gray-900">
                              {appointment?.paymentMethod === "vnpay"
                                ? "VNPay"
                                : appointment?.paymentMethod === "momo"
                                  ? "MoMo"
                                  : "Cash"}
                            </p>
                            {appointment.status === "completed" ? (
                              <p className="text-sm text-gray-600 mt-1">
                                Total Amount: {appointment.serviceId?.price?.toLocaleString() || 0} ₫
                              </p>
                            ) : (
                              !(appointment.status === "confirmed" || appointment.isDepositPaid) && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Deposit amount: {appointment.isDepositPaid
                                    ? `${appointment?.depositAmount?.toLocaleString() || 0} ₫`
                                    : "Not paid"}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                        {/* hiển thị nút đánh giá nếu cuộc hẹn đã hoàn thành */}
                        {activeTab === 'past' && appointment.status === "completed" && (
                          <>
                            {appointmentReviews[appointment._id] && appointmentReviews[appointment._id].isDeleted === false ? (
                              <button
                                onClick={() => {
                                  setSelectedReview(appointmentReviews[appointment._id]);
                                  setShowReviewDialog(true);
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                View Your Review
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedReview({
                                    _id: "",
                                    rating: 0,
                                    comment: "",
                                    createdAt: "",
                                    updatedAt: "",
                                    appointmentId: appointment._id,
                                  });
                                  setShowReviewDialog(true);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Create Review
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Select Pet:</label>
                <select
                  className={`w-full border ${errors.petId ? "border-red-500" : "border-gray-300"
                    } rounded-lg p-2`}
                  value={editForm.petId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, petId: e.target.value })
                  }
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet) => (
                    <option key={pet._id} value={pet._id}>
                      {pet.petName} - {pet.species}{" "}
                      {pet.breed && `(${pet.breed})`}
                      {pet.age && `, ${pet.age} years old`}
                    </option>
                  ))}
                </select>
                {errors.petId && (
                  <p className="text-red-500 text-sm mt-1">{errors.petId}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">
                    Appointment Date:
                  </label>
                  <input
                    type="date"
                    className={`w-full border ${errors.appointment_date
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-lg p-2`}
                    value={editForm.appointment_date}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        appointment_date: e.target.value,
                      });
                      // Clear time error when date changes
                      if (errors.appointment_time && errors.appointment_time.includes('past')) {
                        setErrors(prev => ({ ...prev, appointment_time: '' }));
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.appointment_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.appointment_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 font-medium">
                    Appointment Time:
                  </label>
                  <select
                    className={`w-full border ${errors.appointment_time
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-lg p-2`}
                    value={editForm.appointment_time}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        appointment_time: e.target.value,
                      });
                      // Clear time error when time changes
                      if (errors.appointment_time && errors.appointment_time.includes('past')) {
                        setErrors(prev => ({ ...prev, appointment_time: '' }));
                      }
                    }}
                  >
                    <option value="">Select time</option>
                    {(() => {
                      const today = new Date();
                      const isToday = editForm.appointment_date === today.toISOString().split("T")[0];
                      const currentHour = today.getHours();

                      return [
                        "07:00",
                        "08:00",
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                      ].filter(time => {
                        if (!isToday) return true;
                        const [hour] = time.split(":");
                        return parseInt(hour) > currentHour;
                      }).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ));
                    })()}
                  </select>
                  {errors.appointment_time && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.appointment_time}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium">Symptoms:</label>
                <textarea
                  className={`w-full border ${errors.symptoms ? "border-red-500" : "border-gray-300"
                    } rounded-lg p-2`}
                  rows={3}
                  value={editForm.symptoms}
                  onChange={(e) =>
                    setEditForm({ ...editForm, symptoms: e.target.value })
                  }
                />
                {errors.symptoms && (
                  <p className="text-red-500 text-sm mt-1">{errors.symptoms}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {editingAppointment && editingAppointment.status !== "completed" && (
                <button
                  onClick={handleUpdateAppointment}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update
                </button>
              )}
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Cancel Appointment</h3>
            {/* Always show cancellation fee warning */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-2">Notice:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Cancelling the appointment will incur a 10% service fee.</li>
              </ul>
            </div>
            <label className="block mb-2 font-medium">
              Reason for cancellation:
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter your reason..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* // Hiển thị ReviewDialog */}
      <ReviewDialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        review={selectedReview}
        onUpdated={fetchAppointments}
        onCreated={(newReview) => {
          setAppointmentReviews((prev) => ({
            ...prev,
            [newReview.appointmentId]: newReview,
          }));
          setShowReviewDialog(false);
        }}
      />
      {/* Detail Modal */}
      {showDetailModal && detailAppointment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fade-in">
            <button
              onClick={closeDetailModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl"
              title="Close"
            >
              <FaTimes />
            </button>
            <h3 className="text-2xl font-bold mb-4 text-center text-orange-600">Appointment Details</h3>
            <div className="space-y-4">
              {/* Pet */}
              <div className="flex items-center gap-3">
                {detailAppointment?.petId?.imageUrl && (
                  <img src={detailAppointment?.petId?.imageUrl} alt="pet" className="w-14 h-14 rounded-full object-cover border-2 border-orange-300" />
                )}
                <div>
                  <div className="font-semibold">{detailAppointment?.petId?.petName || 'N/A'}</div>
                  <div className="text-gray-600 text-sm">
                    {detailAppointment?.petId?.species || 'N/A'} - {detailAppointment?.petId?.breed || 'N/A'}
                    {detailAppointment?.petId?.age ? `, ${detailAppointment.petId.age} years old` : ''}
                  </div>
                </div>
              </div>
              {/* Service */}
              <div>
                <div className="font-semibold">Service: {detailAppointment?.serviceId?.name || 'N/A'}</div>
                <div className="text-gray-600 text-sm">{detailAppointment?.serviceId?.category || 'N/A'}</div>
                <div className="text-orange-600 font-bold">{detailAppointment?.serviceId?.price?.toLocaleString() || 0} ₫</div>
              </div>
              {/* Clinic */}
              <div>
                <div className="font-semibold">Clinic: {detailAppointment?.clinicId?.name || 'N/A'}</div>
                <div className="text-gray-600 text-sm">
                  {detailAppointment?.clinicId?.address || 'N/A'}
                  {detailAppointment?.clinicId?.city ? `, ${detailAppointment.clinicId.city}` : ''}
                </div>
              </div>
              {/* Time, status, notes */}
              <div className="flex items-center text-sm">
                <FaCalendarAlt className="text-orange-500 mr-2" />
                <span>{formatDate(detailAppointment?.appointment_date)}</span>
              </div>
              <div className="flex items-center text-sm">
                <FaStethoscope className="text-orange-500 mr-2" />
                <span>{detailAppointment?.symptoms || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <FaEdit className="text-orange-500 mr-2" />
                <span className="capitalize">{detailAppointment?.status || 'N/A'}</span>
              </div>
              {/* Payment */}
              <div>
                <div className="font-semibold">
                  Payment: <span className="ml-2">
                    {detailAppointment?.paymentMethod === 'vnpay' ? 'VNPay' : detailAppointment?.paymentMethod === 'momo' ? 'MoMo' : 'Cash'}
                  </span>
                </div>
                {detailAppointment?.isFullyPaid ? (
                  <>
                    <div className="text-sm text-green-700 font-semibold">Full Payment: Paid</div>
                    <div className="text-sm">
                      Amount Paid: {detailAppointment?.serviceId?.price?.toLocaleString() || 0} ₫
                    </div>
                    <div className="text-sm">Payment Type: Full service</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm">
                      Amount Paid: {detailAppointment?.isDepositPaid
                        ? `${detailAppointment?.depositAmount?.toLocaleString() || 0} ₫`
                        : 'Not paid yet'}
                    </div>
                    <div className="text-sm">Payment Type: Deposit</div>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointment;
