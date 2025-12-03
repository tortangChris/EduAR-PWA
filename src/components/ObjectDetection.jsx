// ARTextPrototype.jsx
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text as DreiText, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ✅ Start WebXR AR session (camera + world-space)
const startARSession = (gl, setStatus) => {
  if (!("xr" in navigator)) {
    setStatus("WebXR not supported on this device/browser.");
    console.warn("WebXR not supported.");
    return;
  }

  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    if (!supported) {
      setStatus("AR session not supported (immersive-ar).");
      console.warn("immersive-ar not supported.");
      return;
    }

    setStatus("Requesting camera permission for AR...");
    navigator.xr
      .requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local-floor"],
      })
      .then((session) => {
        setStatus("AR session started · Move your phone around.");
        gl.xr.setSession(session);

        session.addEventListener("end", () => {
          setStatus("AR session ended.");
        });
      })
      .catch((err) => {
        console.error("AR session failed:", err);
        setStatus("Failed to start AR session. Check permissions / HTTPS.");
      });
  });
};

// ✅ Simple floating 3D text, FIXED in world-space
const WorldSpaceLabel = ({ title, detail }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    tRef.current += delta;

    // maliit lang na breathing animation sa Y & scale
    const floatY = Math.sin(tRef.current * 1.5) * 0.05;
    const scale = 1 + Math.sin(tRef.current * 0.8) * 0.03;

    if (groupRef.current) {
      // ⚠️ Position is fixed in world coordinates.
      // Only adding very small visual animation, hindi lumilipat sa ibang lugar.
      groupRef.current.position.set(0, 1.5 + floatY, -3);
      groupRef.current.scale.set(scale, scale, scale);

      // optional: always face the user
      const cam = state.camera;
      groupRef.current.lookAt(cam.position);
    }
  });

  const textDetail =
    detail ||
    "This text is anchored in AR world space. Walk around and see it stay in the same spot.";

  return (
    <group ref={groupRef}>
      {/* Title */}
      <DreiText
        position={[0, 0.3, 0]}
        fontSize={0.4}
        color="#facc15"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        {title}
      </DreiText>

      {/* Detail */}
      <DreiText
        position={[0, -0.2, 0]}
        fontSize={0.2}
        color="#e5e7eb"
        anchorX="center"
        anchorY="top"
        maxWidth={3.5}
        textAlign="center"
      >
        {textDetail}
      </DreiText>
    </group>
  );
};

const ARTextPrototype = () => {
  const [status, setStatus] = useState("Initializing AR…");

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "black",
      }}
    >
      {/* Status pill like your reference */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.84)",
          color: "#e5e7eb",
          fontSize: "0.7rem",
          maxWidth: "70%",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "999px",
            background:
              status.includes("Failed") || status.includes("not")
                ? "#ef4444"
                : "#22c55e",
          }}
        />
        <span>AR Text Prototype · {status}</span>
      </div>

      {/* AR Canvas */}
      <Canvas
        style={{
          width: "100%",
          height: "100%",
        }}
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          // 🔥 Start AR session & camera permission
          startARSession(gl, setStatus);
        }}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={0.7} />

        {/* World-space 3D label (fixed location) */}
        <WorldSpaceLabel
          title="DSA Concept (Prototype)"
          detail="Move your device around. This label should stay in the same world-space spot, like a floating sign in your room."
        />

        {/* OrbitControls only useful in non-AR fallback */}
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  );
};

export default ARTextPrototype;
