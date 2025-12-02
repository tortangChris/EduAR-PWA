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
  const [isARMode, setIsARMode] = useState(false);

  // Refs for AR
  const boxRefs = useRef([]);
  const draggedBoxRef = useRef(null);

  // Clear refs when mode changes
  useEffect(() => {
    boxRefs.current = [];
  }, [mode]);

  const addBoxRef = (r, index) => {
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
    draggedBoxRef.current = null;
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
    draggedBoxRef.current = index;
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
      draggedBoxRef.current = null;
      setIsDragging(false);
    }
  };

  // AR Session Start
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
              session.addEventListener("end", () => {
                setIsARMode(false);
              });
            })
            .catch((err) => console.error("AR session failed:", err));
        } else {
          console.warn("AR not supported on this device.");
        }
      });
    }
  };

  return (
    <div className="w-full h-[400px]" style={{ touchAction: 'none' }}>
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

        <group position={[0, 0, -8]}>
          {/* Title */}
          <Text position={[0, 4, 0]} fontSize={0.55} color="#facc15" anchorX="center">
            {mode === "intro" ? "Arrays — AR Assessment" : mode === "done" ? "Complete!" : `Q${modeIndex}: ${mode.toUpperCase()}`}
          </Text>

          {/* AR Mode indicator */}
          {isARMode && (
            <Text position={[0, 4.5, 0]} fontSize={0.25} color="#22c55e" anchorX="center">
              🔮 AR Mode Active
            </Text>
          )}

          {/* Question */}
          <Text position={[0, 3.2, 0]} fontSize={0.28} color="white" anchorX="center" maxWidth={10} textAlign="center">
            {isDragging 
              ? "✋ Drag to Answer Zone..." 
              : mode === "intro" 
              ? "Tap Start to begin" 
              : mode === "done" 
              ? (isPassed ? "You passed!" : "Try again") 
              : question?.prompt || ""}
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
                ref={(r) => addBoxRef(r, i)}
              />
            ))
          )}

          {/* Feedback */}
          {feedback && (
            <group position={[0, 1.5, 4]}>
              <mesh>
                <planeGeometry args={[3, 0.8]} />
                <meshBasicMaterial color={feedback.correct ? "#065f46" : "#7f1d1d"} transparent opacity={0.9} />
              </mesh>
              <Text position={[0, 0, 0.01]} fontSize={0.35} color={feedback.correct ? "#22c55e" : "#ef4444"} anchorX="center">
                {feedback.text}
              </Text>
            </group>
          )}
        </group>

        {/* AR Interaction Handler */}
        <ARInteractionManager
          boxRefs={boxRefs}
          mode={mode}
          isDragging={isDragging}
          draggedBoxRef={draggedBoxRef}
          onBoxClick={handleBoxClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          dataLength={data.length}
          spacing={spacing}
        />

        <OrbitControls makeDefault enabled={!isDragging} />
      </Canvas>
    </div>
  );
};

// === Simple Clickable Box (for Start/Restart) ===
const ClickableBox = ({ position, size, color, hoverColor, label, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: 0 };
      groupRef.current.traverse((child) => {
        child.userData = { boxIndex: 0 };
      });
    }
  }, []);

  return (
    <group position={position} ref={groupRef}>
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

// === Draggable Box ===
const DragBox = forwardRef(({
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
}, ref) => {
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

  // Forward ref
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
      groupRef.current.traverse((child) => {
        child.userData = { boxIndex: index };
      });
    }
    if (ref) {
      if (typeof ref === 'function') ref(groupRef.current);
      else ref.current = groupRef.current;
    }
  }, [index, ref]);

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
    console.log("PointerDown box", index);
    
    isDown.current = true;
    setHolding(true);
    setHoldProgress(0);
    holdStart.current = Date.now();

    holdTimer.current = setTimeout(() => {
      if (isDown.current) {
        console.log("Hold complete, drag", index);
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

    if (holding && holdStart.current) {
      const elapsed = Date.now() - holdStart.current;
      setHoldProgress(Math.min(elapsed / HOLD_TIME, 1));
    }

    if (draggingRef.current) {
      const worldPos = getWorldPos(e.clientX, e.clientY);
      onDragMove(worldPos);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    console.log("PointerUp box", index, "dragging:", draggingRef.current);

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}

    if (draggingRef.current) {
      const overZone = isOverAnswerZone();
      onDragEnd(overZone);
      draggingRef.current = false;
    } else if (isDown.current) {
      const elapsed = Date.now() - (holdStart.current || 0);
      if (elapsed < HOLD_TIME) {
        onClick();
      }
    }

    isDown.current = false;
    setHolding(false);
    setHoldProgress(0);
    holdStart.current = null;
  };

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
      {holding && !isDragging && holdProgress > 0 && (
        <group position={[0, size[1] + 1, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 32, 1, 0, Math.PI * 2 * holdProgress]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {isDragging && (
        <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="#000" transparent opacity={0.3} />
        </mesh>
      )}

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

      {(isDragging || holding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      <Text position={[0, size[1] / 2, size[2] / 2 + 0.01]} fontSize={0.4} color="white" anchorX="center">
        {value}
      </Text>

      <Text position={[0, -0.15, size[2] / 2 + 0.01]} fontSize={0.25} color="yellow" anchorX="center">
        [{index}]
      </Text>

      {isDragging && (
        <Text position={[0, size[1] + 0.6, 0]} fontSize={0.22} color="#f97316" anchorX="center">
          ✋ Drag to zone
        </Text>
      )}
    </group>
  );
});

// === AR Interaction Manager (for XR sessions) ===
const ARInteractionManager = ({
  boxRefs,
  mode,
  isDragging,
  draggedBoxRef,
  onBoxClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  dataLength,
  spacing,
}) => {
  const { gl } = useThree();
  const longPressTimer = useRef(null);
  const touchedBoxIndex = useRef(null);
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

      const getHitBoxIndex = () => {
        const { origin, dir } = getCameraRay();
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, dir);

        const allMeshes = [];
        boxRefs.current.forEach((group, idx) => {
          if (group && group.children) {
            group.traverse((child) => {
              if (child.isMesh) {
                child.userData.parentBoxIndex = idx;
                allMeshes.push(child);
              }
            });
          }
        });

        const hits = raycaster.intersectObjects(allMeshes, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj) {
            if (obj.userData?.parentBoxIndex !== undefined) {
              return obj.userData.parentBoxIndex;
            }
            if (obj.userData?.boxIndex !== undefined) {
              return obj.userData.boxIndex;
            }
            obj = obj.parent;
          }
        }
        return null;
      };

      const getPointPosition = () => {
        const { origin, dir } = getCameraRay();
        const planeZ = -8;
        const t = (planeZ - origin.z) / dir.z;
        
        if (t > 0) {
          const x = origin.x + dir.x * t;
          const y = origin.y + dir.y * t;
          const mid = (dataLength - 1) / 2;
          const minX = -mid * spacing - spacing;
          const maxX = mid * spacing + spacing;
          return [Math.max(minX, Math.min(maxX, x)), y, 0];
        }
        return [0, 0, 0];
      };

      const isOverAnswerZone = (pos) => {
        return pos[1] < -0.5 && Math.abs(pos[0]) < 2;
      };

      const onSelectStart = () => {
        console.log("AR selectstart");
        
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        const hitIdx = getHitBoxIndex();
        touchedBoxIndex.current = hitIdx;
        console.log("AR hit:", hitIdx);

        if (mode === "intro" || mode === "done") {
          if (hitIdx !== null) {
            onBoxClick(hitIdx);
          }
          return;
        }

        if (hitIdx !== null && hitIdx >= 0) {
          longPressTimer.current = setTimeout(() => {
            console.log("AR long press complete:", hitIdx);
            onDragStart(hitIdx);
            longPressTimer.current = null;
          }, 500);
        }
      };

      const onSelectEnd = () => {
        console.log("AR selectend, dragging:", isDraggingRef.current);
        
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current && draggedBoxRef.current !== null) {
          const pos = getPointPosition();
          const overZone = isOverAnswerZone(pos);
          console.log("AR drop, overZone:", overZone);
          onDragEnd(draggedBoxRef.current, overZone);
        } else if (touchedBoxIndex.current !== null) {
          onBoxClick(touchedBoxIndex.current);
        }

        touchedBoxIndex.current = null;
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);

      // Frame loop for dragging
      const onFrame = (time, frame) => {
        if (isDraggingRef.current && draggedBoxRef.current !== null) {
          const pos = getPointPosition();
          onDragMove(draggedBoxRef.current, pos);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      session.addEventListener("end", () => {
        console.log("AR Session Ended");
        session.removeEventListener("selectstart", onSelectStart);
        session.removeEventListener("selectend", onSelectEnd);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      });
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);

    return () => {
      gl.xr.removeEventListener("sessionstart", onSessionStart);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [gl, boxRefs, mode, onBoxClick, onDragStart, onDragMove, onDragEnd, dataLength, spacing]);

  return null;
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
