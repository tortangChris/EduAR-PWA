import React from "react";
// import SettingsPersonalNav from "../components/SettingsPersonalNav";
import SettingsContent from "../components/SettingsContent";
import BottomNav from "../components/BottomNav";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center gap-4 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <SettingsIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="text-sm text-gray-500">Manage your preferences</p>
          </div>
        </div>
      </div>

      {/* <SettingsPersonalNav /> */}
      <SettingsContent />

      <BottomNav />
    </div>
  );
};

export default Settings;
