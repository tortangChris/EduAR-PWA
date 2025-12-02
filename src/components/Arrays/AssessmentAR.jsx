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
  
  // Drag state - same as VisualPageAR
  const [draggedBox, setDraggedBox] = useState(null);
  const [dragPosition, setDragPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverAnswerZone, setIsOverAnswerZone] = useState(false);
  
  const [isARMode, setIsARMode] = useState(false);
  
  // Refs - same pattern as VisualPageAR
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
    } catch (e) {
      console.warn("Unable to access localStorage", e);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
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
    setIsDragging(false);
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
    console.log("handleBoxClick:", i, "mode:", mode);
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!isDragging) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  // Drag handlers - same pattern as VisualPageAR
  const onDragStart = (index) => {
    console.log("onDragStart:", index);
    setDraggedBox(index);
    draggedBoxRef.current = index;
    setDragPosition([...originalPositions[index]]);
    setIsDragging(true);
    setSelectedIndex(null);
  };

  const onDragMove = (newPos) => {
    setDragPosition(newPos);
    // Check if over answer zone
    const zoneZ = 4;
    const overZone = newPos[2] > 2.5 && Math.abs(newPos[0]) < 2;
    setIsOverAnswerZone(overZone);
  };

  const onDragEnd = () => {
    console.log("onDragEnd, overZone:", isOverAnswerZone);
    const droppedIndex = draggedBoxRef.current;
    
    if (isOverAnswerZone && droppedIndex !== null) {
      handleDropOnAnswer(droppedIndex);
    } else if (droppedIndex !== null) {
      resetBoxPosition(droppedIndex);
    }
    
    setDraggedBox(null);
    draggedBoxRef.current = null;
    setIsDragging(false);
    setIsOverAnswerZone(false);
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
            .catch((err) => console.error("AR session failed:", err));
        }
      });
    }
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
        <pointLight position={[-5, 5, 5]} intensity={0.3} />

        <group position={[0, 0, -8]}>
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
            <FadeText text="🔮 AR Mode Active" position={[0, 4.6, 0]} fontSize={0.25} color="#22c55e" />
          )}

          {/* Status/Question */}
          <FadeText
            text={
              isDragging
                ? isOverAnswerZone
                  ? "📍 Release to drop!"
                  : "✋ Drag to Answer Zone..."
                : mode === "intro"
                ? "Tap the box below to start"
                : mode === "done"
                ? isPassed ? "You passed!" : "Try again"
                : question?.prompt || ""
            }
            position={[0, 3.2, 0]}
            fontSize={0.28}
            color={isDragging ? (isOverAnswerZone ? "#4ade80" : "#f97316") : "white"}
          />

          {/* Instructions */}
          {mode !== "intro" && mode !== "done" && !isDragging && (
            <FadeText
              text="Hold box 0.5s to drag → Drop on Answer Zone"
              position={[0, 2.7, 0]}
              fontSize={0.2}
              color="#94a3b8"
            />
          )}

          {/* Progress */}
          {mode !== "intro" && mode !== "done" && (
            <FadeText
              text={`Progress: ${modeIndex}/${totalAssessments} | Score: ${score}`}
              position={[0, 2.3, 0]}
              fontSize={0.24}
              color="#fde68a"
            />
          )}

          {/* Answer Zone */}
          {mode !== "intro" && mode !== "done" && (
            <AnswerDropZone
              position={[0, -0.5, 4]}
              isActive={isDragging}
              isHovered={isOverAnswerZone}
            />
          )}

          {/* Content */}
          {mode === "intro" ? (
            <StartBox position={[0, 0, 0]} onClick={() => handleBoxClick(0)} />
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
            data.map((value, i) => {
              const isBeingDragged = draggedBox === i;
              
              return (
                <DraggableBox
                  key={`${mode}-${i}`}
                  index={i}
                  value={value}
                  basePosition={originalPositions[i]}
                  dragPosition={isBeingDragged ? dragPosition : null}
                  selected={selectedIndex === i}
                  isDragging={isBeingDragged}
                  isOtherDragging={isDragging && !isBeingDragged}
                  opacity={animState[i] === "fade" ? 0.25 : 1}
                  onClick={() => handleBoxClick(i)}
                  ref={(r) => addBoxRef(r, i)}
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
        </group>

        <ARInteractionManager
          boxRefs={boxRefs}
          mode={mode}
          isDragging={isDragging}
          onBoxClick={handleBoxClick}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />

        <OrbitControls makeDefault enabled={!isDragging} />
      </Canvas>
    </div>
  );
};

// === Draggable Box - Same pattern as VisualPageAR's SlidingBox ===
const DraggableBox = forwardRef(({ 
  index, 
  value, 
  basePosition, 
  dragPosition,
  selected, 
  isDragging, 
  isOtherDragging,
  opacity = 1,
  onClick
}, ref) => {
  const size = [1.6, 1.2, 1];
  const groupRef = useRef();
  const currentPos = useRef([...basePosition]);

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (selected) return "#facc15";
    if (isOtherDragging) return "#94a3b8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
    }
  }, [index]);

  useEffect(() => {
    if (!isDragging) {
      currentPos.current = [...basePosition];
    }
  }, [basePosition, isDragging]);

  useFrame(() => {
    if (!groupRef.current) return;

    let targetX, targetY, targetZ;

    if (isDragging && dragPosition) {
      targetX = dragPosition[0];
      targetY = 1.5;
      targetZ = dragPosition[2];
    } else {
      targetX = basePosition[0];
      targetY = 0;
      targetZ = 0;
    }

    const lerpSpeed = isDragging ? 0.3 : 0.15;
    currentPos.current[0] += (targetX - currentPos.current[0]) * lerpSpeed;
    currentPos.current[1] += (targetY - currentPos.current[1]) * lerpSpeed;
    currentPos.current[2] += (targetZ - currentPos.current[2]) * lerpSpeed;

    groupRef.current.position.set(
      currentPos.current[0],
      currentPos.current[1],
      currentPos.current[2]
    );

    const targetScale = isDragging ? 1.15 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  return (
    <group
      ref={(g) => {
        groupRef.current = g;
        if (typeof ref === "function") ref(g);
        else if (ref) ref.current = g;
      }}
    >
      {/* Shadow when dragging */}
      {isDragging && (
        <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main box */}
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={onClick}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : selected ? "#fbbf24" : "#000"}
          emissiveIntensity={isDragging ? 0.5 : selected ? 0.3 : 0}
          transparent={opacity < 1 || isOtherDragging}
          opacity={isOtherDragging ? 0.5 : opacity}
        />
      </mesh>

      {/* Wireframe when dragging */}
      {isDragging && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
          <meshBasicMaterial color="#fff" wireframe />
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

      {/* Labels */}
      {isDragging && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.25}
          color="#f97316"
          anchorX="center"
        >
          ✋ Dragging...
        </Text>
      )}
    </group>
  );
});

// === AR Interaction Manager - Same pattern as VisualPageAR ===
const ARInteractionManager = ({
  boxRefs,
  mode,
  isDragging,
  onBoxClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const { gl, camera } = useThree();
  const longPressTimer = useRef(null);
  const touchedBoxIndex = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Non-AR touch/mouse handling
  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getHitBoxIndex = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

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

      console.log("Raycasting, meshes:", allMeshes.length);

      const hits = raycaster.intersectObjects(allMeshes, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj) {
          if (obj.userData?.parentBoxIndex !== undefined) {
            console.log("Hit parentBoxIndex:", obj.userData.parentBoxIndex);
            return obj.userData.parentBoxIndex;
          }
          if (obj.userData?.boxIndex !== undefined) {
            console.log("Hit boxIndex:", obj.userData.boxIndex);
            return obj.userData.boxIndex;
          }
          obj = obj.parent;
        }
      }
      return null;
    };

    const getWorldPosition = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // Intersect with plane at z = -8 (where structure is)
      const planeZ = -8;
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      return [intersection.x, 0, intersection.y + 8]; // Adjust for local coords
    };

    let touchStartTime = 0;

    const onPointerDown = (event) => {
      if (gl.xr.isPresenting) return;
      event.preventDefault();

      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      const clientY = event.touches?.[0]?.clientY ?? event.clientY;

      touchStartTime = Date.now();

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      const hitIdx = getHitBoxIndex(clientX, clientY);
      touchedBoxIndex.current = hitIdx;

      console.log("PointerDown - mode:", mode, "hit:", hitIdx);

      if (mode === "intro" || mode === "done") {
        return; // Handle click on pointerUp
      }

      if (hitIdx !== null && hitIdx >= 0) {
        longPressTimer.current = setTimeout(() => {
          console.log("Long press - start drag:", hitIdx);
          onDragStart(hitIdx);
          longPressTimer.current = null;
        }, 500);
      }
    };

    const onPointerMove = (event) => {
      if (gl.xr.isPresenting) return;
      if (!isDraggingRef.current) return;

      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      const clientY = event.touches?.[0]?.clientY ?? event.clientY;

      const worldPos = getWorldPosition(clientX, clientY);
      onDragMove(worldPos);
    };

    const onPointerUp = (event) => {
      if (gl.xr.isPresenting) return;

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const elapsed = Date.now() - touchStartTime;

      console.log("PointerUp - elapsed:", elapsed, "dragging:", isDraggingRef.current);

      if (isDraggingRef.current) {
        onDragEnd();
      } else if (elapsed < 500 && touchedBoxIndex.current !== null) {
        console.log("Short tap:", touchedBoxIndex.current);
        onBoxClick(touchedBoxIndex.current);
      }

      touchedBoxIndex.current = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [gl, camera, boxRefs, mode, onBoxClick, onDragStart, onDragMove, onDragEnd]);

  // AR XR session handling
  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      console.log("AR Session Started");

      const getCameraRay = () => {
        const xrCamera = gl.xr.getCamera();
        const cam = xrCamera.cameras?.[0] ?? xrCamera;
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
            if (obj.userData?.parentBoxIndex !== undefined) return obj.userData.parentBoxIndex;
            if (obj.userData?.boxIndex !== undefined) return obj.userData.boxIndex;
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
          return [origin.x + dir.x * t, 0, origin.y + dir.y * t + 8];
        }
        return [0, 0, 0];
      };

      const onSelectStart = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        const hitIdx = getHitBoxIndex();
        touchedBoxIndex.current = hitIdx;

        if (mode === "intro" || mode === "done") {
          if (hitIdx !== null) onBoxClick(hitIdx);
          return;
        }

        if (hitIdx !== null) {
          longPressTimer.current = setTimeout(() => {
            onDragStart(hitIdx);
            longPressTimer.current = null;
          }, 500);
        }
      };

      const onSelectEnd = () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current) {
          onDragEnd();
        } else if (touchedBoxIndex.current !== null) {
          onBoxClick(touchedBoxIndex.current);
        }

        touchedBoxIndex.current = null;
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);

      const onFrame = () => {
        if (isDraggingRef.current) {
          const pos = getPointPosition();
          onDragMove(pos);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      session.addEventListener("end", () => {
        session.removeEventListener("selectstart", onSelectStart);
        session.removeEventListener("selectend", onSelectEnd);
      });
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, mode, onBoxClick, onDragStart, onDragMove, onDragEnd]);

  return null;
};

// === Answer Drop Zone ===
const AnswerDropZone = ({ position, isActive, isHovered }) => {
  const meshRef = useRef();
  const pulseRef = useRef(0);

  useFrame(() => {
    if (meshRef.current) {
      if (isActive) {
        pulseRef.current += 0.08;
        const pulse = Math.sin(pulseRef.current) * 0.3 + 0.7;
        meshRef.current.material.emissiveIntensity = isHovered ? 0.8 : pulse * 0.5;
      } else {
        meshRef.current.material.emissiveIntensity = 0;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[4, 0.3, 2.5]} />
        <meshStandardMaterial
          color={isHovered ? "#22c55e" : isActive ? "#3b82f6" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isHovered ? "#22c55e" : isActive ? "#3b82f6" : "#000"}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[4.1, 0.32, 2.6]} />
        <meshBasicMaterial color={isHovered ? "#22c55e" : "#60a5fa"} wireframe />
      </mesh>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.4}
        color={isHovered ? "#22c55e" : isActive ? "#60a5fa" : "#94a3b8"}
        anchorX="center"
      >
        {isHovered ? "✓ Release to Drop!" : isActive ? "📍 Drop Here!" : "Answer Zone"}
      </Text>

      {isActive && (
        <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.25, 0.5, 6]} />
          <meshBasicMaterial color={isHovered ? "#22c55e" : "#60a5fa"} />
        </mesh>
      )}
    </group>
  );
};

// === Start Box ===
const StartBox = ({ position, onClick }) => {
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
        position={[0, 0.6, 0]}
        onClick={onClick}
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
      <Text position={[0, 0.6, 0.52]} fontSize={0.45} color="white" anchorX="center">
        Start AR Assessment
      </Text>
    </group>
  );
};

// === Restart Box ===
const RestartBox = ({ position, onClick }) => {
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
        position={[0, 0.6, 0]}
        onClick={onClick}
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
        Restart Assessment
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
    let frame, start;
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
