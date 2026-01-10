// Prefer env override; auto-use localhost in dev, production URL otherwise
const PROD_BASE = "https://petwell-be.onrender.com";
const LOCAL_BASE = "http://localhost:5000";
export const baseURL =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? LOCAL_BASE
    : PROD_BASE);

const SummaryApi = {
  baseUrl: baseURL,
  register: {
    url: "/api/v1/auth/register",
    method: "post",
  },
  login: {
    url: "/api/v1/auth/login",
    method: "post",
  },
  refreshToken: {
    url: "/api/v1/auth/refresh-token",
    method: "post",
  },
  uploadImage: {
    url: "/api/v1/upload",
    method: "post",
  },
  pets: {
    createPetCustomer: {
      url: "/api/v1/pets/create-pet-customer",
      method: "post",
    },
    getAllPetsCustomer: (id: string) => ({
      url: `/api/v1/pets/view-all-pet-customer/${id}`,
      method: "get",
    }),
    getPetById: {
      url: "/pet-detail",
      method: "get",
    },
    updatePetCustomer: (id: string) => ({
      url: `/api/v1/pets/update-pet-customer/${id}`,
      method: "put",
    }),
    deletePetCustomer: (id: string) => ({
      url: `/api/v1/pets/delete-pet/${id}`,
      method: "put",
    }),
  },

  verifyEmail: (token: string) => ({
    url: `/api/v1/auth/verify-email?token=${token}`,
    method: "get",
  }),
  forgotPassword: {
    url: "/api/v1/auth/forgot-password",
    method: "post",
  },
  verifyOtpAndResetPassword: {
    url: "/api/v1/auth/reset-password",
    method: "post",
  },
  googleLogin: {
    url: "/api/v1/auth/google-login",
    method: "post",
  },

  //Service API
  service: {
    list: {
      url: "/api/v1/services/view-all-service",
      method: "get",
    },
    listForManager: {
      url: "/api/v1/services/view-all-service-for-manager",
      method: "get",
    },
    detail: (id: string) => ({
      url: `/api/v1/services/view-service-details/${id}`,
      method: "get",
    }),
    create: {
      url: "/api/v1/services/create-service",
      method: "post",
    },
    update: (id: string) => ({
      url: `/api/v1/services/update-service/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/v1/services/delete-service/${id}`,
      method: "delete",
    }),
    getStatistics: {
      url: "/api/v1/satatistics/services",
      method: "post",
    },
  },
  clinic: {
    list: {
      url: "/api/v1/clinics/view-all-clinic",
      method: "get",
    },
    listAdmin: {
      url: "/api/v1/clinics/view-all-clinics-admin",
      method: "get",
    },
    detail: {
      url: "/api/v1/clinics/view-clinic-details",
      method: "get",
    },
    create: {
      url: "/api/v1/clinics/create-clinic",
      method: "post",
    },
    update: (clinicId: string) => ({
      url: `/api/v1/clinics/update-clinic/${clinicId}`,
      method: "put",
    }),
    delete: (clinicId: string) => ({
      url: `/api/v1/clinics/delete-clinic/${clinicId}`,
      method: "delete",
    }),
    unban: (clinicId: string) => ({
      url: `/api/v1/clinics/unban-clinic/${clinicId}`,
      method: "put",
    }),
    ban: (clinicId: string) => ({
      url: `/api/v1/clinics/ban-clinic/${clinicId}`,
      method: "put",
    }),
    // Doctor/Staff management
    availableDoctors: {
      url: "/api/v1/clinics/available-doctors",
      method: "get",
    },
    availableStaff: {
      url: "/api/v1/clinics/available-staff",
      method: "get",
    },
    addDoctor: (clinicId: string) => ({
      url: `/api/v1/clinics/${clinicId}/doctors`,
      method: "post",
    }),
    removeDoctor: (clinicId: string, doctorId: string) => ({
      url: `/api/v1/clinics/${clinicId}/doctors/${doctorId}`,
      method: "delete",
    }),
    addStaff: (clinicId: string) => ({
      url: `/api/v1/clinics/${clinicId}/staff`,
      method: "post",
    }),
    removeStaff: (clinicId: string, staffId: string) => ({
      url: `/api/v1/clinics/${clinicId}/staff/${staffId}`,
      method: "delete",
    }),
    // Debug endpoints
    debugAllDoctors: {
      url: "/api/v1/clinics/debug/all-doctors",
      method: "get",
    },
  },

  //Doctor API
  doctor: {
    list: {
      url: "/api/v1/doctors",
      method: "get",
    },
    detail: (id: string) => ({
      url: `/api/v1/doctors/${id}`,
      method: "get",
    }),
    create: {
      url: "/api/v1/doctors",
      method: "post",
    },
    update: (id: string) => ({
      url: `/api/v1/doctors/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/v1/doctors/${id}`,
      method: "delete",
    }),
    // Lấy danh sách bác sĩ theo ID phòng khám
    listByClinicId: (clinicId: string) => ({
      url: `/api/v1/doctors/get-by-clinic/${clinicId}`,
      method: "get",
    }),
  },

  getProfile: {
    url: "/api/v1/profiles/:id",
    method: "get",
  },
  updateProfile: (userId: string) => ({
    method: "PUT",
    url: `/api/v1/profiles/${userId}`,
  }),
  changePassword: (userId: string) => ({
    url: `/api/v1/profiles/change-password/${userId}`,
    method: "put",
  }),
  userDetails: (userId: string) => ({
    url: `/api/v1/profiles/${userId}`,
    method: "get",
  }),
  forumPost: {
    getById: (id: string) => ({
      url: `/api/v1/forum/view-detail-post/${id}`,
      method: "get",
    }),
    getAll: (page: number = 1, limit: number = 5) => ({
      url: `/api/v1/forum/view-forum-post?page=${page}&limit=${limit}`,
      method: "get",
    }),
    create: {
      url: "/api/v1/forum/create-post",
      method: "post",
    },
    update: (postId: string) => ({
      url: `/api/v1/forum/update-post/${postId}`,
      method: "put",
    }),
    delete: (postId: string) => ({
      url: `/api/v1/forum/delete-post/${postId}`,
      method: "delete",
    }),
    getStatistics: {
      url: "/api/v1/forum/statistics-forum",
      method: "get",
    },
    react: (postId: string) => ({
      url: `/api/v1/forum/reaction-post/${postId}`,
      method: "post",
    }),
    search: (q: string) => ({
      url: `/api/v1/forum/search-posts?q=${encodeURIComponent(q)}`,
      method: "get",
    }),
  },
  knowledgePost: {
    getAll: (page: number = 1, limit: number = 5) => ({
      url: `/api/v1/forum/view-knowledge-post?page=${page}&limit=${limit}`,
      method: "get",
    }),
    getById: (id: string) => ({
      url: `/api/v1/forum/view-detail-post/${id}`,
      method: "get",
    }),
  },
  comment: {
    getByPostId: (postId: string) => ({
      url: `/api/v1/comment/view-comments/${postId}`,
      method: "get",
    }),
    create: (postId: string) => ({
      url: `/api/v1/comment/create-comment/${postId}`,
      method: "post",
    }),
    react: (commentId: string) => ({
      url: `/api/v1/comment/reaction-comment/${commentId}`,
      method: "post",
    }),
    update: (commentId: string) => ({
      url: `/api/v1/comment/update-comment/${commentId}`,
      method: "put",
    }),
    delete: (commentId: string) => ({
      url: `/api/v1/comment/delete-comment/${commentId}`,
      method: "delete",
    }),
  },

  //Staff API
  staff: {
    list: {
      url: "/api/v1/staffs/view-all-staff",
      method: "get",
    },
    listByManager: {
      url: "/api/v1/staffs/view-all-staff-by-manager",
      method: "get",
    },
    detail: (id: string) => ({
      url: `/api/v1/staffs/view-staff/${id}`,
      method: "get",
    }),
    create: {
      url: "/api/v1/staffs/create-staff",
      method: "post",
    },
    update: (id: string) => ({
      url: `/api/v1/staffs/update-staff/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/v1/staffs/delete-staff/${id}`,
      method: "delete",
    }),
  },
  //Review API
  review: {
    getReviewByServiceId: (serviceId: string) => ({
      url: `/api/v1/reviews/view-review-by-services/${serviceId}`,
      method: "get",
    }),
    getReviewByAppointmentId: (appointmentId: string) => ({
      url: `/api/v1/reviews/view-review-by-appointment/${appointmentId}`,
      method: "get",
    }),
    create: {
      url: "/api/v1/reviews/create-review",
      method: "post",
    },
    update: (id: string) => ({
      url: `/api/v1/reviews/update-review/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/v1/reviews/delete-review/${id}`,
      method: "delete",
    }),
    like: (id: string) => ({
      url: `/api/v1/reviews/toggle-like-review/${id}`,
      method: "patch",
    }),
  },
  bookAppopintment: {
    url: "/api/v1/appointment/book-appointment",
    method: "post",
  },
  appointmentDetails: (appointmentId: string) => ({
    url: `/api/v1/appointment/view-appointment/${appointmentId}`,
    method: "get",
  }),
  getUserAppointments: (userId: string) => ({
    url: `/api/v1/appointment/user-appointments/${userId}`,
    method: "get",
  }),
  paymentAppointment: (appointmentId: string) => ({
    url: `/api/v1/payment/appointment/${appointmentId}`,
    method: "post",
  }),
  verifyPaymentWithVNPay: (params: URLSearchParams) => ({
    url: `/api/v1/payment/vnpay-return-appointment`,
    method: "get",
    params: params,
  }),

  // Prescription APIs
  prescription: {
    download: (appointmentId: string) => ({
      url: `/api/v1/appointment/prescription/download/${appointmentId}`,
      method: "get",
    }),
    add: (appointmentId: string) => ({
      url: `/api/v1/appointment/prescription/add/${appointmentId}`,
      method: "post",
    }),
    getByCustomer: (customerId: string) => ({
      url: `/api/v1/appointment/prescriptions/customer/${customerId}`,
      method: "get",
    }),
  },

  schedules: {
    getAll: {
      url: "/api/v1/doctor-work-schedules/getall",
      method: "get",
    },
    create: {
      url: "/api/v1/doctor-work-schedules/create-schedule",
      method: "post",
    },
    update: (id: string) => ({
      url: `/api/v1/doctor-work-schedules/update-schedule/${id}`,
      method: "put",
    }),
    delete: (id: string) => ({
      url: `/api/v1/doctor-work-schedules/delete-schedule/${id}`,
      method: "delete",
    }),
    getAvailableScheduleDoctor: {
      url: "/api/v1/doctor-work-schedules/available-schedules",
      method: "get",
    },
    registerWord: {
      url: "/api/v1/doctor-work-schedules/register-schedule",
      method: "post",
    },
    getMyScheduleDoctor: {
      url: "/api/v1/doctor-work-schedules/my-schedule-doctor",
      method: "get",
    },
    getSwappableSchedules: (id: string) => ({
      url: `/api/v1/doctor-work-schedules/swappable-schedules/${id}`,
      method: "get",
    }),
  },
  workScheduleTransfer: {
    create: {
      url: "/api/v1/doctor-schedule-transfer/create-transfer",
      method: "post",
    },
    getMine: {
      url: "/api/v1/doctor-schedule-transfer/my-transfer",
      method: "get",
    },
    accept: (id: string) => ({
      url: `/api/v1/doctor-schedule-transfer/${id}/accept-transfer`,
      method: "put",
    }),
    reject: (id: string) => ({
      url: `/api/v1/doctor-schedule-transfer/${id}/reject-transfer`,
      method: "put",
    }),
  },

  // Staff Approval API
  staffApproval: {
    getPending: {
      url: "/api/v1/staff-approval-requests/pending",
      method: "get",
    },
    getProcessed: {
      url: "/api/v1/staff-approval-requests/processed",
      method: "get",
    },
    approve: (requestId: string) => ({
      url: `/api/v1/staff-approval-requests/${requestId}/approve`,
      method: "put",
    }),
    reject: (requestId: string) => ({
      url: `/api/v1/staff-approval-requests/${requestId}/reject`,
      method: "put",
    }),
  },

  // Thống kê doanh thu và cuộc hẹn
  statistics: {
    // Các API thống kê doanh thu all clinics
    getAllClinicsRevenueByMonth: (year: number, month: number) => ({
      url: `/api/v1/statistics/revenue/all-clinics/by-month?year=${year}&month=${month}`,
      method: "get",
    }),
    getAllClinicsRevenueLast7Days: () => ({
      url: `/api/v1/statistics/revenue/all-clinics/last-7-days`,
      method: "get",
    }),
    // Các API thống kê cho clinic cụ thể
    getClinicRevenueByYear: (clinicId: string, year: number) => ({
      url: `/api/v1/statistics/revenue/clinic/${clinicId}/by-year?year=${year}`,
      method: "get",
    }),
    getClinicRevenueByMonth: (
      clinicId: string,
      year: number,
      month: number
    ) => ({
      url: `/api/v1/statistics/revenue/clinic/${clinicId}/by-month?year=${year}&month=${month}`,
      method: "get",
    }),
    getAppointmentStatusByMonth: (
      clinicId: string,
      year: number,
      month: number
    ) => ({
      url: `/api/v1/statistics/appointments/clinic/${clinicId}/by-month?year=${year}&month=${month}`,
      method: "get",
    }),
    getDoctorAppointmentStatusByMonth: (
      clinicId: string,
      doctorId: string,
      year: number,
      month: number
    ) => ({
      url: `/api/v1/statistics/appointments/clinic/${clinicId}/doctor/${doctorId}/by-month?year=${year}&month=${month}`,
      method: "get",
    }),
  },

  user: {
    getAllUsers: {
      url: "/api/v1/users/get-all-users",
      method: "get",
    },
    blockUnblockUser: {
      url: "/api/v1/users/block/:userId/unblock",
      method: "PATCH",
    },
    createUserAccount: {
      url: "/api/v1/users/create-user-account",
      method: "post",
    },
    deleteUser: (id: string) => ({
      url: `/api/v1/users/delete-user/${id}`,
      method: "delete",
    }),
    updateUser: (id: string) => ({
      url: `/api/v1/users/update-profile/${id}`,
      method: "put",
    }),
  },
  DoctorAppointment: {
    getAll: {
      url: "/api/v1/doctor-appointments/available",
      method: "get",
    },
    getById: (id: string) => ({
      url: `/api/v1/doctor-appointments/${id}`,
      method: "get",
    }),
    accept: (id: string) => ({
      url: `/api/v1/doctor-appointments/accept/${id}`,
      method: "post",
    }),
  },

  prescriptions: {
    create: {
      url: "/api/v1/prescriptions",
      method: "post",
    },
    getAll: {
      url: "/api/v1/prescriptions",
      method: "get",
    },
    getUserPrescriptions: {
      url: "/api/v1/prescriptions/user",
      method: "get",
    },
    getTestPrescriptions: {
      url: "/api/v1/prescriptions/test",
      method: "get",
    },
    getByAppointment: (appointmentId: string) => ({
      url: `/api/v1/prescriptions/appointment/${appointmentId}`,
      method: "get",
    }),

    getByCustomer: (customerId: string) => ({
      url: `/api/v1/prescriptions/customer/${customerId}`,
      method: "get",
    }),
    update: (prescriptionId: string) => ({
      url: `/api/v1/prescriptions/${prescriptionId}`,
      method: "put",
    }),
    download: (prescriptionId: string) => ({
      url: `/api/v1/prescriptions/${prescriptionId}/download`,
      method: "get",
      responseType: "blob",
    }),
    delete: (prescriptionId: string) => ({
      url: `/api/v1/prescriptions/${prescriptionId}`,
      method: "delete",
    }),
    createSamples: {
      url: "/api/v1/prescriptions/sample",
      method: "post",
    },
    createTest: {
      url: "/api/v1/prescriptions/create-test",
      method: "post",
    },
    getAllTest: {
      url: "/api/v1/prescriptions/test",
      method: "get",
    },

    submitDiagnosis: (appointmentId: string) => ({
      url: `/api/v1/appointment/submit-diagnosis/${appointmentId}`,
      method: "post",
    }),
  },
  chat: {
    getUserConversations: (userId: string) => ({
      url: `/api/v1/chat/user/${userId}/conversations`,
      method: "get",
    }),
  },
};

// Export individual endpoints for easier access
export const getUserPrescriptions =
  SummaryApi.prescriptions.getUserPrescriptions;
export const getTestPrescriptions =
  SummaryApi.prescriptions.getTestPrescriptions;

export default SummaryApi;
