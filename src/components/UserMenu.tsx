import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "PERSONAL INFORMATION", path: "profile" },
  // { name: "Pet information", path: "pets" },
  { name: "Appointment", path: "appointment" },
  { name: "My Pet", path: "view-pet-customer" },
  { name: "Medical Records", path: "medical-records" },
];
const UserMenu = () => {
  return (
    <div className="p-4 space-y-2">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `block px-4 py-2 rounded font-medium whitespace-nowrap ${
              isActive
                ? "bg-orange-100 text-orange-600"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
    </div>
  );
};

export default UserMenu;
