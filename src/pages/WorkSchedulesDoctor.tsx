import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  RefreshCcw,
  Repeat,
  User,
  X,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import {
  fetchAvailableScheduleDoctor,
  fetchMyScheduleDoctor,
  fetchSwappableSchedules,
  registerScheduleDoctor,
} from "../utils/workSchedules";
import workScheduleTransferAPI from "../utils/workScheduleTransfer";

const WorkSchedulesDoctor = () => {
  const [tab, setTab] = useState<"available" | "mine" | "history" | "swap">(
    "available"
  );
  const [schedules, setSchedules] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [historySchedules, setHistorySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [availableForSwap, setAvailableForSwap] = useState([]);
  const [selectedMySchedule, setSelectedMySchedule] = useState(null);
  const [selectedSwapTargetId, setSelectedSwapTargetId] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [swapReason, setSwapReason] = useState("");

  // Thêm state để theo dõi thông báo
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const userRaw = localStorage.getItem("persist:root");

  let currentUserId = null;
  if (userRaw) {
    const parsedRoot = JSON.parse(userRaw);
    const userObj = JSON.parse(parsedRoot.user);
    currentUserId = userObj.userId;
  }

  // Thêm function để enrich schedules với staffNote từ StaffApprovalRequest
  const enrichSchedulesWithStaffNotes = async (schedules: any[]) => {
    try {
      // Lấy tất cả swap requests để tìm staffNote
      const swapResponse =
        await workScheduleTransferAPI.getMyTransferRequests();
      const allSwapRequests = swapResponse.data.data || [];

      return schedules.map((schedule) => {
        // Tìm swap request liên quan đến schedule này
        const relatedSwapRequest = allSwapRequests.find(
          (req) =>
            (req.workScheduleId?._id === schedule._id ||
              req.targetScheduleId?._id === schedule._id) &&
            req.status === "accepted" // Chỉ lấy những request đã được accept
        );

        if (relatedSwapRequest?.staffApprovalRequest) {
          return {
            ...schedule,
            swapInfo: {
              staffNote: relatedSwapRequest.staffApprovalRequest.staffNote,
              approvedByStaff:
                relatedSwapRequest.staffApprovalRequest.staffId?.fullName,
              swapApprovedAt:
                relatedSwapRequest.staffApprovalRequest.processedAt,
              swapStatus: relatedSwapRequest.staffApprovalRequest.status,
            },
            swapReason: relatedSwapRequest.reason,
            isSwapped: true,
          };
        }

        return schedule;
      });
    } catch (error) {
      console.error("Error enriching schedules with staff notes:", error);
      return schedules;
    }
  };

  // Cập nhật fetchSchedules function
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      if (tab === "available") {
        const response = await fetchAvailableScheduleDoctor();
        // Sort by date (newest first)
        const sortedSchedules = response.sort((a: any, b: any) => {
          const dateA = new Date(a.work_Date);
          const dateB = new Date(b.work_Date);
          return dateB.getTime() - dateA.getTime();
        });
        setSchedules(sortedSchedules);
      } else if (tab === "mine") {
        const response = await fetchMyScheduleDoctor();
        // Filter and sort schedules - move past schedules to history
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const currentSchedules = response.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.work_Date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate >= currentDate;
        });

        const sortedSchedules = currentSchedules.sort((a: any, b: any) => {
          const dateA = new Date(a.work_Date);
          const dateB = new Date(b.work_Date);
          return dateA.getTime() - dateB.getTime(); // Upcoming schedules: earliest first
        });

        // Enrich với staffNote từ StaffApprovalRequest
        const enrichedSchedules = await enrichSchedulesWithStaffNotes(
          sortedSchedules
        );
        setMySchedules(enrichedSchedules);
      } else if (tab === "history") {
        const response = await fetchMyScheduleDoctor();
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const pastSchedules = response.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.work_Date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate < currentDate;
        });

        const sortedSchedules = pastSchedules.sort((a: any, b: any) => {
          const dateA = new Date(a.work_Date);
          const dateB = new Date(b.work_Date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });

        // Enrich với staffNote từ StaffApprovalRequest
        const enrichedSchedules = await enrichSchedulesWithStaffNotes(
          sortedSchedules
        );
        setHistorySchedules(enrichedSchedules);
      } else if (tab === "swap") {
        const response = await workScheduleTransferAPI.getMyTransferRequests();
        // Sort swap requests by created date (newest first)
        const sortedRequests = (response.data.data || []).sort(
          (a: any, b: any) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }
        );
        setSwapRequests(sortedRequests);
      }
    } catch (err) {
      setError("Error fetching schedules: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Thêm function để check new requests
  const checkForNewRequests = async () => {
    try {
      const response = await workScheduleTransferAPI.getMyTransferRequests();
      const requests = response.data.data || [];

      // Đếm số request pending dành cho doctor hiện tại (không phải sender)
      const incomingPendingRequests = requests.filter((req) => {
        const isSender =
          req.doctorId &&
          String(
            typeof req.doctorId === "object" ? req.doctorId._id : req.doctorId
          ) === String(currentUserId);
        return !isSender && req.status === "pending";
      });

      const newCount = incomingPendingRequests.length;

      if (newCount > newRequestsCount && newCount > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000); // Ẩn sau 5 giây
      }

      setNewRequestsCount(newCount);
    } catch (error) {
      console.error("Error checking for new requests:", error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [tab]);

  // Thêm useEffect để check new requests định kỳ
  useEffect(() => {
    if (currentUserId) {
      checkForNewRequests();
      const interval = setInterval(checkForNewRequests, 30000); // Check mỗi 30 giây
      return () => clearInterval(interval);
    }
  }, [currentUserId, newRequestsCount]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (timeString) => {
    return DateTime.fromISO(timeString, { zone: "utc" })
      .setZone("Asia/Ho_Chi_Minh")
      .toFormat("HH:mm");
  };

  const safeFormatDate = (value?: string) =>
    value ? formatDate(value) : "N/A";

  const safeFormatTime = (value?: string) =>
    value ? formatTime(value) : "N/A";

  // Thêm function để check lịch đã quá hạn
  const isSchedulePast = (schedule: any) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(schedule.work_Date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < currentDate;
  };

  return (
    <div className="bg-white min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow bg-[#fff9f5]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#663300] mb-6">
                Work Schedules
              </h1>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setTab("available")}
                  className={`px-4 py-2 rounded ${
                    tab === "available"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Available Schedules
                </button>
                <button
                  onClick={() => setTab("mine")}
                  className={`px-4 py-2 rounded ${
                    tab === "mine"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  My Schedules
                </button>
                <button
                  onClick={() => setTab("history")}
                  className={`px-4 py-2 rounded ${
                    tab === "history"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setTab("swap")}
                  className={`px-4 py-2 rounded relative ${
                    tab === "swap"
                      ? "bg-orange-200 font-bold text-[#663300]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Swap Requests
                  {newRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {newRequestsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={fetchSchedules}
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
                  Loading schedules...
                </p>
              </div>
            ) : tab === "available" ? (
              schedules.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100">
                  <Calendar
                    size={48}
                    className="mx-auto text-[#e67e22]/60 mb-4"
                  />
                  <p className="text-lg text-gray-600 mb-2">
                    No available schedules
                  </p>
                  <p className="text-gray-500">
                    Check back later for new schedules
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="bg-white rounded-xl shadow-md border border-amber-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="p-5">
                        <div className="flex items-center mb-4">
                          <Calendar size={20} className="text-[#e67e22] mr-3" />
                          <h3 className="text-lg font-semibold text-[#663300]">
                            {schedule.clinicId?.name}
                          </h3>
                        </div>
                        <div className="space-y-3 text-[#663300]">
                          <div className="flex items-center">
                            <Calendar
                              size={16}
                              className="mr-2 text-[#e67e22]"
                            />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">
                              {formatDate(schedule.work_Date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-[#e67e22]" />
                            <span className="font-medium">Time:</span>
                            <div className="ml-2 bg-[#f8f0e9] px-2 py-1 rounded text-sm font-medium">
                              {formatTime(schedule.start_time)} -{" "}
                              {formatTime(schedule.end_time)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#f8f0e9] px-5 py-3 flex justify-end border-t border-[#f5e9dc]">
                        <button
                          onClick={() => {
                            setSelectedScheduleId(schedule._id);
                            setIsConfirmOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#e67e22] text-white hover:bg-[#d35400]"
                        >
                          Register Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "mine" ? (
              mySchedules.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100">
                  <Calendar
                    size={48}
                    className="mx-auto text-[#e67e22]/60 mb-4"
                  />
                  <p className="text-lg text-gray-600 mb-2">
                    No current schedules
                  </p>
                  <p className="text-gray-500">
                    Register for schedules to see them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {mySchedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="bg-white rounded-xl shadow-md border border-amber-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Calendar
                              size={20}
                              className="text-[#e67e22] mr-3"
                            />
                            <h3 className="text-lg font-semibold text-[#663300]">
                              {schedule.clinicId?.name}
                            </h3>
                          </div>
                          {schedule.isSwapped && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Swapped
                            </span>
                          )}
                        </div>
                        <div className="space-y-3 text-[#663300]">
                          <div className="flex items-center">
                            <Calendar
                              size={16}
                              className="mr-2 text-[#e67e22]"
                            />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">
                              {formatDate(schedule.work_Date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-[#e67e22]" />
                            <span className="font-medium">Time:</span>
                            <div className="ml-2 bg-[#f8f0e9] px-2 py-1 rounded text-sm font-medium">
                              {formatTime(schedule.start_time)} -{" "}
                              {formatTime(schedule.end_time)}
                            </div>
                          </div>
                          {schedule.swapReason && (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-yellow-800 mb-1">
                                Swap Reason:
                              </p>
                              <p className="text-sm text-yellow-700">
                                {schedule.swapReason}
                              </p>
                            </div>
                          )}
                          {schedule.swapInfo?.staffNote && (
                            <div
                              className={`p-3 rounded-lg ${
                                schedule.swapInfo.swapStatus === "approved"
                                  ? "bg-green-50"
                                  : "bg-red-50"
                              }`}
                            >
                              <p
                                className={`text-sm font-medium mb-1 ${
                                  schedule.swapInfo.swapStatus === "approved"
                                    ? "text-green-800"
                                    : "text-red-800"
                                }`}
                              >
                                Staff Decision (
                                {schedule.swapInfo.swapStatus === "approved"
                                  ? "Approved"
                                  : "Rejected"}
                                ):
                              </p>
                              <p
                                className={`text-sm ${
                                  schedule.swapInfo.swapStatus === "approved"
                                    ? "text-green-700"
                                    : "text-red-700"
                                }`}
                              >
                                {schedule.swapInfo.staffNote}
                              </p>
                              {schedule.swapInfo.approvedByStaff && (
                                <p className="text-xs text-gray-500 mt-1">
                                  By: {schedule.swapInfo.approvedByStaff} •{" "}
                                  {safeFormatDate(
                                    schedule.swapInfo.swapApprovedAt
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-[#f8f0e9] px-5 py-3 flex justify-end border-t border-[#f5e9dc]">
                        <button
                          onClick={async () => {
                            console.log(
                              "Request swap clicked for schedule:",
                              schedule
                            );
                            setSelectedMySchedule(schedule);
                            setSwapReason(""); // Reset reason
                            setSelectedSwapTargetId(null); // Reset selection

                            try {
                              // Fetch available schedules for swap
                              const response = await fetchSwappableSchedules(
                                schedule._id
                              );
                              console.log(
                                "Swappable schedules response:",
                                response
                              );
                              setAvailableForSwap(response || []);
                              setIsSwapModalOpen(true); // Open modal after fetching data
                            } catch (error) {
                              console.error(
                                "Error fetching swappable schedules:",
                                error
                              );
                              toast.error(
                                "Failed to load available schedules for swap"
                              );
                              setAvailableForSwap([]);
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-[#e67e22] text-white hover:bg-[#663300] flex items-center gap-2 transition-colors duration-200"
                        >
                          <Repeat size={16} />
                          Request Swap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "history" ? (
              historySchedules.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100">
                  <Calendar
                    size={48}
                    className="mx-auto text-[#e67e22]/60 mb-4"
                  />
                  <p className="text-lg text-gray-600 mb-2">
                    No history schedules
                  </p>
                  <p className="text-gray-500">
                    Past schedules will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {historySchedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="bg-white rounded-xl shadow-md border border-gray-300 opacity-75"
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Calendar
                              size={20}
                              className="text-gray-500 mr-3"
                            />
                            <h3 className="text-lg font-semibold text-gray-700">
                              {schedule.clinicId?.name}
                            </h3>
                          </div>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            Completed
                          </span>
                          {schedule.isSwapped && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                              Swapped
                            </span>
                          )}
                        </div>
                        <div className="space-y-3 text-gray-600">
                          <div className="flex items-center">
                            <Calendar
                              size={16}
                              className="mr-2 text-gray-500"
                            />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">
                              {formatDate(schedule.work_Date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-gray-500" />
                            <span className="font-medium">Time:</span>
                            <div className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                              {formatTime(schedule.start_time)} -{" "}
                              {formatTime(schedule.end_time)}
                            </div>
                          </div>
                          {schedule.swapReason && (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-yellow-800 mb-1">
                                Swap Reason:
                              </p>
                              <p className="text-sm text-yellow-700">
                                {schedule.swapReason}
                              </p>
                            </div>
                          )}
                          {schedule.staffNote && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-1">
                                Staff Note:
                              </p>
                              <p className="text-sm text-blue-700">
                                {schedule.staffNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "swap" ? (
              // Existing swap requests content with added reason and staff note display
              swapRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-amber-100 w-full">
                  <Calendar
                    size={48}
                    className="mx-auto text-[#e67e22]/60 mb-4"
                  />
                  <p className="text-lg text-gray-600 mb-2">
                    No incoming swap requests.
                  </p>
                  <p className="text-gray-500">
                    Swap requests from other doctors will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 mb-8">
                  {swapRequests.map((req) => {
                    const isSender =
                      req.doctorId &&
                      String(
                        typeof req.doctorId === "object"
                          ? req.doctorId._id
                          : req.doctorId
                      ) === String(currentUserId);

                    return (
                      <div
                        key={req._id}
                        className="bg-white rounded-lg shadow-md border-l-4 border-[#e67e22] p-5"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[#663300] font-semibold mb-2">
                            Requested by: {req.doctorId?.fullName}
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              req.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : req.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : req.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {req.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Swap FROM */}
                          <div className="bg-[#fef6e4] p-4 rounded shadow-sm">
                            <p className="font-bold text-[#e67e22] mb-2 flex items-center">
                              <ArrowDownToLine size={16} className="mr-2" />
                              Request From:
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Calendar
                                size={16}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatDate(req.workScheduleId?.work_Date)}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Clock
                                size={16}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatTime(req.workScheduleId?.start_time)} -{" "}
                              {safeFormatTime(req.workScheduleId?.end_time)}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Home size={16} className="mr-2 text-[#e67e22]" />
                              {req.workScheduleId?.clinicId?.name || "No Store"}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <User size={16} className="mr-2 text-[#e67e22]" />
                              {req.workScheduleId?.doctorId?.fullName ||
                                "Unknown Doctor"}
                            </p>
                          </div>

                          {/* Your current schedule */}
                          <div className="bg-[#eef8f6] p-4 rounded shadow-sm">
                            <p className="font-bold text-[#e67e22] mb-2 flex items-center">
                              <ArrowDownToLine size={16} className="mr-2" />
                              Your Schedule:
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Calendar
                                size={16}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatDate(req.targetScheduleId?.work_Date)}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Clock
                                size={16}
                                className="mr-2 text-[#e67e22]"
                              />
                              {safeFormatTime(req.targetScheduleId?.start_time)}{" "}
                              - {safeFormatTime(req.targetScheduleId?.end_time)}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <Home size={16} className="mr-2 text-[#e67e22]" />
                              {req.targetScheduleId?.clinicId?.name ||
                                "No Store"}
                            </p>
                            <p className="flex items-center text-[#663300]">
                              <User size={16} className="mr-2 text-[#e67e22]" />
                              {req.targetScheduleId?.doctorId?.fullName ||
                                "Unknown Doctor"}
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        {req.reason && (
                          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">
                              Reason for Swap:
                            </h4>
                            <p className="text-yellow-700">{req.reason}</p>
                          </div>
                        )}

                        {/* Staff Note - hiển thị cho cả approved và rejected */}
                        {req.staffApprovalRequest?.staffNote && (
                          <div
                            className={`p-4 rounded-lg mt-4 ${
                              req.staffApprovalRequest.status === "approved"
                                ? "bg-green-50"
                                : "bg-red-50"
                            }`}
                          >
                            <h4
                              className={`font-semibold mb-2 ${
                                req.staffApprovalRequest.status === "approved"
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              Staff Decision (
                              {req.staffApprovalRequest.status === "approved"
                                ? "Approved"
                                : "Rejected"}
                              ):
                            </h4>
                            <p
                              className={`${
                                req.staffApprovalRequest.status === "approved"
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {req.staffApprovalRequest.staffNote}
                            </p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                              <span>
                                By: {req.staffApprovalRequest.staffId?.fullName}{" "}
                                •{" "}
                                {safeFormatDate(
                                  req.staffApprovalRequest.processedAt
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex justify-end items-center">
                          {isSender ? (
                            <p className="text-sm text-gray-500 italic">
                              You sent this request
                            </p>
                          ) : req.status === "pending" ? (
                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  await workScheduleTransferAPI.acceptTransfer(
                                    req._id
                                  );
                                  toast.success(
                                    "Transfer accepted successfully!"
                                  );
                                  fetchSchedules();
                                }}
                                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  await workScheduleTransferAPI.rejectTransfer(
                                    req._id
                                  );
                                  toast.success(
                                    "Transfer rejected successfully!"
                                  );
                                  fetchSchedules();
                                }}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Request {req.status}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}
          </div>
        </main>
        {isConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-[#663300]">
                  Confirm registration
                </h3>
              </div>
              <div className="p-6 text-[#663300] text-sm">
                Are you sure you want to register to this schedule?
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsConfirmOpen(false);
                    if (selectedScheduleId) {
                      const response = await registerScheduleDoctor(
                        selectedScheduleId
                      );
                      if (response) {
                        toast.success("Schedule registration successful!");
                        fetchSchedules();
                      } else {
                        toast.error("Registration failed. Please try again.");
                      }
                    }
                  }}
                  className="px-4 py-2 bg-[#e67e22] text-white rounded-md hover:bg-[#d35400]"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
        {isSwapModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-[#663300]">
                  Request Schedule Swap
                </h2>
              </div>

              <div className="p-6">
                {/* Reason Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#663300] mb-2">
                    Reason for swap request{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="Please explain why you need to swap this schedule..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e67e22] focus:border-transparent"
                    required
                  />
                </div>

                {/* Schedule Selection */}
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  <h3 className="text-sm font-medium text-[#663300] mb-2">
                    Select a schedule to swap with:
                  </h3>
                  {availableForSwap.length === 0 ? (
                    <p className="text-gray-600">
                      No available schedules found
                    </p>
                  ) : (
                    availableForSwap.map((schedule) => (
                      <div
                        key={schedule._id}
                        onClick={() => setSelectedSwapTargetId(schedule._id)}
                        className={`cursor-pointer p-4 rounded border ${
                          selectedSwapTargetId === schedule._id
                            ? "border-[#e67e22] bg-[#fff6ed]"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="space-y-2 text-[#663300]">
                          <p className="flex items-center">
                            <Calendar
                              size={16}
                              className="mr-2 text-[#e67e22]"
                            />
                            {formatDate(schedule.work_Date)}
                          </p>
                          <p className="flex items-center">
                            <Clock size={16} className="mr-2 text-[#e67e22]" />
                            {formatTime(schedule.start_time)} -{" "}
                            {formatTime(schedule.end_time)}
                          </p>
                          <p className="flex items-center">
                            <Home size={16} className="mr-2 text-[#e67e22]" />
                            {schedule.clinicId?.name || "No store"}
                          </p>
                          <p className="flex items-center">
                            <User size={16} className="mr-2 text-[#e67e22]" />
                            {schedule.doctorId?.fullName || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsSwapModalOpen(false);
                    setSwapReason("");
                    setSelectedSwapTargetId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedMySchedule || !selectedSwapTargetId) {
                      toast.error("Please select a schedule to swap with");
                      return;
                    }
                    if (!swapReason.trim()) {
                      toast.error(
                        "Please provide a reason for the swap request"
                      );
                      return;
                    }
                    try {
                      const res =
                        await workScheduleTransferAPI.createTransferRequest(
                          selectedMySchedule._id,
                          selectedSwapTargetId,
                          swapReason.trim()
                        );
                      if (res.data.success) {
                        toast.success("Swap request sent successfully!");
                        setIsSwapModalOpen(false);
                        setSwapReason("");
                        setSelectedSwapTargetId(null);
                        fetchSchedules(); // refresh schedule view
                      } else {
                        toast.error(
                          res.data.message || "Failed to request swap."
                        );
                      }
                    } catch (err) {
                      toast.error("Error sending swap request.");
                      console.log("Error sending swap request:", err);
                    }
                  }}
                  disabled={!selectedSwapTargetId || !swapReason.trim()}
                  className="px-4 py-2 bg-[#e67e22] text-white rounded-md hover:bg-[#d35400] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Swap
                </button>
              </div>
            </div>
          </div>
        )}
        {showNotification && newRequestsCount > 0 && (
          <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce">
            <div className="bg-blue-600 rounded-full p-1">
              <Calendar size={16} />
            </div>
            <div>
              <p className="font-medium">New Schedule Swap Request!</p>
              <p className="text-sm opacity-90">
                You have {newRequestsCount} pending request
                {newRequestsCount > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setShowNotification(false);
                setTab("swap"); // Chuyển đến tab swap requests
              }}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
            >
              View
            </button>
            <button
              onClick={() => setShowNotification(false)}
              className="hover:bg-blue-600 p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <footer className="mt-auto bg-[#fff5eb] border-t border-amber-100">
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default WorkSchedulesDoctor;
