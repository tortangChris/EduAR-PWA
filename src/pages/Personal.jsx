import PersonalContent from "../components/PersonalContent";
import BottomNav from "../components/BottomNav";
import { User } from "lucide-react";
import React from "react";

const Personal = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const username = user?.username || "Guest";
  const profileImage = user?.avatar || null;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center gap-4 backdrop-blur-sm">
          {/* Avatar with outer border */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
              <User className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold">Personal Information</h2>
            {/* <p className="text-sm text-gray-500">{username}</p> */}
          </div>
        </div>
      </div>

      <div className="bg-base-200 rounded-2xl shadow-md p-6 max-w-3xl mx-auto">
        <PersonalContent />
      </div>

      <BottomNav />
    </div>
  );
};

export default Personal;
