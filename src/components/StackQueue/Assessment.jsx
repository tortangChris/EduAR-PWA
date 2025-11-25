import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const StackActivity3D = () => {
  // More challenging sequence
  const steps = [
    { type: "PUSH", value: 7 },
    { type: "PUSH", value: 2 },
    { type: "PUSH", value: 9 },
    { type: "POP" },
    { type: "PUSH", value: 4 },
    { type: "POP" },
    { type: "PUSH", value: 1 },
    { type: "POP" },
    { type: "POP" },
  ];

  // Tokens include distractors
  const [tokens, setTokens] = useState([
    { id: 1, value: 7, position: [-7, 0.7, -3], used: false },
    { id: 2, value: 2, position: [-7, 0.7, -1], used: false },
    { id: 3, value: 9, position: [-7, 0.7, 1], used: false },
    { id: 4, value: 4, position: [-7, 0.7, 3], used: false },
    { id: 5, value: 1, position: [-9, 0.7, -2], used: false },
    { id: 6, value: 3, position: [-9, 0.7, 0], used: false }, // distractor
    { id: 7, value: 8, position: [-9, 0.7, 2], used: false }, // distractor
  ]);

  const [stack, setStack] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(
    "Follow the algorithm using drag (PUSH) and click (POP)."
  );
  const [completed, setCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const boxHeight = 1.1;
  const gap = 0.15;
  const stackX = 0;
  const stackZ = 0;

  const stackPositions = useMemo(() => {
    return stack.map((_, i) => {
      const y = i * (boxHeight + gap);
      return [stackX, y, stackZ];
    });
  }, [stack]);

  const expectedStep = steps[currentStep] || null;

  const handleTokenDrop = (id, pos, value) => {
    if (completed) return;

    const [x, , z] = pos;
    const distanceToStack = Math.hypot(x - stackX, z - stackZ);

    if (distanceToStack < 2.0) {
      // Attempt PUSH
      if (!expectedStep) return;

      if (expectedStep.type === "PUSH") {
        if (expectedStep.value === value) {
          const newStack = [...stack, { id, value }];
          setStack(newStack);
          setTokens((prev) =>
            prev.map((t) => (t.id === id ? { ...t, used: true } : t))
          );
          advanceStep(`✅ Correct: PUSH ${value} on top.`);
        } else {
          addMistake(
            `❌ Wrong value. Expected PUSH ${expectedStep.value}, but used ${value}.`
          );
        }
      } else {
        addMistake(
          `❌ Wrong action. Expected ${expectedStep.type}, but you tried PUSH.`
        );
      }
    } else {
      // Just update position where dropped
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, position: pos } : t))
      );
    }
  };

  const addMistake = (msg) => {
    setMistakes((m) => m + 1);
    setFeedback(msg);
  };

  const advanceStep = (msg) => {
    const nextStep = currentStep + 1;
    setFeedback(msg);
    setCurrentStep(nextStep);

    if (nextStep >= steps.length) {
      setCompleted(true);
      const finalStack = stack
        .map((s) => s.value)
        .join(" → ") || "(empty stack)";
      const resultMsg =
        mistakes <= 2
          ? "🎉 Great job! You passed the assessment."
          : "⚠ You finished the sequence, but made too many mistakes. Try again for a cleaner run.";

      setFeedback(
        `${msg}\n\nFinal stack (bottom → top): ${finalStack}\nMistakes: ${mistakes}\n${resultMsg}`
      );
    }
  };

  const handlePopClick = () => {
    if (completed) return;
    if (!expectedStep) return;

    if (stack.length === 0) {
      addMistake("❌ Cannot POP: stack is empty.");
      return;
    }

    if (expectedStep.type !== "POP") {
      addMistake(
        `❌ Wrong action. Expected ${expectedStep.type}, but you tried POP.`
      );
      return;
    }

    const top = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    advanceStep(`✅ Correct: POP removed ${top.value} from top.`);
  };

  const resetActivity = () => {
    setStack([]);
    setCurrentStep(0);
    setFeedback("Activity reset. Follow the sequence again.");
    setCompleted(false);
    setMistakes(0);
    setTokens([
      { id: 1, value: 7, position: [-7, 0.7, -3], used: false },
      { id: 2, value: 2, position: [-7, 0.7, -1], used: false },
      { id: 3, value: 9, position: [-7, 0.7, 1], used: false },
      { id: 4, value: 4, position: [-7, 0.7, 3], used: false },
      { id: 5, value: 1, position: [-9, 0.7, -2], used: false },
      { id: 6, value: 3, position: [-9, 0.7, 0], used: false },
      { id: 7, value: 8, position: [-9, 0.7, 2], used: false },
    ]);
    setIsDraggingAny(false);
  };

  const currentStepLabel = expectedStep
    ? expectedStep.type === "PUSH"
      ? `Step ${currentStep + 1} of ${steps.length}: PUSH ?`
      : `Step ${currentStep + 1} of ${steps.length}: POP`
    : "All steps done";

  const algorithmList = steps
    .map((s, i) =>
      s.type === "PUSH"
        ? `${i + 1}. PUSH ${s.value}`
        : `${i + 1}. POP`
    )
    .join("\n");

  return (
    <div className="w-full h-[460px]">
      <Canvas camera={{ position: [11, 9, 16], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={0.9} />

        {/* Title panel in 3D */}
        <Panel3D
          position={[0, 9, -2]}
          size={[10, 1.8, 0.4]}
          color="#0f172a"
          title="Stack Assessment (3D)"
          subtitle="Use drag to PUSH and click top box to POP"
        />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[40, 20]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        {/* Stack background board */}
        <StackBackground
          levels={7}
          boxHeight={boxHeight}
          gap={gap}
          position={[stackX, 0, stackZ - 1]}
        />

        {/* Drop zone as 3D frame */}
        <DropZonePanel position={[stackX, 0.1, stackZ]} />

        {/* Stack boxes */}
        {stack.map((item, i) => (
          <StackBox
            key={item.id}
            index={i}
            value={item.value}
            position={stackPositions[i]}
            isTop={i === stack.length - 1}
            onTopClick={i === stack.length - 1 ? handlePopClick : undefined}
          />
        ))}

        {/* Tokens label panel */}
        <Panel3D
          position={[-8, 3.5, -5]}
          size={[6, 2, 0.4]}
          color="#111827"
          title="Tokens"
          subtitle="Drag a token into the green zone to attempt PUSH."
        />

        {/* Tokens (draggable) */}
        {tokens.map(
          (token) =>
            !token.used && (
              <DraggableToken
                key={token.id}
                id={token.id}
                value={token.value}
                initialPosition={token.position}
                onDrop={handleTokenDrop}
                setGlobalDragging={setIsDraggingAny}
              />
            )
        )}

        {/* Right-side assessment / steps panel */}
        <StepsPanel3D
          position={[9, 4.5, 0]}
          size={[7, 7, 0.5]}
          currentStepLabel={currentStepLabel}
          algorithmList={algorithmList}
          feedback={feedback}
          mistakes={mistakes}
          onReset={resetActivity}
        />

        <OrbitControls
          makeDefault
          enableRotate={!isDraggingAny}
          enablePan={!isDraggingAny}
          enableZoom={!isDraggingAny}
        />
      </Canvas>
    </div>
  );
};

/* === Generic 3D Panel with title + subtitle === */
const Panel3D = ({ position, size, color, title, subtitle }) => {
  const [w, h, d] = size;

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} opacity={0.95} transparent />
      </mesh>

      {/* Title text on front face */}
      <Text
        position={[0, 0.3, d / 2 + 0.01]}
        fontSize={0.45}
        color="#e5e7eb"
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.6}
        textAlign="center"
      >
        {title}
      </Text>

      {/* Subtitle text */}
      {subtitle && (
        <Text
          position={[0, -0.4, d / 2 + 0.01]}
          fontSize={0.28}
          color="#93c5fd"
          anchorX="center"
          anchorY="middle"
          maxWidth={w - 0.6}
          textAlign="center"
        >
          {subtitle}
        </Text>
      )}
    </group>
  );
};

/* === Steps + Feedback Panel === */
const StepsPanel3D = ({
  position,
  size,
  currentStepLabel,
  algorithmList,
  feedback,
  mistakes,
  onReset,
}) => {
  const [w, h, d] = size;

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#020617" opacity={0.98} transparent />
      </mesh>

      {/* Header */}
      <Text
        position={[0, h / 2 - 0.7, d / 2 + 0.01]}
        fontSize={0.4}
        color="#e5e7eb"
        anchorX="center"
        anchorY="middle"
      >
        Algorithm & Status
      </Text>

      {/* Current step label */}
      <Text
        position={[0, h / 2 - 1.6, d / 2 + 0.01]}
        fontSize={0.3}
        color="#a5b4fc"
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.6}
        textAlign="center"
      >
        {currentStepLabel}
      </Text>

      {/* Algorithm list */}
      <Text
        position={[-w / 2 + 0.5, 0.5, d / 2 + 0.01]}
        fontSize={0.26}
        color="#bae6fd"
        anchorX="left"
        anchorY="top"
        maxWidth={w - 1}
        textAlign="left"
      >
        {algorithmList}
      </Text>

      {/* Feedback */}
      <Text
        position={[0, -0.9, d / 2 + 0.01]}
        fontSize={0.26}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.6}
        textAlign="center"
      >
        {feedback}
      </Text>

      {/* Mistakes + Reset */}
      <Text
        position={[-w / 2 + 0.6, -h / 2 + 0.8, d / 2 + 0.01]}
        fontSize={0.28}
        color="#fca5a5"
        anchorX="left"
        anchorY="middle"
      >
        Mistakes: {mistakes}
      </Text>

      <Text
        position={[w / 2 - 0.6, -h / 2 + 0.8, d / 2 + 0.01]}
        fontSize={0.28}
        color="#38bdf8"
        anchorX="right"
        anchorY="middle"
        onClick={onReset}
      >
        🔄 Reset
      </Text>
    </group>
  );
};

/* === Stack Background Board === */
const StackBackground = ({ levels, boxHeight, gap, position }) => {
  const totalHeight = levels * (boxHeight + gap) + 1;
  const width = 3.2;
  const depth = 0.3;

  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(width, totalHeight, depth),
    [width, totalHeight, depth]
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  return (
    <group position={[position[0], totalHeight / 2 - 0.5, position[2]]}>
      <mesh geometry={boxGeo}>
        <meshStandardMaterial color="#020617" opacity={0.9} transparent />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color="#4b5563" linewidth={1} />
      </lineSegments>
    </group>
  );
};

/* === Drop Zone as 3D panel frame === */
const DropZonePanel = ({ position }) => {
  return (
    <group position={[position[0], 0.1, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.8, 32]} />
        <meshStandardMaterial color="#22c55e" opacity={0.35} transparent />
      </mesh>
      <Text
        position={[0, 0.05, 2]}
        fontSize={0.3}
        color="#bbf7d0"
        anchorX="center"
        anchorY="middle"
      >
        PUSH zone
      </Text>
    </group>
  );
};

/* === Stack Box (click top to POP) === */
const StackBox = ({ index, value, position, isTop, onTopClick }) => {
  const size = [2, 1.1, 1.1];
  const baseColor = isTop ? "#f97316" : "#38bdf8";

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={isTop ? onTopClick : undefined}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={baseColor}
          emissive={isTop ? "#fb923c" : "#000000"}
          emissiveIntensity={isTop ? 0.6 : 0}
        />
      </mesh>

      {/* Value on front face */}
      <Text
        position={[0, size[1] / 2 + 0.05, size[2] / 2 + 0.02]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index label on left side */}
      <Text
        position={[-size[0] / 2 - 0.3, size[1] / 2 - 0.1, 0]}
        fontSize={0.26}
        color="#e5e7eb"
        anchorX="right"
        anchorY="middle"
      >
        idx {index}
      </Text>

      {isTop && (
        <Text
          position={[0, size[1] + 0.7, 0]}
          fontSize={0.28}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Top (click to POP)
        </Text>
      )}
    </group>
  );
};

/* === Draggable Token === */
const DraggableToken = ({
  id,
  value,
  initialPosition,
  onDrop,
  setGlobalDragging,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setGlobalDragging(true);
    document.body.style.cursor = "grabbing";
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    setDragging(false);
    setGlobalDragging(false);
    document.body.style.cursor = "default";
    onDrop(id, position, value);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    const p = e.point;
    setPosition([p.x, 0.7, p.z]);
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (!dragging) document.body.style.cursor = "grab";
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    if (!dragging) document.body.style.cursor = "default";
  };

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <Text
        position={[0, 0.5, 0.7]}
        fontSize={0.38}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </group>
  );
};

export default StackActivity3D;
