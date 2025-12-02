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
  
  const [draggedBox, setDraggedBox] = useState(null);
  const [isDraggingStructure, setIsDraggingStructure] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  
  const [structurePos, setStructurePos] = useState([0, 0, -8]);

  const boxRefs = useRef([]);
  const structureRef = useRef();
  const answerZoneRef = useRef();
  const draggedBoxRef = useRef(null);

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
    } catch (e) {
      console.warn("Unable to access localStorage", e);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
    setDraggedBox(null);
    draggedBoxRef.current = null;
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
    } catch (e) {
      console.warn("Unable to write localStorage", e);
    }
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () =>
    setModeIndex((m) => Math.min(m + 1, modes.length - 1));

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
      prompt: `If we insert ${insertValue} at index ${k}, which element will shift? Drag it to the answer zone.`,
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
      prompt: `Delete value at index ${k}. Which value will end up at index ${k}? Drag it to the answer zone.`,
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
      correct = question.answerIndex !== null && droppedIndex === question.answerIndex;
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
    draggedBoxRef.current = null;
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
    if (!isDraggingStructure && draggedBox === null) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  const onStructureDragStart = () => {
    setIsDraggingStructure(true);
    setDraggedBox(null);
    draggedBoxRef.current = null;
    setSelectedIndex(null);
  };

  const onStructureDragMove = (newPos) => {
    setStructurePos(newPos);
  };

  const onStructureDragEnd = () => {
    setIsDraggingStructure(false);
  };

  const onBoxDragStart = (index) => {
    setDraggedBox(index);
    draggedBoxRef.current = index;
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
    if (isOverAnswerZone) {
      handleDropOnAnswer(index);
    } else {
      resetBoxPosition(index);
      setDraggedBox(null);
      draggedBoxRef.current = null;
    }
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
                : `Assessment ${modeIndex}: ${mode.toUpperCase()}`
            }
            position={[0, 4, 0]}
            fontSize={0.55}
            color="#facc15"
          />

          {isARMode && (
            <FadeText
              text="🔮 AR Mode Active"
              position={[0, 4.6, 0]}
              fontSize={0.25}
              color="#22c55e"
            />
          )}

          <FadeText
            text={
              isDraggingStructure
                ? "✋ Moving Structure..."
                : draggedBox !== null
                ? "✋ Drag to Answer Zone..."
                : mode === "intro"
                ? "Tap the box below to start the assessment"
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
            color={isDraggingStructure || draggedBox !== null ? "#f97316" : "white"}
          />

          {mode !== "intro" && mode !== "done" && !isDraggingStructure && (
            <FadeText
              text={isARMode 
                ? "Long press box → drag to answer zone"
                : "Hold box to drag • Drop on Answer Zone"
              }
              position={[0, 2.7, 0]}
              fontSize={0.2}
              color="#94a3b8"
            />
          )}

          {mode !== "intro" && mode !== "done" && (
            <FadeText
              text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
              position={[0, 2.3, 0]}
              fontSize={0.24}
              color="#fde68a"
            />
          )}

          {mode !== "intro" && mode !== "done" && !isDraggingStructure && (
            <AnswerDropZone
              ref={answerZoneRef}
              position={[0, -0.5, 4]}
              isActive={draggedBox !== null}
              feedback={feedback}
            />
          )}

          {/* START BOX - Original working version */}
          {mode === "intro" && (
            <StartBox position={[0, 0, 0]} onClick={() => handleBoxClick(0)} />
          )}

          {/* DONE MODE */}
          {mode === "done" && (
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
                    localStorage.removeItem("arrayAssessmentARPassed");
                  } catch (e) {}
                }}
              />
            </>
          )}

          {/* QUESTION MODE - Boxes */}
          {mode !== "intro" && mode !== "done" && (
            data.map((value, i) => {
              let extraOpacity = 1;
              if (animState[i] === "fade") extraOpacity = 0.25;
              const isSelected = selectedIndex === i;

              return (
                <ARBox
                  key={`${mode}-${i}`}
                  index={i}
                  value={value}
                  position={boxPositions[i] || originalPositions[i]}
                  basePosition={originalPositions[i]}
                  selected={isSelected}
                  isDragging={draggedBox === i}
                  isOtherDragging={draggedBox !== null && draggedBox !== i}
                  opacity={extraOpacity}
                  onSelect={() => handleBoxClick(i)}
                  onDragStart={() => onBoxDragStart(i)}
                  onDragMove={(pos) => onBoxDragMove(i, pos)}
                  onDragEnd={(overZone) => onBoxDragEnd(i, overZone)}
                  answerZonePos={answerZoneWorldPos}
                  structurePos={structurePos}
                  ref={(r) => addBoxRef(r, i)}
                />
              );
            })
          )}

          {feedback && !isDraggingStructure && (
            <FloatingFeedback
              text={feedback.text}
              correct={feedback.correct}
              position={[0, 1.8, 4]}
            />
          )}
        </group>

        <ARInteractionManager
          boxRefs={boxRefs}
          mode={mode}
          draggedBox={draggedBox}
          draggedBoxRef={draggedBoxRef}
          isDraggingStructure={isDraggingStructure}
          onBoxClick={handleBoxClick}
          onBoxDragStart={onBoxDragStart}
          onBoxDragMove={onBoxDragMove}
          onBoxDragEnd={onBoxDragEnd}
          onStructureDragStart={onStructureDragStart}
          onStructureDragMove={onStructureDragMove}
          onStructureDragEnd={onStructureDragEnd}
          answerZonePosition={answerZoneWorldPos}
          structurePos={structurePos}
        />

        <OrbitControls 
          makeDefault 
          enabled={draggedBox === null && !isDraggingStructure} 
        />
      </Canvas>
    </div>
  );
};

// === ARBox with touch handling ===
const ARBox = forwardRef(({ 
  index, 
  value, 
  position, 
  basePosition,
  selected, 
  isDragging, 
  isOtherDragging,
  opacity = 1, 
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  answerZonePos,
  structurePos
}, ref) => {
  const size = [1.6, 1.2, 1];
  const groupRef = useRef();
  const meshRef = useRef();
  const { camera, gl, raycaster } = useThree();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const pointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pointer = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 8));

  const HOLD_TIME = 400;

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
      groupRef.current.traverse((child) => {
        child.userData = { boxIndex: index };
        if (child.isMesh) {
          child.userData.parentBoxIndex = index;
        }
      });
    }
    if (ref) {
      if (typeof ref === 'function') ref(groupRef.current);
      else ref.current = groupRef.current;
    }
  }, [index, ref]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    if (isOtherDragging) return "#6b7280";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  const isOverAnswerZone = () => {
    if (!groupRef.current) return false;
    const pos = groupRef.current.position;
    return pos.z > 2.5 && Math.abs(pos.x) < 2;
  };

  const getWorldPos = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer.current, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersection);

    return [intersection.x, intersection.y, 0];
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    pointerDownRef.current = true;
    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    holdTimerRef.current = setTimeout(() => {
      if (pointerDownRef.current) {
        isDraggingRef.current = true;
        onDragStart();
        setIsHolding(false);
      }
    }, HOLD_TIME);

    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!pointerDownRef.current) return;
    e.stopPropagation();

    if (isHolding && holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      setHoldProgress(Math.min(elapsed / HOLD_TIME, 1));
    }

    if (isDraggingRef.current) {
      const worldPos = getWorldPos(e.clientX, e.clientY);
      onDragMove(worldPos);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}

    if (isDraggingRef.current) {
      const overZone = isOverAnswerZone();
      onDragEnd(overZone);
      isDraggingRef.current = false;
    } else if (pointerDownRef.current && holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      if (elapsed < HOLD_TIME) {
        onSelect();
      }
    }

    pointerDownRef.current = false;
    setIsHolding(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  };

  useFrame(() => {
    if (!groupRef.current) return;

    let targetX = position[0];
    let targetY = isDragging ? 1.5 : isHolding ? 0.3 : 0;
    let targetZ = position[2] || 0;

    const speed = isDragging ? 0.3 : 0.15;

    groupRef.current.position.x += (targetX - groupRef.current.position.x) * speed;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * speed;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * speed;

    const scale = isDragging ? 1.15 : isHolding ? 1.08 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
  });

  return (
    <group ref={groupRef} position={[basePosition[0], 0, 0]}>
      {isHolding && !isDragging && holdProgress > 0 && (
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
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : isHolding ? "#fb923c" : selected ? "#fbbf24" : "#000"}
          emissiveIntensity={isDragging ? 0.5 : isHolding ? 0.4 : selected ? 0.3 : 0}
          transparent={isOtherDragging || opacity < 1}
          opacity={isOtherDragging ? 0.4 : opacity}
        />
      </mesh>

      {(isDragging || isHolding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      <Text position={[0, size[1] / 2, size[2] / 2 + 0.01]} fontSize={0.45} color="white" anchorX="center" anchorY="middle">
        {String(value)}
      </Text>

      <Text position={[0, -0.3, size[2] / 2 + 0.01]} fontSize={0.28} color="yellow" anchorX="center" anchorY="middle">
        [{index}]
      </Text>

      {(selected || isDragging) && (
        <Text position={[0, size[1] + 1, 0]} fontSize={0.25} color={isDragging ? "#fb923c" : "#fde68a"} anchorX="center" anchorY="middle">
          {isDragging ? "📍 Drag to Answer Zone" : `Value ${value} at index ${index}`}
        </Text>
      )}
    </group>
  );
});

// === AR Interaction Manager (for XR mode only) ===
const ARInteractionManager = ({
  boxRefs,
  mode,
  draggedBox,
  draggedBoxRef,
  isDraggingStructure,
  onBoxClick,
  onBoxDragStart,
  onBoxDragMove,
  onBoxDragEnd,
  onStructureDragStart,
  onStructureDragMove,
  onStructureDragEnd,
  answerZonePosition,
  structurePos,
}) => {
  const { gl, scene } = useThree();
  const longPressTimer = useRef(null);
  const touchedBox = useRef(null);
  const isDraggingBoxRef = useRef(false);
  const isDraggingStructureRef = useRef(false);
  const lastPosition = useRef([0, 0, 0]);

  useEffect(() => {
    isDraggingStructureRef.current = isDraggingStructure;
  }, [isDraggingStructure]);

  useEffect(() => {
    isDraggingBoxRef.current = draggedBox !== null;
  }, [draggedBox]);

  const isOverAnswerZone = (position) => {
    if (mode === "intro" || mode === "done") return false;
    const zoneZ = structurePos[2] + 4;
    const dz = Math.abs(position[2] - zoneZ);
    const dx = Math.abs(position[0] - structurePos[0]);
    return dx < 2 && dz < 1.5;
  };

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

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
            if (obj.userData?.parentBoxIndex !== undefined) {
              return obj.userData.parentBoxIndex;
            }
            if (obj.userData?.boxIndex !== undefined) {
              return obj.userData.boxIndex;
            }
            obj = obj.parent;
          }
          return -1;
        }
        return null;
      };

      const getPointPosition = () => {
        const { origin, dir } = getCameraRay();
        const distance = 8;
        const pos = [
          origin.x + dir.x * distance,
          origin.y + dir.y * distance,
          origin.z + dir.z * distance,
        ];
        lastPosition.current = pos;
        return pos;
      };

      const onSelectStart = () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        const hitBox = getHitBox();
        touchedBox.current = hitBox;

        if (mode === "intro" || mode === "done") {
          if (hitBox !== null && hitBox >= 0) {
            onBoxClick(hitBox);
          } else {
            onBoxClick(0);
          }
          return;
        }

        if (hitBox !== null && hitBox >= 0) {
          longPressTimer.current = setTimeout(() => {
            onBoxDragStart(hitBox);
            longPressTimer.current = null;
          }, 400);
        } else if (hitBox === -1) {
          longPressTimer.current = setTimeout(() => {
            onStructureDragStart();
            longPressTimer.current = null;
          }, 400);
        }
      };

      const onSelectEnd = () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingStructureRef.current) {
          onStructureDragEnd();
        } else if (isDraggingBoxRef.current && draggedBoxRef.current !== null) {
          const pos = lastPosition.current;
          const overZone = isOverAnswerZone(pos);
          onBoxDragEnd(draggedBoxRef.current, overZone);
        } else if (touchedBox.current !== null && touchedBox.current >= 0) {
          onBoxClick(touchedBox.current);
        }

        touchedBox.current = null;
      };

      const onSelect = () => {
        if (mode === "intro" || mode === "done") {
          const hitBox = getHitBox();
          if (hitBox !== null && hitBox >= 0) {
            onBoxClick(hitBox);
          } else {
            onBoxClick(0);
          }
        }
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);
      session.addEventListener("select", onSelect);

      const onFrame = () => {
        if (isDraggingStructureRef.current) {
          const newPos = getPointPosition();
          onStructureDragMove(newPos);
        } else if (isDraggingBoxRef.current && draggedBoxRef.current !== null) {
          const pos = getPointPosition();
          const relativePos = [pos[0] - structurePos[0], 0, pos[2] - structurePos[2]];
          onBoxDragMove(draggedBoxRef.current, relativePos);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      session.addEventListener("end", () => {
        session.removeEventListener("selectstart", onSelectStart);
        session.removeEventListener("selectend", onSelectEnd);
        session.removeEventListener("select", onSelect);
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
  }, [gl, scene, boxRefs, mode, structurePos, answerZonePosition, onBoxClick, onBoxDragStart, onBoxDragMove, onBoxDragEnd, onStructureDragStart, onStructureDragMove, onStructureDragEnd]);

  return null;
};

// === Answer Drop Zone ===
const AnswerDropZone = forwardRef(({ position, isActive, feedback }, ref) => {
  const meshRef = useRef();
  const glowRef = useRef(0);

  useFrame(() => {
    if (meshRef.current) {
      if (isActive) {
        glowRef.current += 0.05;
        const pulse = Math.sin(glowRef.current) * 0.3 + 0.7;
        meshRef.current.material.emissiveIntensity = pulse * 0.5;
      } else {
        meshRef.current.material.emissiveIntensity = 0;
      }
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
          emissive={isActive ? "#22c55e" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[4.1, 0.32, 2.6]} />
        <meshBasicMaterial color={isActive ? "#22c55e" : "#60a5fa"} wireframe />
      </mesh>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.35}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? "📍 Drop Here!" : "Answer Zone"}
      </Text>

      {isActive && (
        <group position={[0, 1.2, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
    </group>
  );
});

// === Start Box - ORIGINAL WORKING VERSION ===
const StartBox = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const size = [5.0, 2.2, 1.0];

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
        position={[0, 0.6, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        userData={{ boxIndex: 0 }}
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
        Start AR Assessment
      </Text>
    </group>
  );
};

// === Restart Box - ORIGINAL WORKING VERSION ===
const RestartBox = ({ position = [0, 0, 0], onClick }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const size = [4.0, 1.5, 1.0];

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
        position={[0, 0.6, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        userData={{ boxIndex: 0 }}
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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
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

export default AssessmentAR;
