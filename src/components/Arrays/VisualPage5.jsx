// ✅ VirtualPage5.jsx — PERMANENT DELETE + dynamic pseudocode (same logic as ARPage5)

import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3";

const VirtualPage5 = ({ spacing = 2.2 }) => {
  const [array] = useState([5, 10, 15, 20, 25]); // ✅ fixed original array
  const [removedIndexes, setRemovedIndexes] = useState(new Set()); // ✅ permanent index removal
  const [infoText, setInfoText] = useState("Click a box to delete it");
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  const removedRef = useRef(removedIndexes);

  useEffect(() => {
    removedRef.current = removedIndexes;
  }, [removedIndexes]);

  // ✅ handle delete
  const handleDelete = (index) => {
    if (removedRef.current.has(index)) return;

    const newRemoved = new Set(removedRef.current);
    newRemoved.add(index);
    setRemovedIndexes(newRemoved);
    removedRef.current = newRemoved;

    play();
    setInfoText(`✅ Deleted ${array[index]}`);

    // compute remaining
    const remaining = array
      .map((v, i) => ({ value: v, originalIndex: i }))
      .filter((item) => !newRemoved.has(item.originalIndex));

    const remainingValues = remaining.map((i) => i.value);
    const remainingMap = remaining
      .map((r, newIdx) => `[${newIdx}] = ${r.value}`)
      .join(", ");

    const deletedItems = Array.from(newRemoved)
      .sort((a, b) => a - b)
      .map((i) => `[${i}] = ${array[i]}`)
      .join(", ");

    setPseudoCode([
      "📘 Pseudo Code: Dynamic Deletion",
      "",
      `// Original array: [${array.join(", ")}]`,
      `// Deleted original indexes: ${deletedItems || "none"}`,
      "",
      `array = [${remainingValues.join(", ")}]`,
      `// New index mapping: ${remainingMap || "none"}`,
      "",
      `index = ${index}  // user removed`,
      "delete array[index]",
      "",
      `// Updated length = ${remainingValues.length}`,
    ]);
  };

  // ✅ Recompute positions dynamically based on remaining count
  const positions = useMemo(() => {
    const visibleCount = array.filter((_, i) => !removedRef.current.has(i)).length;
    const mid = (visibleCount - 1) / 2;
    let cur = 0;

    return array.map((_, i) => {
      if (!removedRef.current.has(i)) {
        const pos = [(cur - mid) * spacing, 0, 0];
        cur++;
        return pos;
      }
      return [0, -9999, 0]; // removed → offscreen
    });
  }, [array, spacing, removedIndexes]);

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />

        {/* Title */}
        <FadeText
          text="Deletion Operation"
          position={[0, 2.8, 0]}
          fontSize={0.55}
          color="white"
        />

        {/* Dynamic Info */}
        <FadeText
          text={infoText}
          position={[0, 2, 0]}
          fontSize={0.33}
          color="#ffd166"
        />

        {/* BOXES */}
        {array.map((value, i) =>
          !removedIndexes.has(i) ? (
            <AnimatedBox
              key={i}
              index={i}
              value={value}
              targetPosition={positions[i]}
              onClick={() => handleDelete(i)}
            />
          ) : null
        )}

        {/* Pseudo Code */}
        {pseudoCode.length > 0 &&
          pseudoCode.map((line, idx) => (
            <FadeText
              key={idx}
              text={line}
              position={[0, -0.7 - idx * 0.33, 0]}
              fontSize={0.28}
              color={
                line.startsWith("//")
                  ? "#8ef5b8"
                  : line.startsWith("array") ||
                    line.startsWith("index") ||
                    line.startsWith("delete")
                  ? "#ffeb99"
                  : "#9be7a2"
              }
            />
          ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

/* ---------------- COMPONENTS ---------------- */

const AnimatedBox = forwardRef(({ index, value, targetPosition, onClick }, ref) => {
  const group = useRef();
  const size = [1.6, 1.2, 1];

  useFrame(() => {
    if (!group.current) return;
    group.current.position.lerp(new THREE.Vector3(...targetPosition), 0.12);
  });

  return (
    <group
      ref={group}
      onClick={onClick}
      position={targetPosition}
      style={{ cursor: "pointer" }}
    >
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" emissive="#000" />
      </mesh>

      <Text position={[0, 0.8, size[2] / 2 + 0.01]} fontSize={0.35} anchorX="center">
        {value}
      </Text>

      <Text position={[0, 0.3, size[2] / 2 + 0.01]} fontSize={0.22} anchorX="center">
        [{index}]
      </Text>
    </group>
  );
});

const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const ref = useRef();
  const opacity = useRef(0);

  useFrame(() => {
    if (!ref.current) return;
    opacity.current = Math.min(opacity.current + 0.05, 1);
    ref.current.material.opacity = opacity.current;
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      transparent
    >
      {text}
    </Text>
  );
};

export default VirtualPage5;
