import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_DATA = [10, 20, 30, 40, 50];

const ArrayAssessment = ({
  initialData = DEFAULT_DATA,
  spacing = 2.0,
  passingRatio = 0.75,
  onPassStatusChange,
}) => {
  const modes = ["intro", "access", "search", "insert", "delete", "done"];
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];

  const [data, setData] = useState([...initialData]);
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
  const [droppedAnswer, setDroppedAnswer] = useState(null);

  const controlsRef = useRef();

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // Initialize box positions
  useEffect(() => {
    setBoxPositions(originalPositions.map((pos) => [...pos]));
  }, [originalPositions]);

  // On mount, check localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arrayAssessmentPassed");
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
    setDroppedAnswer(null);
    setBoxPositions(originalPositions.map((pos) => [...pos]));

    if (mode === "access") prepareAccessQuestion();
    if (mode === "search") prepareSearchQuestion();
    if (mode === "insert") prepareInsertQuestion();
    if (mode === "delete") prepareDeleteQuestion();
    if (mode === "intro") {
      setData([...initialData]);
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
        localStorage.setItem("arrayAssessmentPassed", "true");
      } else {
        localStorage.removeItem("arrayAssessmentPassed");
      }
    } catch (e) {
      console.warn("Unable to write localStorage", e);
    }
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Drag the box at index ${idx} to the answer zone. (Access — O(1))`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Drag the box containing value ${value} to the answer zone. (Search — O(n))`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    const answerIndex = k < data.length ? k : data.length - 1;
    setQuestion({
      prompt: `If we insert ${insertValue} at index ${k}, which element will shift? Drag it to the answer zone. (Insertion — O(n))`,
      insertValue,
      k,
      answerIndex,
      type: "insert",
    });
  };

  const prepareDeleteQuestion = () => {
    let k = Math.floor(Math.random() * data.length);
    if (k === data.length - 1 && data.length > 1) k = data.length - 2;
    const answerIndex = k + 1 < data.length ? k + 1 : null;
    setQuestion({
      prompt: `Delete value at index ${k}. Which value will end up at index ${k}? Drag it to the answer zone. (Deletion — O(n))`,
      k,
      answerIndex,
      type: "delete",
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

    setDroppedAnswer(droppedIndex);
    const markScore = (correct) => {
      if (correct) setScore((s) => s + 1);
    };

    let correct = false;

    if (question.type === "access") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Value ${data[droppedIndex]}`, () => {
        resetBoxPosition(droppedIndex);
        nextMode();
      });
    } else if (question.type === "search") {
      correct = data[droppedIndex] === question.answerValue;
      markScore(correct);
      showFeedback(correct, `Dropped ${data[droppedIndex]}`, () => {
        resetBoxPosition(droppedIndex);
        nextMode();
      });
    } else if (question.type === "insert") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Dropped ${data[droppedIndex]}`, () => {
        const newArr = [...data];
        newArr.splice(
          Math.min(question.k, newArr.length),
          0,
          question.insertValue
        );
        const shiftFlags = {};
        for (let idx = question.k; idx < newArr.length; idx++)
          shiftFlags[idx] = "shift";
        setAnimState(shiftFlags);
        setTimeout(() => {
          setData(newArr);
          setAnimState({});
          nextMode();
        }, 600);
      });
    } else if (question.type === "delete") {
      correct =
        question.answerIndex !== null && droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Dropped ${data[droppedIndex]}`, () => {
        const newArr = [...data];
        const fadeFlags = { [question.k]: "fade" };
        setAnimState(fadeFlags);
        setTimeout(() => {
          newArr.splice(question.k, 1);
          setData(newArr);
          setAnimState({});
          nextMode();
        }, 600);
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
      className="w-full h-[300px]"
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
        camera={{ position: [0, 5, 14], fov: 50 }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        {/* Header */}
        <FadeText
          text={
            mode === "intro"
              ? "Arrays — Assessment"
              : mode === "done"
              ? "Assessment Complete!"
              : `Assessment ${modeIndex}: ${mode.toUpperCase()}`
          }
          position={[0, 4, 0]}
          fontSize={0.55}
          color="#facc15"
        />

        {/* Instruction or question */}
        <FadeText
          text={
            mode === "intro"
              ? "Click the box below to start the assessment"
              : mode === "done"
              ? isPassed
                ? "You passed this assessment!"
                : "You did not reach the passing score."
              : question
              ? question.prompt
              : ""
          }
          position={[0, 3.2, 0]}
          fontSize={0.28}
          color="white"
        />

        {/* Progress indicator */}
        {mode !== "intro" && mode !== "done" && (
          <FadeText
            text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
            position={[0, 2.5, 0]}
            fontSize={0.24}
            color="#fde68a"
          />
        )}

        {/* Ground Plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
        </mesh>

        {/* Answer Drop Zone */}
        {mode !== "intro" && mode !== "done" && (
          <AnswerDropZone
            position={[0, -0.5, 4]}
            isActive={draggedBox !== null}
            draggedBox={draggedBox}
            onDrop={handleDropOnAnswer}
            feedback={feedback}
          />
        )}

        {/* Boxes */}
        {mode === "intro" ? (
          <StartBox position={[0, 0, 0]} onClick={() => handleBoxClick(0)} />
        ) : mode === "done" ? (
          <>
            <FadeText
              text={`Your Score: ${score} / ${totalAssessments}`}
              position={[0, 1.5, 0]}
              fontSize={0.5}
              color="#60a5fa"
            />
            <FadeText
              text={isPassed ? "Status: PASSED ✓" : "Status: FAILED ✗"}
              position={[0, 0.8, 0]}
              fontSize={0.45}
              color={isPassed ? "#22c55e" : "#ef4444"}
            />
            <RestartBox
              position={[0, -0.5, 0]}
              onClick={() => {
                setModeIndex(0);
                setData([...initialData]);
                setScore(0);
                setIsPassed(false);
                try {
                  localStorage.removeItem("arrayAssessmentPassed");
                } catch (e) {}
              }}
            />
          </>
        ) : (
          data.map((value, i) => {
            let extraOpacity = 1;
            if (animState[i] === "fade") extraOpacity = 0.25;
            const isSelected = selectedIndex === i;

            return (
              <DraggableBox
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
          })
        )}

        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 1.8, 4]}
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

// === Answer Drop Zone ===
const AnswerDropZone = ({
  position,
  isActive,
  draggedBox,
  onDrop,
  feedback,
}) => {
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

      // Pulsing glow when active
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
        <boxGeometry args={[4, 0.3, 2.5]} />
        <meshStandardMaterial
          color={
            hovered && isActive ? "#22c55e" : isActive ? "#3b82f6" : "#475569"
          }
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#3b82f6" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Drop zone border */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[4.1, 0.32, 2.6]} />
        <meshBasicMaterial
          color={hovered && isActive ? "#22c55e" : "#60a5fa"}
          wireframe
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.35}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>

      {/* Arrow indicator when dragging */}
      {isActive && (
        <group position={[0, 1, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// === Draggable Box ===
const DraggableBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  anyDragging,
  opacity = 1,
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
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const offset = useRef(new THREE.Vector3());
  const intersection = useRef(new THREE.Vector3());

  const HOLD_DURATION = 500; // 0.5 seconds
  const CLICK_THRESHOLD = 5;

  const size = [1.6, 1.2, 1];

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isDragging ? 2 : isHolding ? 0.5 : 0;

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
        ? 1.2
        : isHolding
        ? 1.1
        : isHovered
        ? 1.05
        : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    // Update hold progress
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
      new THREE.Vector3(0, 1, 0),
      -groupRef.current.position.y
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
      0,
      intersection.current.z - offset.current.z,
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

    // If quick tap and didn't move much, treat as click
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
        <group position={[0, size[1] + 1.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.55, 32]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[0.4, 0.55, 32, 1, 0, Math.PI * 2 * holdProgress]}
            />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Shadow when dragging */}
      {isDragging && (
        <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Main Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={
            isDragging
              ? "#f97316"
              : isHolding
              ? "#fb923c"
              : selected
              ? "#fbbf24"
              : "#000000"
          }
          emissiveIntensity={
            isDragging ? 0.6 : isHolding ? 0.4 : selected ? 0.4 : 0
          }
          metalness={0.1}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Wireframe when dragging */}
      {isDragging && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {/* Wireframe when holding */}
      {isHolding && !isDragging && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry
            args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]}
          />
          <meshBasicMaterial color="#f97316" wireframe />
        </mesh>
      )}

      {/* Value label */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index label */}
      <Text
        position={[0, -0.3, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Status label */}
      {(selected || isDragging) && !isHolding && (
        <Text
          position={[0, size[1] + 1, 0]}
          fontSize={0.25}
          color={isDragging ? "#fb923c" : "#fde68a"}
          anchorX="center"
          anchorY="middle"
        >
          {isDragging
            ? "Drag to Answer Zone"
            : `Value ${value} at index ${index}`}
        </Text>
      )}
    </group>
  );
};

// === Start Box ===
const StartBox = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const size = [5.0, 2.2, 1.0];

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
          color={hovered ? "#3b82f6" : "#60a5fa"}
          emissive={hovered ? "#3b82f6" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.6, size[2] / 2 + 0.02]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Start Assessment
      </Text>
    </group>
  );
};

// === Restart Box ===
const RestartBox = ({ position = [0, 0, 0], onClick }) => {
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
          color={hovered ? "#f97316" : "#fb923c"}
          emissive={hovered ? "#f97316" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.6, size[2] / 2 + 0.02]}
        fontSize={0.35}
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
  const [scale, setScale] = useState(0);

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
    }
  });

  useEffect(() => {
    setScale(0);
  }, [text]);

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Background */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[5, 1]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Text
        fontSize={0.35}
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

export default ArrayAssessment;
