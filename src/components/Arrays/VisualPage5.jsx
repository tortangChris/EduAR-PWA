import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // ensure file exists in /public/sounds/

const VisualPage5 = ({ spacing = 2.2 }) => {
  const [array, setArray] = useState([5, 10, 15, 20, "Delete"]);
  const [deleting, setDeleting] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [infoText, setInfoText] = useState(
    "Click 'Delete' to start deletion mode"
  );
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });
  const [deleteMode, setDeleteMode] = useState(false);
  const [fadeOutIndex, setFadeOutIndex] = useState(null);

  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  const handleDeleteClick = () => {
    if (deleteMode) {
      setDeleteMode(false);
      setInfoText("Exited deletion mode.");
    } else {
      setDeleteMode(true);
      setInfoText("🧩 Select a box to delete");
    }
  };

  const handleSelectBox = (index) => {
    if (!deleteMode || deleting) return;
    if (array[index] === "Delete") return;

    setDeleting(true);
    setFadeOutIndex(index);
    setHighlightIndex(index);
    setInfoText(`Deleting value at index ${index}...`);

    setTimeout(() => {
      const newArray = [...array];
      const deletedValue = newArray[index];
      newArray.splice(index, 1);
      setArray(newArray);
      setHighlightIndex(null);
      setFadeOutIndex(null);
      setDeleting(false);
      setDeleteMode(false);
      play();

      setInfoText(`✅ Deleted value ${deletedValue} successfully`);

      // ✅ Short but detailed pseudo code
      const cleanArray = newArray.filter((v) => v !== "Delete");
      const pseudo = [
        "📘 Pseudo Code Example:",
        "",
        `array = [${cleanArray.join(", ")}]`,
        `index = ${index}`,
        "",
        "value = array[index]",
        "delete array[index]",
        "print('Deleted:', value)",
        "",
        `// Deleted value: ${deletedValue}`,
        `// Updated array: [${cleanArray.join(", ")}]`,
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
          text="Deletion Operation"
          position={[0, 2.8, 0]}
          fontSize={0.55}
          color="white"
        />

        {/* Info Text */}
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
            isDelete={value === "Delete"}
            deleteMode={deleteMode}
            fadeOut={fadeOutIndex === i}
            disabled={deleting}
            onClick={
              value === "Delete" ? handleDeleteClick : () => handleSelectBox(i)
            }
          />
        ))}

        {/* Pseudo Code (below boxes) */}
        {pseudoCode.length > 0 && (
          <>
            {pseudoCode.map((line, i) => (
              <FadeInText
                key={i}
                show={true}
                text={line}
                position={[0, -0.8 - i * 0.35, 0]}
                fontSize={0.28}
                color={
                  line.startsWith("//")
                    ? "#8ef5b8"
                    : line.startsWith("array") ||
                      line.startsWith("index") ||
                      line.startsWith("delete") ||
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
  isDelete,
  deleteMode,
  fadeOut,
  disabled,
  onClick,
}) => {
  const meshRef = useRef();
  const size = [1.6, 1.2, 1];
  const opacity = useRef(1);
  const scale = useRef(1);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = isDelete
      ? "#f87171"
      : index % 2 === 0
      ? "#60a5fa"
      : "#34d399";
    const targetColor =
      highlight && !isDelete
        ? new THREE.Color("#fbbf24")
        : new THREE.Color(baseColor);
    const targetEmissive = highlight || isDelete ? 0.7 : 0;

    // Fade-out animation
    if (fadeOut) {
      opacity.current = Math.max(opacity.current - 0.1, 0);
      scale.current = Math.max(scale.current - 0.1, 0);
    } else {
      opacity.current = Math.min(opacity.current + 0.1, 1);
      scale.current = Math.min(scale.current + 0.1, 1);
    }

    mat.transparent = true;
    mat.opacity = opacity.current;
    meshRef.current.scale.set(scale.current, scale.current, scale.current);

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
      onClick={!disabled ? onClick : undefined}
      style={{
        cursor:
          isDelete || (deleteMode && !isDelete && !disabled)
            ? "pointer"
            : "default",
      }}
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
      {value !== "Delete" && (
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

export default VisualPage5;
