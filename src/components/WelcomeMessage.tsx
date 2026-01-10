import logo from "@assets/logo.jpg";
import { useSelector } from "react-redux";

const WelcomeMessage = () => {
  const userRole = useSelector(
    (state: any) => state.user?.role?.toLowerCase?.() || ""
  );
  let title = "👋 Welcome to PetWell Management!";
  let desc =
    "This is where you manage your pet system.\nPlease select an item from the menu on the left to get started.";
  if (userRole === "admin") {
    title = "👋 Welcome to the Admin Dashboard!";
    desc =
      "You have full access to manage users, clinics, and system settings.";
  } else if (userRole === "manager") {
    title = "👋 Welcome to the Manager Dashboard!";
    desc = "Manage services, staff, and clinic operations efficiently.";
  } else if (userRole === "doctor") {
    title = "👋 Welcome to the Doctor Dashboard!";
    desc = "View your appointments, work schedules, and patient information.";
  } else if (userRole === "staff") {
    title = "👋 Welcome to the Staff Dashboard!";
    desc = "Support clinic operations and assist customers as needed.";
  }
  return (
    <div className="w-full h-full min-h-[86vh] flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <img
        src={logo}
        alt="Cute pets welcome"
        className="w-48 h-48 rounded-full shadow-lg mb-8 object-cover"
      />
      <h2 className="text-4xl font-extrabold text-orange-400 mb-4 drop-shadow-md text-center w-full">
        {title}
      </h2>
      <p className="text-lg text-orange-400 text-center mb-6 whitespace-pre-line w-full px-0">
        {desc}
      </p>
    </div>
  );
};

export default WelcomeMessage;
