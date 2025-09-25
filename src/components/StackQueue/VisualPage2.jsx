import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage2 = ({ spacing = 1.5 }) => {
  const [stack, setStack] = useState([]);
  const [explanation, setExplanation] = useState(
    "Stack visualization starting..."
  );
  const [step, setStep] = useState(0);

  // Loop through operations automatically
  useEffect(() => {
    let timer;
    if (step === 0) {
      // initial stack
      setStack([
        { value: 10, id: Math.random() },
        { value: 20, id: Math.random() },
        { value: 30, id: Math.random() },
      ]);
      setExplanation("Initial Stack: [Bottom] 10, 20, 30 [Top]");
      timer = setTimeout(() => setStep(1), 2000);
    } else if (step === 1) {
      // Push 40
      setStack((prev) => [...prev, { value: 40, id: Math.random() }]);
      setExplanation("➡️ PUSH 40: placed on top.");
      timer = setTimeout(() => setStep(2), 2000);
    } else if (step === 2) {
      // Peek top
      setExplanation("👀 PEEK: Top item is 40.");
      timer = setTimeout(() => setStep(3), 2000);
    } else if (step === 3) {
      // Pop top
      setStack((prev) => prev.slice(0, -1));
      setExplanation("❌ POP: removed 40 from top.");
      timer = setTimeout(() => setStep(4), 2000);
    } else if (step === 4) {
      // Restart after 3s
      setExplanation("⏳ Loop complete. Restarting in 3s...");
      timer = setTimeout(() => setStep(0), 3000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [6, 6, 12], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {stack.map((item, i) => (
          <AnimatedBox
            key={item.id}
            index={i}
            value={item.value}
            targetY={i * spacing}
            isTop={i === stack.length - 1}
          />
        ))}

        {/* Explanation floating in 3D */}
        <Text
          position={[6, 4, 0]}
          fontSize={0.45}
          maxWidth={6}
          lineHeight={1.2}
          textAlign="left"
          color="yellow"
          anchorX="left"
          anchorY="top"
        >
          {explanation}
        </Text>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

const AnimatedBox = ({ index, value, targetY, isTop }) => {
  const meshRef = useRef();
  const size = [2, 1, 1.5];

  const position = useRef([0, targetY + 5, 0]);
  const velocity = useRef(-0.15);
  const settled = useRef(false);

  useFrame(() => {
    if (meshRef.current && !settled.current) {
      position.current[1] += velocity.current;
      velocity.current -= 0.01;

      if (position.current[1] <= targetY) {
        position.current[1] = targetY;
        velocity.current *= -0.3;
        if (Math.abs(velocity.current) < 0.02) {
          settled.current = true;
        }
      }
      meshRef.current.position.set(...position.current);
    }
  });

  return (
    <group ref={meshRef} position={position.current}>
      {/* Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isTop ? "#f87171" : "#60a5fa"}
          emissive={isTop ? "red" : "black"}
          emissiveIntensity={isTop ? 0.6 : 0}
        />
      </mesh>

      {/* Value text */}
      <Text
        position={[0, size[1] / 2 + 0.05, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
      <Text
        position={[0, -0.3, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>

      {/* Top label */}
      {isTop && (
        <Text
          position={[size[0] / 1.5 + 0.5, size[1] / 2, 0]}
          fontSize={0.25}
          color="yellow"
          anchorX="left"
          anchorY="middle"
        >
          TOP
        </Text>
      )}
    </group>
  );
};

export default VisualPage2;
