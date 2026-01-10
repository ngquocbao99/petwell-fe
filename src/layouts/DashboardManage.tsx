import { Box, Container, Paper } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import ManagerMenu from "@components/ManagerMenu";
import AccountMenu from "@components/AccountMenu";

const DashboardManager = () => {
  const userRole = useSelector(
    (state: any) => state.user?.role?.toLowerCase?.() || ""
  );

  // Redirect unauthorized users
  if (!userRole || userRole === 'customer') {
    return <Navigate to="/" replace />;
  }

  let headerTitle = "PetWell Management";
  if (userRole === "admin") headerTitle = "Dashboard Admin";
  else if (userRole === "manager") headerTitle = "Dashboard Manager";
  else if (userRole === "doctor") headerTitle = "Dashboard Doctor";
  else if (userRole === "staff") headerTitle = "Dashboard Staff";

  return (
    <section className="bg-orange-50 min-h-screen flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{ style: { zIndex: 14001 } }}
      />
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">{headerTitle}</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Left Menu */}
        <div className="fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-white border-r border-orange-200 shadow-sm z-40 flex flex-col">
          <ManagerMenu />
        </div>

        {/* Right Content */}
        <div className="flex-1 lg:ml-64">
          <div className="bg-white w-full min-h-[75vh] rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardManager;
