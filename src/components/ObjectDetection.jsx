// CameraARPrototype.jsx
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

const CameraARPrototype = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Requesting camera access...");
  const [error, setError] = useState(null);
  const [hasStream, setHasStream] = useState(false);

  // Ask for camera
  useEffect(() => {
    let currentStream = null;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("Camera API not available.");
        setError(
          "This browser does not support camera access via getUserMedia. Try Chrome or another modern browser."
        );
        return;
      }

      setStatus("Requesting camera permission...");

      try {
        // Prefer back camera on mobile (environment), fallback to user
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
        }

        setHasStream(true);
        setStatus("Camera running ✔️");
        setError(null);
      } catch (err) {
        console.error("Camera error:", err);
        setHasStream(false);

        if (err.name === "NotAllowedError") {
          setStatus("Camera permission denied.");
          setError(
            "You denied camera access. Please enable camera permission in your browser settings and reload this page."
          );
        } else if (err.name === "NotFoundError") {
          setStatus("No camera device found.");
          setError("No video input devices were detected on this device.");
        } else {
          setStatus("Unable to start camera.");
          setError(
            `Error: ${
              err.message || "Unknown error. Check HTTPS and permissions."
            }`
          );
        }
      }
    };

    startCamera();

    // Cleanup: stop all tracks on unmount
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* CAMERA VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#000",
        }}
      />

      {/* 3D OVERLAY */}
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none", // so user can still scroll/touch page if needed
        }}
        camera={{ position: [0, 0, 4], fov: 50 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={0.8} />

        {/* Floating label in front of camera */}
        <FloatingLabel hasStream={hasStream} status={status} />

        {/* Simple spinning cube so you see 3D is alive */}
        <SpinningCube />

        <OrbitControls enabled={false} />
      </Canvas>

      {/* STATUS PILL */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.8)",
          color: "#e5e7eb",
          fontSize: "0.7rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: hasStream ? "#22c55e" : "#f97316",
          }}
        />
        <span>{status}</span>
      </div>

      {/* ERROR PANEL (if any) */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: 480,
            width: "calc(100% - 32px)",
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(127, 29, 29, 0.9)",
            border: "1px solid rgba(248, 113, 113, 0.8)",
            color: "#fee2e2",
            fontSize: "0.8rem",
            lineHeight: 1.35,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Camera Permission Issue
          </div>
          <div>{error}</div>
          <div style={{ marginTop: 6, fontSize: "0.7rem", opacity: 0.9 }}>
            Tips:
            <ul style={{ margin: "2px 0 0 16px", padding: 0 }}>
              <li>Make sure you are using HTTPS or localhost.</li>
              <li>Allow camera permission when prompted.</li>
              <li>
                If previously blocked, go to browser/site settings &gt; reset
                permissions.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// === Floating world-space 3D text ===
const FloatingLabel = ({ hasStream, status }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    tRef.current += delta;

    // small float
    const yBase = 0.6;
    groupRef.current.position.y = yBase + Math.sin(tRef.current * 1.5) * 0.1;

    // always face camera
    const cam = state.camera;
    groupRef.current.lookAt(cam.position);
  });

  const mainText = hasStream ? "Camera is running" : "Waiting for camera...";
  const detailText = hasStream
    ? "World-space 3D text overlay.\nMove your device and see text stay in front."
    : "Allow camera access in your browser.";

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      {/* Title */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.35}
        color={hasStream ? "#34D399" : "#f97316"}
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        textAlign="center"
      >
        {mainText}
      </Text>

      {/* Details */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.2}
        color="#e5e7eb"
        anchorX="center"
        anchorY="top"
        maxWidth={3.5}
        textAlign="center"
      >
        {detailText}
      </Text>
    </group>
  );
};

// === Simple spinning cube (just to see 3D works) ===
const SpinningCube = () => {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.6;
    ref.current.rotation.x += delta * 0.3;
  });

  return (
    <mesh ref={ref} position={[0, -0.6, -2]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#60a5fa" />
    </mesh>
  );
};

export default CameraARPrototype;
