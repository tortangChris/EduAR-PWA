import React, { useState, useEffect } from "react";
import { Lock, Unlock } from "lucide-react";
import { ARButton as ThreeARButton } from "three/examples/jsm/webxr/ARButton";
import ARPage1 from "./ARPage1";

const ARButton = () => {
  const [isSupported, setIsSupported] = useState(null);
  const [startAR, setStartAR] = useState(false);
  const [xrSession, setXRSession] = useState(null);

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

  useEffect(() => {
    if (startAR && isSupported) {
      const startThreeAR = async () => {
        try {
          // Start an immersive AR session manually
          const session = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["hit-test", "dom-overlay"],
            optionalFeatures: [],
            domOverlay: { root: document.body },
          });
          setXRSession(session);

          session.addEventListener("end", () => {
            setStartAR(false); // return to button after AR exits
            setXRSession(null);
          });

          // Use Three.js ARButton logic to enter AR context
          const arButton = ThreeARButton.createButton({ xrSession: session });
          document.body.appendChild(arButton);
        } catch (error) {
          console.error("Error starting AR session:", error);
          setStartAR(false);
        }
      };

      startThreeAR();
    }
  }, [startAR, isSupported]);

  // If AR is active, render the AR page
  if (startAR) {
    return <ARPage1 />;
  }

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
      onClick={() => setStartAR(true)}
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
