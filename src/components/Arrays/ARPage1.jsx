import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { XR } from "@react-three/xr";
import useSound from "use-sound";

import dingSfx from "/sounds/ding.mp3";

const VisualPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [timeStep, setTimeStep] = useState(0);
  const [lastStage, setLastStage] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(null);
  const [playDing] = useSound(dingSfx, { volume: 0.5 });

  // timeline control (0–15 seconds loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStep((prev) => (prev + 1) % 15);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger ding kada may bagong stage
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

  const handleSelect = (index) => {
    setActiveIndex(index);
    playDing();

    setTimeout(() => {
      setActiveIndex(null);
    }, 2000);
  };

  return (
    <div className="w-full h-[400px]">
      <Canvas
        shadows
        camera={{ position: [0, 4, 12], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) => console.error("❌ Failed to start AR:", err));
          }
        }}
      >
        <XR>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Timeline-based text */}
          <FadeInText
            show={timeStep >= 0}
            text="This is an Array"
            position={[0, 3, -3]}
            fontSize={0.6}
            color="white"
          />

          {/* Boxes */}
          {timeStep >= 3 &&
            data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i].map((p) => p)}
                showIndex={timeStep >= 8}
                isActive={activeIndex === i}
                onSelect={handleSelect}
              />
            ))}

          {/* Arrow + Labels */}
          {timeStep >= 5 && (
            <>
              <FadeInArrow from={[-6, 0.5, -3]} to={[-4, 0.5, -3]} />
              <FadeInText
                show={timeStep >= 5}
                text="Elements / Values"
                position={[-6, 0.5, -3]}
                fontSize={0.35}
                color="orange"
                anchorX="right"
              />
            </>
          )}

          {timeStep >= 10 && (
            <>
              <FadeInArrow from={[-6, -0.5, -3]} to={[-3.5, -0.5, -3]} />
              <FadeInText
                show={timeStep >= 10}
                text="Indices"
                position={[-6, -0.5, -3]}
                fontSize={0.35}
                color="yellow"
                anchorX="right"
              />
            </>
          )}

          {/* Shadow plane */}
          <mesh
            rotation-x={-Math.PI / 2}
            position={[0, -0.1, -3]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.3} />
          </mesh>

          <OrbitControls makeDefault />
        </XR>
      </Canvas>
    </div>
  );
};

// === Fade-in Text ===
const FadeInText = ({
  show,
  text,
  position,
  fontSize,
  color,
  anchorX = "center",
  anchorY = "middle",
}) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.5);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = 0;
      scale.current = 0.5;
    }
    if (ref.current) {
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      anchorX={anchorX}
      anchorY={anchorY}
      color={color}
      material-transparent
    >
      {text}
    </Text>
  );
};

// === Fade-in Arrow ===
const FadeInArrow = ({ from, to }) => {
  const ref = useRef();
  const opacity = useRef(0);

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

  useFrame(() => {
    opacity.current = Math.min(opacity.current + 0.05, 1);
    if (ref.current) {
      ref.current.setColor(
        new THREE.Color(`rgba(255,255,255,${opacity.current})`)
      );
    }
  });

  return (
    <primitive
      ref={ref}
      object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(...from), length, "white")
      }
    />
  );
};

// === Box ===
const Box = ({
  index,
  value,
  position = [0, 0, 0],
  showIndex = false,
  isActive,
  onSelect,
}) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onPointerDown={() => onSelect(index)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={isActive ? "#facc15" : "black"}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>

      {/* Value */}
      <FadeInText
        show={true}
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        color="white"
      />

      {/* Index */}
      {showIndex && (
        <FadeInText
          show={true}
          text={`[${index}]`}
          position={[0, -0.3, size[2] / 2 + 0.01]}
          fontSize={0.25}
          color="yellow"
        />
      )}
    </group>
  );
};

export default VisualPage1;
