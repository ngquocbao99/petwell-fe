import React, { useState, useEffect } from "react";
import { Calendar, RefreshCcw, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import AppointmentCard from "../components/AppointmentCard";
import AppointmentDetailsModal from "../components/AppointmentDetailsModal";
import DiagnosisFormModal from "../components/DiagnosisFormModal";
import {
  fetchAvailableAppointments,
  fetchAppointmentsForDoctor,
  acceptDoctorAppointment,
  submitDiagnosisResult,
} from "../utils/doctorAppointment";

const DoctorAppointment: React.FC = () => {
  const [tab, setTab] = useState<"available" | "mine" | "history">("available");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null
  );
  const [diagnosisFormOpen, setDiagnosisFormOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<any | null>(
    null
  );
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);

  const doctorId = localStorage.getItem("userId");

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (tab === "available") {
        data = await fetchAvailableAppointments();
        console.log("[DoctorAppointment] Available appointments response:", data);
      } else {
        if (!doctorId) {
          setAppointments([]);
          toast.error("Doctor information not found. Please log in again.");
          setLoading(false);
          return;
        }
        data = await fetchAppointmentsForDoctor(doctorId);
        console.log("[DoctorAppointment] My appointments response:", data);

        // Filter appointments based on tab
        if (data.success) {
          const filteredAppointments = data.data.filter((appointment: any) => {
            if (tab === "mine") {
              return appointment.status.toLowerCase() !== "completed";
            } else if (tab === "history") {
              return appointment.status.toLowerCase() === "completed";
            }
            return true;
          });
          setAppointments(filteredAppointments);
          setLoading(false);
          return;
        }
      }

      if (data.success) {
        // Sort appointments by date (newest first)
        const sortedAppointments = data.data.sort((a: any, b: any) => {
          const dateA = new Date(a.appointment_date || a.createdAt);
          const dateB = new Date(b.appointment_date || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        setAppointments(sortedAppointments);
      } else {
        setAppointments([]);
        setError(data.message || "Failed to load appointments");
      }
    } catch (err) {
      setAppointments([]);
      setError("Error fetching appointments");
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  const handleAccept = async (appointmentId: string) => {
    setLoading(true);
    try {
      if (!doctorId) {
        toast.error("Doctor information not found. Please log in again.");
        setLoading(false);
        return;
      }
      const data = await acceptDoctorAppointment(doctorId, appointmentId);
      if (data.success) {
        toast.success("Appointment accepted successfully!");
        fetchAppointments();
      } else {
        toast.error(data.message || "Failed to accept appointment");
      }
    } catch (err) {
      toast.error("Error accepting appointment");
      console.error("Error accepting appointment:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDiagnosisForm = (appointment: any) => {
    setCurrentAppointment(appointment);
    setDiagnosisFormOpen(true);
  };

  const closeDiagnosisForm = () => {
    if (submittingDiagnosis) return;
    setDiagnosisFormOpen(false);
    setCurrentAppointment(null);
  };

  const handleDiagnosisSubmit = async (diagnosisData: any) => {
    try {
      if (!currentAppointment?._id) {
        toast.error("Cannot identify appointment");
        return;
      }

      setSubmittingDiagnosis(true);

      const result = await submitDiagnosisResult(
        currentAppointment._id,
        diagnosisData
      );

      if (result.success) {
        toast.success("Diagnosis submitted successfully!");
        setDiagnosisFormOpen(false);
        setCurrentAppointment(null);
        fetchAppointments();
      } else {
        toast.error(result.message || "Failed to submit diagnosis");
      }
    } catch (error) {
      console.error("Error submitting diagnosis:", error);
      toast.error("An error occurred while submitting diagnosis");
    } finally {
      setSubmittingDiagnosis(false);
    }
  };

  const shouldShowDiagnosisButton = (appointment: any) => {
    const isCompleted = appointment.status.toLowerCase() === "completed";
    const isConfirmed = appointment.status.toLowerCase() === "confirmed";
    const hasDiagnosisResult =
      appointment.diagnosisResult &&
      appointment.diagnosisResult.diagnosis &&
      appointment.diagnosisResult.healthCondition;

    return (isCompleted || isConfirmed) && !hasDiagnosisResult;
  };

  return (
    <div className="bg-white min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow bg-[#fff9f5]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#663300] mb-6">
                Doctor Appointments
              </h1>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setTab("available")}
                  className={`px-4 py-2 rounded ${tab === "available"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  Available Appointments
                </button>
                <button
                  onClick={() => setTab("mine")}
                  className={`px-4 py-2 rounded ${tab === "mine"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  My Appointments
                </button>
                <button
                  onClick={() => setTab("history")}
                  className={`px-4 py-2 rounded ${tab === "history"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  History Appointments
                </button>
                <button
                  onClick={fetchAppointments}
                  className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f8d7b6] text-[#663300] hover:bg-[#f5c79a] transition-all"
                >
                  <RefreshCcw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border-l-4 border-red-500 shadow-sm flex justify-between items-center">
                <div>{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="ml-2 p-1.5 rounded-full hover:bg-red-200"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e67e22]"></div>
                <p className="text-[#996633] font-medium">
                  Loading appointments...
                </p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100">
                <Calendar
                  size={48}
                  className="mx-auto text-[#e67e22]/60 mb-4"
                />
                <p className="text-lg text-gray-600 mb-2">
                  {tab === "available" && "No available appointments"}
                  {tab === "mine" && "No current appointments"}
                  {tab === "history" && "No completed appointments"}
                </p>
                <p className="text-gray-500">
                  {tab === "available" &&
                    "Check back later for new appointments"}
                  {tab === "mine" && "Accept appointments to see them here"}
                  {tab === "history" &&
                    "Completed appointments will appear here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onAccept={handleAccept}
                    onSubmitDiagnosis={openDiagnosisForm}
                    onViewDetails={setSelectedAppointment}
                    showAcceptButton={tab === "available"}
                    showDiagnosisButton={
                      tab === "mine" || tab === "history"
                        ? shouldShowDiagnosisButton(appointment)
                        : false
                    }
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />

        <DiagnosisFormModal
          isOpen={diagnosisFormOpen}
          onClose={closeDiagnosisForm}
          appointment={currentAppointment}
          onSubmit={handleDiagnosisSubmit}
          submitting={submittingDiagnosis}
        />

        <footer className="mt-auto bg-[#fff5eb] border-t border-amber-100">
          <Footer />
        </footer>
      </div>
    </div>
  );
};
export default DoctorAppointment;
