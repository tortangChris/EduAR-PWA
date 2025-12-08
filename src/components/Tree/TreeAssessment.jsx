// TreeAssessment.jsx - Queue Assessment
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_QUEUE = [10, 20, 30, 40];

const TreeAssessment = ({
  initialData = DEFAULT_QUEUE,
  spacing = 2.0,
  passingRatio = 0.75,
  onPassStatusChange,
}) => {
  const modes = ["intro", "enqueue", "dequeue", "peek", "fifo", "done"];
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];

  const [queue, setQueue] = useState([...initialData]);
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

  // Queue positioned horizontally (left = front, right = rear)
  const originalPositions = useMemo(() => {
    const mid = (queue.length - 1) / 2;
    return queue.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [queue, spacing]);

  useEffect(() => {
    setBoxPositions(originalPositions.map((pos) => [...pos]));
  }, [originalPositions]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("queueAssessmentPassed");
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

    if (mode === "enqueue") prepareEnqueueQuestion();
    if (mode === "dequeue") prepareDequeueQuestion();
    if (mode === "peek") preparePeekQuestion();
    if (mode === "fifo") prepareFIFOQuestion();
    if (mode === "intro") {
      setQueue([...initialData]);
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
        localStorage.setItem("queueAssessmentPassed", "true");
      } else {
        localStorage.removeItem("queueAssessmentPassed");
      }
    } catch (e) {
      console.warn("Unable to write localStorage", e);
    }
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  // --- Question generators for Queue ---
  const prepareEnqueueQuestion = () => {
    const newValue = Math.floor(Math.random() * 90) + 10;
    const rearIndex = queue.length - 1;
    setQuestion({
      prompt: `If we ENQUEUE ${newValue}, which element is currently at the REAR? (Enqueue — O(1))`,
      newValue,
      answerIndex: rearIndex,
      type: "enqueue",
    });
  };

  const prepareDequeueQuestion = () => {
    const frontIndex = 0;
    setQuestion({
      prompt: `Which element will be REMOVED when we call DEQUEUE? (Dequeue — O(1), FIFO principle)`,
      answerIndex: frontIndex,
      type: "dequeue",
    });
  };

  const preparePeekQuestion = () => {
    const frontIndex = 0;
    setQuestion({
      prompt: `Which element does PEEK return? Drag the FRONT element to the answer zone. (Peek — O(1))`,
      answerIndex: frontIndex,
      type: "peek",
    });
  };

  const prepareFIFOQuestion = () => {
    const frontIndex = 0;
    setQuestion({
      prompt: `FIFO means "First In, First Out". Which element was added FIRST and will be removed FIRST?`,
      answerIndex: frontIndex,
      type: "fifo",
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

    if (question.type === "enqueue") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(
        correct,
        `Element ${queue[droppedIndex]} is current rear`,
        () => {
          const newQueue = [...queue, question.newValue];
          setAnimState({ new: queue.length });
          setTimeout(() => {
            setQueue(newQueue);
            setAnimState({});
            nextMode();
          }, 800);
        }
      );
    } else if (question.type === "dequeue") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(
        correct,
        `Dequeued ${queue[droppedIndex]} from front`,
        () => {
          const fadeFlags = { [question.answerIndex]: "fade" };
          setAnimState(fadeFlags);
          setTimeout(() => {
            const newQueue = [...queue];
            newQueue.shift();
            setQueue(newQueue);
            setAnimState({});
            nextMode();
          }, 800);
        }
      );
    } else if (question.type === "peek") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Peek returns ${queue[droppedIndex]}`, () => {
        setAnimState({ [question.answerIndex]: "highlight" });
        setTimeout(() => {
          setAnimState({});
          resetBoxPosition(droppedIndex);
          nextMode();
        }, 800);
      });
    } else if (question.type === "fifo") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(
        correct,
        `${queue[droppedIndex]} was added first (FIFO)`,
        () => {
          resetBoxPosition(droppedIndex);
          nextMode();
        }
      );
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

  const handleStartClick = () => {
    setModeIndex(1);
  };

  const handleBoxClick = (i) => {
    setSelectedIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div
      className="w-full h-[450px]"
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
        camera={{ position: [0, 4, 14], fov: 50 }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        {/* Ground Plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[24, 14]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
        </mesh>

        {/* ========== INTRO SCREEN ========== */}
        {mode === "intro" && <IntroScreen onStart={handleStartClick} />}

        {/* ========== ASSESSMENT MODE ========== */}
        {mode !== "intro" && mode !== "done" && (
          <>
            {/* RIGHT SIDE PANEL - Questions & Info */}
            <group position={[6, 3, 0]}>
              <FadeText
                text={`Assessment ${modeIndex}: ${mode.toUpperCase()}`}
                position={[0, 2.5, 0]}
                fontSize={0.45}
                color="#facc15"
              />

              <mesh position={[0, 0.8, -0.1]}>
                <planeGeometry args={[7, 3.5]} />
                <meshBasicMaterial color="#1e293b" transparent opacity={0.85} />
              </mesh>

              <FadeText
                text={question ? question.prompt : ""}
                position={[0, 1, 0]}
                fontSize={0.26}
                color="white"
              />

              <FadeText
                text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
                position={[0, -0.5, 0]}
                fontSize={0.24}
                color="#fde68a"
              />

              <FadeText
                text={"Hold 0.5s to drag → Drop in Answer Zone"}
                position={[0, -1, 0]}
                fontSize={0.2}
                color="#94a3b8"
              />
            </group>

            {/* Queue Base */}
            <QueueBase width={queue.length * spacing + 2} />

            {/* Answer Drop Zone */}
            <AnswerDropZone
              position={[0, 2, 4]}
              isActive={draggedBox !== null}
              draggedBox={draggedBox}
              onDrop={handleDropOnAnswer}
            />

            {/* FIFO Indicator */}
            <group position={[0, 3.5, 0]}>
              <Text
                fontSize={0.4}
                color="#f472b6"
                anchorX="center"
                anchorY="middle"
              >
                FIFO
              </Text>
              <Text
                position={[0, -0.4, 0]}
                fontSize={0.22}
                color="#f9a8d4"
                anchorX="center"
                anchorY="middle"
              >
                First In, First Out
              </Text>
            </group>

            {/* Front & Rear Labels */}
            {queue.length > 0 && (
              <>
                <group position={[originalPositions[0][0] - 1.8, 0.5, 0]}>
                  <Text
                    fontSize={0.3}
                    color="#60a5fa"
                    anchorX="center"
                    anchorY="middle"
                  >
                    FRONT
                  </Text>
                  <mesh position={[0.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshBasicMaterial color="#60a5fa" />
                  </mesh>
                </group>
                <group
                  position={[
                    originalPositions[queue.length - 1][0] + 1.8,
                    0.5,
                    0,
                  ]}
                >
                  <Text
                    fontSize={0.3}
                    color="#f472b6"
                    anchorX="center"
                    anchorY="middle"
                  >
                    REAR
                  </Text>
                  <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshBasicMaterial color="#f472b6" />
                  </mesh>
                </group>
              </>
            )}

            {/* Queue Elements */}
            {queue.map((value, i) => {
              let extraOpacity = 1;
              if (animState[i] === "fade") extraOpacity = 0.25;
              const isSelected = selectedIndex === i;
              const isFront = i === 0;
              const isRear = i === queue.length - 1;
              const isHighlighted = animState[i] === "highlight";

              return (
                <DraggableQueueBox
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
                  isFront={isFront}
                  isRear={isRear}
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
          </>
        )}

        {/* ========== DONE SCREEN ========== */}
        {mode === "done" && (
          <group position={[0, 1, 0]}>
            <FadeText
              text="Assessment Complete!"
              position={[0, 3, 0]}
              fontSize={0.55}
              color="#facc15"
            />
            <FadeText
              text={
                isPassed
                  ? "You passed this assessment!"
                  : "You did not reach the passing score."
              }
              position={[0, 2.2, 0]}
              fontSize={0.3}
              color="white"
            />
            <FadeText
              text={`Your Score: ${score} / ${totalAssessments}`}
              position={[0, 1.2, 0]}
              fontSize={0.5}
              color="#60a5fa"
            />
            <FadeText
              text={isPassed ? "Status: PASSED ✓" : "Status: FAILED ✗"}
              position={[0, 0.4, 0]}
              fontSize={0.45}
              color={isPassed ? "#22c55e" : "#ef4444"}
            />
            <RestartButton
              position={[0, -1.2, 0]}
              onClick={() => {
                setModeIndex(0);
                setQueue([...initialData]);
                setScore(0);
                setIsPassed(false);
                try {
                  localStorage.removeItem("queueAssessmentPassed");
                } catch (e) {}
              }}
            />
          </group>
        )}

        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 5.5, 0]}
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

// === Intro Screen ===
const IntroScreen = ({ onStart }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[0, 0, 0]}>
      {/* Title */}
      <FadeText
        text="Queue — Assessment"
        position={[0, 5.5, 0]}
        fontSize={0.6}
        color="#facc15"
      />

      {/* Description Panel */}
      <group position={[0, 4.2, 0]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[10, 1.5]} />
          <meshBasicMaterial color="#1e293b" transparent opacity={0.85} />
        </mesh>
        <Text
          position={[0, 0.25, 0]}
          fontSize={0.24}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
          maxWidth={9}
          textAlign="center"
        >
          A Queue follows the FIFO principle:
        </Text>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={9}
          textAlign="center"
        >
          First In, First Out — the first element added is the first to be
          removed.
        </Text>
      </group>

      {/* 3D Queue Visualization */}
      <group position={[0, 1, 0]}>
        {/* Queue boxes - horizontal */}
        <mesh position={[-2.5, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.9]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
        <Text
          position={[-2.5, 0, 0.46]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          10
        </Text>

        <mesh position={[-0.8, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.9]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
        <Text
          position={[-0.8, 0, 0.46]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          20
        </Text>

        <mesh position={[0.9, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.9]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
        <Text
          position={[0.9, 0, 0.46]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          30
        </Text>

        <mesh position={[2.6, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.9]} />
          <meshStandardMaterial color="#f472b6" />
        </mesh>
        <Text
          position={[2.6, 0, 0.46]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          40
        </Text>

        {/* Front indicator */}
        <Text
          position={[-4, 0, 0]}
          fontSize={0.22}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          FRONT →
        </Text>

        {/* Rear indicator */}
        <Text
          position={[4.1, 0, 0]}
          fontSize={0.22}
          color="#f472b6"
          anchorX="center"
          anchorY="middle"
        >
          ← REAR
        </Text>

        {/* Base */}
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[8, 0.15, 1.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      {/* Arrow showing direction */}
      <group position={[0, 2.2, 0]}>
        <Text fontSize={0.25} color="#f9a8d4" anchorX="center" anchorY="middle">
          ← Dequeue Enqueue →
        </Text>
      </group>

      {/* Start Button */}
      <group position={[0, -0.8, 2]}>
        <mesh
          position={[0, 0, 0]}
          onClick={onStart}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[4.5, 1.2, 0.5]} />
          <meshStandardMaterial
            color={hovered ? "#db2777" : "#ec4899"}
            emissive={hovered ? "#db2777" : "#000000"}
            emissiveIntensity={hovered ? 0.5 : 0}
          />
        </mesh>
        <Text
          position={[0, 0, 0.26]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Start Assessment
        </Text>
      </group>
    </group>
  );
};

// === Queue Base ===
const QueueBase = ({ width }) => {
  const geometry = useMemo(() => new THREE.BoxGeometry(width, 0.2, 2), [width]);
  return (
    <mesh position={[0, -0.6, 0]}>
      <primitive object={geometry} />
      <meshBasicMaterial color="#1e293b" opacity={0.4} transparent />
    </mesh>
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
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[3.5, 2, 0.3]} />
        <meshStandardMaterial
          color={
            hovered && isActive ? "#22c55e" : isActive ? "#ec4899" : "#475569"
          }
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#ec4899" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[3.6, 2.1, 0.32]} />
        <meshBasicMaterial
          color={hovered && isActive ? "#22c55e" : "#f472b6"}
          wireframe
        />
      </mesh>

      <Text
        position={[0, 0, 0.2]}
        fontSize={0.28}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>

      {isActive && (
        <group position={[0, 1.3, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// === Draggable Queue Box ===
const DraggableQueueBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  anyDragging,
  opacity = 1,
  isFront,
  isRear,
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

  const boxWidth = 1.6;
  const boxHeight = 1.0;
  const boxDepth = 1.0;

  const getColor = () => {
    if (isDragging) return "#ec4899";
    if (isHolding) return "#f472b6";
    if (isHighlighted) return "#facc15";
    if (selected) return "#facc15";
    if (isHovered) return "#c084fc";
    if (isFront) return "#60a5fa";
    if (isRear) return "#f472b6";
    return "#34d399";
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

      const targetScale = isDragging
        ? 1.15
        : isHolding
        ? 1.08
        : isHovered
        ? 1.03
        : 1;
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
            <meshBasicMaterial color="#ec4899" />
          </mesh>
        </group>
      )}

      {isDragging && (
        <mesh
          position={[0, -position[1] - 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.8, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      <mesh castShadow receiveShadow position={[0, boxHeight / 2, 0]}>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={
            isDragging
              ? "#ec4899"
              : isHolding
              ? "#f472b6"
              : isHighlighted
              ? "#facc15"
              : selected
              ? "#fbbf24"
              : "#000000"
          }
          emissiveIntensity={
            isDragging
              ? 0.5
              : isHolding
              ? 0.4
              : isHighlighted
              ? 0.6
              : selected
              ? 0.4
              : 0
          }
          metalness={0.1}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {isDragging && (
        <mesh position={[0, boxHeight / 2, 0]}>
          <boxGeometry
            args={[boxWidth + 0.1, boxHeight + 0.1, boxDepth + 0.1]}
          />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {isHolding && !isDragging && (
        <mesh position={[0, boxHeight / 2, 0]}>
          <boxGeometry
            args={[boxWidth + 0.08, boxHeight + 0.08, boxDepth + 0.08]}
          />
          <meshBasicMaterial color="#ec4899" wireframe />
        </mesh>
      )}

      <Text
        position={[0, boxHeight / 2, boxDepth / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, -0.3, boxDepth / 2 + 0.01]}
        fontSize={0.2}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {(selected || isDragging) && !isHolding && (
        <Text
          position={[0, boxHeight + 0.5, 0]}
          fontSize={0.2}
          color={isDragging ? "#f472b6" : "#fde68a"}
          anchorX="center"
          anchorY="middle"
        >
          {isDragging ? "Drag to Answer Zone ↑" : `Value: ${value}`}
        </Text>
      )}
    </group>
  );
};

// === Restart Button ===
const RestartButton = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const size = [4.0, 1.2, 0.5];

  return (
    <group position={position}>
      <mesh
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered ? "#db2777" : "#ec4899"}
          emissive={hovered ? "#db2777" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, size[2] / 2 + 0.01]}
        fontSize={0.3}
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
        <planeGeometry args={[7, 1]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Text
        fontSize={0.28}
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
      maxWidth={7}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default TreeAssessment;
