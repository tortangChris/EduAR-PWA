import React, { useState, useEffect } from "react";
import { Lock, Unlock } from "lucide-react";

const ARButton = () => {
  const [isSupported, setIsSupported] = useState(null); // null = checking

  useEffect(() => {
    const checkARSupport = async () => {
      if (!navigator.xr) {
        setIsSupported(false);
        return;
      }
      try {
        const supported = await navigator.xr.isSessionSupported("immersive-ar");
        setIsSupported(supported);
      } catch (error) {
        console.error("Error checking AR support:", error);
        setIsSupported(false);
      }
    };

    checkARSupport();
  }, []);

  if (isSupported === null) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed font-medium"
      >
        <Lock size={18} />
        Checking...
      </button>
    );
  }

  return (
    <button
      disabled={!isSupported}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium shadow-sm transition 
        ${
          isSupported
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-600 cursor-not-allowed"
        }`}
    >
      {isSupported ? <Unlock size={18} /> : <Lock size={18} />}
      {isSupported ? "Start AR Experience" : "AR Not Supported"}
    </button>
  );
};

export default ARButton;
