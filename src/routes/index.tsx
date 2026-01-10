import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import App from "../App";
import NotFound from "@pages/NotFound";

const Clinic = lazy(() => import("@pages/Clinic"));
const ManageClinic = lazy(() => import("@pages/ManageClinic"));
const ManageDoctor = lazy(() => import("@pages/ManageDoctor"));
const ClinicDetail = lazy(() => import("@pages/ClinicDetail"));
const CustomerChat = lazy(() => import("@pages/CustomerChat"));
const DoctorChatManagement = lazy(() => import("@pages/DoctorChatManagement"));
const ServiceStatistics = lazy(() => import("@pages/ServiceStatistics"));

import Dashboard from "@layouts/Dashboard";
import Pets from "@components/Pets";
import FormCreatePetForCustomer from "@components/FormCreatePetForCustomer";
import ViewAllPetsForCustomer from "@components/ViewAllPetsForCustomer";
import Service from "@pages/Service";
import ServiceDetails from "@pages/ServiceDetails";
import ServiceManage from "@pages/ManageService";
import StaffManage from "@pages/ManageStaff";
import DashboardManager from "@layouts/DashboardManage";
import WelcomeMessage from "@components/WelcomeMessage";
import Profile from "@pages/Profile";

import Forum from "@pages/Forum";
import KnowledgeDetail from "@pages/KnowledgeDetail";
import ForumDetail from "@pages/ForumDetail";
import Appointment from "@pages/Appointment";
const Home = lazy(() => import("@pages/Home"));
const Login = lazy(() => import("@pages/Login"));
const Register = lazy(() => import("@pages/Register"));
const VerifyEmail = lazy(() => import("@pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@pages/ForgotPassword"));
const VerifyOtp = lazy(() => import("@pages/VerifyOTP"));
import ManageWorkSchedule from "../pages/ManageWorkSchedule";
import WorkSchedulesDoctor from "@pages/WorkSchedulesDoctor";
import ManageRevenueAllClinics from "@pages/ManageRevenueAllClinics";
import ManageRevenueClinic from "@pages/ManageRevenueClinic";
import AppointmentStatus from "@pages/AppointmentStatistics";
import Users from "@pages/Users";
import DoctorAppointment from "@pages/DoctorAppointment";
import ManageDoctorRequests from "@pages/ManageDoctorRequests";
const PaymentResult = lazy(() => import("@pages/PaymentResult"));
const BookAppointment = lazy(() => import("@pages/BookAppointment"));
import PetCardPage from "@pages/PetCardPage";

import MedicalRecord from "@pages/MedicalRecord";

import KnowledgeAdmin from "@pages/KnowledgeAdmin";
import Contact from "@pages/Contact";
// Role-based route protection component
const PrivateRoute = ({
  element,
  allowedRoles,
  guestOnly = false,
  customerOnly = false,
}: {
  element: React.ReactElement;
  allowedRoles?: string[];
  guestOnly?: boolean;
  customerOnly?: boolean;
}) => {
  const user = useSelector((state: any) => state.user);
  const isAuthenticated = !!user?.token;
  const userRole = user?.role?.toLowerCase() || "";

  // Guest-only routes (like home)
  if (guestOnly) {
    if (isAuthenticated && !["customer"].includes(userRole)) {
      return <Navigate to="/dashboard/manager" replace />;
    }
    return element;
  }

  // Customer-only routes
  if (customerOnly && userRole !== "customer") {
    return <Navigate to="/auth/login" replace />;
  }

  // Protected routes
  if (allowedRoles) {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
      if (userRole === "customer") {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/dashboard/manager" replace />;
    }
  }

  return element;
};

const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense
    fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }
  >
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <PrivateRoute element={withSuspense(Home)} guestOnly={true} />,
      },
      {
        path: "clinic",
        element: (
          <PrivateRoute element={withSuspense(Clinic)} guestOnly={true} />
        ),
      },
      {
        path: "clinic/manage",
        element: (
          <PrivateRoute
            element={withSuspense(ManageClinic)}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "clinic/:id",
        element: (
          <PrivateRoute element={withSuspense(ClinicDetail)} guestOnly={true} />
        ),
      },
      {
        path: "chat",
        element: (
          <PrivateRoute
            element={withSuspense(CustomerChat)}
            customerOnly={true}
          />
        ),
      },
      {
        path: "services",
        element: <PrivateRoute element={<Service />} guestOnly={true} />,
      },
      {
        path: "services/:id",
        element: <PrivateRoute element={<ServiceDetails />} guestOnly={true} />,
      },
      {
        path: "general",
        element: <PrivateRoute element={<Forum />} guestOnly={true} />,
      },
      {
        path: "general/knowledge/:id",
        element: (
          <PrivateRoute element={<KnowledgeDetail />} guestOnly={true} />
        ),
      },
      {
        path: "general/forum/:id",
        element: <PrivateRoute element={<ForumDetail />} guestOnly={true} />,
      },
      {
        path: "/contact",
        element: <PrivateRoute element={<Contact />} guestOnly={true} />,
      },
      {
        path: "dashboard",
        element: <PrivateRoute element={<Dashboard />} customerOnly={true} />,
        children: [
          {
            path: "profile",
            element: <PrivateRoute element={<Profile />} customerOnly={true} />,
          },
          {
            path: "pets",
            element: <PrivateRoute element={<Pets />} customerOnly={true} />,
          },
          {
            path: "pet-new",
            element: (
              <PrivateRoute
                element={<FormCreatePetForCustomer />}
                customerOnly={true}
              />
            ),
          },
          {
            path: "view-pet-customer",
            element: (
              <PrivateRoute
                element={<ViewAllPetsForCustomer />}
                customerOnly={true}
              />
            ),
          },
          {
            path: "appointment",
            element: (
              <PrivateRoute element={<Appointment />} customerOnly={true} />
            ),
          },
          {
            path: "medical-records",
            element: (
              <PrivateRoute element={<MedicalRecord />} customerOnly={true} />
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/auth/login",
    element: withSuspense(Login),
  },
  {
    path: "/auth/register",
    element: withSuspense(Register),
  },
  {
    path: "/auth/verify-email",
    element: withSuspense(VerifyEmail),
  },
  {
    path: "/auth/forgot-password",
    element: withSuspense(ForgotPassword),
  },
  {
    path: "/auth/verify-otp",
    element: withSuspense(VerifyOtp),
  },
  {
    path: "/payment/payment-result",
    element: (
      <PrivateRoute element={withSuspense(PaymentResult)} customerOnly={true} />
    ),
  },
  {
    path: "dashboard/manager",
    element: (
      <PrivateRoute
        element={<DashboardManager />}
        allowedRoles={["admin", "manager", "doctor", "staff"]}
      />
    ),
    children: [
      {
        index: true,
        element: <WelcomeMessage />,
      },
      {
        path: "services",
        element: (
          <PrivateRoute
            element={<ServiceManage />}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "service-statistics",
        element: (
          <PrivateRoute
            element={withSuspense(ServiceStatistics)}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "clinic",
        element: (
          <PrivateRoute
            element={<ManageClinic />}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "staffs",
        element: (
          <PrivateRoute
            element={<StaffManage />}
            allowedRoles={["admin", "manager", "staff"]}
          />
        ),
      },
      {
        path: "doctors",
        element: (
          <PrivateRoute
            element={withSuspense(ManageDoctor)}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "work-schedule",
        element: (
          <PrivateRoute
            element={<ManageWorkSchedule />}
            allowedRoles={["admin", "manager", "staff"]}
          />
        ),
      },
      {
        path: "manage-doctor-requests",
        element: (
          <PrivateRoute
            element={<ManageDoctorRequests />}
            allowedRoles={["staff"]}
          />
        ),
      },
      {
        path: "statistics/revenue/all-clinics",
        element: (
          <PrivateRoute
            element={<ManageRevenueAllClinics />}
            allowedRoles={["admin"]}
          />
        ),
      },
      {
        path: "statistics/revenue/clinic",
        element: (
          <PrivateRoute
            element={<ManageRevenueClinic />}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "statistics/appointments/clinic",
        element: (
          <PrivateRoute
            element={<AppointmentStatus />}
            allowedRoles={["admin", "manager"]}
          />
        ),
      },
      {
        path: "user",
        element: <PrivateRoute element={<Users />} allowedRoles={["admin"]} />,
      },
      {
        path: "doctor-chat",
        element: (
          <PrivateRoute
            element={withSuspense(DoctorChatManagement)}
            allowedRoles={["doctor"]}
          />
        ),
      },
      {
        path: "workSchedulesDoctor",
        element: (
          <PrivateRoute
            element={<WorkSchedulesDoctor />}
            allowedRoles={["doctor", "staff"]}
          />
        ),
      },
      {
        path: "doctorAppointment",
        element: (
          <PrivateRoute
            element={<DoctorAppointment />}
            allowedRoles={["doctor"]}
          />
        ),
      },
      {
        path: "knowledge-admin",
        element: (
          <PrivateRoute element={<KnowledgeAdmin />} allowedRoles={["admin"]} />
        ),
      },
    ],
  },
  {
    path: "book-appointment",
    element: (
      <PrivateRoute
        element={withSuspense(BookAppointment)}
        customerOnly={true}
      />
    ),
  },
  {
    path: "/doctor",
    element: (
      <PrivateRoute element={<DashboardManager />} allowedRoles={["doctor"]} />
    ),
    children: [
      {
        path: "workSchedulesDoctor",
        element: (
          <PrivateRoute
            element={<WorkSchedulesDoctor />}
            allowedRoles={["doctor"]}
          />
        ),
      },
      {
        path: "doctorAppointment",
        element: (
          <PrivateRoute
            element={<DoctorAppointment />}
            allowedRoles={["doctor"]}
          />
        ),
      },
    ],
  },
  {
    path: "/pet-card/:petId",
    element: <PrivateRoute element={<PetCardPage />} customerOnly={true} />,
  },
]);

export default router;
