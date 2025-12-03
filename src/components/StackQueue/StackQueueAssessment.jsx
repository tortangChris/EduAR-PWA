// StackQueueAssessment.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_STACK = [10, 20, 30, 40];

const StackQueueAssessment = ({
  initialData = DEFAULT_STACK,
  spacing = 1.4,
  passingRatio = 0.75,
  onPassStatusChange,
}) => {
  const modes = ["intro", "push", "pop", "peek", "lifo", "done"];
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];

  const [stack, setStack] = useState([...initialData]);
  const [question, setQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [animState, setAnimState] = useState({});

  const [score, setScore] = useState(0);
  const totalAssessments = 4;

  const [isPassed, setIsPassed] = useState(false);
  const [draggedBox, setDraggedBox] = useState(null);
  const [holdingBox, setHoldingBox] = useState(null);
  const [boxPositions, setBoxPositions] = useState([]);

  const controlsRef = useRef();

  const originalPositions = useMemo(() => {
    return stack.map((_, i) => [0, i * spacing, 0]);
  }, [stack, spacing]);

  // Initialize box positions
  useEffect(() => {
    setBoxPositions(originalPositions.map((pos) => [...pos]));
  }, [originalPositions]);

  // On mount, check localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stackAssessmentPassed");
      if (stored === "true") {
        setIsPassed(true);
        setScore(totalAssessments);
        setModeIndex(modes.indexOf("done"));
        onPassStatusChange && onPassStatusChange(true);
      }
    } catch (e) {
      console.warn("Unable to access localStorage", e);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
    setDraggedBox(null);
    setHoldingBox(null);
    setBoxPositions(originalPositions.map((pos) => [...pos]));

    if (mode === "push") preparePushQuestion();
    if (mode === "pop") preparePopQuestion();
    if (mode === "peek") preparePeekQuestion();
    if (mode === "lifo") prepareLIFOQuestion();
    if (mode === "intro") {
      setStack([...initialData]);
      setScore(0);
    }
    if (mode === "done") setQuestion(null);
  }, [modeIndex]);

  useEffect(() => {
    if (mode !== "done") return;

    const ratio = score / totalAssessments;
    const passed = ratio >= passingRatio;

    setIsPassed(passed);
    onPassStatusChange && onPassStatusChange(passed);

    try {
      if (passed) {
        localStorage.setItem("stackAssessmentPassed", "true");
      } else {
        localStorage.removeItem("stackAssessmentPassed");
      }
    } catch (e) {
      console.warn("Unable to write localStorage", e);
    }
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () =>
    setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  // --- Question generators for Stack ---
  const preparePushQuestion = () => {
    const newValue = Math.floor(Math.random() * 90) + 10;
    setQuestion({
      prompt: `If we PUSH ${newValue} onto the stack, which element will be directly BELOW it? (Push — O(1))`,
      newValue,
      answerIndex: stack.length - 1, // Current top will be below
      type: "push",
    });
  };

  const preparePopQuestion = () => {
    const topIndex = stack.length - 1;
    setQuestion({
      prompt: `Which element will be REMOVED when we call POP? (Pop — O(1), LIFO principle)`,
      answerIndex: topIndex,
      type: "pop",
    });
  };

  const preparePeekQuestion = () => {
    const topIndex = stack.length - 1;
    setQuestion({
      prompt: `Which element does PEEK return? Drag the TOP element to the answer zone. (Peek — O(1))`,
      answerIndex: topIndex,
      type: "peek",
    });
  };

  const prepareLIFOQuestion = () => {
    // Ask which element was pushed LAST (should be top)
    const topIndex = stack.length - 1;
    setQuestion({
      prompt: `LIFO means "Last In, First Out". Which element was added LAST and will be removed FIRST?`,
      answerIndex: topIndex,
      type: "lifo",
    });
  };

  const handleHoldStart = (index) => {
    setHoldingBox(index);
  };

  const handleHoldComplete = (index) => {
    setDraggedBox(index);
    setSelectedIndex(index);
    setHoldingBox(null);
  };

  const handleHoldCancel = () => {
    setHoldingBox(null);
  };

  const handleDragEnd = () => {
    setDraggedBox(null);
    setHoldingBox(null);
  };

  const updateBoxPosition = (index, newPosition) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = newPosition;
      return updated;
    });
  };

  const resetBoxPosition = (index) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = [...originalPositions[index]];
      return updated;
    });
  };

  const handleDropOnAnswer = (droppedIndex) => {
    if (!question) return;

    const markScore = (correct) => {
      if (correct) setScore((s) => s + 1);
    };

    let correct = false;

    if (question.type === "push") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Element ${stack[droppedIndex]} is current top`, () => {
        // Animate push
        const newStack = [...stack, question.newValue];
        setAnimState({ new: stack.length });
        setTimeout(() => {
          setStack(newStack);
          setAnimState({});
          nextMode();
        }, 800);
      });
    } else if (question.type === "pop") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Popped ${stack[droppedIndex]} from top`, () => {
        // Animate pop
        const fadeFlags = { [question.answerIndex]: "fade" };
        setAnimState(fadeFlags);
        setTimeout(() => {
          const newStack = [...stack];
          newStack.pop();
          setStack(newStack);
          setAnimState({});
          nextMode();
        }, 800);
      });
    } else if (question.type === "peek") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Peek returns ${stack[droppedIndex]}`, () => {
        // Highlight top briefly
        setAnimState({ [question.answerIndex]: "highlight" });
        setTimeout(() => {
          setAnimState({});
          resetBoxPosition(droppedIndex);
          nextMode();
        }, 800);
      });
    } else if (question.type === "lifo") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `${stack[droppedIndex]} was added last (LIFO)`, () => {
        resetBoxPosition(droppedIndex);
        nextMode();
      });
    }

    setDraggedBox(null);
  };

  const showFeedback = (correct, label, callback) => {
    setFeedback({
      text: correct ? `✓ Correct — ${label}` : `✗ Incorrect — ${label}`,
      correct,
    });
    setTimeout(() => {
      setFeedback(null);
      callback && callback();
    }, 1200);
  };

  const handleBoxClick = (i) => {
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    setSelectedIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div
      className="w-full h-[500px]"
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        KhtmlUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        {/* Header */}
        <FadeText
          text={
            mode === "intro"
              ? "Stack — Assessment"
              : mode === "done"
              ? "Assessment Complete!"
              : `Assessment ${modeIndex}: ${mode.toUpperCase()}`
          }
          position={[0, 6, 0]}
          fontSize={0.55}
          color="#facc15"
        />

        {/* Instruction or question */}
        <FadeText
          text={
            mode === "intro"
              ? "Click the button below to start the Stack assessment"
              : mode === "done"
              ? isPassed
                ? "You passed this assessment!"
                : "You did not reach the passing score."
              : question
              ? question.prompt
              : ""
          }
          position={[0, 5.2, 0]}
          fontSize={0.26}
          color="white"
        />

        {/* Progress indicator */}
        {mode !== "intro" && mode !== "done" && (
          <FadeText
            text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
            position={[0, 4.5, 0]}
            fontSize={0.22}
            color="#fde68a"
          />
        )}

        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[20, 14]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
        </mesh>

        {/* Stack Background */}
        {mode !== "intro" && mode !== "done" && (
          <StackBackground height={stack.length * spacing + 2} />
        )}

        {/* Answer Drop Zone */}
        {mode !== "intro" && mode !== "done" && (
          <AnswerDropZone
            position={[5, 0, 2]}
            isActive={draggedBox !== null}
            draggedBox={draggedBox}
            onDrop={handleDropOnAnswer}
          />
        )}

        {/* LIFO Indicator */}
        {mode !== "intro" && mode !== "done" && (
          <group position={[-4, 2, 0]}>
            <Text
              fontSize={0.4}
              color="#a78bfa"
              anchorX="center"
              anchorY="middle"
            >
              LIFO
            </Text>
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.22}
              color="#c4b5fd"
              anchorX="center"
              anchorY="middle"
            >
              Last In
            </Text>
            <Text
              position={[0, -0.85, 0]}
              fontSize={0.22}
              color="#c4b5fd"
              anchorX="center"
              anchorY="middle"
            >
              First Out
            </Text>
            {/* Arrow pointing up */}
            <mesh position={[0, 1.2, 0]}>
              <coneGeometry args={[0.2, 0.5, 8]} />
              <meshBasicMaterial color="#a78bfa" />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[0.1, 0.6, 0.1]} />
              <meshBasicMaterial color="#a78bfa" />
            </mesh>
          </group>
        )}

        {/* Stack Elements */}
        {mode === "intro" ? (
          <StartButton position={[0, 0, 0]} onClick={() => handleBoxClick(0)} />
        ) : mode === "done" ? (
          <>
            <FadeText
              text={`Your Score: ${score} / ${totalAssessments}`}
              position={[0, 2, 0]}
              fontSize={0.5}
              color="#60a5fa"
            />
            <FadeText
              text={isPassed ? "Status: PASSED ✓" : "Status: FAILED ✗"}
              position={[0, 1.2, 0]}
              fontSize={0.45}
              color={isPassed ? "#22c55e" : "#ef4444"}
            />
            <RestartButton
              position={[0, -0.5, 0]}
              onClick={() => {
                setModeIndex(0);
                setStack([...initialData]);
                setScore(0);
                setIsPassed(false);
                try {
                  localStorage.removeItem("stackAssessmentPassed");
                } catch (e) {}
              }}
            />
          </>
        ) : (
          <>
            {/* Render stack boxes */}
            {stack.map((value, i) => {
              let extraOpacity = 1;
              if (animState[i] === "fade") extraOpacity = 0.25;
              const isSelected = selectedIndex === i;
              const isTop = i === stack.length - 1;
              const isHighlighted = animState[i] === "highlight";

              return (
                <DraggableStackBox
                  key={i}
                  index={i}
                  value={value}
                  position={boxPositions[i] || originalPositions[i]}
                  originalPosition={originalPositions[i]}
                  selected={isSelected}
                  isDragging={draggedBox === i}
                  isHolding={holdingBox === i}
                  anyDragging={draggedBox !== null}
                  opacity={extraOpacity}
                  isTop={isTop}
                  isHighlighted={isHighlighted}
                  onBoxClick={() => handleBoxClick(i)}
                  onHoldStart={() => handleHoldStart(i)}
                  onHoldComplete={() => handleHoldComplete(i)}
                  onHoldCancel={handleHoldCancel}
                  onDragEnd={() => {
                    handleDragEnd();
                    resetBoxPosition(i);
                  }}
                  onPositionChange={(pos) => updateBoxPosition(i, pos)}
                  controlsRef={controlsRef}
                />
              );
            })}

            {/* Base platform */}
            <mesh position={[0, -0.8, 0]}>
              <boxGeometry args={[3, 0.3, 1.5]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <Text
              position={[0, -0.8, 0.8]}
              fontSize={0.2}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              BOTTOM
            </Text>
          </>
        )}

        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[2, 4, 2]}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={draggedBox === null && holdingBox === null}
        />
      </Canvas>
    </div>
  );
};

// === Stack Background ===
const StackBackground = ({ height }) => {
  const geometry = useMemo(
    () => new THREE.BoxGeometry(3.2, height, 0.08),
    [height]
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group position={[0, height / 2 - 1, -0.6]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#1e293b" opacity={0.4} transparent />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#64748b" linewidth={2} />
      </lineSegments>
    </group>
  );
};

// === Answer Drop Zone ===
const AnswerDropZone = ({ position, isActive, draggedBox, onDrop }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const glowRef = useRef(0);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isActive && hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      if (isActive) {
        glowRef.current += 0.05;
        const pulse = Math.sin(glowRef.current) * 0.3 + 0.7;
        meshRef.current.material.emissiveIntensity = pulse * 0.5;
      } else {
        meshRef.current.material.emissiveIntensity = 0;
      }
    }
  });

  const handlePointerUp = () => {
    if (isActive && draggedBox !== null) {
      onDrop(draggedBox);
    }
  };

  return (
    <group position={position}>
      {/* Drop zone base */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[3.5, 2.5, 0.3]} />
        <meshStandardMaterial
          color={hovered && isActive ? "#22c55e" : isActive ? "#f97316" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#f97316" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Drop zone border */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[3.6, 2.6, 0.32]} />
        <meshBasicMaterial
          color={hovered && isActive ? "#22c55e" : "#fb923c"}
          wireframe
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0, 0.2]}
        fontSize={0.3}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>

      {/* Stack icon */}
      <group position={[0, -0.6, 0.2]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.1]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.1]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.1]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* Arrow indicator when dragging */}
      {isActive && (
        <group position={[0, 1.8, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.25, 0.5, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// === Draggable Stack Box ===
const DraggableStackBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  anyDragging,
  opacity = 1,
  isTop,
  isHighlighted,
  onBoxClick,
  onHoldStart,
  onHoldComplete,
  onHoldCancel,
  onDragEnd,
  onPositionChange,
  controlsRef,
}) => {
  const groupRef = useRef();
  const { camera, gl, raycaster, pointer } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartTimeRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const offset = useRef(new THREE.Vector3());
  const intersection = useRef(new THREE.Vector3());

  const HOLD_DURATION = 500;
  const CLICK_THRESHOLD = 5;

  const boxWidth = 2.2;
  const boxHeight = 1.0;
  const boxDepth = 1.0;

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (isHighlighted) return "#facc15";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    if (isTop) return "#60a5fa"; // Blue for top
    return "#34d399"; // Green for others
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isDragging ? 2 : isHolding ? 0.3 : 0;

      if (isDragging) {
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + targetY,
          0.3
        );
      } else {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + targetY,
          0.15
        );
        groupRef.current.position.x = THREE.MathUtils.lerp(
          groupRef.current.position.x,
          position[0],
          0.15
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
          groupRef.current.position.z,
          position[2],
          0.15
        );
      }

      const targetScale = isDragging ? 1.15 : isHolding ? 1.08 : isHovered ? 1.03 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    if (isHolding && holdStartTimeRef.current && !isDragging) {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        completeHold();
      }
    }
  });

  const startHold = (e) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    holdStartTimeRef.current = Date.now();
    pointerStartPosRef.current = { x: e.clientX || 0, y: e.clientY || 0 };
    setHoldProgress(0);
    onHoldStart();

    gl.domElement.style.cursor = "progress";
  };

  const completeHold = () => {
    if (!isPointerDownRef.current) return;

    hasDraggedRef.current = true;
    holdStartTimeRef.current = null;
    setHoldProgress(0);

    dragPlane.current.set(
      new THREE.Vector3(0, 0, 1),
      -groupRef.current.position.z
    );

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
    offset.current.copy(intersection.current).sub(groupRef.current.position);

    onHoldComplete();
    gl.domElement.style.cursor = "grabbing";
  };

  const cancelHold = () => {
    holdStartTimeRef.current = null;
    setHoldProgress(0);
    isPointerDownRef.current = false;
    onHoldCancel();

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }

    gl.domElement.style.cursor = "auto";
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}
    startHold(e);
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    e.stopPropagation();

    if (!isDragging) return;

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersection.current);

    const newPosition = [
      intersection.current.x - offset.current.x,
      intersection.current.y - offset.current.y,
      position[2],
    ];

    onPositionChange(newPosition);
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();

    try {
      if (e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    const endPos = { x: e.clientX || 0, y: e.clientY || 0 };
    const distance = Math.sqrt(
      Math.pow(endPos.x - pointerStartPosRef.current.x, 2) +
        Math.pow(endPos.y - pointerStartPosRef.current.y, 2)
    );

    if (!hasDraggedRef.current && distance < CLICK_THRESHOLD) {
      onBoxClick();
    }

    if (isDragging) {
      onDragEnd();
    } else {
      cancelHold();
    }

    isPointerDownRef.current = false;
    hasDraggedRef.current = false;
    holdStartTimeRef.current = null;
    setHoldProgress(0);

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }

    gl.domElement.style.cursor = "auto";
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => {
        setIsHovered(true);
        if (!anyDragging) gl.domElement.style.cursor = "grab";
      }}
      onPointerOut={() => {
        setIsHovered(false);
        if (!anyDragging && !isHolding) gl.domElement.style.cursor = "auto";
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Hold Progress Ring */}
      {isHolding && !isDragging && (
        <group position={[0, boxHeight + 0.8, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 32]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[0.3, 0.45, 32, 1, 0, Math.PI * 2 * holdProgress]}
            />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Shadow when dragging */}
      {isDragging && (
        <mesh position={[0, -position[1] - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main Box */}
      <mesh castShadow receiveShadow position={[0, boxHeight / 2, 0]}>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={
            isDragging
              ? "#f97316"
              : isHolding
              ? "#fb923c"
              : isHighlighted
              ? "#facc15"
              : selected
              ? "#fbbf24"
              : "#000000"
          }
          emissiveIntensity={
            isDragging ? 0.5 : isHolding ? 0.4 : isHighlighted ? 0.6 : selected ? 0.4 : 0
          }
          metalness={0.1}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Wireframe when dragging */}
      {isDragging && (
        <mesh position={[0, boxHeight / 2, 0]}>
          <boxGeometry args={[boxWidth + 0.1, boxHeight + 0.1, boxDepth + 0.1]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {/* Wireframe when holding */}
      {isHolding && !isDragging && (
        <mesh position={[0, boxHeight / 2, 0]}>
          <boxGeometry args={[boxWidth + 0.08, boxHeight + 0.08, boxDepth + 0.08]} />
          <meshBasicMaterial color="#f97316" wireframe />
        </mesh>
      )}

      {/* Value label */}
      <Text
        position={[0, boxHeight / 2, boxDepth / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index label */}
      <Text
        position={[-boxWidth / 2 - 0.3, boxHeight / 2, 0]}
        fontSize={0.22}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Top indicator */}
      {isTop && !isDragging && (
        <group position={[boxWidth / 2 + 0.8, boxHeight / 2, 0]}>
          <Text
            fontSize={0.28}
            color="#fde68a"
            anchorX="left"
            anchorY="middle"
          >
            ← TOP
          </Text>
        </group>
      )}

      {/* Status label when selected or dragging */}
      {(selected || isDragging) && !isHolding && (
        <Text
          position={[0, boxHeight + 0.6, 0]}
          fontSize={0.22}
          color={isDragging ? "#fb923c" : "#fde68a"}
          anchorX="center"
          anchorY="middle"
        >
          {isDragging ? "Drag to Answer Zone" : `Value: ${value} | Index: ${index}`}
        </Text>
      )}
    </group>
  );
};

// === Start Button ===
const StartButton = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const size = [5.0, 2.0, 1.0];

  return (
    <group position={position}>
      <mesh
        position={[0, 0.6, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered ? "#ea580c" : "#f97316"}
          emissive={hovered ? "#ea580c" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.6, size[2] / 2 + 0.02]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Start Stack Assessment
      </Text>
      {/* Stack icon */}
      <group position={[0, 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
        <Text
          position={[1.2, 1, 0.3]}
          fontSize={0.25}
          color="#fde68a"
          anchorX="left"
          anchorY="middle"
        >
          ← TOP
        </Text>
      </group>
    </group>
  );
};

// === Restart Button ===
const RestartButton = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const size = [4.0, 1.5, 1.0];

  return (
    <group position={position}>
      <mesh
        position={[0, 0.6, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered ? "#ea580c" : "#f97316"}
          emissive={hovered ? "#ea580c" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.6, size[2] / 2 + 0.02]}
        fontSize={0.32}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Restart Assessment
      </Text>
    </group>
  );
};

// === Floating Feedback ===
const FloatingFeedback = ({ text, correct = true, position = [0, 0, 0] }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[6, 1.2]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Text
        fontSize={0.3}
        color={correct ? "#34d399" : "#f87171"}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// === Fade-in text ===
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 500;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
      maxWidth={14}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default StackQueueAssessment;
