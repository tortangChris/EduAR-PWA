import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // Make sure this is in /public/sounds/

const MAX_INDEX = 6; // ✅ Limit: up to 6 indexes only

const VisualPage4 = ({ spacing = 2.2 }) => {
  const [array, setArray] = useState([5, 10, 15, "Append"]);
  const [inserting, setInserting] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [infoText, setInfoText] = useState("Click 'Append' to add new value");
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  const handleInsert = () => {
    if (inserting) return;
    if (array.length - 1 >= MAX_INDEX) return; // ✅ Stop when reaching 6 indexes

    setInserting(true);
    setInfoText("🧩 Appending new value at the end...");

    const newValue = Math.floor(Math.random() * 90) + 10;
    const insertIndex = array.length - 1;
    setHighlightIndex(insertIndex);

    setTimeout(() => {
      const newArray = [...array];
      newArray.splice(insertIndex, 0, newValue);

      // ✅ Remove "Insert/Append" when reaching limit
      if (newArray.length - 1 >= MAX_INDEX) {
        newArray.pop();
        setInfoText("⚠️ Limit reached (6 indexes)");
      } else {
        setInfoText(`✅ Inserted value ${newValue} at index ${insertIndex}`);
      }

      setArray(newArray);
      play();
      setHighlightIndex(null);
      setInserting(false);

      // ✅ Detailed pseudo code below the boxes
      const cleanArray = newArray.filter((v) => v !== "Append");
      const pseudo = [
        "📘 Pseudo Code Example:",
        "",
        `array = [${cleanArray.join(", ")}]`,
        `index = ${insertIndex}`,
        "",
        `value = array[index]`,
        `print('Accessed Value:', value)`,
        "",
        `// Result: ${newValue}`,
      ];
      setPseudoCode(pseudo);
    }, 1000);
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text="Insertion Operation"
          position={[0, 2.8, 0]}
          fontSize={0.55}
          color="white"
        />

        {/* Step Info */}
        <FadeInText
          show={true}
          text={infoText}
          position={[0, 2, 0]}
          fontSize={0.3}
          color="#ffd166"
        />

        {/* Boxes */}
        {array.map((value, i) => (
          <Box
            key={i}
            index={i}
            value={value}
            position={positions[i]}
            highlight={highlightIndex === i}
            isInsert={value === "Append"}
            disabled={inserting}
            onClick={value === "Append" ? handleInsert : undefined}
          />
        ))}

        {/* ✅ Pseudo Code (below boxes) */}
        {pseudoCode.length > 0 && (
          <>
            {pseudoCode.map((line, i) => (
              <FadeInText
                key={i}
                show={true}
                text={line}
                position={[0, -0.8 - i * 0.35, 0]} // 👈 Position moved below
                fontSize={0.28}
                color={
                  line.startsWith("//")
                    ? "#8ef5b8"
                    : line.startsWith("array") ||
                      line.startsWith("index") ||
                      line.startsWith("value") ||
                      line.startsWith("print")
                    ? "#ffeb99"
                    : "#9be7a2"
                }
                anchorX="center"
              />
            ))}
          </>
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

/* ---------- Box Component ---------- */
const Box = ({
  index,
  value,
  position,
  highlight,
  isInsert,
  disabled,
  onClick,
}) => {
  const meshRef = useRef();
  const size = [1.6, 1.2, 1];

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = isInsert
      ? "#fbbf24"
      : index % 2 === 0
      ? "#60a5fa"
      : "#34d399";
    const targetColor = highlight
      ? new THREE.Color("#f87171")
      : new THREE.Color(baseColor);
    const targetEmissive = highlight || isInsert ? 0.7 : 0;
    mat.color.lerp(targetColor, 0.12);
    mat.emissive = mat.emissive || new THREE.Color(0x000000);
    mat.emissive.lerp(targetColor, 0.1);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity || 0,
      targetEmissive,
      0.12
    );
  });

  return (
    <group
      position={position}
      onClick={!disabled && isInsert ? onClick : undefined}
      style={{ cursor: isInsert && !disabled ? "pointer" : "default" }}
    >
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} emissive={"#000"} />
      </mesh>

      {/* Value Text */}
      <Text
        position={[0, 0.75, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index Text */}
      {value !== "Append" && (
        <Text
          position={[0, 0.25, size[2] / 2 + 0.01]}
          fontSize={0.22}
          anchorX="center"
          anchorY="middle"
          color="#e0e0e0"
        >
          [{index}]
        </Text>
      )}
    </group>
  );
};

/* ---------- Fade-in Text ---------- */
const FadeInText = ({
  show = false,
  text = "",
  position = [0, 0, 0],
  fontSize = 0.5,
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

export default VisualPage4;
