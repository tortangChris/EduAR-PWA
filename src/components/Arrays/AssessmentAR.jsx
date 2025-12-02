// AssessmentAR.jsx
import React, { useMemo, useState, useEffect, useRef, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_DATA = [10, 20, 30, 40, 50];

const AssessmentAR = ({
  initialData = DEFAULT_DATA,
  spacing = 2.5,
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
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragPosition, setDragPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);

  const nodeRefs = useRef([]);
  const dropZoneRef = useRef();

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

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
    setDraggedNode(null);
    setIsDragging(false);

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

  // --- Question generators ---
  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Access the element at index ${idx}. Drag it to the answer zone. (O(1))`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Search for value ${value}. Drag the correct box to the answer zone. (O(n))`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `To insert ${insertValue} at index ${k}, which element shifts right first? (O(n))`,
      insertValue,
      k,
      answerIndex: k,
      type: "insert",
    });
  };

  const prepareDeleteQuestion = () => {
    const k = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Delete element at index ${k}. Drag the element to be removed. (O(n))`,
      k,
      answerIndex: k,
      type: "delete",
    });
  };

  // Drag functions
  const onDragStart = (index) => {
    setDraggedNode(index);
    setDragPosition([...originalPositions[index]]);
    setIsDragging(true);
    setSelectedIndex(index);
  };

  const onDragMove = (newPos) => {
    setDragPosition(newPos);
  };

  const onDragEnd = () => {
    // Check if dropped on answer zone
    if (draggedNode !== null && isOverDropZone(dragPosition)) {
      handleDropOnAnswer(draggedNode);
    }
    
    setDraggedNode(null);
    setIsDragging(false);
  };

  const isOverDropZone = (pos) => {
    // Drop zone is at z = 4, check if close enough
    return pos[2] > 2.5 && Math.abs(pos[0]) < 3;
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
      showFeedback(correct, `Index ${droppedIndex} = ${data[droppedIndex]}`, () => {
        nextMode();
      });
    } else if (question.type === "search") {
      correct = data[droppedIndex] === question.answerValue;
      markScore(correct);
      showFeedback(correct, `Value ${data[droppedIndex]}`, () => {
        nextMode();
      });
    } else if (question.type === "insert") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Index ${droppedIndex} shifts right`, () => {
        const newArr = [...data];
        newArr.splice(question.k, 0, question.insertValue);
        setAnimState({ new: question.k });
        setTimeout(() => {
          setData(newArr);
          setAnimState({});
          nextMode();
        }, 800);
      });
    } else if (question.type === "delete") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Deleted index ${droppedIndex}`, () => {
        setAnimState({ [question.k]: "fade" });
        setTimeout(() => {
          const newArr = [...data];
          newArr.splice(question.k, 1);
          setData(newArr);
          setAnimState({});
          nextMode();
        }, 800);
      });
    }
  };

  const showFeedback = (correct, label, callback) => {
    setFeedback({
      text: correct ? `✓ Correct — ${label}` : `✗ Incorrect — ${label}`,
      correct,
    });
    setTimeout(() => {
      setFeedback(null);
      callback && callback();
    }, 1500);
  };

  const handleNodeClick = (i) => {
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    setSelectedIndex((prev) => (prev === i ? null : i));
  };

  const addNodeRef = (r, index) => {
    if (r) {
      nodeRefs.current[index] = r;
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
            })
            .catch((err) => console.error("AR session failed:", err));
        } else {
          console.warn("AR not supported on this device.");
        }
      });
    }
  };

  return (
    <div className="w-full h-[450px]">
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

        <group position={[0, 0, -5]}>
          {/* Header */}
          <FadeText
            text={
              mode === "intro"
                ? "Array Assessment — AR Mode"
                : mode === "done"
                ? "Assessment Complete!"
                : `Question ${modeIndex}: ${mode.toUpperCase()}`
            }
            position={[0, 4.5, 0]}
            fontSize={0.55}
            color="#facc15"
          />

          {/* Instruction or question */}
          <FadeText
            text={
              mode === "intro"
                ? "Tap the button below to start"
                : mode === "done"
                ? isPassed
                  ? "You passed this assessment!"
                  : "You did not reach the passing score."
                : question
                ? question.prompt
                : ""
            }
            position={[0, 3.7, 0]}
            fontSize={0.28}
            color="white"
          />

          {/* Progress indicator */}
          {mode !== "intro" && mode !== "done" && (
            <FadeText
              text={`Progress: ${modeIndex} / ${totalAssessments} | Score: ${score}`}
              position={[0, 3.0, 0]}
              fontSize={0.24}
              color="#fde68a"
            />
          )}

          {/* Dragging indicator */}
          {isDragging && draggedNode !== null && (
            <FadeText
              text={`✋ Dragging [${draggedNode}] → Drop in Answer Zone`}
              position={[0, 2.4, 0]}
              fontSize={0.3}
              color="#f97316"
            />
          )}

          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 2]} receiveShadow>
            <planeGeometry args={[20, 14]} />
            <meshStandardMaterial color="#1e293b" transparent opacity={0.4} />
          </mesh>

          {/* Answer Drop Zone */}
          {mode !== "intro" && mode !== "done" && (
            <AnswerDropZone
              ref={dropZoneRef}
              position={[0, -0.5, 5]}
              isActive={isDragging}
              isHovered={isDragging && isOverDropZone(dragPosition)}
              feedback={feedback}
            />
          )}

          {/* Content based on mode */}
          {mode === "intro" ? (
            <StartButton position={[0, 0.5, 0]} onClick={() => handleNodeClick(0)} />
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
              <RestartButton
                position={[0, -0.3, 0]}
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
            <>
              {/* Render nodes */}
              {data.map((value, i) => {
                const isBeingDragged = draggedNode === i;
                const isFaded = animState[i] === "fade";
                const isNew = animState.new === i;

                return (
                  <DraggableBox
                    key={`box-${i}`}
                    index={i}
                    value={value}
                    position={isBeingDragged ? dragPosition : originalPositions[i]}
                    originalPosition={originalPositions[i]}
                    selected={selectedIndex === i}
                    isDragging={isBeingDragged}
                    isOtherDragging={isDragging && !isBeingDragged}
                    isFaded={isFaded}
                    isNew={isNew}
                    onClick={() => handleNodeClick(i)}
                    ref={(r) => addNodeRef(r, i)}
                  />
                );
              })}
            </>
          )}

          {/* Feedback display */}
          {feedback && (
            <FloatingFeedback
              text={feedback.text}
              correct={feedback.correct}
              position={[0, 2, 4]}
            />
          )}
        </group>

        <ARInteractionManager
          nodeRefs={nodeRefs}
          isDragging={isDragging}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          mode={mode}
          handleNodeClick={handleNodeClick}
        />

        <OrbitControls makeDefault enabled={!isDragging} />
      </Canvas>
    </div>
  );
};

// === AR Interaction Manager ===
const ARInteractionManager = ({
  nodeRefs,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  mode,
  handleNodeClick,
}) => {
  const { gl } = useThree();
  const longPressTimer = useRef(null);
  const touchedNodeIndex = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

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

      const getHitNodeIndex = () => {
        const { origin, dir } = getCameraRay();
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, dir);

        const allMeshes = [];
        nodeRefs.current.forEach((group, idx) => {
          if (group && group.children) {
            group.children.forEach((child) => {
              child.userData.parentNodeIndex = idx;
              allMeshes.push(child);
            });
          }
        });

        const hits = raycaster.intersectObjects(allMeshes, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj) {
            if (obj.userData?.parentNodeIndex !== undefined) {
              return obj.userData.parentNodeIndex;
            }
            if (obj.userData?.nodeIndex !== undefined) {
              return obj.userData.nodeIndex;
            }
            obj = obj.parent;
          }
        }
        return null;
      };

      const getPointPosition = () => {
        const { origin, dir } = getCameraRay();
        const distance = 10;
        const x = origin.x + dir.x * distance;
        const y = Math.max(0, origin.y + dir.y * distance);
        const z = origin.z + dir.z * distance;
        return [x, y, z];
      };

      const onSelectStart = () => {
        if (mode === "intro" || mode === "done") return;

        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        const hitIdx = getHitNodeIndex();
        touchedNodeIndex.current = hitIdx;

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
        } else if (touchedNodeIndex.current !== null) {
          handleNodeClick(touchedNodeIndex.current);
        }

        touchedNodeIndex.current = null;
      };

      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);

      const onFrame = (time, frame) => {
        if (isDraggingRef.current) {
          const newPos = getPointPosition();
          onDragMove(newPos);
        }
        session.requestAnimationFrame(onFrame);
      };
      session.requestAnimationFrame(onFrame);

      session.addEventListener("end", () => {
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
  }, [gl, nodeRefs, onDragStart, onDragMove, onDragEnd, mode, handleNodeClick]);

  return null;
};

// === Answer Drop Zone ===
const AnswerDropZone = forwardRef(({ position, isActive, isHovered, feedback }, ref) => {
  const meshRef = useRef();
  const glowRef = useRef(0);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered ? 1.15 : isActive ? 1.05 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      if (isActive) {
        glowRef.current += 0.08;
        const pulse = Math.sin(glowRef.current) * 0.3 + 0.7;
        meshRef.current.material.emissiveIntensity = pulse * 0.6;
      } else {
        meshRef.current.material.emissiveIntensity = 0;
      }
    }
  });

  return (
    <group position={position} ref={ref}>
      {/* Drop zone base */}
      <mesh ref={meshRef}>
        <boxGeometry args={[5, 0.4, 3]} />
        <meshStandardMaterial
          color={isHovered ? "#22c55e" : isActive ? "#8b5cf6" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isHovered ? "#22c55e" : isActive ? "#8b5cf6" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Border */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[5.1, 0.42, 3.1]} />
        <meshBasicMaterial
          color={isHovered ? "#22c55e" : "#a78bfa"}
          wireframe
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.35}
        color={isHovered ? "#22c55e" : isActive ? "#c4b5fd" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
      >
        {isHovered ? "✓ Release to Drop!" : isActive ? "↓ Drop Here ↓" : "Answer Zone"}
      </Text>

      {/* Arrow indicator */}
      {isActive && (
        <group position={[0, 1.5, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.35, 0.7, 8]} />
            <meshBasicMaterial color={isHovered ? "#22c55e" : "#a78bfa"} />
          </mesh>
        </group>
      )}
    </group>
  );
});

// === Draggable Box ===
const DraggableBox = forwardRef(({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isOtherDragging,
  isFaded,
  isNew,
  onClick,
}, ref) => {
  const size = [1.8, 1.2, 1];
  const groupRef = useRef();
  const currentPos = useRef(new THREE.Vector3(...position));

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isNew) return "#22c55e";
    if (selected) return "#facc15";
    if (isOtherDragging) return "#94a3b8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { nodeIndex: index };
    }
  }, [index]);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetPos = new THREE.Vector3(...position);
    
    if (isDragging) {
      targetPos.y += 1.5; // Lift when dragging
      targetPos.z += 0.5;
    }

    currentPos.current.lerp(targetPos, isDragging ? 0.3 : 0.15);
    groupRef.current.position.copy(currentPos.current);

    // Scale animation
    const targetScale = isDragging ? 1.15 : isNew ? 1.1 : 1;
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
      onClick={onClick}
    >
      {/* Shadow when dragging */}
      {isDragging && (
        <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : isNew ? "#22c55e" : selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={isDragging ? 0.6 : isNew ? 0.5 : selected ? 0.4 : 0}
          transparent={isOtherDragging || isFaded}
          opacity={isFaded ? 0.3 : isOtherDragging ? 0.5 : 1}
        />
      </mesh>

      {/* Wireframe when dragging */}
      {isDragging && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {/* Value text */}
      <Text
        position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index text */}
      <Text
        position={[0, -0.2, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color={isDragging ? "#f97316" : "#fbbf24"}
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Status labels */}
      {selected && !isDragging && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.25}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Value {value} at index {index}
        </Text>
      )}

      {isDragging && (
        <Text
          position={[0, size[1] + 1, 0]}
          fontSize={0.28}
          color="#f97316"
          anchorX="center"
          anchorY="middle"
        >
          ✋ Drag to Answer Zone
        </Text>
      )}

      {isNew && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.25}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          ✨ Inserted!
        </Text>
      )}
    </group>
  );
});

// === Start Button ===
const StartButton = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[5, 2, 1]} />
        <meshStandardMaterial
          color={hovered ? "#7c3aed" : "#8b5cf6"}
          emissive={hovered ? "#7c3aed" : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.51]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Start Assessment
      </Text>
    </group>
  );
};

// === Restart Button ===
const RestartButton = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 1.5, 1]} />
        <meshStandardMaterial
          color={hovered ? "#ea580c" : "#f97316"}
          emissive={hovered ? "#ea580c" : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.51]}
        fontSize={0.32}
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
const FloatingFeedback = ({ text, correct, position }) => {
  const groupRef = useRef();
  const [scale, setScale] = useState(0);

  useEffect(() => {
    setScale(0);
    const timer = setTimeout(() => setScale(1), 50);
    return () => clearTimeout(timer);
  }, [text]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Background */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[7, 1.2]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[7.1, 1.3]} />
        <meshBasicMaterial
          color={correct ? "#22c55e" : "#ef4444"}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Text */}
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

// === Fade-in Text ===
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0);
    let frame;
    let start;
    const duration = 400;
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
