import React from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Stethoscope,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AppointmentCardProps {
  appointment: any;
  onAccept?: (id: string) => void;
  onSubmitDiagnosis?: (appointment: any) => void;
  onViewDetails?: (appointment: any) => void;
  showAcceptButton?: boolean;
  showDiagnosisButton?: boolean;
  loading?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onSubmitDiagnosis,
  onViewDetails,
  showAcceptButton = false,
  showDiagnosisButton = false,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const hasDiagnosisResult =
    appointment.diagnosisResult &&
    appointment.diagnosisResult.diagnosis &&
    appointment.diagnosisResult.healthCondition;

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-[#e67e22] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="p-5">
        <div className="mb-3 flex justify-between items-start">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              appointment.status
            )}`}
          >
            {appointment.status}
          </span>
          {appointment.status.toLowerCase() === "completed" &&
            hasDiagnosisResult && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Diagnosis Submitted
              </span>
            )}
        </div>

        <div className="bg-[#f8f8f8] p-3 rounded-lg mb-3">
          <p className="text-[#996633] flex items-center">
            <User size={16} className="mr-2 text-[#e67e22]" />
            <span className="font-medium">Customer:</span>
            <span className="ml-1">
              {appointment.customerId?.fullName || "N/A"}
            </span>
          </p>
          <p className="text-[#996633] flex items-center mt-2">
            <Phone size={16} className="mr-2 text-[#e67e22]" />
            <span className="font-medium">Phone:</span>
            <span className="ml-1">
              {appointment.customerId?.phone || "N/A"}
            </span>
          </p>
          <p className="text-[#996633] flex items-center mt-2">
            <MapPin size={16} className="mr-2 text-[#e67e22]" />
            <span className="font-medium">Clinic:</span>
            <span className="ml-1">{appointment.clinicId?.name || "N/A"}</span>
          </p>
          <p className="text-[#996633] flex items-center mt-2">
            <Stethoscope size={16} className="mr-2 text-[#e67e22]" />
            <span className="font-medium">Doctor:</span>
            <span className="ml-1">
              {appointment.doctorId?.fullName || (
                <span className="text-orange-500 font-medium">Unassigned</span>
              )}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="flex items-center bg-[#f8f8f8] p-3 rounded-lg text-gray-600">
            <Calendar size={16} className="mr-2 text-[#e67e22]" />
            {formatDate(appointment.appointment_date)}
          </div>
          <div className="flex items-center bg-[#f8f8f8] p-3 rounded-lg text-gray-600">
            <Clock size={16} className="mr-2 text-[#e67e22]" />
            {formatTime(appointment.appointment_date)}
          </div>
        </div>

        <div className="bg-[#f8f8f8] p-3 rounded-lg mb-3">
          <p className="text-[#996633] text-sm">
            <span className="font-medium">Pet:</span>{" "}
            {appointment.petId?.breed || "N/A"} (Age:{" "}
            {appointment.petId?.age || "N/A"})
          </p>
          <p className="text-[#996633] text-sm mt-1">
            <span className="font-medium">Symptoms:</span>{" "}
            {appointment.symptoms || "N/A"}
          </p>
        </div>

        <div className="bg-[#f8f8f8] p-3 rounded-lg mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign size={16} className="mr-2 text-[#e67e22]" />
              <span className="font-medium text-[#996633]">Total:</span>
              <span className="ml-1 text-[#996633]">
                {(appointment.totalAmount ?? appointment.serviceId?.price ?? 0).toLocaleString()} VND
              </span>
            </div>
            <div className="flex items-center gap-2">
              {appointment.isDepositPaid && (
                <CheckCircle size={16} className="text-green-500" />
              )}
              {appointment.isFullyPaid && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Fully Paid
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8f0e9] px-5 py-3 flex justify-between items-center border-t border-[#f5e9dc]">
        <button
          onClick={() => onViewDetails?.(appointment)}
          className="text-[#e67e22] hover:text-[#d35400] font-medium text-sm"
        >
          View Details
        </button>

        <div className="flex gap-2">
          {showAcceptButton && (
            <button
              onClick={() => onAccept?.(appointment._id)}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#e67e22] text-white hover:bg-[#d35400] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Accepting..." : "Accept"}
            </button>
          )}

          {showDiagnosisButton && (
            <button
              onClick={() => onSubmitDiagnosis?.(appointment)}
              className="px-4 py-2 rounded-lg bg-[#e67e22] text-white hover:bg-[#d35400]"
            >
              Submit Diagnosis
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
