import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SettingsContent = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/auth/login");
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    localStorage.clear();
    setIsDeleteModalOpen(false);
    console.log("Account deleted successfully.");
    navigate("/auth/login");
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    handleLogout();
  };

  return (
    <>
      <div className="bg-base-200 rounded-xl shadow-md overflow-y-auto p-4 space-y-4">
        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">Theme</h2>
          <div className="flex gap-4">
            <button className="btn btn-sm w-full">System</button>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            Privacy & Security
          </h2>
          <button className="btn btn-sm w-full">Change Password</button>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">Help & Support</h2>
          <button className="btn btn-sm w-full">FAQs</button>
          <button className="btn btn-sm w-full">Contact Support</button>
          <button className="btn btn-sm w-full">Send Feedback</button>
        </div>

        {/* Buttons */}
        <div className="max-w-xs mx-auto mt-4 space-y-2">
          <button onClick={handleLogoutClick} className="btn btn-error w-full">
            Logout
          </button>
          <button
            onClick={handleDeleteClick}
            className="btn btn-outline btn-warning w-full"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <dialog id="logout_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">Logout</h3>
            <p className="py-4">Are you sure you want to log out?</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleConfirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <dialog id="delete_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-warning">Delete Account</h3>
            <p className="py-4">
              Are you sure you want to permanently delete your account? This
              will log you out immediately and cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelDelete}>
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
