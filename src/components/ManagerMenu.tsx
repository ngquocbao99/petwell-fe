import { NavLink, useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useSelector, useDispatch } from "react-redux";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../store/userSlice";

interface MenuItem {
  name: string;
  path: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    name: "Service Management",
    path: "services",
    roles: ["manager"],
  },
  {
    name: "Service Statistics",
    path: "service-statistics",
    roles: ["manager"],
  },
  {
    name: "Clinic Management",
    path: "clinic",
    roles: ["admin"],
  },
  {
    name: "Staff Management",
    path: "staffs",
    roles: ["manager"],
  },
  {
    name: "Doctor Management",
    path: "doctors",
    roles: ["manager"],
  },
  {
    name: "Manage Work Schedule",
    path: "work-schedule",
    roles: ["staff"],
  },
  {
    name: "Manage Doctor Requests",
    path: "manage-doctor-requests",
    roles: ["staff"],
  },

  {
    name: "All Clinics Revenue",
    path: "statistics/revenue/all-clinics",
    roles: ["admin"],
  },
  {
    name: "Clinic Revenue",
    path: "statistics/revenue/clinic",
    roles: ["manager"],
  },
  {
    name: "Appointment Statistics",
    path: "statistics/appointments/clinic",
    roles: ["manager"],
  },

  {
    name: "User Management",
    path: "user",
    roles: ["admin"],
  },
  {
    name: "Chat Customer",
    path: "doctor-chat",
    roles: ["doctor"],
  },
  {
    name: "Doctor Work Schedule",
    path: "workSchedulesDoctor",
    roles: ["doctor"],
  },
  {
    name: "Doctor Appointment",
    path: "doctorAppointment",
    roles: ["doctor"],
  },
  {
    name: "Manage Knowledge Post",
    path: "knowledge-admin",
    roles: ["admin"],
  },
];

const ManagerMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userRole = useSelector((state: any) => state.user?.role);

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole?.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("userId");
    dispatch(logout());
    // Clear any chat history if needed
    window.dispatchEvent(new Event("user-login"));
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-l-4 border-orange-500 shadow-sm"
                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-l-4 hover:border-orange-300"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
        {!userRole && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg border border-red-200">
            You don't have permission to access any menus
          </div>
        )}
        {userRole && filteredMenuItems.length === 0 && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg border border-red-200">
            No menu items available for your role: {userRole}
          </div>
        )}
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-orange-200 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 font-medium"
        >
          <LogoutIcon className="mr-2" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ManagerMenu;
