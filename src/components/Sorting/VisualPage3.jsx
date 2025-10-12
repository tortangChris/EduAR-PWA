import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage3 = ({ data = [30, 10, 20, 5, 15], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [isSorting, setIsSorting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [highlight, setHighlight] = useState([]);

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

  // Sleep helper
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Reset
  const handleReset = () => {
    setArray([...data]);
    setFinished(false);
    setIsSorting(false);
    setHighlight([]);
  };

  // Perform Insertion Sort animation
  const handleStartSort = async () => {
    if (isSorting) return;

    if (finished) {
      handleReset();
      return;
    }

    setIsSorting(true);
    let tempArray = [...array];

    for (let i = 1; i < tempArray.length; i++) {
      let key = tempArray[i];
      let j = i - 1;
      setHighlight([i]);
      await sleep(700);

      while (j >= 0 && tempArray[j] > key) {
        setHighlight([j, j + 1]);
        tempArray[j + 1] = tempArray[j];
        setArray([...tempArray]);
        j--;
        await sleep(700);
      }

      tempArray[j + 1] = key;
      setArray([...tempArray]);
      await sleep(700);
    }

    setHighlight([]);
    setFinished(true);
    setIsSorting(false);
  };

  // Pseudo code generator
  const generateCode = () => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [35, 10, 25, 5, 15]",
      "n = length(array)",
      "",
      "for i = 1 to n-1:",
      "    key = array[i]",
      "    j = i - 1",
      "    while j >= 0 and array[j] > key:",
      "        array[j+1] = array[j]",
      "        j = j - 1",
      "    array[j+1] = key",
      "",
      `print('Sorted Array:', [${[...array]
        .sort((a, b) => a - b)
        .join(", ")}])`,
      "",
      "// Result: [5, 10, 15, 20, 30]",
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
          text="Insertion Sort Algorithm (O(n²))"
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
              : "Click any box to start Insertion Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Bars */}
        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={highlight.includes(i)}
            sorted={finished}
            onClick={handleStartSort}
          />
        ))}

        {/* Pseudo code */}
        {finished && <CodePanel code={generateCode()} position={[7.8, 1, 0]} />}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Animated Box ===
const AnimatedBox = ({
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
          emissive={highlighted ? "#fbbf24" : "#000000"}
          emissiveIntensity={highlighted ? 0.5 : 0}
        />
      </mesh>

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

export default VisualPage3;
