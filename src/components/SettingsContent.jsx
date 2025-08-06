import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SettingsContent = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/auth/login");
  };

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    localStorage.removeItem("progress"); // Example: only reset module progress
    setIsResetModalOpen(false);
    console.log("Progress reset successfully.");
  };

  const handleCancelReset = () => {
    setIsResetModalOpen(false);
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

  return (
    <>
      <div className="bg-base-200 rounded-xl shadow-md overflow-y-auto p-4 space-y-4">
        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">Theme</h2>
          <div className="flex gap-4">
            <button className="btn btn-outline btn-sm">System</button>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            Privacy & Security
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>Change password</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">Help & Support</h2>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
            <li>
              <a href="#" className="link link-hover">
                FAQs
              </a>
            </li>
            <li>
              <a href="#" className="link link-hover">
                Contact Support
              </a>
            </li>
            <li>
              <a href="#" className="link link-hover">
                Send Feedback
              </a>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="max-w-xs mx-auto mt-4 space-y-2">
          <button onClick={handleLogout} className="btn btn-error w-full">
            Logout
          </button>
          <button
            onClick={handleResetClick}
            className="btn btn-outline  btn-error w-full"
          >
            Reset Module Progress
          </button>
          <button
            onClick={handleDeleteClick}
            className="btn btn-outline btn-warning w-full"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {isResetModalOpen && (
        <dialog id="reset_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reset Module Progress</h3>
            <p className="py-4">
              Are you sure you want to reset your progress? This action cannot
              be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelReset}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleConfirmReset}>
                Confirm Reset
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <dialog id="delete_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">Delete Account</h3>
            <p className="py-4">
              Are you sure you want to permanently delete your account? This
              will log you out immediately and cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleConfirmDelete}>
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
