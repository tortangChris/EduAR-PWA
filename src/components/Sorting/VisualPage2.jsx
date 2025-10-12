import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage2 = ({ data = [35, 10, 25, 5, 15], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSorting, setIsSorting] = useState(false);
  const [swapPair, setSwapPair] = useState([]);
  const [finished, setFinished] = useState(false);

  // Compute normalized heights (for bar visualization)
  const heights = useMemo(() => {
    const maxVal = Math.max(...array);
    return array.map((v) => (v / maxVal) * 2 + 0.5);
  }, [array]);

  // Compute X positions
  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  // Reset function
  const handleReset = () => {
    setArray([...data]);
    setFinished(false);
    setIsSorting(false);
    setSwapPair([]);
    setCurrentStep(0);
  };

  // Perform Bubble Sort animation
  const handleStartSort = async () => {
    if (isSorting) return;

    // If finished, clicking resets
    if (finished) {
      handleReset();
      return;
    }

    setIsSorting(true);
    let tempArray = [...array];
    const n = tempArray.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setSwapPair([j, j + 1]);
        await sleep(700);

        if (tempArray[j] > tempArray[j + 1]) {
          [tempArray[j], tempArray[j + 1]] = [tempArray[j + 1], tempArray[j]];
          setArray([...tempArray]);
          await sleep(700);
        }
      }
    }

    setSwapPair([]);
    setFinished(true);
    setIsSorting(false);
  };

  // Utility sleep function
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Pseudo code generator
  const generateCode = () => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [35, 10, 25, 5, 15]",
      "n = length(array)",
      "",
      "for i = 0 to n-1:",
      "    for j = 0 to n-i-1:",
      "        if array[j] > array[j+1]:",
      "            swap(array[j], array[j+1])",
      "",
      `print('Sorted Array:', [${[...array]
        .sort((a, b) => a - b)
        .join(", ")}])`,
      "",
      "// Result: [5, 10, 15, 25, 35]",
    ].join("\n");
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 5, 13], fov: 50 }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        {/* Header */}
        <FadeText
          text="Bubble Sort Algorithm (O(n²))"
          position={[0, 4.5, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        {/* Instruction */}
        <FadeText
          text={
            finished
              ? "Sorting completed! Click any box to reset."
              : isSorting
              ? "Sorting in progress..."
              : "Click any box to start Bubble Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Boxes */}
        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={swapPair.includes(i)}
            sorted={finished}
            onClick={handleStartSort}
          />
        ))}

        {/* Code Panel */}
        {finished && <CodePanel code={generateCode()} position={[7.8, 1, 0]} />}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Animated Box Component ===
const AnimatedBox = ({
  index,
  value,
  height,
  position,
  highlighted,
  sorted,
  onClick,
}) => {
  const meshRef = useRef();
  const targetY = height / 2;
  const normalColor = sorted ? "#34d399" : "#60a5fa";
  const highlightColor = "#f87171";
  const targetColor = highlighted
    ? new THREE.Color(highlightColor)
    : new THREE.Color(normalColor);

  useFrame(() => {
    if (!meshRef.current) return;
    // Smooth Y animation
    meshRef.current.position.x +=
      (position[0] - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.15;

    // Smooth color transition
    meshRef.current.material.color.lerp(targetColor, 0.2);
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick}>
        <boxGeometry args={[1.6, height, 1]} />
        <meshStandardMaterial
          color={highlighted ? highlightColor : normalColor}
          emissive={highlighted ? "#fbbf24" : "#000000"}
          emissiveIntensity={highlighted ? 0.5 : 0}
        />
      </mesh>

      {/* Value label */}
      <Text
        position={[position[0], height + 0.3, 0]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </group>
  );
};

// === Code Panel ===
const CodePanel = ({ code, position }) => (
  <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
);

// === Fade Text ===
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1000;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default VisualPage2;
