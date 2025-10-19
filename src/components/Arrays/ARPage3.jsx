import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, ARButton } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // keep this in /public/sounds/

const ARPage3 = ({ data = [5, 10, 15, 20, 25], spacing = 0.6 }) => {
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

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
    <div className="w-full h-[100vh] bg-black">
      {/* 🔹 AR START BUTTON */}
      <ARButton />

      <Canvas
        camera={{ position: [0, 1.6, 0], fov: 70 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={0.8} />

        {/* 🔹 GROUP all 3D objects at z = -8 */}
        <group position={[0, 1, -8]}>
          {/* Title */}
          <FadeInText
            show={true}
            text="Linear Search (AR Mode)"
            position={[0, 2, 0]}
            fontSize={0.25}
            color="white"
          />

          {/* Status label */}
          <FadeInText
            show={!!statusText}
            text={statusText}
            position={[0, 1.6, 0]}
            fontSize={0.18}
            color="#ffd166"
          />

          {/* Boxes */}
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              highlight={highlightIndex === i}
              found={foundIndex === i}
              disabled={searching}
              onClick={() => handleClick(i)}
            />
          ))}

          {/* Info text & pseudo code */}
          {showCode && (
            <>
              <FadeInText
                show={true}
                text={infoText}
                position={[3.2, 1.5, 0]}
                fontSize={0.2}
                color="#9be7a2"
                anchorX="left"
              />

              {pseudoCode.map((line, i) => (
                <FadeInText
                  key={i}
                  show={true}
                  text={line}
                  position={[3.3, 1.2 - i * 0.25, 0]}
                  fontSize={0.18}
                  color={line.startsWith("//") ? "#9be7a2" : "#ffeb99"}
                  anchorX="left"
                />
              ))}
            </>
          )}
        </group>
      </Canvas>
    </div>
  );
};

/* ---------- Box Component ---------- */
const Box = ({
  index,
  value,
  position = [0, 0, 0],
  highlight,
  found,
  disabled,
  onClick,
}) => {
  const meshRef = useRef();
  const size = [0.8, 0.6, 0.5];

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = new THREE.Color(index % 2 === 0 ? "#60a5fa" : "#34d399");
    const targetColor = found
      ? new THREE.Color("#fbbf24")
      : highlight
      ? new THREE.Color("#f87171")
      : baseColor;
    const targetEmissive = highlight || found ? 0.9 : 0;
    mat.color.lerp(targetColor, 0.12);
    mat.emissive = mat.emissive || new THREE.Color(0x000000);
    mat.emissive.lerp(targetColor, 0.12);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity || 0,
      targetEmissive,
      0.12
    );
  });

  return (
    <group
      position={position}
      onClick={!disabled ? onClick : undefined}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      <mesh ref={meshRef}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} emissive={"#000"} />
      </mesh>

      {/* Value */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.25}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
      <Text position={[0, -0.35, 0]} fontSize={0.2} color="#e0e0e0">
        [{index}]
      </Text>
    </group>
  );
};

/* ---------- Fade-in Text ---------- */
const FadeInText = ({
  show = false,
  text = "",
  position = [0, 0, 0],
  fontSize = 0.2,
  color = "white",
  anchorX = "center",
}) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.85);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.03, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
      scale.current = Math.max(scale.current - 0.04, 0.85);
    }
    if (ref.current && ref.current.material) {
      ref.current.material.transparent = true;
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
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
