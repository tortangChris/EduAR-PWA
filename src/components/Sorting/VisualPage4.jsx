import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = ({ data = [30, 10, 50, 20, 40], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [isSorting, setIsSorting] = useState(false);
  const [swapPair, setSwapPair] = useState([]);
  const [minIndex, setMinIndex] = useState(null);
  const [finished, setFinished] = useState(false);

  // Compute normalized heights for bars
  const heights = useMemo(() => {
    const maxVal = Math.max(...array);
    return array.map((v) => (v / maxVal) * 2 + 0.5);
  }, [array]);

  // Compute X positions
  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  // Reset
  const handleReset = () => {
    setArray([...data]);
    setIsSorting(false);
    setFinished(false);
    setSwapPair([]);
    setMinIndex(null);
  };

  // Selection Sort animation
  const handleStartSort = async () => {
    if (isSorting) return;

    // Reset if already sorted
    if (finished) {
      handleReset();
      return;
    }

    setIsSorting(true);
    let tempArray = [...array];
    const n = tempArray.length;

    for (let i = 0; i < n - 1; i++) {
      let min = i;
      setMinIndex(min);
      await sleep(700);

      for (let j = i + 1; j < n; j++) {
        setSwapPair([min, j]);
        await sleep(700);

        if (tempArray[j] < tempArray[min]) {
          min = j;
          setMinIndex(min);
          await sleep(700);
        }
      }

      if (min !== i) {
        [tempArray[i], tempArray[min]] = [tempArray[min], tempArray[i]];
        setArray([...tempArray]);
        await sleep(700);
      }
    }

    setSwapPair([]);
    setMinIndex(null);
    setFinished(true);
    setIsSorting(false);
  };

  // Sleep utility
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Generate pseudo code
  const generateCode = () => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [30, 10, 50, 20, 40]",
      "n = length(array)",
      "",
      "for i = 0 to n-1:",
      "    minIndex = i",
      "    for j = i+1 to n-1:",
      "        if array[j] < array[minIndex]:",
      "            minIndex = j",
      "    swap(array[i], array[minIndex])",
      "",
      `print('Sorted Array:', [${[...array]
        .sort((a, b) => a - b)
        .join(", ")}])`,
      "",
      "// Result: [10, 20, 30, 40, 50]",
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
          text="Selection Sort Algorithm (O(n²))"
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
              : "Click any box to start Selection Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Bars */}
        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={swapPair.includes(i)}
            isMin={i === minIndex}
            sorted={finished}
            onClick={handleStartSort}
          />
        ))}

        {/* Pseudo code display */}
        {finished && <CodePanel code={generateCode()} position={[7.8, 1, 0]} />}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Animated Box ===
const AnimatedBox = ({
  index,
  value,
  height,
  position,
  highlighted,
  isMin,
  sorted,
  onClick,
}) => {
  const meshRef = useRef();
  const targetY = height / 2;

  const normalColor = sorted ? "#34d399" : "#60a5fa";
  const highlightColor = "#f87171";
  const minColor = "#facc15";

  const targetColor = new THREE.Color(
    highlighted ? highlightColor : isMin ? minColor : normalColor
  );

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x +=
      (position[0] - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.15;
    meshRef.current.material.color.lerp(targetColor, 0.2);
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick}>
        <boxGeometry args={[1.6, height, 1]} />
        <meshStandardMaterial
          color={highlighted ? highlightColor : normalColor}
          emissive={isMin ? "#fbbf24" : "#000000"}
          emissiveIntensity={isMin ? 0.6 : 0}
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

export default VisualPage4;
