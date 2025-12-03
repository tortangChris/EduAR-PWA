// ARLabelPrototype.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// --- optional: enable WebXR AR session (works on supported devices/browsers) ---
const startAR = (gl) => {
  if (navigator.xr) {
    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if (supported) {
        navigator.xr
          .requestSession("immersive-ar", {
            requiredFeatures: ["local-floor"],
          })
          .then((session) => {
            gl.xr.setSession(session);
          })
          .catch((err) => console.error("AR session failed:", err));
      } else {
        console.warn("AR not supported on this device.");
      }
    });
  }
};

// === Fade-in Text (world-space 3D text) ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.06, 1);
      scale.current = Math.min(scale.current + 0.06, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
      scale.current = 0.6;
    }

    if (ref.current && ref.current.material) {
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      material-transparent
      maxWidth={3.5}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Concept AR Label (same idea as gusto mo sa ObjectDetection) ===
const ConceptARLabel = ({ concept }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    tRef.current += delta;

    // small floating animation
    const yBase = 1.5;
    groupRef.current.position.y = yBase + Math.sin(tRef.current * 1.5) * 0.1;

    // always face camera
    const cam = state.camera;
    groupRef.current.lookAt(cam.position);
  });

  const textDetail =
    concept === "Array"
      ? "Array: row of slots in memory.\nEach element has an index (0, 1, 2, 3) for O(1) access."
      : concept === "Queue (FIFO)"
      ? "Queue: like people in line.\nFirst in → first out."
      : concept === "Stack (LIFO)"
      ? "Stack: like a pile of books.\nLast pushed → first popped."
      : concept === "Linked List"
      ? "Linked List: chain of nodes.\nEach node points to the next.\nLast → null."
      : "";

  return (
    <group ref={groupRef} position={[0, 1.5, -3]}>
      <FadeInText
        show={!!concept}
        text={concept}
        position={[0, 0.4, 0]}
        fontSize={0.42}
        color="#34D399"
      />
      {textDetail && (
        <FadeInText
          show={!!concept}
          text={textDetail}
          position={[0, -0.1, 0]}
          fontSize={0.2}
          color="#e5e7eb"
        />
      )}
    </group>
  );
};

// === Prototype Scene ===
const ARLabelPrototype = () => {
  const [concept, setConcept] = useState("Array");

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        background: "black",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          // optional: uncomment if you want to auto-start AR on supported devices
          // startAR(gl);
        }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={0.8} />

        {/* ground-ish plane for reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        {/* world-space 3D label */}
        <ConceptARLabel concept={concept} />

        <OrbitControls />
      </Canvas>

      {/* UI buttons overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          padding: 8,
          borderRadius: 999,
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(148,163,184,0.8)",
        }}
      >
        {["Array", "Queue (FIFO)", "Stack (LIFO)", "Linked List"].map(
          (label) => {
            const isActive = concept === label;
            return (
              <button
                key={label}
                onClick={() => setConcept(label)}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  color: isActive ? "#020617" : "#e5e7eb",
                  backgroundColor: isActive ? "#facc15" : "transparent",
                }}
              >
                {label}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default ARLabelPrototype;
