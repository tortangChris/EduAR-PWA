import React, { useMemo, useState, useEffect, useRef, forwardRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_DATA = [10, 20, 30, 40, 50];

const AssessmentAR = ({
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
  const [isDraggingStructure, setIsDraggingStructure] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  
  const [structurePos, setStructurePos] = useState([0, 0, -8]);

  // ✅ FIX: Use a Map to store refs by index
  const boxRefsMap = useRef(new Map());
  const structureRef = useRef();
  const answerZoneRef = useRef();

  // ✅ FIX: Clear refs when mode changes
  useEffect(() => {
    if (mode === "intro" || mode === "done") {
      boxRefsMap.current.clear();
    }
  }, [mode]);

  // ✅ FIX: Better ref registration
  const registerBoxRef = useCallback((index, ref) => {
    if (ref) {
      boxRefsMap.current.set(index, ref);
    } else {
      boxRefsMap.current.delete(index);
    }
  }, []);

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const [boxPositions, setBoxPositions] = useState([]);

  useEffect(() => {
    setBoxPositions(originalPositions.map(pos => [...pos]));
  }, [originalPositions]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("arrayAssessmentARPassed");
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
    setBoxPositions(originalPositions.map(pos => [...pos]));
    
    // ✅ Clear refs on mode change
    boxRefsMap.current.clear();

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
        localStorage.setItem("arrayAssessmentARPassed", "true");
      } else {
        localStorage.removeItem("arrayAssessmentARPassed");
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
      prompt: `If we insert ${insertValue} at index ${k}, which element will shift? Drag it.`,
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
      prompt: `Delete value at index ${k}. Which value ends up at index ${k}? Drag it.`,
      k,
      answerIndex,
      type: "delete",
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
        newArr.splice(Math.min(question.k, newArr.length), 0, question.insertValue);
        setData(newArr);
        nextMode();
      });
    } else if (question.type === "delete") {
      correct = question.answerIndex !== null && droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Dropped ${data[droppedIndex]}`, () => {
        const newArr = [...data];
        newArr.splice(question.k, 1);
        setData(newArr);
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

  const handleBoxClick = useCallback((i) => {
    console.log("handleBoxClick called with index:", i, "mode:", mode);
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!isDraggingStructure) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  }, [mode, isDraggingStructure]);

  const onStructureDragStart = useCallback(() => {
    setIsDraggingStructure(true);
    setDraggedBox(null);
    setSelectedIndex(null);
  }, []);

  const onStructureDragMove = useCallback((newPos) => {
    setStructurePos(newPos);
  }, []);

  const onStructureDragEnd = useCallback(() => {
    setIsDraggingStructure(false);
  }, []);

  const onBoxDragStart = useCallback((index) => {
    console.log("onBoxDragStart:", index);
    setDraggedBox(index);
    setSelectedIndex(index);
  }, []);

  const onBoxDragMove = useCallback((index, newPos) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = newPos;
      return updated;
    });
  }, []);

  const onBoxDragEnd = useCallback((index, isOverAnswerZone) => {
    console.log("onBoxDragEnd:", index, "overZone:", isOverAnswerZone);
    if (isOverAnswerZone) {
      handleDropOnAnswer(index);
    } else {
      resetBoxPosition(index);
      setDraggedBox(null);
    }
  }, [question, data]);

  const startAR = (gl) => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["hit-test", "local-floor"],
            })
            .then((session) => {
              gl.xr.setSession(session);
              setIsARMode(true);
              session.addEventListener("end", () => setIsARMode(false));
            })
            .catch((err) => console.error("AR session failed:", err));
        }
      });
    }
  };

  const answerZoneWorldPos = useMemo(() => {
    return [structurePos[0], structurePos[1] - 0.5, structurePos[2] + 4];
  }, [structurePos]);

  return (
    <div className="w-full h-[400px]">
      <Canvas
        camera={{ position: [0, 5, 14], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        <group position={structurePos} ref={structureRef}>
          <FadeText
            text={
              mode === "intro"
                ? "Arrays — AR Assessment"
                : mode === "done"
                ? "Assessment Complete!"
                : `Question ${modeIndex}: ${mode.toUpperCase()}`
            }
            position={[0, 4, 0]}
            fontSize={0.55}
            color="#facc15"
          />

          {isARMode && (
            <FadeText text="🔮 AR Mode Active" position={[0, 4.6, 0]} fontSize={0.25} color="#22c55e" />
          )}

          <FadeText
            text={
              isDraggingStructure
                ? "✋ Moving Structure..."
                : mode === "intro"
                ? "Tap the box below to start"
                : mode === "done"
                ? isPassed ? "You passed!" : "Try again"
                : question?.prompt || ""
            }
            position={[0, 3.2, 0]}
            fontSize={0.28}
            color={isDraggingStructure ? "#f97316" : "white"}
          />

          {mode !== "intro" && mode !== "done" && (
            <>
              <FadeText
                text="Hold 0.5s to drag → Drop on Answer Zone"
                position={[0, 2.7, 0]}
                fontSize={0.2}
                color="#94a3b8"
              />
              <FadeText
                text={`Progress: ${modeIndex}/${totalAssessments} | Score: ${score}`}
                position={[0, 2.3, 0]}
                fontSize={0.24}
                color="#fde68a"
              />
            </>
          )}

          {mode !== "intro" && mode !== "done" && (
            <AnswerDropZone
              ref={answerZoneRef}
              position={[0, -0.5, 4]}
              isActive={draggedBox !== null}
            />
          )}

          {mode === "intro" ? (
            <StartBox position={[0, 0, 0]} onClick={() => setModeIndex(1)} />
          ) : mode === "done" ? (
            <>
              <FadeText
                text={`Your Score: ${score}/${totalAssessments}`}
                position={[0, 1.5, 0]}
                fontSize={0.5}
                color="#60a5fa"
              />
              <FadeText
                text={isPassed ? "PASSED ✓" : "FAILED ✗"}
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
                  localStorage.removeItem("arrayAssessmentARPassed");
                }}
              />
            </>
          ) : (
            data.map((value, i) => (
              <InteractiveBox
                key={`box-${i}-${mode}`}
                index={i}
                value={value}
                position={boxPositions[i] || originalPositions[i]}
                originalPosition={originalPositions[i]}
                selected={selectedIndex === i}
                isDragging={draggedBox === i}
                opacity={animState[i] === "fade" ? 0.25 : 1}
                onSelect={() => handleBoxClick(i)}
                onDragStart={() => onBoxDragStart(i)}
                onDragMove={(pos) => onBoxDragMove(i, pos)}
                onDragEnd={(overZone) => onBoxDragEnd(i, overZone)}
                answerZonePos={answerZoneWorldPos}
                structurePos={structurePos}
                registerRef={(ref) => registerBoxRef(i, ref)}
              />
            ))
          )}

          {feedback && (
            <FloatingFeedback
              text={feedback.text}
              correct={feedback.correct}
              position={[0, 1.8, 4]}
            />
          )}
        </group>

        <OrbitControls
          makeDefault
          enabled={draggedBox === null && !isDraggingStructure}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};

// ✅ NEW: Interactive Box with built-in touch handling
const InteractiveBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  opacity = 1,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  answerZonePos,
  structurePos,
  registerRef,
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const { camera, gl, raycaster } = useThree();

  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pointerDownRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const pointer = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const HOLD_TIME = 500;
  const size = [1.6, 1.2, 1];

  // Sync dragging ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Register ref
  useEffect(() => {
    registerRef(groupRef.current);
    return () => registerRef(null);
  }, [registerRef]);

  // Set userData
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
      groupRef.current.traverse((child) => {
        child.userData = { boxIndex: index };
      });
    }
  }, [index]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Animate
  useFrame(() => {
    if (!groupRef.current) return;

    const targetY = isDragging ? 2 : isHolding ? 0.3 : 0;
    const targetScale = isDragging ? 1.2 : isHolding ? 1.1 : selected ? 1.05 : 1;

    if (isDragging) {
      groupRef.current.position.set(position[0], position[1] + targetY, position[2]);
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.2);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] + targetY, 0.2);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.2);
    }

    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    // Update hold progress
    if (isHolding && !isDragging && holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / HOLD_TIME, 1);
      setHoldProgress(progress);
    }
  });

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  const isOverAnswerZone = (worldPos) => {
    const dx = Math.abs(worldPos[0] - answerZonePos[0]);
    const dz = Math.abs(worldPos[2] - answerZonePos[2]);
    return dx < 2 && dz < 1.5;
  };

  const getWorldPosFromEvent = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer.current, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);
    return [intersection.x, 0, intersection.z];
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    console.log("PointerDown on box", index);

    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? 0;

    pointerDownRef.current = true;
    startPosRef.current = { x: clientX, y: clientY };

    // Set drag plane
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), 0);

    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    // Start hold timer
    holdTimerRef.current = setTimeout(() => {
      if (pointerDownRef.current) {
        console.log("Hold complete, starting drag for box", index);
        isDraggingRef.current = true;
        onDragStart();
        setIsHolding(false);
        setHoldProgress(0);
      }
    }, HOLD_TIME);

    // Capture pointer
    try {
      if (e.target && e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!pointerDownRef.current) return;
    e.stopPropagation();

    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? 0;

    if (isDraggingRef.current) {
      const worldPos = getWorldPosFromEvent(clientX, clientY);
      const relativePos = [
        worldPos[0] - structurePos[0],
        0,
        worldPos[2] - structurePos[2]
      ];
      onDragMove(relativePos);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    console.log("PointerUp on box", index, "isDragging:", isDraggingRef.current);

    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Release pointer capture
    try {
      if (e.target && e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    const clientX = e.clientX ?? startPosRef.current.x;
    const clientY = e.clientY ?? startPosRef.current.y;

    if (isDraggingRef.current) {
      // Was dragging - check drop zone
      const worldPos = getWorldPosFromEvent(clientX, clientY);
      const overZone = isOverAnswerZone(worldPos);
      console.log("Dropping, overZone:", overZone);
      onDragEnd(overZone);
      isDraggingRef.current = false;
    } else if (pointerDownRef.current) {
      // Was just a tap (hold didn't complete)
      const elapsed = Date.now() - (holdStartRef.current || 0);
      if (elapsed < HOLD_TIME) {
        console.log("Short tap on box", index);
        onSelect();
      }
    }

    pointerDownRef.current = false;
    setIsHolding(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  };

  const handlePointerCancel = (e) => {
    console.log("PointerCancel on box", index);
    handlePointerUp(e);
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Hold progress ring */}
      {isHolding && !isDragging && holdProgress > 0 && (
        <group position={[0, size[1] + 1.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.5, 32]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.5, 32, 1, 0, Math.PI * 2 * holdProgress]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.18} color="white" anchorX="center">
            Hold...
          </Text>
        </group>
      )}

      {/* Shadow when dragging */}
      {isDragging && (
        <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main box mesh - touch target */}
      <mesh
        ref={meshRef}
        position={[0, size[1] / 2, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : isHolding ? "#fb923c" : selected ? "#fbbf24" : "#000"}
          emissiveIntensity={isDragging ? 0.5 : isHolding ? 0.4 : selected ? 0.3 : 0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Wireframe when holding/dragging */}
      {(isDragging || isHolding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      {/* Value text */}
      <Text
        position={[0, size[1] / 2, size[2] / 2 + 0.01]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      {/* Index text */}
      <Text
        position={[0, -0.2, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Status label */}
      {isDragging && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.25}
          color="#fb923c"
          anchorX="center"
        >
          📍 Drop on Answer Zone!
        </Text>
      )}
    </group>
  );
};

// === Answer Drop Zone ===
const AnswerDropZone = forwardRef(({ position, isActive }, ref) => {
  const meshRef = useRef();
  const pulseRef = useRef(0);

  useFrame(() => {
    if (meshRef.current && isActive) {
      pulseRef.current += 0.08;
      const pulse = Math.sin(pulseRef.current) * 0.3 + 0.7;
      meshRef.current.material.emissiveIntensity = pulse * 0.6;
    } else if (meshRef.current) {
      meshRef.current.material.emissiveIntensity = 0;
    }
  });

  return (
    <group position={position} ref={ref}>
      <mesh ref={meshRef}>
        <boxGeometry args={[4, 0.3, 2.5]} />
        <meshStandardMaterial
          color={isActive ? "#22c55e" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#22c55e" : "#000"}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[4.1, 0.32, 2.6]} />
        <meshBasicMaterial color={isActive ? "#22c55e" : "#60a5fa"} wireframe />
      </mesh>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.4}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
      >
        {isActive ? "📍 DROP HERE!" : "Answer Zone"}
      </Text>

      {isActive && (
        <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.25, 0.5, 6]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
});

// === Start Box ===
const StartBox = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  const handleClick = (e) => {
    e.stopPropagation();
    console.log("Start button clicked");
    onClick();
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, 0.6, 0]}
        onClick={handleClick}
        onPointerDown={(e) => {
          e.stopPropagation();
          console.log("Start button pointerDown");
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[5, 2.2, 1]} />
        <meshStandardMaterial
          color={hovered ? "#3b82f6" : "#60a5fa"}
          emissive={hovered ? "#3b82f6" : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text position={[0, 0.6, 0.52]} fontSize={0.5} color="white" anchorX="center">
        ▶ START
      </Text>
    </group>
  );
};

// === Restart Box ===
const RestartBox = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        position={[0, 0.6, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerDown={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 1.5, 1]} />
        <meshStandardMaterial
          color={hovered ? "#f97316" : "#fb923c"}
          emissive={hovered ? "#f97316" : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text position={[0, 0.6, 0.52]} fontSize={0.35} color="white" anchorX="center">
        🔄 RESTART
      </Text>
    </group>
  );
};

// === Floating Feedback ===
const FloatingFeedback = ({ text, correct, position }) => {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
    }
  });

  return (
    <group ref={ref} position={position} scale={[0.1, 0.1, 0.1]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[4.5, 0.9]} />
        <meshBasicMaterial color={correct ? "#065f46" : "#7f1d1d"} transparent opacity={0.9} />
      </mesh>
      <Text fontSize={0.35} color={correct ? "#34d399" : "#f87171"} anchorX="center">
        {text}
      </Text>
    </group>
  );
};

// === Fade Text ===
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 400, 1);
      setOpacity(p);
      if (p < 1) frame = requestAnimationFrame(animate);
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
      maxWidth={12}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default AssessmentAR;
