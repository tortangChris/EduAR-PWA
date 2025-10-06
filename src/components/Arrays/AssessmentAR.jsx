import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const AssessmentAR = () => {
  const meshRef = useRef();
  const { gl, camera } = useThree();
  const [position, setPosition] = useState([0, 0, -2]);
  const [geometry, setGeometry] = useState("cube");

  // ✅ Detect tap/click and confirm
  useEffect(() => {
    const handleClick = (event) => {
      alert("🟢 Tap detected — creating anchor position!");

      // Simulate anchor placement 1 meter forward
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );
      const newPos = camera.position.clone().addScaledVector(dir, 1);
      setPosition([newPos.x, newPos.y, newPos.z]);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera]);

  // ✅ Slowly rotate the object
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 3], fov: 70 }}
      onCreated={({ gl }) => {
        gl.setClearColor("black");
      }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 5]} intensity={1.5} />

      {/* Object that moves when tapping (simulated anchor) */}
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
    </Canvas>
  );
};

export default AssessmentAR;
