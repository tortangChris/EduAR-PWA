// ARTextPrototype.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Start WebXR AR session (camera + tracking)
const startARSession = async (gl, setArStatus) => {
  try {
    if (!navigator.xr) {
      setArStatus("WebXR not available on this device/browser.");
      console.warn("WebXR not available.");
      return;
    }

    const supported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!supported) {
      setArStatus("Immersive AR not supported on this device.");
      console.warn("Immersive AR not supported.");
      return;
    }

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local-floor"],
    });

    gl.xr.setSession(session);
    setArStatus("AR session started – camera should be visible.");
  } catch (err) {
    console.error("AR session failed:", err);
    setArStatus("Failed to start AR session. Check permissions or support.");
  }
};

// World-space 3D label – stays at one position, floats a bit, always faces camera
const WorldSpaceLabel = ({ text, detail, position = [0, 1.5, -3] }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    tRef.current += delta;

    // Small up-down floating animation
    const yBase = position[1];
    const floatY = yBase + Math.sin(tRef.current * 1.5) * 0.1;
    groupRef.current.position.set(position[0], floatY, position[2]);

    // Always face the camera (billboard)
    const cam = state.camera;
    groupRef.current.lookAt(cam.position);
  });

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.4}
        color="#34D399"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        {text}
      </Text>

      {/* Detail (multi-line) */}
      <Text
        position={[0, -0.1, 0]}
        fontSize={0.2}
        color="#e5e7eb"
        anchorX="center"
        anchorY="top"
        maxWidth={3.2}
        textAlign="center"
      >
        {detail}
      </Text>
    </group>
  );
};

const ARTextPrototype = () => {
  const glRef = useRef(null);
  const [arStatus, setArStatus] = useState(
    "Tap 'Start AR' and allow camera permission."
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "black",
        overflow: "hidden",
      }}
    >
      {/* AR Canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 60 }}
        onCreated={({ gl }) => {
          glRef.current = gl;
          gl.xr.enabled = true; // enable XR, session will be attached after button click
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={0.8} />

        {/* World-space text – fixed in front of the user */}
        <WorldSpaceLabel
          text="Array Data Structure"
          detail={
            "This is a world-space 3D label.\nIt stays at one position in the AR world,\neven as you move your device around."
          }
          position={[0, 1.5, -3]} // 🔒 fixed world position
        />

        {/* Optional: allow orbit controls when NOT in AR (desktop debugging) */}
        <OrbitControls enabled />
      </Canvas>

      {/* Top status text */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.85)",
          color: "#e5e7eb",
          fontSize: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#22c55e",
            }}
          />
          <span>{arStatus}</span>
        </span>
      </div>

      {/* Start AR button – required user gesture for camera/AR permission */}
      <button
        onClick={() => {
          if (!glRef.current) {
            setArStatus("GL not ready yet.");
            return;
          }
          startARSession(glRef.current, setArStatus);
        }}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid rgba(148, 163, 184, 0.9)",
          background: "rgba(15, 23, 42, 0.95)",
          color: "#e5e7eb",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Start AR
      </button>
    </div>
  );
};

export default ARTextPrototype;
