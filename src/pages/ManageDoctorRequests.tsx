import React, { useState, useEffect } from "react";
import {
  Calendar,
  RefreshCcw,
  X,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Home,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import staffApprovalAPI from "../utils/staffApprovalAPI";
import { DateTime } from "luxon";

const ManageDoctorRequests: React.FC = () => {
  const [tab, setTab] = useState<"pending" | "processed">("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffNote, setStaffNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (tab === "pending") {
        response = await staffApprovalAPI.getPendingRequests();
      } else {
        response = await staffApprovalAPI.getProcessedRequests();
      }


      // Sửa lại cấu trúc response
      if (response && response.success) {
        setRequests(response.data || []);
      } else {
        setRequests([]);
        setError(response?.message || "Failed to load requests");
      }
    } catch (err: any) {
      setRequests([]);
      setError("Error fetching requests");
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tab]);

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString, { zone: "utc" })
      .setZone("Asia/Ho_Chi_Minh")
      .toFormat("dd/MM/yyyy");
  };

  const formatTime = (timeString: string) => {
    return DateTime.fromISO(timeString, { zone: "utc" })
      .setZone("Asia/Ho_Chi_Minh")
      .toFormat("HH:mm");
  };

  const safeFormatDate = (value?: string) =>
    value ? formatDate(value) : "N/A";

  const safeFormatTime = (value?: string) =>
    value ? formatTime(value) : "N/A";

  const handleAction = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setStaffNote("");
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      let response;
      if (actionType === "approve") {
        response = await staffApprovalAPI.approveRequest(
          selectedRequest._id,
          staffNote
        );
      } else {
        response = await staffApprovalAPI.rejectRequest(
          selectedRequest._id,
          staffNote
        );
      }


      // Sửa lại cấu trúc response
      if (response && response.success) {
        toast.success(`Request ${actionType}d successfully!`);
        setIsModalOpen(false);
        fetchRequests(); // Refresh the list
      } else {
        toast.error(response?.message || `Failed to ${actionType} request`);
      }
    } catch (err: any) {
      toast.error(`Error ${actionType}ing request`);
      console.error(`Error ${actionType}ing request:`, err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow bg-[#fff9f5]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#663300] mb-6">
                Manage Doctor Schedule Requests
              </h1>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setTab("pending")}
                  className={`px-4 py-2 rounded ${
                    tab === "pending"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending Requests
                </button>
                <button
                  onClick={() => setTab("processed")}
                  className={`px-4 py-2 rounded ${
                    tab === "processed"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Processed Requests
                </button>
                <button
                  onClick={fetchRequests}
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
                  Loading requests...
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100">
                <Calendar
                  size={48}
                  className="mx-auto text-[#e67e22]/60 mb-4"
                />
                <p className="text-lg text-gray-600 mb-2">
                  {tab === "pending"
                    ? "No pending requests"
                    : "No processed requests"}
                </p>
                <p className="text-gray-500">
                  {tab === "pending"
                    ? "Schedule transfer requests will appear here"
                    : "Processed requests will appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg shadow-md border-l-4 border-[#e67e22] hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-gray-500">
                            Created: {safeFormatDate(request.createdAt)}
                          </span>
                          {request.processedAt && (
                            <span className="text-sm text-gray-500">
                              Processed: {safeFormatDate(request.processedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transfer Request Details */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                        {/* From Schedule */}
                        <div className="bg-[#fef6e4] p-4 rounded-lg">
                          <h4 className="font-bold text-[#e67e22] mb-3 flex items-center">
                            <Calendar size={16} className="mr-2" />
                            From Schedule
                          </h4>
                          <div className="space-y-2 text-[#663300]">
                            <p className="flex items-center">
                              <User size={14} className="mr-2 text-[#e67e22]" />
                              {request.transferRequestId?.workScheduleId
                                ?.doctorId?.fullName || "Unknown Doctor"}
                            </p>
                            <p className="flex items-center">
                              <Calendar
                                size={14}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatDate(
                                request.transferRequestId?.workScheduleId
                                  ?.work_Date
                              )}
                            </p>
                            <p className="flex items-center">
                              <Clock
                                size={14}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatTime(
                                request.transferRequestId?.workScheduleId
                                  ?.start_time
                              )}{" "}
                              -
                              {safeFormatTime(
                                request.transferRequestId?.workScheduleId
                                  ?.end_time
                              )}
                            </p>
                            <p className="flex items-center">
                              <Home size={14} className="mr-2 text-[#e67e22]" />
                              {request.transferRequestId?.workScheduleId
                                ?.clinicId?.name || "Unknown Clinic"}
                            </p>
                          </div>
                        </div>

                        {/* To Schedule */}
                        <div className="bg-[#eef8f6] p-4 rounded-lg">
                          <h4 className="font-bold text-[#059669] mb-3 flex items-center">
                            <Calendar size={16} className="mr-2" />
                            To Schedule
                          </h4>
                          <div className="space-y-2 text-[#663300]">
                            <p className="flex items-center">
                              <User size={14} className="mr-2 text-[#059669]" />
                              {request.transferRequestId?.targetScheduleId
                                ?.doctorId?.fullName || "Empty Slot"}
                            </p>
                            <p className="flex items-center">
                              <Calendar
                                size={14}
                                className="mr-2 text-[#059669]"
                              />
                              {safeFormatDate(
                                request.transferRequestId?.targetScheduleId
                                  ?.work_Date
                              )}
                            </p>
                            <p className="flex items-center">
                              <Clock
                                size={14}
                                className="mr-2 text-[#059669]"
                              />
                              {safeFormatTime(
                                request.transferRequestId?.targetScheduleId
                                  ?.start_time
                              )}{" "}
                              -
                              {safeFormatTime(
                                request.transferRequestId?.targetScheduleId
                                  ?.end_time
                              )}
                            </p>
                            <p className="flex items-center">
                              <Home size={14} className="mr-2 text-[#059669]" />
                              {request.transferRequestId?.targetScheduleId
                                ?.clinicId?.name || "Unknown Clinic"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {request.transferRequestId?.reason && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-[#663300] mb-2">
                            Reason for Transfer:
                          </h4>
                          <p className="text-gray-700">
                            {request.transferRequestId.reason}
                          </p>
                        </div>
                      )}

                      {/* Staff Note - hiển thị cho cả processed requests */}
                      {request.staffNote && (
                        <div
                          className={`p-4 rounded-lg mb-4 ${
                            request.status === "approved"
                              ? "bg-green-50"
                              : request.status === "rejected"
                              ? "bg-red-50"
                              : "bg-blue-50"
                          }`}
                        >
                          <h4
                            className={`font-semibold mb-2 ${
                              request.status === "approved"
                                ? "text-green-700"
                                : request.status === "rejected"
                                ? "text-red-700"
                                : "text-blue-700"
                            }`}
                          >
                            Staff Note:
                          </h4>
                          <p
                            className={`${
                              request.status === "approved"
                                ? "text-green-600"
                                : request.status === "rejected"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {request.staffNote}
                          </p>
                          {request.staffId && (
                            <p className="text-xs text-gray-500 mt-1">
                              By: {request.staffId.fullName || "Staff"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {tab === "pending" && (
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleAction(request, "reject")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(request, "approve")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Action Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-[#663300]">
                  {actionType === "approve"
                    ? "Approve Request"
                    : "Reject Request"}
                </h3>
              </div>

              <div className="p-6">
                <p className="text-[#663300] mb-4">
                  Are you sure you want to {actionType} this schedule transfer
                  request?
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#663300]">
                    Staff Note (Optional)
                  </label>
                  <textarea
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    placeholder="Add a note about your decision..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e67e22] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={processing}
                  className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
                    actionType === "approve"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {processing
                    ? "Processing..."
                    : actionType === "approve"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-auto bg-[#fff5eb] border-t border-amber-100">
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default ManageDoctorRequests;
