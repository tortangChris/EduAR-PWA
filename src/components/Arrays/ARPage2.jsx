import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // must exist in /public/sounds/

const ARPage3 = ({ data = [5, 10, 15, 20, 25], spacing = 0.35 }) => {
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
    return data.map((_, i) => [(i - mid) * spacing, 0, -1]);
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

  // Inject AR button into DOM
  React.useEffect(() => {
    const btn = ARButton.createButton(rendererRef.current);
    document.body.appendChild(btn);
  }, []);

  const rendererRef = useRef();

  return (
    <div className="w-full h-[500px]">
      <Canvas
        camera={{ position: [0, 1.5, 2], fov: 60 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          rendererRef.current = gl;
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 1]} intensity={0.8} />

        {/* Floating title */}
        <FadeInText
          show={true}
          text="Search Operation (Linear Search)"
          position={[0, 0.8, -1.2]}
          fontSize={0.08}
          color="white"
        />

        {/* Status label */}
        <FadeInText
          show={!!statusText}
          text={statusText}
          position={[0, 0.6, -1.2]}
          fontSize={0.07}
          color="#ffd166"
        />

        {/* Boxes in AR space */}
        {data.map((value, i) => (
          <ARBox
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

        {/* Info + pseudo code floating beside */}
        {showCode && (
          <>
            <FadeInText
              show={true}
              text={infoText}
              position={[0.5, 0.3, -1.2]}
              fontSize={0.065}
              color="#9be7a2"
              anchorX="left"
            />
            {pseudoCode.map((line, i) => (
              <FadeInText
                key={i}
                show={true}
                text={line}
                position={[0.5, 0.15 - i * 0.08, -1.2]}
                fontSize={0.06}
                color={line.startsWith("//") ? "#9be7a2" : "#ffeb99"}
                anchorX="left"
              />
            ))}
          </>
        )}
      </Canvas>
    </div>
  );
};

/* ---------- Box (AR Touchable) ---------- */
const ARBox = ({
  index,
  value,
  position = [0, 0, 0],
  highlight,
  found,
  disabled,
  onClick,
}) => {
  const meshRef = useRef();
  const size = [0.15, 0.12, 0.1];

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
    mat.color.lerp(targetColor, 0.15);
    mat.emissive.lerp(targetColor, 0.15);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity || 0,
      targetEmissive,
      0.15
    );
  });

  return (
    <group
      position={position}
      onClick={!disabled ? onClick : undefined}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      <mesh ref={meshRef} position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} emissive={"#000"} />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.05, size[2] / 2 + 0.01]}
        fontSize={0.08}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.05, size[2] / 2 + 0.01]}
        fontSize={0.06}
        anchorX="center"
        anchorY="middle"
        color="#e0e0e0"
      >
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
  fontSize = 0.1,
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
