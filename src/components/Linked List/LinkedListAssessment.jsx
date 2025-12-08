// ArrayAssessment.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_DATA = [10, 20, 30, 40, 50];

const ArrayAssessment = ({
  initialData = DEFAULT_DATA,
  spacing = 2.0,
  passingRatio = 0.75, // NEW: generic passing rule
  onPassStatusChange, // NEW: to inform parent (Array.jsx)
}) => {
  const modes = ["intro", "access", "search", "insert", "delete", "done"];
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];

  const [data, setData] = useState([...initialData]);
  const [question, setQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [animState, setAnimState] = useState({});

  // --- New states for scoring & progress ---
  const [score, setScore] = useState(0);
  const totalAssessments = 4;

  // NEW: track if passed
  const [isPassed, setIsPassed] = useState(false);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // 🔹 On mount, check kung passed na sa localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arrayAssessmentPassed");
      if (stored === "true") {
        setIsPassed(true);
        setScore(totalAssessments); // optional: full score display
        setModeIndex(modes.indexOf("done")); // jump to done
        onPassStatusChange && onPassStatusChange(true);
      }
    } catch (e) {
      console.warn("Unable to access localStorage", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});

    if (mode === "access") prepareAccessQuestion();
    if (mode === "search") prepareSearchQuestion();
    if (mode === "insert") prepareInsertQuestion();
    if (mode === "delete") prepareDeleteQuestion();
    if (mode === "intro") {
      setData([...initialData]);
      setScore(0);
    }
    if (mode === "done") setQuestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeIndex]);

  // 🔹 Kapag nasa "done" mode na, compute kung pasado at i-save
  useEffect(() => {
    if (mode !== "done") return;

    const ratio = score / totalAssessments;
    const passed = ratio >= passingRatio;

    setIsPassed(passed);
    onPassStatusChange && onPassStatusChange(passed);

    try {
      if (passed) {
        localStorage.setItem("arrayAssessmentPassed", "true");
      } else {
        // optional: linisin kung gusto mong ulitin pag bumalik
        localStorage.removeItem("arrayAssessmentPassed");
      }
    } catch (e) {
      console.warn("Unable to write localStorage", e);
    }
  }, [mode, score, totalAssessments, passingRatio, onPassStatusChange]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  // --- Question generators ---
  const prepareAccessQuestion = () => {
    const idx = Math.floor(Math.random() * data.length);
    setQuestion({
      prompt: `Which box is at index ${idx}? (Access — O(1))`,
      answerIndex: idx,
      type: "access",
    });
  };

  const prepareSearchQuestion = () => {
    const value = data[Math.floor(Math.random() * data.length)];
    setQuestion({
      prompt: `Click the box containing the value ${value}. (Search — O(n))`,
      answerValue: value,
      type: "search",
    });
  };

  const prepareInsertQuestion = () => {
    const insertValue = 99;
    const k = Math.floor(Math.random() * data.length); // avoid inserting at end
    const answerIndex = k < data.length ? k : data.length - 1;
    setQuestion({
      prompt: `If we insert ${insertValue} at index ${k}, which element (value) will shift right? (Insertion — O(n))`,
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
      prompt: `Delete the value at index ${k}. After deletion, which value will end up at index ${k}? (Deletion — O(n))`,
      k,
      answerIndex,
      type: "delete",
    });
  };

  // --- Click handler ---
  const handleBoxClick = (i) => {
    if (mode === "intro") {
      setModeIndex(1);
      return;
    }
    if (!question) return;

    setSelectedIndex(i);
    const markScore = (correct) => {
      if (correct) setScore((s) => s + 1);
    };

    if (question.type === "access") {
      const correct = i === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Value ${data[i]}`, nextMode);
    } else if (question.type === "search") {
      const correct = data[i] === question.answerValue;
      markScore(correct);
      showFeedback(correct, `Clicked ${data[i]}`, nextMode);
    } else if (question.type === "insert") {
      const correct = i === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Clicked ${data[i]}`, () => {
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
      const correct =
        question.answerIndex !== null && i === question.answerIndex;
      markScore(correct);
      showFeedback(correct, `Clicked ${data[i]}`, () => {
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
  };

  const showFeedback = (correct, label, callback) => {
    setFeedback({
      text: correct ? `Correct — ${label}` : `Incorrect — ${label}`,
      correct,
    });
    setTimeout(() => {
      setFeedback(null);
      callback && callback();
    }, 800);
  };

  // --- Render ---
  return (
    <div className="w-full h-[450px]">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeText
          text={
            mode === "intro"
              ? "Arrays — Assessment"
              : mode === "done"
              ? "Assessment Complete!"
              : `Assessment ${modeIndex}: ${mode.toUpperCase()}`
          }
          position={[0, 3.2, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        {/* Instruction or question */}
        <FadeText
          text={
            mode === "intro"
              ? "Click the box below to start the assessment"
              : mode === "done"
              ? isPassed
                ? "You passed this assessment!"
                : "You did not reach the passing score."
              : question
              ? question.prompt
              : ""
          }
          position={[0, 2.4, 0]}
          fontSize={0.34}
          color="white"
        />

        {/* Progress indicator */}
        {mode !== "intro" && mode !== "done" && (
          <FadeText
            text={`Progress: ${modeIndex} / ${totalAssessments}`}
            position={[0, 1.7, 0]}
            fontSize={0.28}
            color="#fde68a"
          />
        )}

        {/* Boxes */}
        {mode === "intro" ? (
          <StartBox position={[0, 0, 0]} onClick={() => handleBoxClick(0)} />
        ) : mode === "done" ? (
          <>
            <FadeText
              text={`Your Score: ${score} / ${totalAssessments}`}
              position={[0, 1.8, 0]}
              fontSize={0.5}
              color="#60a5fa"
            />
            <FadeText
              text={isPassed ? "Status: PASSED" : "Status: FAILED"}
              position={[0, 1.2, 0]}
              fontSize={0.45}
              color={isPassed ? "#22c55e" : "#ef4444"}
            />
          </>
        ) : (
          data.map((value, i) => {
            let extraPosX = 0;
            let extraOpacity = 1;
            if (animState[i] === "shift") extraPosX = 0.2;
            if (animState[i] === "fade") extraOpacity = 0.25;
            const isSelected = selectedIndex === i;
            return (
              <group key={i} position={[positions[i][0] + extraPosX, 0, 0]}>
                <Box
                  index={i}
                  value={value}
                  position={[0, 0, 0]}
                  selected={isSelected}
                  onClick={() => handleBoxClick(i)}
                  opacity={extraOpacity}
                />
              </group>
            );
          })
        )}

        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 1.3, 0]}
          />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// --- Start Box ---
const StartBox = ({ position = [0, 0, 0], onClick }) => {
  const size = [5.0, 2.2, 1.0];
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" emissive="#000000" />
      </mesh>
      <Text
        position={[0, 0.6, size[2] / 2 + 0.02]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Start Assessment
      </Text>
    </group>
  );
};

// --- Individual Box ---
const Box = ({
  index,
  value,
  position = [0, 0, 0],
  selected,
  onClick,
  opacity = 1,
}) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399";
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]} onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <Text
        position={[0, 0.2, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </group>
  );
};

// --- Floating Feedback ---
const FloatingFeedback = ({ text, correct = true, position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      <Text
        fontSize={0.36}
        color={correct ? "#10b981" : "#ef4444"}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// --- Fade-in text ---
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 700;
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
      maxWidth={12}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default ArrayAssessment;
