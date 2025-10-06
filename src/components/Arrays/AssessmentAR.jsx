import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// 🧩 3D Scene Component (this runs inside Canvas)
const ARScene = () => {
  const meshRef = useRef();
  const { camera } = useThree();
  const [position, setPosition] = useState([0, 0, -2]);
  const [geometry, setGeometry] = useState("cube");

  // ✅ Detect tap or click
  useEffect(() => {
    const handleClick = () => {
      alert("🟢 Tap detected — anchor placed!");

      // Move the object 1 meter in front of the camera
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );
      const newPos = camera.position.clone().addScaledVector(dir, 1);
      setPosition([newPos.x, newPos.y, newPos.z]);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera]);

  // ✅ Rotate mesh
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {geometry === "cube" ? (
          <boxGeometry args={[6, 6, 6]} />
        ) : (
          <sphereGeometry args={[3.5, 32, 32]} />
        )}
        <meshStandardMaterial color="#60a5fa" emissive="black" />
      </mesh>
    </group>
  );
};

// 🧠 Main Component (rafce structure)
const AssessmentAR = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 3], fov: 70 }}
      onCreated={({ gl }) => gl.setClearColor("black")}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 5]} intensity={1.5} />

      <ARScene />
    </Canvas>
  );
};

export default AssessmentAR;
