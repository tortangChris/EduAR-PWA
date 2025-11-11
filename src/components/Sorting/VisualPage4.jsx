// ✅ VisualPage4.jsx — Selection Sort (Virtual / Non-AR Version)

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = ({ data = [30, 10, 50, 20, 40], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [isSorting, setIsSorting] = useState(false);
  const [minIndex, setMinIndex] = useState(null);
  const [activePair, setActivePair] = useState([]);
  const [finished, setFinished] = useState(false);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // ✅ Heights (normalize max value to scale bar height)
  const heights = useMemo(() => {
    const maxVal = Math.max(...array);
    return array.map((v) => (v / maxVal) * 2 + 0.5);
  }, [array]);

  // ✅ X positions (centers everything horizontally)
  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  const reset = () => {
    setArray([...data]);
    setIsSorting(false);
    setFinished(false);
    setActivePair([]);
    setMinIndex(null);
  };

  const startSort = async () => {
    if (isSorting) return;

    if (finished) {
      reset();
      return;
    }

    setIsSorting(true);

    let tempArray = [...array];
    const n = tempArray.length;

    for (let i = 0; i < n - 1; i++) {
      let min = i;
      setMinIndex(min);
      await sleep(600);

      for (let j = i + 1; j < n; j++) {
        setActivePair([min, j]);
        await sleep(600);

        if (tempArray[j] < tempArray[min]) {
          min = j;
          setMinIndex(min);
          await sleep(600);
        }
      }

      if (min !== i) {
        [tempArray[i], tempArray[min]] = [tempArray[min], tempArray[i]];
        setArray([...tempArray]);
        await sleep(600);
      }
    }

    setActivePair([]);
    setMinIndex(null);
    setFinished(true);
    setIsSorting(false);
  };

  const generateCode = () => {
    return [
      "📘 Selection Sort Pseudo Code:",
      "",
      "for i = 0 to n - 1:",
      "    minIndex = i",
      "    for j = i+1 to n - 1:",
      "        if array[j] < array[minIndex]:",
      "            minIndex = j",
      "    swap(array[i], array[minIndex])",
      "",
      `Result: [${[...array].sort((a, b) => a - b).join(", ")}]`,
    ].join("\n");
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 5, 14], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 10, 6]} intensity={1.1} />

        <FadeText
          text="Selection Sort Algorithm (O(n²))"
          position={[0, 4.8, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        <FadeText
          text={
            finished
              ? "Sorting Completed! Click any bar to reset."
              : isSorting
              ? "Sorting in progress..."
              : "Click any bar to start Selection Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={activePair.includes(i)}
            isMin={i === minIndex}
            sorted={finished}
            onClick={startSort}
          />
        ))}

        {finished && <CodePanel code={generateCode()} position={[8.2, 1, 0]} />}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// ✅ 3D Box Component
const AnimatedBox = ({
  value,
  height,
  position,
  highlighted,
  isMin,
  sorted,
  onClick,
}) => {
  const meshRef = useRef();

  const normal = sorted ? "#34d399" : "#60a5fa";
  const comparing = "#f87171";
  const minimum = "#facc15";

  const targetColor = new THREE.Color(
    highlighted ? comparing : isMin ? minimum : normal
  );

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x += (position[0] - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += ((height / 2) - meshRef.current.position.y) * 0.15;
    meshRef.current.material.color.lerp(targetColor, 0.2);
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick}>
        <boxGeometry args={[1.6, height, 1]} />
        <meshStandardMaterial color={normal} />
      </mesh>
      <Text position={[position[0], height + 0.3, 0]} fontSize={0.35} color="white">
        {String(value)}
      </Text>
    </group>
  );
};

// ✅ Display Fade-in Text
const FadeText = ({ text, position, fontSize, color }) => {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    let start;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 900, 1);
      setOpacity(progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  return (
    <Text position={position} fontSize={fontSize} color={color} fillOpacity={opacity}>
      {text}
    </Text>
  );
};

// ✅ Code Panel Renderer
const CodePanel = ({ code, position }) => (
  <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
);

export default VisualPage4;
