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

  const [score, setScore] = useState(0);
  const totalAssessments = 4;
  const [isPassed, setIsPassed] = useState(false);
  
  // Drag state
  const [draggedBox, setDraggedBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
    setDraggedBox(null);
    setIsDragging(false);
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
      if (passed) localStorage.setItem("arrayAssessmentARPassed", "true");
      else localStorage.removeItem("arrayAssessmentARPassed");
    } catch (e) {}
  }, [mode, score]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({ prompt: `Drag box at index ${idx} to answer zone.`, answerIndex: idx, type: "access" });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({ prompt: `Drag box with value ${value} to answer zone.`, answerValue: value, type: "search" });
  };

  const prepareInsertQuestion = () => {
    const k = Math.floor(Math.random() * data.length);
    setQuestion({ prompt: `Insert 99 at index ${k}. Which shifts?`, k, answerIndex: k, type: "insert" });
  };

  const prepareDeleteQuestion = () => {
    let k = Math.floor(Math.random() * data.length);
    if (k === data.length - 1 && data.length > 1) k--;
    setQuestion({ prompt: `Delete index ${k}. What's at ${k}?`, k, answerIndex: k + 1 < data.length ? k + 1 : null, type: "delete" });
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

    if (question.type === "access") correct = droppedIndex === question.answerIndex;
    else if (question.type === "search") correct = data[droppedIndex] === question.answerValue;
    else if (question.type === "insert") correct = droppedIndex === question.answerIndex;
    else if (question.type === "delete") correct = question.answerIndex !== null && droppedIndex === question.answerIndex;

    if (correct) setScore((s) => s + 1);

    setFeedback({ text: correct ? "✓ Correct!" : "✗ Wrong!", correct });
    setTimeout(() => {
      setFeedback(null);
      resetBoxPosition(droppedIndex);
      nextMode();
    }, 1000);

    setDraggedBox(null);
    setIsDragging(false);
  };

  const handleBoxClick = (i) => {
    console.log("Box clicked:", i);
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!isDragging) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  const handleDragStart = (index) => {
    console.log("Drag start:", index);
    setDraggedBox(index);
    setIsDragging(true);
    setSelectedIndex(null);
  };

  const handleDragMove = (index, newPos) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = newPos;
      return updated;
    });
  };

  const handleDragEnd = (index, isOverZone) => {
    console.log("Drag end:", index, "over zone:", isOverZone);
    if (isOverZone) {
      handleDropOnAnswer(index);
    } else {
      resetBoxPosition(index);
      setDraggedBox(null);
      setIsDragging(false);
    }
  };

  return (
    <div className="w-full h-[400px]">
      <Canvas camera={{ position: [0, 5, 14], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <group position={[0, 0, -8]}>
          {/* Title */}
          <Text position={[0, 4, 0]} fontSize={0.55} color="#facc15" anchorX="center">
            {mode === "intro" ? "Arrays — Assessment" : mode === "done" ? "Complete!" : `Q${modeIndex}: ${mode.toUpperCase()}`}
          </Text>

          {/* Question */}
          <Text position={[0, 3.2, 0]} fontSize={0.28} color="white" anchorX="center" maxWidth={10} textAlign="center">
            {mode === "intro" ? "Tap Start to begin" : mode === "done" ? (isPassed ? "You passed!" : "Try again") : question?.prompt || ""}
          </Text>

          {/* Progress */}
          {mode !== "intro" && mode !== "done" && (
            <Text position={[0, 2.5, 0]} fontSize={0.22} color="#fde68a" anchorX="center">
              {`Score: ${score}/${totalAssessments}`}
            </Text>
          )}

          {/* Answer Zone */}
          {mode !== "intro" && mode !== "done" && (
            <AnswerZone position={[0, -0.5, 4]} isActive={isDragging} />
          )}

          {/* Boxes */}
          {mode === "intro" ? (
            <ClickableBox
              position={[0, 0.6, 0]}
              size={[5, 2.2, 1]}
              color="#60a5fa"
              hoverColor="#3b82f6"
              label="▶ START"
              onClick={() => setModeIndex(1)}
            />
          ) : mode === "done" ? (
            <>
              <Text position={[0, 1.2, 0]} fontSize={0.45} color={isPassed ? "#22c55e" : "#ef4444"} anchorX="center">
                {isPassed ? "PASSED ✓" : "FAILED ✗"}
              </Text>
              <ClickableBox
                position={[0, -0.5, 0]}
                size={[4, 1.5, 1]}
                color="#fb923c"
                hoverColor="#f97316"
                label="🔄 Restart"
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
              <DragBox
                key={`${mode}-${i}`}
                index={i}
                value={value}
                position={boxPositions[i] || originalPositions[i]}
                basePosition={originalPositions[i]}
                selected={selectedIndex === i}
                isDragging={draggedBox === i}
                isOtherDragging={isDragging && draggedBox !== i}
                onClick={() => handleBoxClick(i)}
                onDragStart={() => handleDragStart(i)}
                onDragMove={(pos) => handleDragMove(i, pos)}
                onDragEnd={(overZone) => handleDragEnd(i, overZone)}
              />
            ))
          )}

          {/* Feedback */}
          {feedback && (
            <Text position={[0, 1.5, 4]} fontSize={0.4} color={feedback.correct ? "#22c55e" : "#ef4444"} anchorX="center">
              {feedback.text}
            </Text>
          )}
        </group>

        <OrbitControls makeDefault enabled={!isDragging} />
      </Canvas>
    </div>
  );
};

// === Simple Clickable Box (for Start/Restart) ===
const ClickableBox = ({ position, size, color, hoverColor, label, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          emissive={hovered ? hoverColor : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text position={[0, 0, size[2] / 2 + 0.01]} fontSize={0.4} color="white" anchorX="center">
        {label}
      </Text>
    </group>
  );
};

// === Draggable Box with Built-in Touch Handling ===
const DragBox = ({
  index,
  value,
  position,
  basePosition,
  selected,
  isDragging,
  isOtherDragging,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const { camera, gl, raycaster } = useThree();
  const groupRef = useRef();
  const meshRef = useRef();
  
  const [hovered, setHovered] = useState(false);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const holdTimer = useRef(null);
  const holdStart = useRef(null);
  const isDown = useRef(false);
  const draggingRef = useRef(false);
  const pointer = useRef(new THREE.Vector2());

  const size = [1.6, 1.2, 1];
  const HOLD_TIME = 500;

  useEffect(() => {
    draggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (holding) return "#fb923c";
    if (selected) return "#facc15";
    if (hovered) return "#818cf8";
    if (isOtherDragging) return "#6b7280";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  const isOverAnswerZone = () => {
    if (!groupRef.current) return false;
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    // Answer zone is at z = -8 + 4 = -4 in world space
    return worldPos.z > -5.5 && Math.abs(worldPos.x) < 2;
  };

  const getWorldPos = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(pointer.current, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 8);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    return [intersection.x, intersection.y, 0];
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    console.log("PointerDown on box", index);
    
    isDown.current = true;
    setHolding(true);
    setHoldProgress(0);
    holdStart.current = Date.now();

    holdTimer.current = setTimeout(() => {
      if (isDown.current) {
        console.log("Hold complete, start drag", index);
        draggingRef.current = true;
        onDragStart();
        setHolding(false);
      }
    }, HOLD_TIME);

    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDown.current) return;
    e.stopPropagation();

    // Update hold progress
    if (holding && holdStart.current) {
      const elapsed = Date.now() - holdStart.current;
      setHoldProgress(Math.min(elapsed / HOLD_TIME, 1));
    }

    // Move if dragging
    if (draggingRef.current) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      const worldPos = getWorldPos(clientX, clientY);
      onDragMove(worldPos);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    console.log("PointerUp on box", index, "dragging:", draggingRef.current);

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}

    if (draggingRef.current) {
      const overZone = isOverAnswerZone();
      console.log("Dropping, over zone:", overZone);
      onDragEnd(overZone);
      draggingRef.current = false;
    } else if (isDown.current) {
      const elapsed = Date.now() - (holdStart.current || 0);
      if (elapsed < HOLD_TIME) {
        console.log("Quick tap on box", index);
        onClick();
      }
    }

    isDown.current = false;
    setHolding(false);
    setHoldProgress(0);
    holdStart.current = null;
  };

  // Animate position
  useFrame(() => {
    if (!groupRef.current) return;

    let targetX = position[0];
    let targetY = isDragging ? 1.5 : holding ? 0.3 : 0;
    let targetZ = position[2] || 0;

    const speed = isDragging ? 0.3 : 0.15;
    
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * speed;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * speed;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * speed;

    const scale = isDragging ? 1.15 : holding ? 1.08 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
  });

  return (
    <group ref={groupRef} position={[basePosition[0], 0, 0]}>
      {/* Hold progress ring */}
      {holding && !isDragging && holdProgress > 0 && (
        <group position={[0, size[1] + 1, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 32, 1, 0, Math.PI * 2 * holdProgress]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Shadow */}
      {isDragging && (
        <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="#000" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main mesh - TOUCH TARGET */}
      <mesh
        ref={meshRef}
        position={[0, size[1] / 2, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : holding ? "#fb923c" : selected ? "#facc15" : "#000"}
          emissiveIntensity={isDragging ? 0.5 : holding ? 0.4 : selected ? 0.3 : 0}
          transparent={isOtherDragging}
          opacity={isOtherDragging ? 0.4 : 1}
        />
      </mesh>

      {/* Wireframe */}
      {(isDragging || holding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      {/* Value */}
      <Text position={[0, size[1] / 2, size[2] / 2 + 0.01]} fontSize={0.4} color="white" anchorX="center">
        {value}
      </Text>

      {/* Index */}
      <Text position={[0, -0.15, size[2] / 2 + 0.01]} fontSize={0.25} color="yellow" anchorX="center">
        [{index}]
      </Text>

      {/* Status */}
      {isDragging && (
        <Text position={[0, size[1] + 0.6, 0]} fontSize={0.22} color="#f97316" anchorX="center">
          ✋ Drag to zone
        </Text>
      )}
    </group>
  );
};

// === Answer Zone ===
const AnswerZone = ({ position, isActive }) => {
  const meshRef = useRef();
  const pulse = useRef(0);

  useFrame(() => {
    if (meshRef.current && isActive) {
      pulse.current += 0.08;
      meshRef.current.material.emissiveIntensity = Math.sin(pulse.current) * 0.3 + 0.5;
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
      <Text position={[0, 0.4, 0]} fontSize={0.35} color={isActive ? "#22c55e" : "#94a3b8"} anchorX="center">
        {isActive ? "📍 Drop Here!" : "Answer Zone"}
      </Text>
    </group>
  );
};

export default AssessmentAR;
