import React, { useState } from "react";

const SettingsContent = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    localStorage.clear();
    setIsResetModalOpen(false);
    console.log("Progress reset successfully.");
  };

  const handleCancelReset = () => {
    setIsResetModalOpen(false);
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

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-3">
          <h2 className="text-lg font-semibold text-primary">Notifications</h2>
          <div className="form-control space-y-4">
            <label className="label cursor-pointer justify-between">
              <span className="label-text">Enable Email Notifications</span>
              <input type="checkbox" className="toggle toggle-primary" />
            </label>
            <br />
            <label className="label cursor-pointer justify-between">
              <span className="label-text">Enable Push Notifications</span>
              <input type="checkbox" className="toggle toggle-primary" />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            Privacy & Security
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>Change password</li>
            <li>Two-factor authentication</li>
            <li>Manage connected devices</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-neutral rounded-lg p-4 shadow space-y-2">
          <h2 className="text-lg font-semibold text-primary">Language</h2>
          <select className="select select-bordered w-full max-w-xs">
            <option>English</option>
            <option>Filipino</option>
          </select>
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

        <div className="max-w-xs mx-auto mt-4">
          <button onClick={handleResetClick} className="btn btn-error w-full">
            Reset Module Progress
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
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
    </>
  );
};

export default SettingsContent;
