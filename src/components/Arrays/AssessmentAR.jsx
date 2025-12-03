import React, { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { XR, createXRStore, useXR } from "@react-three/xr";
import * as THREE from "three";

const DEFAULT_DATA = [10, 20, 30, 40, 50];

// Create XR Store outside component
const xrStore = createXRStore({
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['dom-overlay', 'hit-test'],
});

const AssessmentAR = ({
  initialData = DEFAULT_DATA,
  spacing = 1.2,
  passingRatio = 0.75,
  onPassStatusChange,
  onBack, // callback to go back to Assessment.jsx
}) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [error, setError] = useState(null);

  // Check AR support on mount
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        if (navigator.xr) {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsARSupported(supported);
        } else {
          setIsARSupported(false);
        }
      } catch (e) {
        console.error("AR check failed:", e);
        setIsARSupported(false);
      }
    };
    checkARSupport();
  }, []);

  // Listen for XR session changes
  useEffect(() => {
    const unsubscribe = xrStore.subscribe((state) => {
      setIsARActive(!!state.session);
    });
    return () => unsubscribe();
  }, []);

  const handleStartAR = async () => {
    try {
      setError(null);
      await xrStore.enterAR();
    } catch (e) {
      console.error("Failed to start AR:", e);
      setError("Failed to start AR. Please try again.");
    }
  };

  const handleExitAR = () => {
    try {
      const session = xrStore.getState().session;
      if (session) {
        session.end();
      }
    } catch (e) {
      console.error("Failed to exit AR:", e);
    }
  };

  // Start Screen (before AR)
  if (!isARActive) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        {/* Header */}
        <div className="text-6xl mb-6">📱</div>
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          AR Assessment
        </h1>
        <p className="text-gray-300 text-center max-w-md px-4 mb-8">
          Experience array operations in Augmented Reality. 
          Point your camera at a flat surface.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-600/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* AR Button or Not Supported Message */}
        {isARSupported ? (
          <button
            onClick={handleStartAR}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            🚀 Start AR
          </button>
        ) : (
          <div className="text-center px-4">
            <div className="px-6 py-4 bg-red-600/20 border border-red-500 rounded-xl mb-4">
              <p className="text-red-400 font-semibold mb-2">
                AR Not Supported
              </p>
              <p className="text-gray-400 text-sm">
                Your device or browser doesn't support WebXR AR
              </p>
            </div>
            <p className="text-gray-500 text-sm">
              Try using:
            </p>
            <ul className="text-gray-400 text-sm mt-2">
              <li>• Chrome on Android with ARCore</li>
              <li>• Safari on iOS 15+</li>
              <li>• Make sure you're on HTTPS</li>
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-center px-4">
          <p className="text-gray-500 text-sm mb-2">How to interact:</p>
          <div className="flex gap-4 justify-center text-gray-400 text-xs">
            <span className="px-3 py-1 bg-slate-700 rounded">Hold to grab</span>
            <span className="px-3 py-1 bg-slate-700 rounded">Drag to answer</span>
          </div>
        </div>
      </div>
    );
  }

  // AR Mode Active
  return (
    <div className="w-full h-screen relative">
      {/* Exit AR Button */}
      <button
        onClick={handleExitAR}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg font-semibold"
      >
        ✕ Exit AR
      </button>

      {/* AR Badge */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
        AR Active
      </div>

      {/* AR Canvas */}
      <Canvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <ARContent
              initialData={initialData}
              spacing={spacing}
              passingRatio={passingRatio}
              onPassStatusChange={onPassStatusChange}
            />
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
};

// AR Content - All the 3D stuff
const ARContent = ({ initialData, spacing, passingRatio, onPassStatusChange }) => {
  // Distance: 4 feet ≈ 1.2 meters in front
  const AR_DISTANCE = 1.2;
  const AR_HEIGHT = 0;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1} />
      <directionalLight position={[2, 4, 2]} intensity={0.8} />

      {/* Main Assessment Content - positioned 4 feet away */}
      <group position={[0, AR_HEIGHT, -AR_DISTANCE]}>
        <AssessmentContent
          initialData={initialData}
          spacing={spacing}
          passingRatio={passingRatio}
          onPassStatusChange={onPassStatusChange}
        />
      </group>
    </>
  );
};

// Main Assessment Logic
const AssessmentContent = ({
  initialData,
  spacing,
  passingRatio,
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
  const [holdingBox, setHoldingBox] = useState(null);
  const [boxPositions, setBoxPositions] = useState([]);

  // Scale everything down for AR (60% size)
  const arScale = 0.5;
  const adjustedSpacing = spacing * arScale;

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * adjustedSpacing, 0, 0]);
  }, [data, adjustedSpacing]);

  useEffect(() => {
    setBoxPositions(originalPositions.map((pos) => [...pos]));
  }, [originalPositions]);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});
    setDraggedBox(null);
    setHoldingBox(null);
    setBoxPositions(originalPositions.map((pos) => [...pos]));

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
  }, [mode, score]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Drag index ${idx} to answer`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Find value ${value}`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    const answerIndex = k < data.length ? k : data.length - 1;
    setQuestion({
      prompt: `Insert at ${k}. What shifts?`,
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
      prompt: `Delete ${k}. What fills it?`,
      k,
      answerIndex,
      type: "delete",
    });
  };

  const handleHoldStart = (index) => setHoldingBox(index);
  const handleHoldComplete = (index) => {
    setDraggedBox(index);
    setSelectedIndex(index);
    setHoldingBox(null);
  };
  const handleHoldCancel = () => setHoldingBox(null);
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

    setFeedback({ text: correct ? "✓ Correct!" : "✗ Wrong", correct });

    setTimeout(() => {
      setFeedback(null);
      resetBoxPosition(droppedIndex);

      if (question.type === "insert") {
        const newArr = [...data];
        newArr.splice(Math.min(question.k, newArr.length), 0, question.insertValue);
        setData(newArr);
      } else if (question.type === "delete") {
        const newArr = [...data];
        newArr.splice(question.k, 1);
        setData(newArr);
      }

      nextMode();
    }, 1000);

    setDraggedBox(null);
  };

  const handleBoxClick = (i) => {
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    setSelectedIndex((prev) => (prev === i ? null : i));
  };

  return (
    <group scale={[arScale, arScale, arScale]}>
      {/* UI Panel */}
      <group position={[0, 2.5, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[5, 1.2]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 0.3, 0]} fontSize={0.25} color="#facc15" anchorX="center">
          {mode === "intro"
            ? "AR Array Assessment"
            : mode === "done"
            ? "Complete!"
            : `${mode.toUpperCase()}`}
        </Text>
        <Text position={[0, -0.05, 0]} fontSize={0.15} color="white" anchorX="center" maxWidth={4.5}>
          {mode === "intro"
            ? "Tap START to begin"
            : mode === "done"
            ? isPassed
              ? "You passed!"
              : "Try again"
            : question?.prompt || ""}
        </Text>
        {mode !== "intro" && (
          <Text position={[0, -0.4, 0]} fontSize={0.12} color="#fde68a" anchorX="center">
            Score: {score}/{totalAssessments}
          </Text>
        )}
      </group>

      {/* Ground circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Drop Zone */}
      {mode !== "intro" && mode !== "done" && (
        <DropZone
          position={[0, 0, 1.8]}
          isActive={draggedBox !== null}
          draggedBox={draggedBox}
          onDrop={handleDropOnAnswer}
        />
      )}

      {/* Boxes */}
      {mode === "intro" ? (
        <StartButton position={[0, 0.4, 0]} onClick={() => handleBoxClick(0)} />
      ) : mode === "done" ? (
        <ResultDisplay
          score={score}
          total={totalAssessments}
          passed={isPassed}
          onRestart={() => {
            setModeIndex(0);
            setData([...initialData]);
            setScore(0);
            setIsPassed(false);
          }}
        />
      ) : (
        data.map((value, i) => (
          <DraggableBox
            key={i}
            index={i}
            value={value}
            position={boxPositions[i] || originalPositions[i]}
            originalPosition={originalPositions[i]}
            selected={selectedIndex === i}
            isDragging={draggedBox === i}
            isHolding={holdingBox === i}
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
        ))
      )}

      {/* Feedback */}
      {feedback && (
        <group position={[0, 1.5, 1.8]}>
          <mesh>
            <planeGeometry args={[1.5, 0.4]} />
            <meshBasicMaterial
              color={feedback.correct ? "#065f46" : "#7f1d1d"}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text fontSize={0.18} color={feedback.correct ? "#34d399" : "#f87171"} anchorX="center">
            {feedback.text}
          </Text>
        </group>
      )}
    </group>
  );
};

// Draggable Box
const DraggableBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  onBoxClick,
  onHoldStart,
  onHoldComplete,
  onHoldCancel,
  onDragEnd,
  onPositionChange,
}) => {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const [hovered, setHovered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef(null);
  const isDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const offset = useRef(new THREE.Vector3());
  const intersect = useRef(new THREE.Vector3());

  const HOLD_TIME = 350;
  const size = [0.8, 0.6, 0.5];

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (hovered) return "#818cf8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useFrame(() => {
    if (!groupRef.current) return;

    const targetY = isDragging ? 1 : isHolding ? 0.2 : 0;

    if (isDragging) {
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.15);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.15);
    }
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] + targetY, 0.2);

    const targetScale = isDragging ? 1.3 : isHolding ? 1.15 : hovered ? 1.05 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Hold progress
    if (isHolding && holdStartRef.current && !isDragging) {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / HOLD_TIME, 1);
      setHoldProgress(progress);
      if (progress >= 1) completeHold();
    }
  });

  const startHold = () => {
    isDownRef.current = true;
    hasDraggedRef.current = false;
    holdStartRef.current = Date.now();
    setHoldProgress(0);
    onHoldStart();
  };

  const completeHold = () => {
    if (!isDownRef.current) return;
    hasDraggedRef.current = true;
    holdStartRef.current = null;
    setHoldProgress(0);

    if (groupRef.current) {
      dragPlane.current.set(new THREE.Vector3(0, 1, 0), -groupRef.current.position.y);
    }
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersect.current);
    if (groupRef.current) {
      offset.current.copy(intersect.current).sub(groupRef.current.position);
    }
    onHoldComplete();
  };

  const cancelHold = () => {
    holdStartRef.current = null;
    setHoldProgress(0);
    isDownRef.current = false;
    onHoldCancel();
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    startHold();
  };

  const handlePointerMove = (e) => {
    if (!isDownRef.current || !isDragging) return;
    e.stopPropagation();

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersect.current);
    onPositionChange([
      intersect.current.x - offset.current.x,
      0,
      intersect.current.z - offset.current.z,
    ]);
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (!hasDraggedRef.current) onBoxClick();
    if (isDragging) onDragEnd();
    else cancelHold();

    isDownRef.current = false;
    hasDraggedRef.current = false;
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Hold ring */}
      {isHolding && !isDragging && (
        <group position={[0, size[1] + 0.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.22, 32]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.22, 32, 1, 0, Math.PI * 2 * holdProgress]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Shadow */}
      {isDragging && (
        <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Box */}
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isDragging ? "#f97316" : isHolding ? "#fb923c" : "#000"}
          emissiveIntensity={isDragging ? 0.5 : isHolding ? 0.3 : 0}
        />
      </mesh>

      {/* Wireframe */}
      {(isDragging || isHolding) && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.05, size[1] + 0.05, size[2] + 0.05]} />
          <meshBasicMaterial color={isDragging ? "#fff" : "#f97316"} wireframe />
        </mesh>
      )}

      {/* Value */}
      <Text position={[0, size[1] / 2, size[2] / 2 + 0.01]} fontSize={0.22} color="white" anchorX="center">
        {value}
      </Text>

      {/* Index */}
      <Text position={[0, -0.08, size[2] / 2 + 0.01]} fontSize={0.12} color="yellow" anchorX="center">
        [{index}]
      </Text>
    </group>
  );
};

// Drop Zone
const DropZone = ({ position, isActive, draggedBox, onDrop }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const pulseRef = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = isActive && hovered ? 1.1 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);

    if (isActive) {
      pulseRef.current += 0.05;
      meshRef.current.material.emissiveIntensity = Math.sin(pulseRef.current) * 0.3 + 0.4;
    } else {
      meshRef.current.material.emissiveIntensity = 0;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={() => isActive && draggedBox !== null && onDrop(draggedBox)}
      >
        <boxGeometry args={[2.5, 0.15, 1.2]} />
        <meshStandardMaterial
          color={hovered && isActive ? "#22c55e" : isActive ? "#3b82f6" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#3b82f6" : "#000"}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[2.55, 0.17, 1.25]} />
        <meshBasicMaterial color={hovered && isActive ? "#22c55e" : "#60a5fa"} wireframe />
      </mesh>
      <Text position={[0, 0.2, 0]} fontSize={0.15} color={isActive ? "#22c55e" : "#94a3b8"} anchorX="center">
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>
      {isActive && (
        <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.12, 0.25, 6]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
};

// Start Button
const StartButton = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.4;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.8, 0.7, 0.5]} />
        <meshStandardMaterial
          color={hovered ? "#3b82f6" : "#60a5fa"}
          emissive={hovered ? "#3b82f6" : "#1e40af"}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      <Text position={[0, 0.4, 0.28]} fontSize={0.22} color="white" anchorX="center">
        START
      </Text>
    </group>
  );
};

// Result Display
const ResultDisplay = ({ score, total, passed, onRestart }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[0, 0.5, 0]}>
      <Text position={[0, 0.8, 0]} fontSize={0.25} color="#60a5fa" anchorX="center">
        Score: {score}/{total}
      </Text>
      <Text position={[0, 0.4, 0]} fontSize={0.22} color={passed ? "#22c55e" : "#ef4444"} anchorX="center">
        {passed ? "PASSED ✓" : "FAILED ✗"}
      </Text>
      <mesh
        position={[0, -0.1, 0]}
        onClick={onRestart}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.5, 0.5, 0.4]} />
        <meshStandardMaterial
          color={hovered ? "#f97316" : "#fb923c"}
          emissive={hovered ? "#f97316" : "#000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text position={[0, -0.1, 0.25]} fontSize={0.16} color="white" anchorX="center">
        RESTART
      </Text>
    </group>
  );
};

export default AssessmentAR;