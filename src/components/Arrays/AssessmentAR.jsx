import React, { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
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

const AssessmentAR = ({
  initialData = DEFAULT_DATA,
  spacing = 1.5,
  passingRatio = 0.75,
  onPassStatusChange,
}) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // null, 'ar', '3d'
  const [arStarted, setArStarted] = useState(false);

  // Check AR support
  useEffect(() => {
    const checkAR = async () => {
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsARSupported(supported);
        } catch (e) {
          setIsARSupported(false);
        }
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

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode === 'ar') {
      startAR();
    }
  };

  const handleBack = () => {
    if (arStarted) {
      xrStore.getState().session?.end();
      setArStarted(false);
    }
    setSelectedMode(null);
  };

  // Mode Selection Screen
  if (selectedMode === null) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
            🎯 Array Assessment
          </h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto px-4">
            Learn array operations through interactive exercises
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="flex flex-col md:flex-row gap-6 px-4">
          {/* 3D Mode Card */}
          <div 
            onClick={() => handleModeSelect('3d')}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 w-72 transform hover:scale-105 transition-all duration-300 shadow-2xl border border-blue-400/30"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold text-white mb-2">3D Mode</h2>
              <p className="text-blue-200 text-sm mb-4">
                Interactive 3D visualization with mouse/touch controls
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-500/30 rounded-full text-xs text-blue-200">
                  All Devices
                </span>
                <span className="px-3 py-1 bg-blue-500/30 rounded-full text-xs text-blue-200">
                  Rotate & Zoom
                </span>
              </div>
            </div>
          </div>

          {/* AR Mode Card */}
          <div 
            onClick={() => isARSupported && handleModeSelect('ar')}
            className={`cursor-pointer bg-gradient-to-br rounded-2xl p-8 w-72 transform transition-all duration-300 shadow-2xl border ${
              isARSupported 
                ? 'from-green-600 to-green-800 hover:scale-105 border-green-400/30' 
                : 'from-gray-600 to-gray-800 opacity-60 border-gray-500/30 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-white mb-2">AR Mode</h2>
              <p className={`text-sm mb-4 ${isARSupported ? 'text-green-200' : 'text-gray-400'}`}>
                {isARSupported 
                  ? 'Experience arrays in your real environment'
                  : 'AR not supported on this device'
                }
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {isARSupported ? (
                  <>
                    <span className="px-3 py-1 bg-green-500/30 rounded-full text-xs text-green-200">
                      Camera View
                    </span>
                    <span className="px-3 py-1 bg-green-500/30 rounded-full text-xs text-green-200">
                      Walk Around
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-gray-500/30 rounded-full text-xs text-gray-400">
                      Requires ARCore/ARKit
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            {isARSupported 
              ? '✅ Your device supports AR' 
              : '💡 Use Chrome on Android or Safari on iOS for AR'
            }
          </p>
        </div>
      </div>
    );
  }

  // 3D Mode (Non-AR)
  if (selectedMode === '3d') {
    return (
      <div className="w-full h-screen relative">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow-lg flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Mode Indicator */}
        <div className="absolute top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
          🖥️ 3D Mode
        </div>

        <Canvas
          camera={{ position: [0, 5, 12], fov: 50 }}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            touchAction: 'none',
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)'
          }}
        >
          <Suspense fallback={null}>
            <AssessmentScene
              initialData={initialData}
              spacing={spacing}
              passingRatio={passingRatio}
              onPassStatusChange={onPassStatusChange}
              isAR={false}
            />
          </Suspense>
          <OrbitControls 
            makeDefault
            minDistance={5}
            maxDistance={20}
          />
        </Canvas>
      </div>
    );
  }

  // AR Mode
  return (
    <div className="w-full h-screen relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg flex items-center gap-2"
      >
        ✕ Exit AR
      </button>

      {/* Mode Indicator */}
      <div className="absolute top-4 right-4 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg">
        📱 AR Mode
      </div>

      {/* AR Canvas */}
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
            <ARSceneWrapper
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

// AR Scene Wrapper - positions content 4 feet away
const ARSceneWrapper = ({ initialData, spacing, passingRatio, onPassStatusChange }) => {
  // 4 feet = ~1.22 meters
  const AR_DISTANCE = -1.5; // Negative Z means in front of camera
  const AR_HEIGHT = -0.3;   // Slightly below eye level

  return (
    <>
      <XROrigin position={[0, 0, 0]} />
      
      {/* Position the entire scene 4 feet away */}
      <group position={[0, AR_HEIGHT, AR_DISTANCE]}>
        <AssessmentScene
          initialData={initialData}
          spacing={spacing}
          passingRatio={passingRatio}
          onPassStatusChange={onPassStatusChange}
          isAR={true}
        />
      </group>
    </>
  );
};

// Main Assessment Scene (works for both AR and 3D)
const AssessmentScene = ({
  initialData,
  spacing,
  passingRatio,
  onPassStatusChange,
  isAR = false
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

  // Scale down for AR to fit in view
  const scaleMultiplier = isAR ? 0.6 : 1;
  const adjustedSpacing = spacing * scaleMultiplier;

  const originalPositions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * adjustedSpacing, 0, 0]);
  }, [data, adjustedSpacing]);

  // Initialize box positions
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
      prompt: `Drag box at index ${idx} to answer zone`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Find and drag value ${value}`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length);
    const answerIndex = k < data.length ? k : data.length - 1;
    setQuestion({
      prompt: `Insert ${insertValue} at index ${k}. Which shifts?`,
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
      prompt: `Delete index ${k}. What fills it?`,
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

  // Adjust sizes based on AR or 3D mode
  const uiScale = isAR ? 0.7 : 1;

  return (
    <group scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />

      {/* UI Panel */}
      <UIPanel
        position={[0, 3.5 * uiScale, 0]}
        mode={mode}
        modeIndex={modeIndex}
        question={question}
        score={score}
        totalAssessments={totalAssessments}
        isPassed={isPassed}
        scale={uiScale}
        isAR={isAR}
      />

      {/* Ground Indicator */}
      {!isAR && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[15, 8]} />
          <meshStandardMaterial 
            color="#1e293b" 
            transparent 
            opacity={0.5}
          />
        </mesh>
      )}

      {/* AR Ground Circle */}
      {isAR && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[3, 32]} />
          <meshStandardMaterial 
            color="#1e293b" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Answer Drop Zone */}
      {mode !== "intro" && mode !== "done" && (
        <AnswerDropZone
          position={[0, 0, 2.5]}
          isActive={draggedBox !== null}
          draggedBox={draggedBox}
          onDrop={handleDropOnAnswer}
          feedback={feedback}
          scale={uiScale}
        />
      )}

      {/* Interactive Boxes */}
      {mode === "intro" ? (
        <StartBox 
          position={[0, 0.5, 0]} 
          onClick={() => handleBoxClick(0)}
          scale={uiScale}
        />
      ) : mode === "done" ? (
        <ResultPanel
          position={[0, 0.5, 0]}
          score={score}
          totalAssessments={totalAssessments}
          isPassed={isPassed}
          onRestart={() => {
            setModeIndex(0);
            setData([...initialData]);
            setScore(0);
            setIsPassed(false);
          }}
          scale={uiScale}
        />
      ) : (
        data.map((value, i) => {
          let extraOpacity = 1;
          if (animState[i] === "fade") extraOpacity = 0.25;
          const isSelected = selectedIndex === i;

          return (
            <DraggableBox
              key={i}
              index={i}
              value={value}
              position={boxPositions[i] || originalPositions[i]}
              originalPosition={originalPositions[i]}
              selected={isSelected}
              isDragging={draggedBox === i}
              isHolding={holdingBox === i}
              anyDragging={draggedBox !== null}
              opacity={extraOpacity}
              onBoxClick={() => handleBoxClick(i)}
              onHoldStart={() => handleHoldStart(i)}
              onHoldComplete={() => handleHoldComplete(i)}
              onHoldCancel={handleHoldCancel}
              onDragEnd={() => {
                handleDragEnd();
                resetBoxPosition(i);
              }}
              onPositionChange={(pos) => updateBoxPosition(i, pos)}
              scale={uiScale}
            />
          );
        })
      )}

      {/* Feedback Display */}
      {feedback && (
        <FeedbackDisplay
          text={feedback.text}
          correct={feedback.correct}
          position={[0, 2, 2.5]}
          scale={uiScale}
        />
      )}
    </group>
  );
};

// UI Panel Component
const UIPanel = ({ position, mode, modeIndex, question, score, totalAssessments, isPassed, scale = 1, isAR }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[6, 1.8]} />
        <meshBasicMaterial 
          color="#0f172a" 
          transparent 
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[6.1, 1.9]} />
        <meshBasicMaterial color="#3b82f6" wireframe />
      </mesh>

      {/* Mode badge */}
      <group position={[2.2, 0.65, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.35]} />
          <meshBasicMaterial 
            color={isAR ? "#22c55e" : "#3b82f6"} 
            transparent 
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.15}
          color="white"
          anchorX="center"
        >
          {isAR ? "AR" : "3D"}
        </Text>
      </group>

      {/* Title */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#facc15"
        anchorX="center"
      >
        {mode === "intro"
          ? "Arrays — Assessment"
          : mode === "done"
          ? "Assessment Complete!"
          : `Step ${modeIndex}: ${mode.toUpperCase()}`}
      </Text>

      {/* Question/Instruction */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        maxWidth={5.5}
        textAlign="center"
      >
        {mode === "intro"
          ? "Tap START to begin the assessment"
          : mode === "done"
          ? isPassed ? "Congratulations! You passed!" : "Try again to improve your score"
          : question?.prompt || ""}
      </Text>

      {/* Score */}
      {mode !== "intro" && (
        <Text
          position={[0, -0.55, 0]}
          fontSize={0.16}
          color="#fde68a"
          anchorX="center"
        >
          {`Score: ${score} / ${totalAssessments}`}
        </Text>
      )}
    </group>
  );
};

// Draggable Box Component
const DraggableBox = ({
  index,
  value,
  position,
  originalPosition,
  selected,
  isDragging,
  isHolding,
  anyDragging,
  opacity = 1,
  onBoxClick,
  onHoldStart,
  onHoldComplete,
  onHoldCancel,
  onDragEnd,
  onPositionChange,
  scale = 1,
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
  const size = [1.2 * scale, 0.9 * scale, 0.8 * scale];

  const getColor = () => {
    if (isDragging) return "#f97316";
    if (isHolding) return "#fb923c";
    if (selected) return "#facc15";
    if (isHovered) return "#818cf8";
    return index % 2 === 0 ? "#60a5fa" : "#34d399";
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isDragging ? 1.5 * scale : isHolding ? 0.3 * scale : 0;

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

      {/* Main Box */}
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

      {/* Glow outline */}
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
        fontSize={0.3 * scale}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index label */}
      <Text
        position={[0, -0.15, size[2] / 2 + 0.01]}
        fontSize={0.18 * scale}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
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

// Answer Drop Zone
const AnswerDropZone = ({ position, isActive, draggedBox, onDrop, feedback, scale = 1 }) => {
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
    <group position={position} scale={[scale, scale, scale]}>
      {/* Drop zone */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[4, 0.25, 2]} />
        <meshStandardMaterial
          color={hovered && isActive ? "#22c55e" : isActive ? "#3b82f6" : "#475569"}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          emissive={isActive ? "#3b82f6" : "#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Border */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[4.1, 0.27, 2.1]} />
        <meshBasicMaterial
          color={hovered && isActive ? "#22c55e" : "#60a5fa"}
          wireframe
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.25}
        color={isActive ? "#22c55e" : "#94a3b8"}
        anchorX="center"
      >
        {isActive ? "Drop Here!" : "Answer Zone"}
      </Text>

      {/* Arrow when active */}
      {isActive && (
        <group position={[0, 1, 0]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Start Box
const StartBox = ({ position, onClick, scale = 1 }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.5;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[3, 1.2, 0.8]} />
        <meshStandardMaterial
          color={hovered ? "#3b82f6" : "#60a5fa"}
          emissive={hovered ? "#3b82f6" : "#1e40af"}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      <Text
        position={[0, 0.5, 0.45]}
        fontSize={0.35}
        color="white"
        anchorX="center"
      >
        START
      </Text>
    </group>
  );
};

// Result Panel
const ResultPanel = ({ position, score, totalAssessments, isPassed, onRestart, scale = 1 }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Score display */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color="#60a5fa"
        anchorX="center"
      >
        {`Score: ${score} / ${totalAssessments}`}
      </Text>

      {/* Status */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.35}
        color={isPassed ? "#22c55e" : "#ef4444"}
        anchorX="center"
      >
        {isPassed ? "PASSED ✓" : "FAILED ✗"}
      </Text>

      {/* Restart button */}
      <mesh
        position={[0, -0.2, 0]}
        onClick={onRestart}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.5, 0.8, 0.5]} />
        <meshStandardMaterial
          color={hovered ? "#f97316" : "#fb923c"}
          emissive={hovered ? "#f97316" : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, -0.2, 0.3]}
        fontSize={0.25}
        color="white"
        anchorX="center"
      >
        RESTART
      </Text>
    </group>
  );
};

// Feedback Display
const FeedbackDisplay = ({ text, correct, position, scale = 1 }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2.5 * scale, 0.6 * scale]} />
        <meshBasicMaterial
          color={correct ? "#065f46" : "#7f1d1d"}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        fontSize={0.25 * scale}
        color={correct ? "#34d399" : "#f87171"}
        anchorX="center"
      >
        {text}
      </Text>
    </group>
  );
};

export default AssessmentAR;