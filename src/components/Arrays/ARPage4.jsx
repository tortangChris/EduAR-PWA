import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, ARButton, XR, Interactive } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // Ensure file exists in /public/sounds/

const ARPage3 = ({ data = [5, 10, 15, 20, 25], spacing = 0.45 }) => {
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  // 🔹 Positions in AR (closer and smaller scale)
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, -1.5]); // forward 1.5m
  }, [data, spacing]);

  // 🔹 Linear Search animation
  const handleClick = (index) => {
    if (searching) return;
    setSearching(true);
    setHighlightIndex(null);
    setFoundIndex(null);
    setStatusText("");
    setInfoText("");
    setShowCode(false);

    let i = 0;
    setStatusText("🔍 Starting linear search...");

    const interval = setInterval(() => {
      setHighlightIndex(i);
      setStatusText(`Checking index ${i} → value ${data[i]}`);

      if (i === index) {
        clearInterval(interval);
        setTimeout(() => {
          setFoundIndex(i);
          play();
          setStatusText(`✅ Found value ${data[i]} at index ${i}`);
          setInfoText(`Value ${data[i]} located after ${i + 1} comparisons`);
          setPseudoCode([
            "📘 Pseudo Code Example:",
            "",
            "for i = 0 to n-1:",
            "   if array[i] == key:",
            "       return i",
            "",
            `// Found at index ${i}`,
          ]);
          setShowCode(true);
          setSearching(false);
        }, 900);
      } else {
        i++;
        if (i >= data.length) {
          clearInterval(interval);
          setTimeout(() => {
            setStatusText("❌ Value not found in array");
            setInfoText("Search completed — no match found.");
            setPseudoCode([
              "📘 Pseudo Code Example:",
              "",
              "for i = 0 to n-1:",
              "   if array[i] == key:",
              "       return i",
              "",
              "return -1  // not found",
            ]);
            setShowCode(true);
            setSearching(false);
          }, 800);
        }
      }
    }, 900);
  };

  return (
    <div className="w-full h-[300px]">
      <ARButton />
      <Canvas camera={{ position: [0, 1.6, 0] }}>
        <XR>
          <ambientLight intensity={0.4} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />

          {/* 🔹 Title floating above */}
          <FadeInText
            show={true}
            text="🔍 Linear Search (AR Mode)"
            position={[0, 0.6, -1.5]}
            fontSize={0.12}
            color="white"
          />

          {/* 🔹 Status Text */}
          <FadeInText
            show={!!statusText}
            text={statusText}
            position={[0, 0.4, -1.5]}
            fontSize={0.09}
            color="#ffd166"
          />

          {/* 🔹 Info Text */}
          <FadeInText
            show={!!infoText}
            text={infoText}
            position={[0, 0.25, -1.5]}
            fontSize={0.09}
            color="#9be7a2"
          />

          {/* 🔹 Boxes in AR */}
          {data.map((value, i) => (
            <Interactive key={i} onSelect={() => handleClick(i)}>
              <Box
                index={i}
                value={value}
                position={positions[i]}
                highlight={highlightIndex === i}
                found={foundIndex === i}
              />
            </Interactive>
          ))}

          {/* 🔹 Pseudo code below */}
          {showCode &&
            pseudoCode.map((line, i) => (
              <FadeInText
                key={i}
                show={true}
                text={line}
                position={[-0.5, -0.1 - i * 0.08, -1.5]}
                fontSize={0.07}
                color={line.startsWith("//") ? "#9be7a2" : "#ffeb99"}
                anchorX="left"
              />
            ))}
        </XR>
      </Canvas>
    </div>
  );
};

/* ---------- Box Component (for AR) ---------- */
const Box = ({ index, value, position, highlight, found }) => {
  const meshRef = useRef();
  const size = [0.15, 0.1, 0.1];

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = new THREE.Color(index % 2 === 0 ? "#60a5fa" : "#34d399");
    const targetColor = found
      ? new THREE.Color("#fbbf24")
      : highlight
      ? new THREE.Color("#f87171")
      : baseColor;
    mat.color.lerp(targetColor, 0.15);
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} />
      </mesh>

      {/* Value */}
      <Text
        position={[0, 0.08, 0.06]}
        fontSize={0.06}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {String(value)}
      </Text>

      {/* Index */}
      <Text
        position={[0, -0.05, 0.06]}
        fontSize={0.05}
        color="#e0e0e0"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>
    </group>
  );
};

/* ---------- Fade-in Text Component ---------- */
const FadeInText = ({
  show = false,
  text = "",
  position = [0, 0, 0],
  fontSize = 0.08,
  color = "white",
  anchorX = "center",
}) => {
  const ref = useRef();
  const opacity = useRef(0);

  useFrame(() => {
    if (!ref.current || !ref.current.material) return;
    if (show) opacity.current = Math.min(opacity.current + 0.05, 1);
    else opacity.current = Math.max(opacity.current - 0.06, 0);
    ref.current.material.transparent = true;
    ref.current.material.opacity = opacity.current;
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX={anchorX}
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

export default ARPage3;
