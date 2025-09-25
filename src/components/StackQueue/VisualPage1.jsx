import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage1 = ({ data = [10, 20, 30, 40], spacing = 1.5 }) => {
  const [stack, setStack] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [explanation, setExplanation] = useState(
    "Stack is empty. Waiting for push..."
  );

  // trigger pushes one by one
  useEffect(() => {
    if (!waiting && currentIndex < data.length) {
      const value = data[currentIndex];
      setStack((prev) => [...prev, { value, settled: false }]);
      setExplanation(`➡️ PUSH ${value} into the stack...`);
      setWaiting(true);
    }
    // when finished, restart loop after 3s
    else if (!waiting && currentIndex >= data.length) {
      setExplanation("⏳ Stack completed. Restarting in 3s...");
      const resetTimer = setTimeout(() => {
        setStack([]);
        setCurrentIndex(0);
        setExplanation("Stack reset. Waiting for push...");
      }, 3000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, waiting, data]);

  // positions for stack
  const positions = useMemo(() => {
    return stack.map((_, i) => [0, i * spacing, 0]);
  }, [stack, spacing]);

  return (
    <div className="w-full h-[450px]">
      <Canvas camera={{ position: [7, 7, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.9} />

        {stack.map((item, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={item.value}
            targetPosition={positions[i]}
            isTop={i === stack.length - 1}
            isNew={!item.settled}
            onSettle={() => {
              // mark as settled
              setStack((prev) =>
                prev.map((box, idx) =>
                  idx === i ? { ...box, settled: true } : box
                )
              );
              // update explanation
              setExplanation(
                `✅ ${item.value} is placed at position [${i}]. ${
                  i === stack.length - 1
                    ? "This is now the TOP of the stack."
                    : ""
                }`
              );
              // allow next push after 2s
              setTimeout(() => {
                setWaiting(false);
                setCurrentIndex((idx) => idx + 1);
              }, 2000);
            }}
          />
        ))}

        {/* Explanation Text floating on the side */}
        <Text
          position={[6, 3, 0]}
          fontSize={0.4}
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

const AnimatedBox = ({
  index,
  value,
  targetPosition,
  isTop,
  isNew,
  onSettle,
}) => {
  const meshRef = useRef();
  const size = [2, 1, 1.5];

  const position = useRef(
    isNew ? [0, targetPosition[1] + 6, 0] : [...targetPosition]
  );
  const velocity = useRef(-0.12);
  const [settled, setSettled] = useState(!isNew);

  useFrame(() => {
    if (meshRef.current && !settled) {
      // gravity + bounce
      position.current[1] += velocity.current;
      velocity.current -= 0.01;

      if (position.current[1] <= targetPosition[1]) {
        position.current[1] = targetPosition[1];
        velocity.current *= -0.35; // bounce

        if (Math.abs(velocity.current) < 0.02) {
          position.current[1] = targetPosition[1];
          setSettled(true);
          onSettle();
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
          emissiveIntensity={isTop ? 0.5 : 0}
        />
      </mesh>

      {/* Value */}
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

      {/* Label beside */}
      <Text
        position={[size[0] / 1.5 + 0.6, size[1] / 2, 0]}
        fontSize={0.25}
        color="yellow"
        anchorX="left"
        anchorY="middle"
      >
        {!settled ? "PUSHING..." : isTop ? "TOP" : ""}
      </Text>
    </group>
  );
};

export default VisualPage1;
