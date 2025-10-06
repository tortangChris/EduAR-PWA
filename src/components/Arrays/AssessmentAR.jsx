// AssessmentAR.jsx
import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei"; // ✅ Added Html import
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

const AssessmentAR = () => {
  const containerRef = useRef();

  useEffect(() => {
    // ✅ Check WebXR availability
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          const button = ARButton.createButton(rendererRef.current, {
            requiredFeatures: ["hit-test"],
          });
          document.body.appendChild(button);
        } else {
          alert("AR not supported on this device 😢");
        }
      });
    } else {
      alert("AR feature not available in this browser or device.");
    }
  }, []);

  const rendererRef = useRef();

  return (
    <div ref={containerRef} className="w-full h-screen bg-black">
      <Canvas
        ref={rendererRef}
        shadows
        camera={{ position: [0, 1.5, 3] }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true; // ✅ Enable AR Mode
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* ✅ Debug text for click testing */}
        <mesh
          position={[0, 0, -2]}
          onClick={() => alert("✅ Object tapped! Debug confirmed.")}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>

        {/* ✅ Overlay text for feedback */}
        <Html position={[0, 1.5, -2]}>
          <div style={{ color: "white", textAlign: "center" }}>
            <p>👆 Tap the cube to test interaction</p>
          </div>
        </Html>

        <Text position={[0, 2, -2]} fontSize={0.3} color="white">
          AR Debug Mode
        </Text>
      </Canvas>
    </div>
  );
};

export default AssessmentAR;
