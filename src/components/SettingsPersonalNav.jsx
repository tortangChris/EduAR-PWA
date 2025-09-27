import { UserCircle } from "lucide-react";
import { ChevronRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const SettingsPersonalNav = () => {
  const navigate = useNavigate();

  // Fetch user from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const username = user?.username || "Guest";
  const email = user?.email || "No email";
  const profileImage = user?.avatar || null; // <- updated to match PersonalContent

  const handleNavigate = () => {
    navigate("/personal");
  };

  return (
    <div
      onClick={handleNavigate}
      className="bg-base-200 rounded-2xl shadow-md p-5 flex justify-between items-center w-full cursor-pointer hover:bg-base-300 hover:shadow-lg transition-all"
    >
      {/* Left section: avatar + user info */}
      <div className="flex items-center gap-4">
        {/* Outer border circle */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary/40">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-7 h-7 text-primary" />
            )}
          </div>
        </div>

        {/* Username + Email */}
        <div>
          <h2 className="text-lg font-semibold">{username}</h2>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      {/* Right chevron */}
      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
    </div>
  );
};

export default SettingsPersonalNav;
