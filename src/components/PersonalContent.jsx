import React, { useRef, useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PersonalContent = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {
    username: "User's Name",
    email: "user123@gmail.com",
    image: null,
  };

  const [name, setName] = useState(storedUser.username);
  const [email, setEmail] = useState(storedUser.email);
  const [image, setImage] = useState(storedUser.image || null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);

    const updatedUser = {
      ...storedUser,
      username: name,
      email: email,
      image: image,
    };

    // Save to localStorage (para gumana sa login at settings)
    localStorage.setItem("user", JSON.stringify(updatedUser));

    console.log("Information saved:", updatedUser);
    navigate("/settings");
  };

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const handleDiscardClick = () => {
    setShowDiscardModal(true);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    // Reset to last saved state
    setName(storedUser.username);
    setEmail(storedUser.email);
    setImage(storedUser.image || null);
    console.log("Changes discarded.");
    navigate("/settings");
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setImage(imgUrl);
    }
  };

  return (
    <>
      <div className="bg-base-200 rounded-2xl shadow-xl p-8 max-w-full mx-auto mt-10 space-y-6">
        <div className="flex justify-center">
          <div className="avatar cursor-pointer" onClick={handleImageClick}>
            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={
                  image || "https://via.placeholder.com/150?text=Upload+Image"
                }
                alt="User"
              />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

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
    </>
  );
};

export default PersonalContent;
