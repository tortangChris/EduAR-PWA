import { NavLink } from "react-router-dom";
import { Home, BookOpen, Settings, ScanIcon } from "lucide-react";

const BottomNav = () => {
  const navItems = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/modules", label: "Modules", icon: BookOpen },
    { to: "/arDetection", label: "Scan Object", icon: ScanIcon },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-base-100 border-t border-base-300 z-50 flex items-center justify-between py-2 px-4 shadow-xl rounded-3xl">
      <div className="flex-1 flex justify-around items-center">
        {navItems.map(({ to, label, icon: Icon }, index) => (
          <NavLink
            key={index}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                isActive ? "text-primary font-semibold" : "text-gray-500"
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
