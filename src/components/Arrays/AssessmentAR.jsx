import React, { useMemo, useState, useEffect, useRef, forwardRef } from "react";
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
  
  // Drag state
  const [draggedBox, setDraggedBox] = useState(null);
  const [isDraggingStructure, setIsDraggingStructure] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  
  // Structure position
  const [structurePos, setStructurePos] = useState([0, 0, -8]);

  // Refs
  const boxRefs = useRef([]);
  const structureRef = useRef();

  const addBoxRef = (index, r) => {
    if (r) {
      boxRefs.current[index] = r;
    }
  };

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
    } catch (e) {}
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
    setDraggedBox(null);
    setBoxPositions(originalPositions.map(pos => [...pos]));

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
    } catch (e) {}
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Drag the box at index ${idx} to the answer zone.`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Drag the box containing value ${value} to the answer zone.`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    const answerIndex = k < data.length ? k : data.length - 1;
    setQuestion({
      prompt: `If we insert ${insertValue} at index ${k}, which element shifts?`,
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
      prompt: `Delete index ${k}. Which value ends up at index ${k}?`,
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

    let correct = false;

    if (question.type === "access") {
      correct = droppedIndex === question.answerIndex;
    } else if (question.type === "search") {
      correct = data[droppedIndex] === question.answerValue;
    } else if (question.type === "insert") {
      correct = droppedIndex === question.answerIndex;
    } else if (question.type === "delete") {
      correct = question.answerIndex !== null && droppedIndex === question.answerIndex;
    }

    if (correct) setScore((s) => s + 1);

    setFeedback({
      text: correct ? `✓ Correct!` : `✗ Wrong!`,
      correct,
    });

    setTimeout(() => {
      setFeedback(null);
      resetBoxPosition(droppedIndex);
      
      if (question.type === "insert" && correct) {
        const newArr = [...data];
        newArr.splice(Math.min(question.k, newArr.length), 0, question.insertValue);
        setData(newArr);
      } else if (question.type === "delete" && correct) {
        const newArr = [...data];
        newArr.splice(question.k, 1);
        setData(newArr);
      }
      
      nextMode();
    }, 1000);

    setDraggedBox(null);
  };

  const handleBoxSelect = (i) => {
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!isDraggingStructure && draggedBox === null) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  const onBoxDragStart = (index) => {
    console.log("Drag start:", index);
    setDraggedBox(index);
    setSelectedIndex(index);
  };

  const onBoxDragMove = (index, newPos) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = newPos;
      return updated;
    });
  };

  const onBoxDragEnd = (index, isOverAnswerZone) => {
    console.log("Drag end:", index, "over zone:", isOverAnswerZone);
    if (isOverAnswerZone) {
      handleDropOnAnswer(index);
    } else {
      resetBoxPosition(index);
      setDraggedBox(null);
    }
  };

  const onStructureDragStart = () => {
    setIsDraggingStructure(true);
    setDraggedBox(null);
    setSelectedIndex(null);
  };

  const onStructureDragMove = (newPos) => {
    setStructurePos(newPos);
  };

  const onStructureDragEnd = () => {
    setIsDraggingStructure(false);
  };

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
            .catch((err) => console.error("AR failed:", err));
        }
      });
    }
  };

  const answerZoneWorldPos = useMemo(() => {
    return [structurePos[0], structurePos[1] - 0.5, structurePos[2] + 4];
  }, [structurePos]);

  return (
    <div className="w-full h-[400px] touch-none select-none">
      <Canvas
        camera={{ position: [0, 5, 14], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        <group position={structurePos} ref={structureRef}>
          {/* Header */}
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
            <FadeText text="🔮 AR Mode" position={[0, 4.5, 0]} fontSize={0.25} color="#22c55e" />
          )}

          <FadeText
            text={
              isDraggingStructure
                ? "✋ Moving..."
                : mode === "intro"
                ? "Tap Start to begin"
                : mode === "done"
                ? isPassed ? "You Passed! ✓" : "Try Again"
                : question?.prompt || ""
            }
            position={[0, 3.2, 0]}
            fontSize={0.28}
            color={isDraggingStructure ? "#f97316" : "white"}
          />

          {mode !== "intro" && mode !== "done" && (
            <>
              <FadeText
                text="Hold box 0.5s to drag → drop on Answer Zone"
                position={[0, 2.7, 0]}
                fontSize={0.2}
                color="#94a3b8"
              />
              <FadeText
                text={`Score: ${score}/${totalAssessments}`}
                position={[0, 2.3, 0]}
                fontSize={0.24}
                color="#fde68a"
              />
            </>
          )}

          {/* Answer Zone */}
          {mode !== "intro" && mode !== "done" && (
            <AnswerDropZone
              position={[0, -0.5, 4]}
              isActive={draggedBox !== null}
            />
          )}

          {/* Content */}
          {mode === "intro" ? (
            <StartBox position={[0, 0, 0]} onClick={() => setModeIndex(1)} />
          ) : mode === "done" ? (
            <>
              <FadeText
                text={`Final: ${score}/${totalAssessments}`}
                position={[0, 1.2, 0]}
                fontSize={0.5}
                color="#60a5fa"
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
              <DraggableBox
                key={`${i}-${value}`}
                index={i}
                value={value}
                position={boxPositions[i] || originalPositions[i]}
                originalPosition={originalPositions[i]}
                selected={selectedIndex === i}
                isDragging={draggedBox === i}
                opacity={animState[i] === "fade" ? 0.25 : 1}
                onSelect={() => handleBoxSelect(i)}
                onDragStart={() => onBoxDragStart(i)}
                onDragMove={(pos) => onBoxDragMove(i, pos)}
                onDragEnd={(overZone) => onBoxDragEnd(i, overZone)}
                answerZonePos={answerZoneWorldPos}
                structurePos={structurePos}
                ref={(r) => addBoxRef(i, r)}
              />
            ))
          )}

          {feedback && (
            <FloatingFeedback
              text={feedback.text}
              correct={feedback.correct}
              position={[0, 1.5, 4]}
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

// === DRAGGABLE BOX WITH BUILT-IN TOUCH HANDLING ===
const DraggableBox = forwardRef(({
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
}, ref) => {
  const groupRef = useRef();
  const { camera, gl, raycaster } = useThree();
  
  const [isHovered, setIsHovered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  
  const holdTimer = useRef(null);
  const isDraggingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const pointer = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const offset = useRef(new THREE.Vector3());
  
  const HOLD_TIME = 500;
  const size = [1.6, 1.2, 1];

  // Sync ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Set userData
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
    }
  }, [index]);

  // Animate position
  useFrame(() => {
    if (!groupRef.current) return;
    
    const targetY = isDragging ? 2 : isHolding ? 0.3 : 0;
    const targetScale = isDragging ? 1.2 : isHolding ? 1.1 : selected ? 1.05 : 1;
    
    if (isDragging) {
      // Direct position when dragging
      groupRef.current.position.set(position[0], position[1] + targetY, position[2]);
    } else {
      // Lerp back to position
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.2);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] + targetY, 0.2);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.2);
    }
    
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    
    // Update hold progress
    if (isHolding && !isDragging && holdTimer.current) {
      const elapsed = Date.now() - holdTimer.current;
      setHoldProgress(Math.min(elapsed / HOLD_TIME, 1));
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
    const dx = Math.abs(worldPos.x - answerZonePos[0]);
    const dz = Math.abs(worldPos.z - answerZonePos[2]);
    return dx < 2 && dz < 1.5;
  };

  const getWorldPosFromPointer = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(pointer.current, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);
    return intersection;
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    startPos.current = { x: clientX, y: clientY };
    
    // Set up drag plane at current Y position
    const worldY = groupRef.current.position.y + structurePos[1];
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -worldY);
    
    // Calculate offset
    const worldPos = getWorldPosFromPointer(clientX, clientY);
    offset.current.copy(worldPos).sub(new THREE.Vector3(
      groupRef.current.position.x + structurePos[0],
      worldY,
      groupRef.current.position.z + structurePos[2]
    ));
    
    setIsHolding(true);
    setHoldProgress(0);
    holdTimer.current = Date.now();
    
    // Capture pointer
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}
    
    console.log("Pointer down on box", index);
  };

  const handlePointerMove = (e) => {
    if (!isHolding && !isDraggingRef.current) return;
    e.stopPropagation();
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    
    // Check if we should start dragging
    if (isHolding && !isDraggingRef.current) {
      const elapsed = Date.now() - holdTimer.current;
      if (elapsed >= HOLD_TIME) {
        // Start drag
        isDraggingRef.current = true;
        onDragStart();
        setIsHolding(false);
        setHoldProgress(0);
        console.log("Started dragging box", index);
      }
    }
    
    // Move if dragging
    if (isDraggingRef.current) {
      const worldPos = getWorldPosFromPointer(clientX, clientY);
      const newPos = [
        worldPos.x - offset.current.x - structurePos[0],
        0,
        worldPos.z - offset.current.z - structurePos[2]
      ];
      onDragMove(newPos);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
    
    const clientX = e.clientX ?? startPos.current.x;
    const clientY = e.clientY ?? startPos.current.y;
    
    if (isDraggingRef.current) {
      // Check if over answer zone
      const worldPos = getWorldPosFromPointer(clientX, clientY);
      const overZone = isOverAnswerZone(worldPos);
      console.log("Dropped box", index, "over zone:", overZone);
      onDragEnd(overZone);
      isDraggingRef.current = false;
    } else {
      // Was just a tap
      const elapsed = Date.now() - (holdTimer.current || 0);
      if (elapsed < HOLD_TIME) {
        console.log("Tapped box", index);
        onSelect();
      }
    }
    
    setIsHolding(false);
    setHoldProgress(0);
    holdTimer.current = null;
  };

  const handlePointerCancel = (e) => {
    handlePointerUp(e);
  };

  return (
    <group
      position={position}
      ref={(g) => {
        groupRef.current = g;
        if (typeof ref === "function") ref(g);
        else if (ref) ref.current = g;
      }}
    >
      {/* Hold progress indicator */}
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
          <Text position={[0, 0.1, 0]} fontSize={0.2} color="white" anchorX="center">
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

      {/* Main box - THIS IS THE TOUCH TARGET */}
      <mesh
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

      {/* Wireframe effect */}
      {(isDragging || isHolding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      {/* Value */}
      <Text
        position={[0, size[1] / 2, size[2] / 2 + 0.01]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      {/* Index */}
      <Text
        position={[0, -0.2, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Drag instruction */}
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
});

// === ANSWER DROP ZONE ===
const AnswerDropZone = ({ position, isActive }) => {
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
    <group position={position}>
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
};

// === START BOX ===
const StartBox = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        position={[0, 0.6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
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

// === RESTART BOX ===
const RestartBox = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        position={[0, 0.6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick();
        }}
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

// === FLOATING FEEDBACK ===
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
        <planeGeometry args={[4, 1]} />
        <meshBasicMaterial color={correct ? "#065f46" : "#7f1d1d"} transparent opacity={0.9} />
      </mesh>
      <Text fontSize={0.4} color={correct ? "#34d399" : "#f87171"} anchorX="center">
        {text}
      </Text>
    </group>
  );
};

// === FADE TEXT ===
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
