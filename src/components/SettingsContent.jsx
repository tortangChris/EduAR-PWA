import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsPersonalNav from "./SettingsPersonalNav";
import { Palette, Shield, HelpCircle, LogOut, Trash2 } from "lucide-react";

const SettingsContent = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/auth/login");
  };

  const handleConfirmDelete = () => {
    localStorage.clear();
    setIsDeleteModalOpen(false);
    navigate("/auth/login");
  };

  return (
    <>
      <div className="bg-base-200 rounded-2xl shadow-md overflow-y-auto p-4 space-y-4">
        {/* Profile card */}
        <SettingsPersonalNav />

        {/* Theme */}
        <div className="bg-base-100 rounded-xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Palette className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Theme</h2>
          </div>
          <button className="btn btn-sm w-full">System</button>
        </div>

        {/* Privacy & Security */}
        <div className="bg-base-100 rounded-xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
          </div>
          <button className="btn btn-sm w-full">Change Password</button>
        </div>

        {/* Help & Support */}
        <div className="bg-base-100 rounded-xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <HelpCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Help & Support</h2>
          </div>
          <button className="btn btn-sm w-full">FAQs</button>
          <button className="btn btn-sm w-full">Contact Support</button>
          <button className="btn btn-sm w-full">Send Feedback</button>
        </div>

        {/* Danger zone */}
        <div className="space-y-2 pt-2 border-t border-base-300">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="btn btn-error w-full flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="btn btn-outline btn-warning w-full flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <dialog id="logout_modal" className="modal modal-open">
          <div className="modal-box border-t-4 border-error">
            <h3 className="font-bold text-lg text-error flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Logout
            </h3>
            <p className="py-4">Are you sure you want to log out?</p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <dialog id="delete_modal" className="modal modal-open">
          <div className="modal-box border-t-4 border-warning">
            <h3 className="font-bold text-lg text-warning flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Account
            </h3>
            <p className="py-4">
              Are you sure you want to permanently delete your account? <br />
              This cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-warning" onClick={handleConfirmDelete}>
                Delete Account
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default SettingsContent;
