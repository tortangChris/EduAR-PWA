import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage3 = ({ spacing = 2 }) => {
  const [queue, setQueue] = useState([]);
  const [explanation, setExplanation] = useState(
    "Queue visualization starting..."
  );
  const [step, setStep] = useState(0);

  // Loop through queue operations automatically
  useEffect(() => {
    let timer;
    if (step === 0) {
      // initial queue
      setQueue([
        { value: "A", id: Math.random() },
        { value: "B", id: Math.random() },
        { value: "C", id: Math.random() },
      ]);
      setExplanation("Initial Queue: [Front] A, B, C [Rear]");
      timer = setTimeout(() => setStep(1), 2000);
    } else if (step === 1) {
      // Enqueue D
      setQueue((prev) => [...prev, { value: "D", id: Math.random() }]);
      setExplanation("➡️ ENQUEUE D: added to the rear.");
      timer = setTimeout(() => setStep(2), 2000);
    } else if (step === 2) {
      // Peek front
      setExplanation("👀 FRONT of queue: A.");
      timer = setTimeout(() => setStep(3), 2000);
    } else if (step === 3) {
      // Dequeue front
      setQueue((prev) => prev.slice(1));
      setExplanation("❌ DEQUEUE: removed A from the front.");
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
      <Canvas camera={{ position: [8, 6, 12], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {queue.map((item, i) => (
          <AnimatedBox
            key={item.id}
            index={i}
            value={item.value}
            targetX={i * spacing}
            isFront={i === 0}
            isRear={i === queue.length - 1}
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

const AnimatedBox = ({ index, value, targetX, isFront, isRear }) => {
  const meshRef = useRef();
  const size = [1.5, 1, 1.5];

  const position = useRef([targetX, 5, 0]);
  const velocity = useRef(-0.15);
  const settled = useRef(false);

  useFrame(() => {
    if (meshRef.current && !settled.current) {
      position.current[1] += velocity.current;
      velocity.current -= 0.01;

      if (position.current[1] <= 0) {
        position.current[1] = 0;
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
          color={isFront ? "#34d399" : isRear ? "#f87171" : "#60a5fa"}
          emissive={isFront ? "green" : isRear ? "red" : "black"}
          emissiveIntensity={isFront || isRear ? 0.6 : 0}
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

      {/* Front / Rear labels */}
      {isFront && (
        <Text
          position={[-size[0] / 1.5 - 0.5, size[1] / 2, 0]}
          fontSize={0.25}
          color="yellow"
          anchorX="right"
          anchorY="middle"
        >
          FRONT
        </Text>
      )}
      {isRear && (
        <Text
          position={[size[0] / 1.5 + 0.5, size[1] / 2, 0]}
          fontSize={0.25}
          color="yellow"
          anchorX="left"
          anchorY="middle"
        >
          REAR
        </Text>
      )}
    </group>
  );
};

export default VisualPage3;
