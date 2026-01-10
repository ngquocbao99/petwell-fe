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
  FileText,
  X,
} from "lucide-react";

interface AppointmentDetailsModalProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !appointment) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#663300]">
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                appointment.status
              )}`}
            >
              {appointment.status}
            </span>
          </div>

          {/* Customer Information */}
          <div className="bg-[#f8f8f8] p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-[#663300] mb-3 flex items-center">
              <User size={18} className="mr-2 text-[#e67e22]" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium text-[#663300]">
                  {appointment.customerId?.fullName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-[#663300]">
                  {appointment.customerId?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-[#663300]">
                  {appointment.customerId?.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Pet Information */}
          <div className="bg-[#f8f8f8] p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-[#663300] mb-3 flex items-center">
              <Stethoscope size={18} className="mr-2 text-[#e67e22]" />
              Pet Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Breed</p>
                <p className="font-medium text-[#663300]">
                  {appointment.petId?.breed || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-medium text-[#663300]">
                  {appointment.petId?.age || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Symptoms</p>
                <p className="font-medium text-[#663300]">
                  {appointment.symptoms || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="bg-[#f8f8f8] p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-[#663300] mb-3 flex items-center">
              <Calendar size={18} className="mr-2 text-[#e67e22]" />
              Appointment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Appointment Date</p>
                <p className="font-medium text-[#663300]">
                  {formatDateTime(appointment.appointment_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Doctor</p>
                <p className="font-medium text-[#663300]">
                  {appointment.doctorId?.fullName || (
                    <span className="text-orange-500">Unassigned</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clinic</p>
                <p className="font-medium text-[#663300]">
                  {appointment.clinicId?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-[#663300]">
                  {appointment.clinicId?.address || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-medium text-[#663300]">
                  {formatDateTime(appointment.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-[#f8f8f8] p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-[#663300] mb-3 flex items-center">
              <DollarSign size={18} className="mr-2 text-[#e67e22]" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-[#663300]">
                  {appointment.paymentMethod || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-[#663300]">
                  {appointment.totalAmount?.toLocaleString()} VND
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deposit Amount</p>
                <p className="font-medium text-[#663300]">
                  {appointment.depositAmount?.toLocaleString()} VND
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {appointment.isDepositPaid && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  <span className="text-sm text-gray-600">Deposit Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  {appointment.isFullyPaid && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  <span className="text-sm text-gray-600">Fully Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Result */}
          {appointment.diagnosisResult && (
            <div className="bg-[#f0f8ff] p-4 rounded-lg">
              <h3 className="font-semibold text-[#663300] mb-3 flex items-center">
                <FileText size={18} className="mr-2 text-[#e67e22]" />
                Diagnosis Result
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Health Condition</p>
                  <p className="font-medium text-[#663300]">
                    {appointment.diagnosisResult.healthCondition}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-medium text-[#663300]">
                    {appointment.diagnosisResult.diagnosis}
                  </p>
                </div>
                {appointment.diagnosisResult.treatment && (
                  <div>
                    <p className="text-sm text-gray-600">Treatment</p>
                    <p className="font-medium text-[#663300]">
                      {appointment.diagnosisResult.treatment}
                    </p>
                  </div>
                )}
                {appointment.diagnosisResult.testResults &&
                  appointment.diagnosisResult.testResults.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Test Results</p>
                      <ul className="list-disc list-inside text-[#663300] mt-1">
                        {appointment.diagnosisResult.testResults.map(
                          (result: string, index: number) => (
                            <li key={index}>{result}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {appointment.diagnosisResult.medications &&
                  appointment.diagnosisResult.medications.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Medications</p>
                      <div className="mt-1 space-y-2">
                        {appointment.diagnosisResult.medications.map(
                          (med: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white p-2 rounded border"
                            >
                              <p className="font-medium text-[#663300]">
                                {med.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Dosage: {med.dosage} | Duration: {med.duration}
                              </p>
                              {med.note && (
                                <p className="text-sm text-gray-600">
                                  Note: {med.note}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                {appointment.diagnosisResult.reExaminationDate && (
                  <div>
                    <p className="text-sm text-gray-600">Re-examination Date</p>
                    <p className="font-medium text-[#663300]">
                      {formatDateTime(
                        appointment.diagnosisResult.reExaminationDate
                      )}
                    </p>
                  </div>
                )}
                {appointment.diagnosisResult.instructions && (
                  <div>
                    <p className="text-sm text-gray-600">Instructions</p>
                    <p className="font-medium text-[#663300]">
                      {appointment.diagnosisResult.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
