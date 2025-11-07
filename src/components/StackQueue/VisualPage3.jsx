import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage3 = () => {
  const [queue, setQueue] = useState([10, 20, 30]);
  const [highlighted, setHighlighted] = useState(null);
  const [operationInfo, setOperationInfo] = useState(null);

  const spacing = 2; // horizontal distance between boxes

  const positions = useMemo(() => {
    return queue.map((_, i) => [i * spacing, 0, 0]);
  }, [queue]);

  const showOperationInfo = (title, complexity, description) => {
    setOperationInfo({ title, complexity, description });
  };

  // === Queue Operations ===
  const handleEnqueue = () => {
    const newVal = Math.floor(Math.random() * 90) + 10;
    setQueue((prev) => [...prev, newVal]);
    showOperationInfo(
      "Enqueue()",
      "O(1)",
      "Adds an element to the rear of the queue."
    );
  };

  const handleDequeue = () => {
    if (queue.length === 0) return;
    setHighlighted(0);
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setHighlighted(null);
    }, 600);
    showOperationInfo(
      "Dequeue()",
      "O(1)",
      "Removes the element from the front of the queue."
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
          text={"Introduction to Queues"}
          position={[0, 4.5, 0]}
          fontSize={0.55}
          color="white"
        />

        <FadeInText
          show={true}
          text={"FIFO (First In, First Out) Principle"}
          position={[0, 3.7, 0]}
          fontSize={0.35}
          color="#fde68a"
        />

        {/* Queue Base */}
        <QueueBase width={queue.length * spacing + 2} />

        {/* Boxes */}
        {queue.map((value, i) => (
          <QueueBox
            key={i}
            value={value}
            position={positions[i]}
            isFront={i === 0}
            isRear={i === queue.length - 1}
            highlight={highlighted === i}
          />
        ))}

        {/* Operation Info Panel (Left side) */}
        {operationInfo && (
          <OperationInfoPanel info={operationInfo} position={[-6, 1.5, 0]} />
        )}

        {/* Operations Panel (Right side) */}
        <OperationsPanel
          position={[6, 1.5, 0]}
          onEnqueue={handleEnqueue}
          onDequeue={handleDequeue}
        />

        {/* Analogy */}
        <FadeInText
          show={true}
          text={
            "Real-Life Example: A line at the ticket counter —\nfirst person served first."
          }
          position={[0, -2.5, 0]}
          fontSize={0.3}
          color="#a5f3fc"
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Queue Base ===
const QueueBase = ({ width }) => {
  const geometry = useMemo(() => new THREE.BoxGeometry(width, 0.2, 2), [width]);
  return (
    <mesh position={[width / 2 - 2, -0.1, 0]}>
      <primitive object={geometry} />
      <meshBasicMaterial color="#1e293b" opacity={0.3} transparent />
    </mesh>
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
      maxWidth={10}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Queue Box ===
const QueueBox = ({ value, position, isFront, isRear, highlight }) => {
  const color = highlight ? "#facc15" : "#34d399";
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current && meshRef.current.scale.y < 1) {
      meshRef.current.scale.y += 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <FadeInText
        show={true}
        text={String(value)}
        position={[0, 0.5, 0.6]}
        fontSize={0.4}
        color="white"
      />

      {isFront && (
        <Text
          position={[-1.6, 0.5, 0]}
          fontSize={0.3}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          Front  🔵 
        </Text>
      )}
      {isRear && (
        <Text
          position={[1.6, 0.5, 0]}
          fontSize={0.3}
          color="#f472b6"
          anchorX="center"
          anchorY="middle"
        >
          🟣 Rear
        </Text>
      )}
    </group>
  );
};

// === Operations Panel (Fixed - No Double Click, Visual Boxes) ===
const OperationsPanel = ({ position, onEnqueue, onDequeue }) => {
  const [activeButton, setActiveButton] = useState(null);

  const handleClick = (e, action, callback) => {
    e.stopPropagation(); // prevent duplicate clicks
    setActiveButton(action);
    callback();
    setTimeout(() => setActiveButton(null), 250);
  };

  const renderButton = (label, action, y, callback) => {
    const isActive = activeButton === action;
    const color = isActive ? "#22c55e" : "#38bdf8"; // green active, blue default

    return (
      <group position={[0, y, 0]}>
        {/* Button Box */}
        <mesh
          onClick={(e) => handleClick(e, action, callback)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.8, 0.6, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Button Label */}
        <Text
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.06]} // slightly above box
          onClick={(e) => handleClick(e, action, callback)}
        >
          {label}
        </Text>
      </group>
    );
  };

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"Queue Functions:"}
        position={[0, 3, 0]}
        fontSize={0.35}
        color="#fde68a"
      />

      {renderButton("➕ Enqueue", "enqueue", 2.2, onEnqueue)}
      {renderButton("➖ Dequeue", "dequeue", 1.4, onDequeue)}

      <FadeInText
        show={true}
        text={"Operations → O(1)\nFIFO Order"}
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

export default VisualPage3;
