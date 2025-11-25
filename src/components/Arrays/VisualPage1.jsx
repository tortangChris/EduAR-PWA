import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const StackActivity3D = () => {
  // Target algorithm steps for the activity
  const steps = [
    { type: "PUSH", value: 5 },
    { type: "PUSH", value: 9 },
    { type: "POP" },
    { type: "PUSH", value: 3 },
  ];

  // Tokens that the user can drag
  const [tokens, setTokens] = useState([
    { id: 1, value: 5, position: [-6, 0.7, -2], used: false },
    { id: 2, value: 9, position: [-6, 0.7, 0], used: false },
    { id: 3, value: 3, position: [-6, 0.7, 2], used: false },
  ]);

  // Current stack content
  const [stack, setStack] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(
    "Follow the algorithm steps using drag & drop and clicks."
  );
  const [completed, setCompleted] = useState(false);

  const boxHeight = 1.1;
  const gap = 0.15;
  const stackX = 0;
  const stackZ = 0;

  // Position of each box in stack
  const stackPositions = useMemo(() => {
    return stack.map((_, i) => {
      const y = i * (boxHeight + gap);
      return [stackX, y, stackZ];
    });
  }, [stack]);

  const expectedStep = steps[currentStep] || null;

  // Handle dropping a token somewhere in the scene
  const handleTokenDrop = (id, pos, value) => {
    if (completed) return;

    const [x, , z] = pos;

    // Larger, more forgiving drop radius
    const DROP_RADIUS = 2.5;
    const distanceToStack = Math.hypot(x - stackX, z - stackZ);
    const isInDropArea = distanceToStack <= DROP_RADIUS;

    if (isInDropArea) {
      if (!expectedStep) return;

      if (expectedStep.type === "PUSH") {
        if (expectedStep.value === value) {
          // Snap token visually to the top of the stack
          const y = stack.length * (boxHeight + gap);
          const snappedPos = [stackX, y + 0.7, stackZ];

          const newStack = [...stack, { id, value }];
          setStack(newStack);

          setTokens((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, used: true, position: snappedPos } : t
            )
          );

          advanceStep(`✅ Correct: PUSH ${value} onto the stack.`);
        } else {
          setFeedback(
            `❌ Wrong value. Expected PUSH ${expectedStep.value}, but you used ${value}.`
          );
        }
      } else {
        setFeedback(
          `❌ Wrong action. Expected ${expectedStep.type}, but you tried PUSH.`
        );
      }
    } else {
      // Not in drop area: just drop the token where it is
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, position: pos } : t))
      );
    }
  };

  const advanceStep = (message) => {
    const nextStep = currentStep + 1;
    setFeedback(message);
    setCurrentStep(nextStep);

    if (nextStep >= steps.length) {
      setCompleted(true);
      setFeedback(
        message + " 🎉 Activity Complete! You followed the stack algorithm correctly."
      );
    }
  };

  // When user clicks top of stack -> POP attempt
  const handlePopClick = () => {
    if (completed) return;
    if (!expectedStep) return;

    if (stack.length === 0) {
      setFeedback("❌ Cannot POP: stack is empty.");
      return;
    }

    if (expectedStep.type !== "POP") {
      setFeedback(
        `❌ Wrong action. Expected ${expectedStep.type}, but you tried POP.`
      );
      return;
    }

    const top = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    advanceStep(`✅ Correct: POP removed ${top.value} from the stack.`);
  };

  const resetActivity = () => {
    setStack([]);
    setCurrentStep(0);
    setFeedback("Activity reset. Follow the steps again.");
    setCompleted(false);
    setTokens([
      { id: 1, value: 5, position: [-6, 0.7, -2], used: false },
      { id: 2, value: 9, position: [-6, 0.7, 0], used: false },
      { id: 3, value: 3, position: [-6, 0.7, 2], used: false },
    ]);
  };

  const currentStepText = expectedStep
    ? expectedStep.type === "PUSH"
      ? `Step ${currentStep + 1}: PUSH ${expectedStep.value}`
      : `Step ${currentStep + 1}: POP`
    : "All steps done!";

  return (
    <div className="w-full h-[420px]">
      <Canvas camera={{ position: [10, 8, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={0.9} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"Stack Activity: Drag & Drop + Click"}
          position={[0, 9, 0]}
          fontSize={0.7}
          color="white"
        />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[40, 20]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        {/* Stack background board */}
        <StackBackground
          levels={6}
          boxHeight={boxHeight}
          gap={gap}
          position={[stackX, 0, stackZ - 1]}
        />

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

        {/* Hint for stack top */}
        <FadeInText
          show={true}
          text={"Drop here to PUSH\nClick top box to POP"}
          position={[stackX, 6.5, stackZ + 2]}
          fontSize={0.35}
          color="#fde68a"
        />

        {/* Stack top area marker */}
        <StackTopArea position={[stackX, 0.05, stackZ]} />

        {/* Tokens area label */}
        <FadeInText
          show={true}
          text={"Drag these tokens"}
          position={[-6, 3.5, -3.5]}
          fontSize={0.4}
          color="#38bdf8"
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
              />
            )
        )}

        {/* Steps + feedback panel */}
        <ActivityPanel
          position={[8.5, 4, 0]}
          currentStepText={currentStepText}
          feedback={feedback}
          onReset={resetActivity}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

/* === Fade-in Text === */
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.7);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.06, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
      scale.current = 0.7;
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

/* === Stack Top Drop Area Marker === */
const StackTopArea = ({ position }) => {
  return (
    <mesh
      position={[position[0], 0.02, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[1.3, 1.7, 32]} />
      <meshStandardMaterial color="#22c55e" opacity={0.35} transparent />
    </mesh>
  );
};

/* === Single Stack Box (click top to POP) === */
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

      {/* Value */}
      <Text
        position={[0, size[1] / 2 + 0.05, size[2] / 2 + 0.02]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index label */}
      <Text
        position={[-size[0] / 2 - 0.3, size[1] / 2 - 0.1, 0]}
        fontSize={0.28}
        color="#e5e7eb"
        anchorX="right"
        anchorY="middle"
      >
        idx {index}
      </Text>

      {isTop && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.3}
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
const DraggableToken = ({ id, value, initialPosition, onDrop }) => {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    setDragging(false);

    // Use actual world position at release time
    const p = e.point;
    const dropPos = [p.x, 0.7, p.z];

    setPosition(dropPos);
    onDrop(id, dropPos, value);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    const p = e.point;
    setPosition([p.x, 0.7, p.z]);
  };

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <Text
        position={[0, 0.5, 0.7]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </group>
  );
};

/* === Side Panel: Current Step + Feedback + Reset === */
const ActivityPanel = ({ position, currentStepText, feedback, onReset }) => {
  return (
    <group>
      <FadeInText
        show={true}
        text={"Stack Algorithm Steps"}
        position={[position[0], position[1] + 2.4, position[2]]}
        fontSize={0.55}
        color="#e5e7eb"
      />
      <Text
        position={[position[0], position[1] + 1, position[2]]}
        fontSize={0.35}
        color="#a5b4fc"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
      >
        {currentStepText}
      </Text>
      <Text
        position={[position[0], position[1] - 0.8, position[2]]}
        fontSize={0.3}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
        maxWidth={9}
        textAlign="center"
      >
        {feedback}
      </Text>

      {/* Reset "button" */}
      <Text
        position={[position[0], position[1] - 2.3, position[2]]}
        fontSize={0.35}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        onClick={onReset}
      >
        🔄 Reset Activity
      </Text>
    </group>
  );
};

export default StackActivity3D;
