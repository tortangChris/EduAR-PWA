// CameraARTextPrototype.jsx
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

const WorldSpaceLabel = ({ text, detail, position = [0, 1.5, -3] }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    tRef.current += delta;

    // maliit na floating animation pero naka-stay sa isang world position
    const yBase = position[1];
    const floatY = yBase + Math.sin(tRef.current * 1.5) * 0.1;
    groupRef.current.position.set(position[0], floatY, position[2]);

    // always face camera (billboard effect)
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

const CameraARTextPrototype = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Requesting camera access…");

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setStatus("getUserMedia not supported in this browser.");
          return;
        }

        setStatus("Requesting camera permission…");

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStatus("Camera running.");
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setStatus(
          "Failed to access camera. Check permission settings or device."
        );
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
      {/* CAMERA VIDEO BACKGROUND */}
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
          zIndex: 0,
        }}
      />

      {/* THREE.JS CANVAS (3D text sa ibabaw ng camera) */}
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none", // para hindi ma-block ng canvas ang taps/scroll
        }}
        camera={{ position: [0, 1.6, 3], fov: 60 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={0.8} />

        {/* FIXED WORLD-SPACE 3D TEXT (naka-stay sa isang location) */}
        <WorldSpaceLabel
          text="Array Data Structure"
          detail={
            "World-space 3D label over camera.\nIt stays in front of you at a fixed position\nwhile the camera shows the real world."
          }
          position={[0, 1.5, -3]} // 🔒 naka-stay sa world position na 'to
        />

        {/* Optional: OrbitControls for desktop testing */}
        <OrbitControls enabled />
      </Canvas>

      {/* STATUS PILL */}
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
          zIndex: 2,
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
              background: status === "Camera running." ? "#22c55e" : "#f97316",
            }}
          />
          <span>{status}</span>
        </span>
      </div>
    </div>
  );
};

export default CameraARTextPrototype;
