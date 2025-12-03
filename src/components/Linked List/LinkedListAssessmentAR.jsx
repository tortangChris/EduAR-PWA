import React, { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { 
  XR, 
  createXRStore,
  XROrigin
} from "@react-three/xr";
import * as THREE from "three";

// Create XR Store for AR
const xrStore = createXRStore({
  depthSensing: true,
  optionalFeatures: ['hit-test', 'dom-overlay', 'light-estimation']
});

const DEFAULT_DATA = [10, 20, 30, 40, 50];

const LinkedListAssessmentAR = ({
  initialData = DEFAULT_DATA,
  spacing = 2.0,
  passingRatio = 0.75,
  onPassStatusChange,
  onBack,
}) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [arStarted, setArStarted] = useState(false);

  useEffect(() => {
    const checkAR = async () => {
      if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
      }
    };
    checkAR();
  }, []);

  const startAR = async () => {
    try {
      await xrStore.enterAR();
      setArStarted(true);
    } catch (error) {
      console.error("Failed to start AR:", error);
      alert("Failed to start AR. Make sure you're using a compatible device and browser.");
    }
  };

  return (
    <div className="w-full h-screen relative">
      {!arStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 z-10">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2"
            >
              ← Back
            </button>
          )}

          <h1 className="text-3xl font-bold text-green-400 mb-4">
            Linked List Assessment AR
          </h1>
          <p className="text-white mb-8 text-center px-4">
            Experience interactive linked list operations in Augmented Reality!
          </p>
          
          {isARSupported ? (
            <button
              onClick={startAR}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Start AR Experience
            </button>
          ) : (
            <div className="text-center">
              <p className="text-red-400 mb-4">
                AR is not supported on this device/browser
              </p>
              <p className="text-gray-400 text-sm">
                Try using Chrome on Android or Safari on iOS
              </p>
              {onBack && (
                <button
                  onClick={onBack}
                  className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                >
                  ← Go Back
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Canvas
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <ARScene
              initialData={initialData}
              spacing={spacing}
              passingRatio={passingRatio}
              onPassStatusChange={onPassStatusChange}
              arStarted={arStarted}
            />
          </Suspense>
        </XR>
      </Canvas>

      {arStarted && (
        <button
          onClick={() => {
            xrStore.getState().session?.end();
            setArStarted(false);
          }}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg"
        >
          Exit AR
        </button>
      )}
    </div>
  );
};

const ARScene = ({
  initialData,
  spacing,
  passingRatio,
  onPassStatusChange,
  arStarted
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
  
  const [arPlaced, setArPlaced] = useState(false);
  const [arPosition, setArPosition] = useState([0, 0, -8]);

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    setBoxPositions(originalPositions.map(pos => [...pos]));
  }, [originalPositions]);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
    setDraggedBox(null);
    setHoldingBox(null);
    setDroppedAnswer(null);
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
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () =>
    setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Traverse to node at position ${idx}. (Access — O(n))`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Find node with value ${value}. (Search — O(n))`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    const answerIndex = k;
    setQuestion({
      prompt: `Insert ${insertValue} after position ${k}. Which node's pointer changes?`,
      insertValue,
      k,
      answerIndex,
      type: "insert",
    });
  };

  const prepareDeleteQuestion = () => {
    let k = Math.floor(Math.random() * (data.length - 1)) + 1;
    if (k >= data.length) k = data.length - 1;
    const answerIndex = k - 1;
    setQuestion({
      prompt: `Delete node at position ${k}. Which node's pointer must update?`,
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
      showFeedback(correct, `Node ${data[droppedIndex]}`, () => {
        resetBoxPosition(droppedIndex);
        nextMode();
      });
    } else if (question.type === "search") {
      correct = data[droppedIndex] === question.answerValue;
      markScore(correct);
      showFeedback(correct, `Found ${data[droppedIndex]}`, () => {
        resetBoxPosition(droppedIndex);
        nextMode();
      });
    } else if (question.type === "insert") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Node ${data[droppedIndex]}`, () => {
        const newArr = [...data];
        newArr.splice(question.k + 1, 0, question.insertValue);
        setData(newArr);
        nextMode();
      });
    } else if (question.type === "delete") {
      correct = droppedIndex === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Node ${data[droppedIndex]}`, () => {
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
      text: correct ? `✓ Correct!` : `✗ Wrong`,
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

  const handlePlaceAR = (position) => {
    setArPosition(position);
    setArPlaced(true);
  };

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />

      <XROrigin position={[0, 0, 0]} />

      {!arPlaced && arStarted && (
        <ARHitTest onPlace={handlePlaceAR} />
      )}

      <group position={arPosition}>
        <ARUIPanel
          position={[0, 2.5, 0]}
          mode={mode}
          modeIndex={modeIndex}
          question={question}
          score={score}
          totalAssessments={totalAssessments}
          isPassed={isPassed}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[5, 32]} />
          <meshStandardMaterial 
            color="#1e293b" 
            transparent 
            opacity={0.3}
          />
        </mesh>

        {/* HEAD Label */}
        {mode !== "intro" && mode !== "done" && data.length > 0 && (
          <group position={[originalPositions[0][0] - 1.8, 0.6, 0]}>
            <Text fontSize={0.3} color="#22c55e" anchorX="center">
              HEAD
            </Text>
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.12, 0.35, 8]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        )}

        {mode !== "intro" && mode !== "done" && (
          <ARAnswerDropZone
            position={[0, 0, 2.5]}
            isActive={draggedBox !== null}
            draggedBox={draggedBox}
            onDrop={handleDropOnAnswer}
            feedback={feedback}
          />
        )}

        {mode === "intro" ? (
          <ARStartBox 
            position={[0, 0.5, 0]} 
            onClick={() => handleBoxClick(0)} 
          />
        ) : mode === "done" ? (
          <ARResultPanel
            score={score}
            totalAssessments={totalAssessments}
            isPassed={isPassed}
            onRestart={() => {
              setModeIndex(0);
              setData([...initialData]);
              setScore(0);
              setIsPassed(false);
            }}
          />
        ) : (
          <>
            {data.map((value, i) => {
              let extraOpacity = 1;
              if (animState[i] === "fade") extraOpacity = 0.25;
              const isSelected = selectedIndex === i;

              return (
                <React.Fragment key={i}>
                  <ARDraggableBox
                    index={i}
                    value={value}
                    position={boxPositions[i] || originalPositions[i]}
                    originalPosition={originalPositions[i]}
                    selected={isSelected}
                    isDragging={draggedBox === i}
                    isHolding={holdingBox === i}
                    anyDragging={draggedBox !== null}
                    opacity={extraOpacity}
                    isHead={i === 0}
                    onBoxClick={() => handleBoxClick(i)}
                    onHoldStart={() => handleHoldStart(i)}
                    onHoldComplete={() => handleHoldComplete(i)}
                    onHoldCancel={handleHoldCancel}
                    onDragEnd={() => {
                      handleDragEnd();
                      resetBoxPosition(i);
                    }}
                    onPositionChange={(pos) => updateBoxPosition(i, pos)}
                  />
                  {/* Arrow to next node */}
                  {i < data.length - 1 && draggedBox !== i && (
                    <ARPointerArrow
                      from={boxPositions[i] || originalPositions[i]}
                      to={boxPositions[i + 1] || originalPositions[i + 1]}
                      spacing={spacing}
                    />
                  )}
                </React.Fragment>
              );
            })}
            {/* NULL at end */}
            <group position={[originalPositions[data.length - 1][0] + spacing, 0.6, 0]}>
              <mesh>
                <boxGeometry args={[1, 0.6, 0.6]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <Text position={[0, 0, 0.35]} fontSize={0.25} color="white" anchorX="center">
                NULL
              </Text>
            </group>
          </>
        )}

        {feedback && (
          <ARFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 1.5, 2.5]}
          />
        )}
      </group>

      {!arStarted && <FallbackCamera />}
    </>
  );
};

const ARHitTest = ({ onPlace }) => {
  const reticleRef = useRef();
  const [hitPosition, setHitPosition] = useState(null);

  useFrame(() => {
    if (reticleRef.current) {
      reticleRef.current.rotation.x = -Math.PI / 2;
    }
  });

  const handleTap = () => {
    if (hitPosition) {
      onPlace(hitPosition);
    } else {
      onPlace([0, 0, -8]);
    }
  };

  return (
    <group>
      <mesh
        ref={reticleRef}
        position={[0, 0, -8]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleTap}
      >
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#22c55e" side={THREE.DoubleSide} />
      </mesh>
      
      <Text
        position={[0, 0.5, -8]}
        fontSize={0.1}
        color="#22c55e"
        anchorX="center"
      >
        Tap to place linked list
      </Text>
    </group>
  );
};

const ARUIPanel = ({ position, mode, modeIndex, question, score, totalAssessments, isPassed }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[5, 1.4]} />
        <meshBasicMaterial 
          color="#0f172a" 
          transparent 
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[5.1, 1.5]} />
        <meshBasicMaterial color="#22c55e" wireframe />
      </mesh>

      <Text
        position={[0, 0.4, 0]}
        fontSize={0.18}
        color="#22c55e"
        anchorX="center"
      >
        {mode === "intro"
          ? "Linked List — AR Assessment"
          : mode === "done"
          ? "Assessment Complete!"
          : `Step ${modeIndex}: ${mode.toUpperCase()}`}
      </Text>

      <Text
        position={[0, 0, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        maxWidth={4.5}
        textAlign="center"
      >
        {mode === "intro"
          ? "Tap START to begin"
          : mode === "done"
          ? isPassed ? "You passed!" : "Try again!"
          : question?.prompt || ""}
      </Text>

      {mode !== "intro" && (
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.1}
          color="#86efac"
          anchorX="center"
        >
          {`Score: ${score} / ${totalAssessments}`}
        </Text>
      )}
    </group>
  );
};

// Pointer Arrow between boxes (same style as Array but with arrow)
const ARPointerArrow = ({ from, to, spacing }) => {
  const arrowLength = spacing * 0.35;
  const midX = (from[0] + to[0]) / 2;
  
  return (
    <group position={[midX, 0.6, 0]}>
      {/* Arrow line */}
      <mesh>
        <boxGeometry args={[arrowLength, 0.1, 0.1]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      {/* Arrow head */}
      <mesh position={[arrowLength / 2 + 0.12, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
};

// Same Box as ArrayAssessmentAR
const ARDraggableBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  anyDragging,
  opacity = 1,
  isHead,
  onBoxClick,
  onHoldStart,
  onHoldComplete,
  onHoldCancel,
  onDragEnd,
  onPositionChange,
}) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartTimeRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const offset = useRef(new THREE.Vector3());
  const intersection = useRef(new THREE.Vector3());

  const HOLD_DURATION = 400;
  const size = [1.2, 0.9, 0.8]; // Same size as Array boxes

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    if (isHead) return "#22c55e"; // Head node is green
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isDragging ? 1.5 : isHolding ? 0.3 : 0;

      if (isDragging) {
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + targetY,
          0.3
        );
      } else {
        groupRef.current.position.x = THREE.MathUtils.lerp(
          groupRef.current.position.x,
          position[0],
          0.15
        );
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + targetY,
          0.15
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
          groupRef.current.position.z,
          position[2],
          0.15
        );
      }

      const targetScale = isDragging ? 1.3 : isHolding ? 1.15 : isHovered ? 1.08 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    if (isHolding && holdStartTimeRef.current && !isDragging) {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        completeHold();
      }
    }
  });

  const startHold = () => {
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);
    onHoldStart();
  };

  const completeHold = () => {
    if (!isPointerDownRef.current) return;

    hasDraggedRef.current = true;
    holdStartTimeRef.current = null;
    setHoldProgress(0);

    if (groupRef.current) {
      dragPlane.current.set(
        new THREE.Vector3(0, 1, 0), 
        -groupRef.current.position.y
      );
    }

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
    if (groupRef.current) {
      offset.current.copy(intersection.current).sub(groupRef.current.position);
    }

    onHoldComplete();
  };

  const cancelHold = () => {
    holdStartTimeRef.current = null;
    setHoldProgress(0);
    isPointerDownRef.current = false;
    onHoldCancel();
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    startHold();
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

    if (!hasDraggedRef.current) {
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
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Hold Progress Ring */}
      {isHolding && !isDragging && (
        <group position={[0, size[1] + 0.8, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.25, 0.35, 32]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[0.25, 0.35, 32, 1, 0, Math.PI * 2 * holdProgress]}
            />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Shadow */}
      {isDragging && (
        <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Main Box - Same as Array */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : isHolding ? "#fb923c" : selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={isDragging ? 0.6 : isHolding ? 0.4 : selected ? 0.4 : 0}
          metalness={0.1}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Glow outline when dragging */}
      {(isDragging || isHolding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2] + 0.08]} />
          <meshBasicMaterial 
            color={isDragging ? "#ffffff" : "#f97316"} 
            wireframe 
          />
        </mesh>
      )}

      {/* Value label */}
      <Text
        position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Position label (instead of index for linked list) */}
      <Text
        position={[0, -0.15, size[2] / 2 + 0.01]}
        fontSize={0.18}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        pos:{index}
      </Text>

      {/* Drag instruction */}
      {isDragging && (
        <Text
          position={[0, size[1] + 0.5, 0]}
          fontSize={0.12}
          color="#fb923c"
          anchorX="center"
        >
          Drag to Answer Zone ↓
        </Text>
      )}
    </group>
  );
};

const ARAnswerDropZone = ({ position, isActive, draggedBox, onDrop, feedback }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const glowRef = useRef(0);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isActive && hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      if (isActive) {
        glowRef.current += 0.06;
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
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[3, 0.2, 1.8]} />
        <meshStandardMaterial
          color={hovered && isActive ? "#22c55e" : isActive ? "#22c55e" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#22c55e" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[3.1, 0.22, 1.9]} />
        <meshBasicMaterial
          color={hovered && isActive ? "#4ade80" : "#22c55e"}
          wireframe
        />
      </mesh>

      <Text
        position={[0, 0.25, 0]}
        fontSize={0.2}
        color={isActive ? "#4ade80" : "#94a3b8"}
        anchorX="center"
      >
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>

      {isActive && (
        <group position={[0, 0.8, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshBasicMaterial color="#4ade80" />
          </mesh>
        </group>
      )}
    </group>
  );
};

const ARStartBox = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.5;
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
        <boxGeometry args={[2.5, 1, 0.8]} />
        <meshStandardMaterial
          color={hovered ? "#16a34a" : "#22c55e"}
          emissive={hovered ? "#22c55e" : "#14532d"}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      <Text
        position={[0, 0.5, 0.45]}
        fontSize={0.25}
        color="white"
        anchorX="center"
      >
        START
      </Text>
    </group>
  );
};

const ARResultPanel = ({ score, totalAssessments, isPassed, onRestart }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[0, 0.5, 0]}>
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="#22c55e"
        anchorX="center"
      >
        {`Score: ${score} / ${totalAssessments}`}
      </Text>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.25}
        color={isPassed ? "#22c55e" : "#ef4444"}
        anchorX="center"
      >
        {isPassed ? "PASSED ✓" : "FAILED ✗"}
      </Text>

      <mesh
        position={[0, -0.3, 0]}
        onClick={onRestart}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 0.6, 0.5]} />
        <meshStandardMaterial
          color={hovered ? "#16a34a" : "#22c55e"}
          emissive={hovered ? "#22c55e" : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, -0.3, 0.3]}
        fontSize={0.18}
        color="white"
        anchorX="center"
      >
        RESTART
      </Text>
    </group>
  );
};

const ARFeedback = ({ text, correct, position }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2, 0.5]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        fontSize={0.18}
        color={correct ? "#34d399" : "#f87171"}
        anchorX="center"
      >
        {text}
      </Text>
    </group>
  );
};

const FallbackCamera = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
};

export default LinkedListAssessmentAR;
