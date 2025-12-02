import React, { useState, useRef, useEffect, useMemo } from "react";
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

  // Drag state - exactly like VisualPageAR
  const [draggedBox, setDraggedBox] = useState(null);
  const [dragPosition, setDragPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isARMode, setIsARMode] = useState(false);

  const boxRefs = useRef([]);
  const draggedBoxRef = useRef(null);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const [boxPositions, setBoxPositions] = useState([]);

  useEffect(() => {
    boxRefs.current = [];
  }, [mode]);

  useEffect(() => {
    setBoxPositions(positions.map((pos) => [...pos]));
  }, [positions]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("arrayAssessmentARPassed");
      if (stored === "true") {
        setIsPassed(true);
        setScore(totalAssessments);
        setModeIndex(modes.indexOf("done"));
        onPassStatusChange?.(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setDraggedBox(null);
    draggedBoxRef.current = null;
    setIsDragging(false);
    setBoxPositions(positions.map((pos) => [...pos]));

    if (mode === "access") prepareAccessQuestion();
    else if (mode === "search") prepareSearchQuestion();
    else if (mode === "insert") prepareInsertQuestion();
    else if (mode === "delete") prepareDeleteQuestion();
    else if (mode === "intro") {
      setData([...initialData]);
      setScore(0);
    } else if (mode === "done") {
      setQuestion(null);
    }
  }, [modeIndex]);

  useEffect(() => {
    if (mode !== "done") return;
    const ratio = score / totalAssessments;
    const passed = ratio >= passingRatio;
    setIsPassed(passed);
    onPassStatusChange?.(passed);
    try {
      if (passed) localStorage.setItem("arrayAssessmentARPassed", "true");
      else localStorage.removeItem("arrayAssessmentARPassed");
    } catch (e) {}
  }, [mode, score]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Drag box at index ${idx} to answer zone.`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Drag box with value ${value} to answer zone.`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const k = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Insert 99 at index ${k}. Which shifts?`,
      k,
      answerIndex: k,
      type: "insert",
    });
  };

  const prepareDeleteQuestion = () => {
    let k = Math.floor(Math.random() * data.length);
    if (k === data.length - 1 && data.length > 1) k--;
    setQuestion({
      prompt: `Delete index ${k}. What ends up at ${k}?`,
      k,
      answerIndex: k + 1 < data.length ? k + 1 : null,
      type: "delete",
    });
  };

  const resetBoxPosition = (index) => {
    setBoxPositions((prev) => {
      const updated = [...prev];
      updated[index] = [...positions[index]];
      return updated;
    });
  };

  const handleDropOnAnswer = (droppedIndex) => {
    if (!question) return;
    let correct = false;

    if (question.type === "access") correct = droppedIndex === question.answerIndex;
    else if (question.type === "search") correct = data[droppedIndex] === question.answerValue;
    else if (question.type === "insert") correct = droppedIndex === question.answerIndex;
    else if (question.type === "delete")
      correct = question.answerIndex !== null && droppedIndex === question.answerIndex;

    if (correct) setScore((s) => s + 1);

    setFeedback({ text: correct ? "✓ Correct!" : "✗ Wrong!", correct });
    setTimeout(() => {
      setFeedback(null);
      resetBoxPosition(droppedIndex);
      nextMode();
    }, 1000);

    setDraggedBox(null);
    draggedBoxRef.current = null;
    setIsDragging(false);
  };

  // Click handler
  const handleClick = (i) => {
    console.log("handleClick:", i, "mode:", mode);
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!isDragging) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  // Drag handlers - same as VisualPageAR
  const onDragStart = (index) => {
    console.log("onDragStart:", index);
    setDraggedBox(index);
    draggedBoxRef.current = index;
    setDragPosition([...positions[index]]);
    setIsDragging(true);
    setSelectedIndex(null);
  };

  const onDragMove = (newX, newZ) => {
    setDragPosition([newX, 0, newZ]);
  };

  const onDragEnd = () => {
    console.log("onDragEnd");
    const idx = draggedBoxRef.current;
    if (idx === null) return;

    // Check if over answer zone (z > 2.5)
    const isOverZone = dragPosition[2] > 2.5 && Math.abs(dragPosition[0]) < 2;
    console.log("Over zone:", isOverZone, "pos:", dragPosition);

    if (isOverZone) {
      handleDropOnAnswer(idx);
    } else {
      resetBoxPosition(idx);
      setDraggedBox(null);
      draggedBoxRef.current = null;
      setIsDragging(false);
    }
  };

  const startAR = (gl) => {
    if (!navigator.xr) return;
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
  };

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

        <group position={[0, 0, -8]}>
          {/* Title */}
          <Text position={[0, 4, 0]} fontSize={0.55} color="#facc15" anchorX="center">
            {mode === "intro"
              ? "Arrays — AR Assessment"
              : mode === "done"
              ? "Complete!"
              : `Q${modeIndex}: ${mode.toUpperCase()}`}
          </Text>

          {isARMode && (
            <Text position={[0, 4.5, 0]} fontSize={0.25} color="#22c55e" anchorX="center">
              🔮 AR Mode
            </Text>
          )}

          {/* Status */}
          <Text
            position={[0, 3.2, 0]}
            fontSize={0.28}
            color={isDragging ? "#f97316" : "white"}
            anchorX="center"
            maxWidth={10}
            textAlign="center"
          >
            {isDragging
              ? "✋ Drag to Answer Zone..."
              : mode === "intro"
              ? "Tap Start to begin"
              : mode === "done"
              ? isPassed
                ? "You passed!"
                : "Try again"
              : question?.prompt || ""}
          </Text>

          {/* Progress */}
          {mode !== "intro" && mode !== "done" && (
            <Text position={[0, 2.5, 0]} fontSize={0.22} color="#fde68a" anchorX="center">
              Score: {score}/{totalAssessments}
            </Text>
          )}

          {/* Answer Zone */}
          {mode !== "intro" && mode !== "done" && (
            <AnswerZone position={[0, -0.5, 4]} isActive={isDragging} />
          )}

          {/* Content based on mode */}
          {mode === "intro" ? (
            <InteractiveBox
              position={[0, 0.6, 0]}
              size={[5, 2.2, 1]}
              color="#60a5fa"
              label="▶ START"
              onClick={() => handleClick(0)}
            />
          ) : mode === "done" ? (
            <>
              <Text
                position={[0, 1.2, 0]}
                fontSize={0.45}
                color={isPassed ? "#22c55e" : "#ef4444"}
                anchorX="center"
              >
                {isPassed ? "PASSED ✓" : "FAILED ✗"}
              </Text>
              <InteractiveBox
                position={[0, -0.3, 0]}
                size={[4, 1.5, 1]}
                color="#fb923c"
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
              <DraggableBox
                key={`${mode}-${i}`}
                index={i}
                value={value}
                basePosition={positions[i]}
                dragX={draggedBox === i ? dragPosition[0] : null}
                dragZ={draggedBox === i ? dragPosition[2] : null}
                selected={selectedIndex === i}
                isDragging={draggedBox === i}
                isOtherDragging={isDragging && draggedBox !== i}
                onClick={() => handleClick(i)}
                onDragStart={() => onDragStart(i)}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                ref={(r) => {
                  if (r) boxRefs.current[i] = r;
                }}
              />
            ))
          )}

          {/* Feedback */}
          {feedback && (
            <Text
              position={[0, 1.5, 4]}
              fontSize={0.4}
              color={feedback.correct ? "#22c55e" : "#ef4444"}
              anchorX="center"
            >
              {feedback.text}
            </Text>
          )}
        </group>

        {/* AR handler */}
        <ARHandler
          boxRefs={boxRefs}
          mode={mode}
          isDragging={isDragging}
          draggedBoxRef={draggedBoxRef}
          onBoxClick={handleClick}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          spacing={spacing}
          dataLength={data.length}
        />

        <OrbitControls makeDefault enabled={!isDragging} />
      </Canvas>
    </div>
  );
};

// === Simple Interactive Box (Start/Restart) ===
const InteractiveBox = ({ position, size, color, label, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      ref.current.userData = { boxIndex: 0 };
    }
  }, []);

  return (
    <group position={position} ref={ref}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered ? "#3b82f6" : color}
          emissive={hovered ? "#3b82f6" : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text position={[0, 0, size[2] / 2 + 0.01]} fontSize={0.4} color="white" anchorX="center">
        {label}
      </Text>
    </group>
  );
};

// === Draggable Box - Same pattern as VisualPageAR's SlidingBox ===
const DraggableBox = React.forwardRef(
  (
    {
      index,
      value,
      basePosition,
      dragX,
      dragZ,
      selected,
      isDragging,
      isOtherDragging,
      onClick,
      onDragStart,
      onDragMove,
      onDragEnd,
    },
    ref
  ) => {
    const groupRef = useRef();
    const { camera, gl, raycaster } = useThree();

    const [hovered, setHovered] = useState(false);
    const [holding, setHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);

    const holdTimer = useRef(null);
    const holdStart = useRef(null);
    const isPointerDown = useRef(false);
    const hasDragged = useRef(false);

    const currentX = useRef(basePosition[0]);
    const currentY = useRef(0);
    const currentZ = useRef(0);

    const pointer = useRef(new THREE.Vector2());
    const size = [1.6, 1.2, 1];
    const HOLD_TIME = 400;

    // Set userData
    useEffect(() => {
      if (groupRef.current) {
        groupRef.current.userData = { boxIndex: index };
        groupRef.current.traverse((child) => {
          child.userData = { boxIndex: index };
        });
      }
    }, [index]);

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") ref(groupRef.current);
        else ref.current = groupRef.current;
      }
    }, [ref]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
      };
    }, []);

    // Reset position when basePosition changes
    useEffect(() => {
      if (!isDragging) {
        currentX.current = basePosition[0];
        currentZ.current = 0;
      }
    }, [basePosition, isDragging]);

    const getColor = () => {
      if (isDragging) return "#f97316";
      if (holding) return "#fb923c";
      if (selected) return "#facc15";
      if (hovered) return "#818cf8";
      if (isOtherDragging) return "#6b7280";
      return index % 2 === 0 ? "#60a5fa" : "#34d399";
    };

    const getWorldXZ = (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer.current, camera);

      // Plane at z = -8 (where the structure is)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 8);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      return { x: intersection.x, z: -intersection.y };
    };

    const handlePointerDown = (e) => {
      e.stopPropagation();
      console.log("PointerDown box:", index);

      isPointerDown.current = true;
      hasDragged.current = false;
      setHolding(true);
      setHoldProgress(0);
      holdStart.current = Date.now();

      holdTimer.current = setTimeout(() => {
        if (isPointerDown.current) {
          console.log("Hold complete, start drag:", index);
          hasDragged.current = true;
          onDragStart();
          setHolding(false);
        }
      }, HOLD_TIME);

      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const handlePointerMove = (e) => {
      if (!isPointerDown.current) return;
      e.stopPropagation();

      // Update hold progress
      if (holding && holdStart.current) {
        const elapsed = Date.now() - holdStart.current;
        setHoldProgress(Math.min(elapsed / HOLD_TIME, 1));
      }

      // Move if dragging
      if (hasDragged.current) {
        const { x, z } = getWorldXZ(e.clientX, e.clientY);
        onDragMove(x, z);
      }
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();
      console.log("PointerUp box:", index, "dragged:", hasDragged.current);

      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (hasDragged.current) {
        onDragEnd();
      } else if (isPointerDown.current) {
        const elapsed = Date.now() - (holdStart.current || 0);
        if (elapsed < HOLD_TIME) {
          console.log("Quick tap:", index);
          onClick();
        }
      }

      isPointerDown.current = false;
      hasDragged.current = false;
      setHolding(false);
      setHoldProgress(0);
      holdStart.current = null;
    };

    // Animation
    useFrame(() => {
      if (!groupRef.current) return;

      let targetX, targetY, targetZ;

      if (isDragging && dragX !== null) {
        targetX = dragX;
        targetY = 1.5;
        targetZ = dragZ || 0;
      } else {
        targetX = basePosition[0];
        targetY = holding ? 0.3 : 0;
        targetZ = 0;
      }

      const speed = isDragging ? 0.3 : 0.15;
      currentX.current += (targetX - currentX.current) * speed;
      currentY.current += (targetY - currentY.current) * speed;
      currentZ.current += (targetZ - currentZ.current) * speed;

      groupRef.current.position.set(currentX.current, currentY.current, currentZ.current);

      const scale = isDragging ? 1.15 : holding ? 1.08 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
    });

    return (
      <group ref={groupRef}>
        {/* Hold progress ring */}
        {holding && !isDragging && holdProgress > 0 && (
          <mesh position={[0, size[1] + 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.25, 0.4, 32, 1, 0, Math.PI * 2 * holdProgress]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        )}

        {/* Shadow */}
        {isDragging && (
          <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 32]} />
            <meshBasicMaterial color="#000" transparent opacity={0.3} />
          </mesh>
        )}

        {/* Main box */}
        <mesh
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
            <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, size[2] + 0.06]} />
            <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
          </mesh>
        )}

        {/* Value */}
        <Text
          position={[0, size[1] / 2, size[2] / 2 + 0.01]}
          fontSize={0.4}
          color="white"
          anchorX="center"
        >
          {value}
        </Text>

        {/* Index */}
        <Text
          position={[0, -0.15, size[2] / 2 + 0.01]}
          fontSize={0.25}
          color="yellow"
          anchorX="center"
        >
          [{index}]
        </Text>

        {/* Dragging label */}
        {isDragging && (
          <Text position={[0, size[1] + 0.6, 0]} fontSize={0.22} color="#f97316" anchorX="center">
            ✋ Drag to zone
          </Text>
        )}
      </group>
    );
  }
);

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
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.35}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
      >
        {isActive ? "📍 Drop Here!" : "Answer Zone"}
      </Text>
    </group>
  );
};

// === AR Handler ===
const ARHandler = ({
  boxRefs,
  mode,
  isDragging,
  draggedBoxRef,
  onBoxClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  spacing,
  dataLength,
}) => {
  const { gl, scene } = useThree();
  const longPressTimer = useRef(null);
  const touchedBox = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      console.log("AR Session Started");

      const getCameraRay = () => {
        const xrCamera = gl.xr.getCamera();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        return { origin, dir };
      };

      const getHitBox = () => {
        const { origin, dir } = getCameraRay();
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, dir);

        const allMeshes = [];
        boxRefs.current.forEach((group, idx) => {
          if (group) {
            group.traverse((child) => {
              if (child.isMesh) {
                child.userData.parentBoxIndex = idx;
                allMeshes.push(child);
              }
            });
          }
        });

        // Fallback: search scene
        if (allMeshes.length === 0) {
          scene.traverse((child) => {
            if (child.isMesh && child.userData?.boxIndex !== undefined) {
              allMeshes.push(child);
            }
          });
        }

        const hits = raycaster.intersectObjects(allMeshes, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj) {
            if (obj.userData?.parentBoxIndex !== undefined) return obj.userData.parentBoxIndex;
            if (obj.userData?.boxIndex !== undefined) return obj.userData.boxIndex;
            obj = obj.parent;
          }
          return -1;
        }
        return null;
      };

      const getRayXZ = () => {
        const { origin, dir } = getCameraRay();
        const planeZ = -8;
        const t = (planeZ - origin.z) / dir.z;
        if (t > 0) {
          const x = origin.x + dir.x * t;
          const y = origin.y + dir.y * t;
          const mid = (dataLength - 1) / 2;
          const minX = -mid * spacing - spacing;
          const maxX = mid * spacing + spacing;
          return { x: Math.max(minX, Math.min(maxX, x)), z: -y };
        }
        return { x: 0, z: 0 };
      };

      const onSelectStart = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        const hitBox = getHitBox();
        touchedBox.current = hitBox;

        if (mode === "intro" || mode === "done") {
          if (hitBox !== null) onBoxClick(hitBox >= 0 ? hitBox : 0);
          return;
        }

        if (hitBox !== null && hitBox >= 0) {
          longPressTimer.current = setTimeout(() => {
            onDragStart(hitBox);
            longPressTimer.current = null;
          }, 400);
        }
      };

      const onSelectEnd = () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current) {
          onDragEnd();
        } else if (touchedBox.current !== null && touchedBox.current >= 0) {
          onBoxClick(touchedBox.current);
        }

        touchedBox.current = null;
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);

      const onFrame = () => {
        if (isDraggingRef.current && draggedBoxRef.current !== null) {
          const { x, z } = getRayXZ();
          onDragMove(x, z);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      session.addEventListener("end", () => {
        session.removeEventListener("selectstart", onSelectStart);
        session.removeEventListener("selectend", onSelectEnd);
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      });
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => {
      gl.xr.removeEventListener("sessionstart", onSessionStart);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [gl, scene, boxRefs, mode, onBoxClick, onDragStart, onDragMove, onDragEnd, spacing, dataLength]);

  return null;
};

export default AssessmentAR;
