import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = () => {
  const [queue, setQueue] = useState([15, 25, 35]);
  const [highlighted, setHighlighted] = useState(null);
  const [operationInfo, setOperationInfo] = useState(null);

  const spacing = 2;

  const positions = useMemo(() => {
    return queue.map((_, i) => [i * spacing, 0, 0]);
  }, [queue]);

  const showOperationInfo = (title, complexity, description) => {
    setOperationInfo({ title, complexity, description });
  };

  // === Operations ===
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

  const handlePeek = () => {
    if (queue.length === 0) return;
    setHighlighted(0);
    showOperationInfo(
      "Peek()",
      "O(1)",
      "Views the element at the front without removing it."
    );
    setTimeout(() => setHighlighted(null), 600);
  };

  return (
    <div className="w-full h-[400px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"Queue Operations & Complexity"}
          position={[0, 4.5, 0]}
          fontSize={0.55}
          color="white"
        />

        <FadeInText
          show={true}
          text={"Each operation has constant time complexity — O(1)"}
          position={[0, 3.8, 0]}
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

        {/* Operation Info Panel (Left Side) */}
        {operationInfo && (
          <OperationInfoPanel info={operationInfo} position={[-6, 1.5, 0]} />
        )}

        {/* Buttons for operations (Right Side) */}
        <OperationsPanel
          position={[6, 1.5, 0]}
          onEnqueue={handleEnqueue}
          onDequeue={handleDequeue}
          onPeek={handlePeek}
        />

        {/* Footer Explanation */}
        <FadeInText
          show={true}
          text={"Queues process elements in the order they arrive (FIFO)."}
          position={[0, -2.5, 0]}
          fontSize={0.35}
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
        position={[0, 1, 0.5]}
        fontSize={0.4}
        color="white"
      />

      {isFront && (
        <Text
          position={[0, 1.6, 0]}
          fontSize={0.3}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          🔵 Front
        </Text>
      )}
      {isRear && (
        <Text
          position={[0, 1.6, 0]}
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

// === Operations Panel ===
const OperationsPanel = ({ position, onEnqueue, onDequeue, onPeek }) => {
  const buttonStyle = {
    fontSize: 0.35,
    color: "#38bdf8",
    anchorX: "center",
    anchorY: "middle",
    cursor: "pointer",
  };

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"Queue Functions:"}
        position={[0, 2, 0]}
        fontSize={0.35}
        color="#fde68a"
      />

      <Text position={[0, 1.2, 0]} {...buttonStyle} onClick={onEnqueue}>
        ➕ Enqueue (Add Rear)
      </Text>
      <Text position={[0, 0.4, 0]} {...buttonStyle} onClick={onDequeue}>
        ➖ Dequeue (Remove Front)
      </Text>
      <Text position={[0, -0.4, 0]} {...buttonStyle} onClick={onPeek}>
        👁 Peek (View Front)
      </Text>

      <FadeInText
        show={true}
        text={"Each → O(1)"}
        position={[0, -2, 0]}
        fontSize={0.3}
        color="#fef9c3"
      />
    </group>
  );
};

// === Operation Info Panel ===
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

export default VisualPage4;
