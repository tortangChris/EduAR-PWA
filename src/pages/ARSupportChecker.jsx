import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";

const statusConfig = {
  supported: {
    title: "AR is Supported",
    message: "This device is ready for immersive AR experiences.",
    classes: "bg-green-50 border-green-200 text-green-800",
  },
  unsupported: {
    title: "AR is Not Supported",
    message: "This browser or device does not support WebXR.",
    classes: "bg-red-50 border-red-200 text-red-800",
  },
  error: {
    title: "Error Checking Support",
    message: "An error occurred while checking for AR compatibility.",
    classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  checking: {
    title: "Checking AR Compatibility...",
    message: "Please wait a moment.",
    classes: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

const ARSupportChecker = () => {
  const [supportStatus, setSupportStatus] = useState("checking");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const checkARSupport = async () => {
      if (!navigator.xr) {
        setSupportStatus("unsupported");
        return;
      }
      try {
        const isSupported = await navigator.xr.isSessionSupported(
          "immersive-ar"
        );
        setSupportStatus(isSupported ? "supported" : "unsupported");
      } catch (error) {
        console.error("Error checking for AR support:", error);
        setSupportStatus("error");
      }
    };

    checkARSupport();
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentStatus = statusConfig[supportStatus] || statusConfig.checking;
  const { title, message, classes } = currentStatus;

  const baseContainerClasses =
    "flex items-center justify-between p-3 border rounded-lg shadow-sm transition-colors duration-300";

  return (
    <div className={`${baseContainerClasses} ${classes}`}>
      <h3 className="font-semibold text-base">{title}</h3>

      {/* Info icon on the right side */}
      <div className="relative" ref={tooltipRef}>
        <button
          type="button"
          onClick={() => setTooltipOpen(!tooltipOpen)}
          className="cursor-pointer"
        >
          <Info size={18} />
        </button>

        {/* Tooltip */}
        <div
          className={`
            absolute right-0 mt-2 w-56 p-2 text-xs text-white 
            bg-gray-800 rounded-md shadow-lg transition-opacity z-10
            ${tooltipOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default ARSupportChecker;
