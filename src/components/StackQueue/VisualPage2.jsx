import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage2 = () => {
  const [stack, setStack] = useState([10, 20, 30]);
  const [highlighted, setHighlighted] = useState(null);
  const [operationInfo, setOperationInfo] = useState(null);

  const spacing = 1.6;

  const positions = useMemo(() => {
    return stack.map((_, i) => [0, i * spacing, 0]);
  }, [stack]);

  // === Utility: Show operation info ===
  const showOperationInfo = (title, complexity, description) => {
    setOperationInfo({ title, complexity, description });
  };

  // === Operations ===
  const handlePush = () => {
    const newVal = Math.floor(Math.random() * 90) + 10;
    setStack((prev) => [...prev, newVal]);
    showOperationInfo(
      "Push()",
      "O(1)",
      "Adds a new element on top of the stack."
    );
  };

  const handlePop = () => {
    if (stack.length === 0) return;
    setStack((prev) => prev.slice(0, -1));
    showOperationInfo(
      "Pop()",
      "O(1)",
      "Removes the top element from the stack."
    );
  };

  const handlePeek = () => {
    if (stack.length === 0) return;
    const topIndex = stack.length - 1;
    setHighlighted(topIndex);
    setTimeout(() => setHighlighted(null), 1000);
    showOperationInfo(
      "Peek()",
      "O(1)",
      "Views the top element without removing it."
    );
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"Stack Operations & Complexity"}
          position={[5, 5, 0]}
          fontSize={0.6}
          color="white"
        />

        {/* Stack Base */}
        <StackBackground height={stack.length * spacing + 2} />

        {/* Boxes */}
        {stack.map((value, i) => (
          <StackBox
            key={i}
            index={i}
            value={value}
            position={[0, i * spacing, 0]}
            isTop={i === stack.length - 1}
            highlight={highlighted === i}
          />
        ))}

        {/* Operation Info Panel (Left side) */}
        {operationInfo && (
          <OperationInfoPanel info={operationInfo} position={[-6, 2, 0]} />
        )}

        {/* Operations Panel (Right side) */}
        <OperationsPanel
          position={[5, 2, 0]}
          onPush={handlePush}
          onPop={handlePop}
          onPeek={handlePeek}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Stack Background ===
const StackBackground = ({ height }) => {
  const geometry = useMemo(
    () => new THREE.BoxGeometry(3.5, height, 0.08),
    [height]
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group position={[0, height / 2 - 1, -0.5]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#1e293b" opacity={0.3} transparent />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#64748b" linewidth={2} />
      </lineSegments>
    </group>
  );
};

// === Fade-in Text ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.05, 0);
      scale.current = 0.6;
    }
    if (ref.current && ref.current.material) {
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
      anchorX="center"
      anchorY="middle"
      material-transparent
      maxWidth={8}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Stack Box ===
const StackBox = ({ index, value, position, isTop, highlight }) => {
  const size = [2, 1, 1];
  const color = highlight ? "#facc15" : isTop ? "#60a5fa" : "#34d399";
  const meshRef = useRef();

  // Smooth pop-in animation
  useFrame(() => {
    if (meshRef.current && meshRef.current.scale.y < 1) {
      meshRef.current.scale.y += 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>

      <FadeInText
        show={true}
        text={String(value)}
        position={[0, 0.6, 0.57]}
        fontSize={0.4}
        color="white"
      />

      {isTop && (
        <Text
          position={[0, 1.6, 0]}
          fontSize={0.3}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          🟢 Top
        </Text>
      )}
    </group>
  );
};

// === Operations Panel (Right Side Buttons - FIXED) ===
const OperationsPanel = ({ position, onPush, onPop, onPeek }) => {
  const [activeButton, setActiveButton] = useState(null);

  const handleClick = (e, action, callback) => {
    e.stopPropagation(); // Prevent double trigger
    setActiveButton(action);
    callback();
    setTimeout(() => setActiveButton(null), 250);
  };

  const renderButton = (label, action, y, callback) => {
    const isActive = activeButton === action;
    const color = isActive ? "#22c55e" : "#38bdf8"; // green when clicked, blue default

    return (
      <group position={[0, y, 0]}>
        {/* Button Box */}
        <mesh
          onClick={(e) => handleClick(e, action, callback)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.6, 0.6, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Button Label */}
        <Text
          fontSize={0.33}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.06]}
          onClick={(e) => handleClick(e, action, callback)}
        >
          {label}
        </Text>
      </group>
    );
  };

  return (
    <group position={position}>
      {/* Title */}
      <FadeInText
        show={true}
        text={"Stack Functions:"}
        position={[0, 2, 0]}
        fontSize={0.35}
        color="#fde68a"
      />

      {/* Clickable Buttons */}
      {renderButton("➕ Push", "push", 1.2, onPush)}
      {renderButton("➖ Pop", "pop", 0.4, onPop)}
      {renderButton("👁️ Peek", "peek", -0.4, onPeek)}

      {/* Complexity Info */}
      <FadeInText
        show={true}
        text={"All operations → O(1)"}
        position={[0, -2, 0]}
        fontSize={0.28}
        color="#fef9c3"
      />
    </group>
  );
};

// === Operation Info Panel (Left Side Indicator) ===
const OperationInfoPanel = ({ info, position }) => {
  const content = [
    `🔹 ${info.title}`,
    `Complexity: ${info.complexity}`,
    "",
    info.description,
  ].join("\n");

  return (
    <group>
      <FadeInText
        show={true}
        text={content}
        position={position}
        fontSize={0.32}
        color="#a5f3fc"
      />
    </group>
  );
};

export default VisualPage2;
