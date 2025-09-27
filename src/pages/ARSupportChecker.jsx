import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";

const statusConfig = {
  supported: {
    short: "AR Supported: Ready for immersive AR experiences.",
    dot: "bg-green-500",
  },
  unsupported: {
    short: "AR Not Supported: Unavailable access AR experiences.",
    dot: "bg-red-500",
  },
  error: {
    short:
      "Error Checking: An error occurred while checking for AR compatibility.",
    dot: "bg-yellow-500",
  },
  checking: {
    short: "Checking... Please wait a moment.",
    dot: "bg-gray-400",
  },
};

const ARSupportChecker = () => {
  const [supportStatus, setSupportStatus] = useState("checking");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        if (!navigator.xr) {
          setSupportStatus("unsupported");
          setTooltipOpen(true);
          return;
        }

        const isSupported = await navigator.xr.isSessionSupported(
          "immersive-ar"
        );

        // Extra check: camera access for more reliable detection
        let hasCamera = false;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          hasCamera = true;
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          hasCamera = false;
        }

        if (isSupported && hasCamera) {
          setSupportStatus("supported");
        } else {
          setSupportStatus("unsupported");
          setTooltipOpen(true);
        }
      } catch (error) {
        console.error("Error checking for AR support:", error);
        setSupportStatus("error");
        setTooltipOpen(true);
      }
    };

    checkARSupport();
  }, []);

  // Close tooltip when clicking outside (support touch)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const currentStatus = statusConfig[supportStatus] || statusConfig.checking;

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Tooltip with Info */}
      <div className="relative" ref={tooltipRef}>
        <button
          type="button"
          onClick={() => setTooltipOpen(!tooltipOpen)}
          className="cursor-pointer hover:text-primary transition"
        >
          <Info size={16} />
        </button>

        {/* Tooltip */}
        <div
          className={`absolute right-0 mt-2 w-60 p-3 text-xs text-white 
            bg-gray-800 rounded-lg shadow-lg transition-all duration-200 z-10
            ${
              tooltipOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none"
            }
          `}
        >
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-8 rounded-full ${currentStatus.dot}`}
            ></span>
            <span>{currentStatus.short}</span>
          </div>

          <div className="mt-2 text-right">
            <button
              onClick={() => setTooltipOpen(false)}
              className="px-2 py-1 w-full text-xs bg-primary text-white rounded hover:bg-primary/80 transition"
            >
              OK
            </button>
          </div>

          {/* Tooltip arrow */}
          <div className="absolute -top-1.5 right-1 w-4 h-4 bg-gray-800 rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default ARSupportChecker;
