import React, { useState } from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PersonalContent = () => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user")) || {
    username: "User's Name",
    email: "user123@gmail.com",
    avatar: null,
  };

  const [name, setName] = useState(storedUser.username);
  const [email] = useState(storedUser.email);
  const [avatar, setAvatar] = useState(storedUser.avatar);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Avatars from public/icons folder
  const avatars = [
    "/icons/icon1.png",
    "/icons/icon2.png",
    "/icons/icon3.png",
    "/icons/icon4.png",
    "/icons/icon5.png",
    "/icons/icon6.png",
    "/icons/icon7.png",
  ];

  const handleSaveClick = () => setShowSaveModal(true);

  const handleConfirmSave = () => {
    setShowSaveModal(false);

    const updatedUser = {
      ...storedUser,
      username: name,
      email: email,
      avatar: avatar,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    console.log("Information saved:", updatedUser);
    navigate("/settings");
  };

  const handleCancelSave = () => setShowSaveModal(false);

  const handleDiscardClick = () => setShowDiscardModal(true);

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setName(storedUser.username);
    setAvatar(storedUser.avatar);
    console.log("Changes discarded.");
    navigate("/settings");
  };

  const handleCancelDiscard = () => setShowDiscardModal(false);

  const handleChooseAvatar = (selected) => {
    setAvatar(selected);
    setShowAvatarModal(false);
  };

  return (
    <>
      <div className="bg-base-200 rounded-2xl shadow-xl p-8 max-w-full mx-auto mt-2 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="avatar">
            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={avatar || "/icons/icon1.png"} alt="User Avatar" />
            </div>
          </div>
          <button
            className="btn btn-outline btn-primary btn-sm"
            onClick={() => setShowAvatarModal(true)}
          >
            Choose Avatar
          </button>
        </div>

        {/* Username */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Username</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Gmail (disabled) */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Gmail</span>
          </label>
          <input
            type="email"
            className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
            value={email}
            disabled
          />
        </div>

        {/* Save / Discard */}
        <div className="pt-4 space-y-2">
          <button
            className="btn btn-success gap-2 w-full justify-center"
            onClick={handleSaveClick}
          >
            <Save size={18} /> Save
          </button>
          <button
            className="btn btn-outline btn-error gap-2 w-full justify-center"
            onClick={handleDiscardClick}
          >
            Discard Changes
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <dialog id="confirm_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Update</h3>
            <p className="py-4">Are you sure you want to save the changes?</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelSave}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleConfirmSave}>
                Confirm
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Discard Modal */}
      {showDiscardModal && (
        <dialog id="discard_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Discard Changes</h3>
            <p className="py-4">
              Are you sure you want to discard all changes?
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelDiscard}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleConfirmDiscard}>
                Discard Changes
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <dialog id="avatar_modal" className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((a, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer avatar"
                  onClick={() => handleChooseAvatar(a)}
                >
                  <div className="w-20 rounded-full ring hover:ring-primary">
                    <img src={a} alt={`Avatar ${idx + 1}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowAvatarModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default PersonalContent;
