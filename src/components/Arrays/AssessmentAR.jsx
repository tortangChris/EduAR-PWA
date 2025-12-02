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
  
  // AR Drag state
  const [draggedBox, setDraggedBox] = useState(null);
  const [isDraggingStructure, setIsDraggingStructure] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  
  // Structure position (whole structure moves together)
  const [structurePos, setStructurePos] = useState([0, 0, -8]);

  const boxRefs = useRef([]);
  const structureRef = useRef();
  const answerZoneRef = useRef();

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const [boxPositions, setBoxPositions] = useState([]);

  // Initialize box positions
  useEffect(() => {
    setBoxPositions(originalPositions.map(pos => [...pos]));
  }, [originalPositions]);

  // On mount, check localStorage
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
    if (!isDraggingStructure) {
      setSelectedIndex((prev) => (prev === i ? null : i));
    }
  };

  // Structure drag handlers
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

  // Box drag handlers for AR
  const onBoxDragStart = (index) => {
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
    if (isOverAnswerZone) {
      handleDropOnAnswer(index);
    } else {
      resetBoxPosition(index);
    }
    setDraggedBox(null);
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

  // Answer zone world position for collision detection
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

        {/* Whole structure group - moves together when dragging structure */}
        <group position={structurePos} ref={structureRef}>
          {/* Header */}
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

          {/* AR Mode indicator */}
          {isARMode && (
            <FadeText
              text="🔮 AR Mode Active"
              position={[0, 4.6, 0]}
              fontSize={0.25}
              color="#22c55e"
            />
          )}

          {/* Instruction or question */}
          <FadeText
            text={
              isDraggingStructure
                ? "✋ Moving Structure..."
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
            color={isDraggingStructure ? "#f97316" : "white"}
          />

          {/* AR Drag instruction */}
          {mode !== "intro" && mode !== "done" && !isDraggingStructure && (
            <FadeText
              text={isARMode 
                ? "Long press box → drag to answer zone • Long press empty → move structure"
                : "Hold box to drag • Drop on Answer Zone"
              }
              position={[0, 2.7, 0]}
              fontSize={0.2}
              color="#94a3b8"
            />
          )}

          {/* Progress indicator */}
          {mode !== "intro" && mode !== "done" && (
            <FadeText
              text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
              position={[0, 2.3, 0]}
              fontSize={0.24}
              color="#fde68a"
            />
          )}

          {/* Answer Drop Zone */}
          {mode !== "intro" && mode !== "done" && !isDraggingStructure && (
            <AnswerDropZone
              ref={answerZoneRef}
              position={[0, -0.5, 4]}
              isActive={draggedBox !== null}
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
                    localStorage.removeItem("arrayAssessmentARPassed");
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
                <ARBox
                  key={i}
                  index={i}
                  value={value}
                  position={boxPositions[i] || originalPositions[i]}
                  selected={isSelected}
                  isDragging={draggedBox === i}
                  opacity={extraOpacity}
                  onClick={() => handleBoxClick(i)}
                  ref={(r) => addBoxRef(r)}
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
          structureRef={structureRef}
          answerZoneRef={answerZoneRef}
          mode={mode}
          draggedBox={draggedBox}
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

// === AR Interaction Manager - FIXED VERSION ===
const ARInteractionManager = ({
  boxRefs,
  structureRef,
  answerZoneRef,
  mode,
  draggedBox,
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
  const { gl, camera } = useThree();
  const longPressTimer = useRef(null);
  const touchedBox = useRef(null);
  const isDraggingBoxRef = useRef(false);
  const isDraggingStructureRef = useRef(false);
  const draggedBoxIndexRef = useRef(null);
  const lastDragPosition = useRef([0, 0, 0]);

  useEffect(() => {
    isDraggingStructureRef.current = isDraggingStructure;
  }, [isDraggingStructure]);

  useEffect(() => {
    isDraggingBoxRef.current = draggedBox !== null;
    draggedBoxIndexRef.current = draggedBox;
  }, [draggedBox]);

  // Check if position is over answer zone
  const isOverAnswerZone = (position) => {
    if (mode === "intro" || mode === "done") return false;
    
    const zonePos = answerZonePosition;
    const zoneSize = { width: 4, depth: 2.5 };
    
    const dx = Math.abs(position[0] - zonePos[0]);
    const dz = Math.abs(position[2] - zonePos[2]);
    
    return dx < zoneSize.width / 2 && dz < zoneSize.depth / 2;
  };

  useEffect(() => {
    // === XR Session handlers ===
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      console.log("AR Session Started");

      // Get camera ray (center of phone screen)
      const getCameraRay = () => {
        const xrCamera = gl.xr.getCamera();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        return { origin, dir };
      };

      // Check if pointing at any box
      const getHitBox = () => {
        const { origin, dir } = getCameraRay();
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, dir);

        const allMeshes = [];
        boxRefs.current.forEach((group) => {
          if (group && group.children) {
            group.traverse((child) => {
              if (child.isMesh) {
                allMeshes.push(child);
              }
            });
          }
        });

        if (allMeshes.length === 0) return null;

        const hits = raycaster.intersectObjects(allMeshes, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj) {
            if (obj.userData?.boxIndex !== undefined) {
              return obj.userData.boxIndex;
            }
            obj = obj.parent;
          }
          return -1; // Hit something but not a box
        }
        return null;
      };

      // Calculate 3D position where phone is pointing
      const getPointPosition = (distance = 6) => {
        const { origin, dir } = getCameraRay();
        const pos = [
          origin.x + dir.x * distance,
          origin.y + dir.y * distance,
          origin.z + dir.z * distance
        ];
        lastDragPosition.current = pos;
        return pos;
      };

      // Touch start - uses selectstart event
      const onSelectStart = (event) => {
        console.log("AR Select Start");
        
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        if (mode === "intro" || mode === "done") {
          // In intro/done mode, just handle clicks
          const hitBox = getHitBox();
          console.log("Intro/Done mode, hit:", hitBox);
          if (hitBox !== null && hitBox >= 0) {
            onBoxClick(hitBox);
          } else if (hitBox === -1) {
            // Hit structure area but not a box - trigger start anyway
            onBoxClick(0);
          }
          return;
        }

        const hitBox = getHitBox();
        touchedBox.current = hitBox;
        console.log("Hit box:", hitBox);

        // Long press timer
        longPressTimer.current = setTimeout(() => {
          console.log("Long press complete, hitBox:", hitBox);
          if (hitBox !== null && hitBox >= 0) {
            // Long press on a box - start dragging box
            onBoxDragStart(hitBox);
          } else {
            // Long press on empty space - move whole structure
            onStructureDragStart();
          }
          longPressTimer.current = null;
        }, 500);
      };

      // Touch end - uses selectend event
      const onSelectEnd = (event) => {
        console.log("AR Select End");
        
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingStructureRef.current) {
          // Drop structure
          onStructureDragEnd();
        } else if (isDraggingBoxRef.current && draggedBoxIndexRef.current !== null) {
          // Drop box - check if over answer zone
          const currentPos = lastDragPosition.current;
          const overZone = isOverAnswerZone(currentPos);
          console.log("Dropping box, over zone:", overZone, "pos:", currentPos);
          onBoxDragEnd(draggedBoxIndexRef.current, overZone);
        } else if (touchedBox.current !== null && touchedBox.current >= 0) {
          // Short tap on box
          console.log("Short tap on box:", touchedBox.current);
          onBoxClick(touchedBox.current);
        }

        touchedBox.current = null;
      };

      // Also listen for 'select' event (single tap)
      const onSelect = (event) => {
        console.log("AR Select (tap)");
        
        if (mode === "intro" || mode === "done") {
          const hitBox = getHitBox();
          if (hitBox !== null && hitBox >= 0) {
            onBoxClick(hitBox);
          } else {
            // Tap anywhere to start
            onBoxClick(0);
          }
        }
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);
      session.addEventListener("select", onSelect);

      // Frame loop - move box or structure while dragging
      const onFrame = (time, frame) => {
        if (isDraggingStructureRef.current) {
          const newPos = getPointPosition(8);
          onStructureDragMove(newPos);
        } else if (isDraggingBoxRef.current && draggedBoxIndexRef.current !== null) {
          const newPos = getPointPosition(6);
          // Adjust position relative to structure
          const relativePos = [
            newPos[0] - structurePos[0],
            newPos[1] - structurePos[1],
            newPos[2] - structurePos[2]
          ];
          onBoxDragMove(draggedBoxIndexRef.current, relativePos);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      // Cleanup on session end
      const onEnd = () => {
        console.log("AR Session Ended");
        session.removeEventListener("selectstart", onSelectStart);
        session.removeEventListener("selectend", onSelectEnd);
        session.removeEventListener("select", onSelect);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      };
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);

    return () => {
      gl.xr.removeEventListener("sessionstart", onSessionStart);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [gl, boxRefs, mode, answerZonePosition, structurePos, onBoxClick, onBoxDragStart, onBoxDragMove, onBoxDragEnd, onStructureDragStart, onStructureDragMove, onStructureDragEnd]);

  // === Non-AR touch handling (for testing on desktop/non-AR devices) ===
  useEffect(() => {
    const canvas = gl.domElement;
    
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getHitBoxFromPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const allMeshes = [];
      boxRefs.current.forEach((group) => {
        if (group && group.children) {
          group.traverse((child) => {
            if (child.isMesh) {
              allMeshes.push(child);
            }
          });
        }
      });

      const hits = raycaster.intersectObjects(allMeshes, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj) {
          if (obj.userData?.boxIndex !== undefined) {
            return { index: obj.userData.boxIndex, point: hits[0].point };
          }
          obj = obj.parent;
        }
        return { index: -1, point: hits[0].point };
      }
      return null;
    };

    const getWorldPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      
      // Intersect with a horizontal plane at y=0
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      return [intersection.x, 0, intersection.z];
    };

    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };

    const onTouchStart = (event) => {
      if (gl.xr.isPresenting) return; // Skip if in AR mode
      
      touchStartTime = Date.now();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      touchStartPos = { x: clientX, y: clientY };

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      const hit = getHitBoxFromPointer(event);
      touchedBox.current = hit ? hit.index : null;

      if (mode === "intro" || mode === "done") {
        return; // Handle in onTouchEnd
      }

      longPressTimer.current = setTimeout(() => {
        if (hit && hit.index >= 0) {
          onBoxDragStart(hit.index);
        } else {
          onStructureDragStart();
        }
        longPressTimer.current = null;
      }, 500);
    };

    const onTouchMove = (event) => {
      if (gl.xr.isPresenting) return;
      
      if (isDraggingBoxRef.current && draggedBoxIndexRef.current !== null) {
        const worldPos = getWorldPosition(event);
        const relativePos = [
          worldPos[0] - structurePos[0],
          0,
          worldPos[2] - structurePos[2]
        ];
        lastDragPosition.current = worldPos;
        onBoxDragMove(draggedBoxIndexRef.current, relativePos);
      } else if (isDraggingStructureRef.current) {
        const worldPos = getWorldPosition(event);
        onStructureDragMove([worldPos[0], 0, worldPos[2] - 8]);
      }
    };

    const onTouchEnd = (event) => {
      if (gl.xr.isPresenting) return;
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const elapsed = Date.now() - touchStartTime;

      if (isDraggingStructureRef.current) {
        onStructureDragEnd();
      } else if (isDraggingBoxRef.current && draggedBoxIndexRef.current !== null) {
        const currentPos = lastDragPosition.current;
        const overZone = isOverAnswerZone(currentPos);
        onBoxDragEnd(draggedBoxIndexRef.current, overZone);
      } else if (elapsed < 500 && touchedBox.current !== null) {
        // Short tap
        if (touchedBox.current >= 0) {
          onBoxClick(touchedBox.current);
        } else if (mode === "intro") {
          onBoxClick(0);
        }
      }

      touchedBox.current = null;
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("mousedown", onTouchStart);
    canvas.addEventListener("mousemove", onTouchMove);
    canvas.addEventListener("mouseup", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onTouchStart);
      canvas.removeEventListener("mousemove", onTouchMove);
      canvas.removeEventListener("mouseup", onTouchEnd);
    };
  }, [gl, camera, boxRefs, mode, structurePos, answerZonePosition, onBoxClick, onBoxDragStart, onBoxDragMove, onBoxDragEnd, onStructureDragStart, onStructureDragMove, onStructureDragEnd]);

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

// === AR Box ===
const ARBox = forwardRef(({ index, value, position, selected, isDragging, opacity = 1, onClick }, ref) => {
  const size = [1.6, 1.2, 1];
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
      // Also set on all children
      groupRef.current.traverse((child) => {
        child.userData = { boxIndex: index };
      });
    }
  }, [index]);

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (selected) return "#facc15";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isDragging ? 2 : 0;
      const targetScale = isDragging ? 1.2 : selected ? 1.05 : 1;

      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.15);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] + targetY, 0.15);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.15);

      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group
      position={position}
      ref={(g) => {
        groupRef.current = g;
        if (typeof ref === "function") ref(g);
        else if (ref) ref.current = g;
      }}
    >
      {isDragging && (
        <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.4} />
        </mesh>
      )}

      <mesh 
        castShadow 
        receiveShadow 
        position={[0, size[1] / 2, 0]} 
        onClick={onClick}
        userData={{ boxIndex: index }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={isDragging ? 0.6 : selected ? 0.4 : 0}
          metalness={0.1}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {isDragging && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, -0.3, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {(selected || isDragging) && (
        <Text
          position={[0, size[1] + 1, 0]}
          fontSize={0.25}
          color={isDragging ? "#fb923c" : "#fde68a"}
          anchorX="center"
          anchorY="middle"
        >
          {isDragging ? "📍 Drag to Answer Zone" : `Value ${value} at index ${index}`}
        </Text>
      )}
    </group>
  );
});

// === Start Box ===
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

// === Restart Box ===
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
