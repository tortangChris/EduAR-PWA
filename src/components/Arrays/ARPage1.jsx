import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // same ding sound

const ARPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [timeStep, setTimeStep] = useState(0);
  const [lastStage, setLastStage] = useState(-1);
  const [placed, setPlaced] = useState(true); // always placed
  const [playDing] = useSound(dingSfx, { volume: 0.5 });

  // Timeline loop (0–15s)
  useEffect(() => {
    if (!placed) return;

    const interval = setInterval(() => {
      setTimeStep((prev) => (prev + 1) % 15);
    }, 1000);
    return () => clearInterval(interval);
  }, [placed]);

  // Ding sound on stages
  useEffect(() => {
    const stages = [0, 3, 5, 8, 10];
    if (stages.includes(timeStep) && timeStep !== lastStage) {
      playDing();
      setLastStage(timeStep);
    }
  }, [timeStep, lastStage, playDing]);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) => console.error("❌ AR session failed:", err));
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* Fixed AR group */}
        <group position={[0, 1, -2]} scale={[0.1, 0.1, 0.1]}>
          {/* Main text */}
          {timeStep >= 0 && (
            <Text
              position={[0, 3, 0]}
              fontSize={0.5}
              anchorX="center"
              anchorY="middle"
              color="white"
            >
              This is an Array
            </Text>
          )}

          {/* Boxes */}
          {timeStep >= 3 &&
            data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i]}
                showIndex={timeStep >= 8}
              />
            ))}

          {/* Arrow + Labels */}
          {timeStep >= 5 && (
            <>
              <Arrow from={[-6, 0.5, 0]} to={[-4, 0.5, 0]} />
              <Text
                position={[-6, 0.5, 0]}
                fontSize={0.35}
                color="orange"
                anchorX="right"
                anchorY="middle"
              >
                Elements / Values
              </Text>
            </>
          )}
          {timeStep >= 10 && (
            <>
              <Arrow from={[-6, -0.5, 0]} to={[-3.5, -0.5, 0]} />
              <Text
                position={[-6, -0.5, 0]}
                fontSize={0.35}
                color="yellow"
                anchorX="right"
                anchorY="middle"
              >
                Indices
              </Text>
            </>
          )}

          {/* Ground */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};

// Box component with fade-in value and index
const Box = ({ index, value, position = [0, 0, 0], showIndex = false }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {String(value)}
      </Text>

      {showIndex && (
        <Text
          position={[0, -0.3, size[2] / 2 + 0.01]}
          fontSize={0.25}
          anchorX="center"
          anchorY="middle"
          color="yellow"
        >
          [{index}]
        </Text>
      )}
    </group>
  );
};

// Simple arrow helper
const Arrow = ({ from, to }) => {
  const dir = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  ).normalize();
  const length = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  ).length();
  return (
    <primitive
      object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(...from), length, "white")
      }
    />
  );
};

export default ARPage1;
