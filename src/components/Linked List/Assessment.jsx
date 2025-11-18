// SortingAssessment.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const DEFAULT_DATA = [35, 10, 25, 5, 15];

const SortingAssessment = ({
  initialData = DEFAULT_DATA,
  spacing = 2.0,
  randomize = false,
}) => {
  // Mode flow:
  // intro -> bubble-1 -> bubble-2 -> insertion-1 -> insertion-2 -> selection-1 -> selection-2 -> done
  const modes = [
    "intro",
    "bubble-q1",
    "bubble-q2",
    "insertion-q1",
    "insertion-q2",
    "selection-q1",
    "selection-q2",
    "done",
  ];
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];

  const makeRandomArray = () => {
    const base = [...initialData];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  };

  const [data, setData] = useState(() =>
    randomize ? makeRandomArray() : [...initialData]
  );
  const [question, setQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [animState, setAnimState] = useState({});
  const [score, setScore] = useState(0);

  const totalAssessments = 6; // 2 per algorithm

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    // reset selection & feedback when mode changes
    setSelectedIndex(null);
    setFeedback(null);
    setAnimState({});

    // prepare question based on mode
    if (mode === "bubble-q1") prepareBubbleQ1();
    if (mode === "bubble-q2") prepareBubbleQ2();
    if (mode === "insertion-q1") prepareInsertionQ1();
    if (mode === "insertion-q2") prepareInsertionQ2();
    if (mode === "selection-q1") prepareSelectionQ1();
    if (mode === "selection-q2") prepareSelectionQ2();
    if (mode === "intro") setData(randomize ? makeRandomArray() : [...initialData]);
    if (mode === "done") setQuestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeIndex]);

  const nextMode = () => setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  // ------------------ Question generators ------------------

  // Bubble Sort Q1:
  // "Which pair will be compared first?" (i.e., indices 0 & 1)
  const prepareBubbleQ1 = () => {
    setQuestion({
      prompt: `Bubble Sort — Q1: Which pair of boxes will be compared first? Click the LEFT box of that pair.`,
      type: "bubble-q1",
      answerIndex: 0, // left of first comparison (0 & 1)
    });
  };

  // Bubble Sort Q2:
  // "After one full pass, which element will be at the end?" (largest value)
  const prepareBubbleQ2 = () => {
    const maxVal = Math.max(...data);
    const indexOfMax = data.indexOf(maxVal);
    setQuestion({
      prompt: `Bubble Sort — Q2: After one full pass (one outer loop), which value will be at the last index? Click that box.`,
      type: "bubble-q2",
      answerValue: maxVal,
      answerIndex: indexOfMax,
    });
  };

  // Insertion Sort Q1:
  // "What is the next 'key' to insert?" -- we define key as data[1] on first step
  const prepareInsertionQ1 = () => {
    // pick k = 1 as typical insertion start
    const keyIndex = 1;
    setQuestion({
      prompt: `Insertion Sort — Q1: Which element is the 'key' on the first insertion step? (Usually the element at index 1). Click that box.`,
      type: "insertion-q1",
      answerIndex: keyIndex,
    });
  };

  // Insertion Sort Q2:
  // "Where will the key be inserted after shifting?" -> find position where key should go among [0..1]
  const prepareInsertionQ2 = () => {
    const keyIndex = 1;
    const keyVal = data[keyIndex];
    // determine insertion position among indices 0..keyIndex
    let insertPos = keyIndex;
    for (let i = keyIndex - 1; i >= 0; i--) {
      if (data[i] > keyVal) insertPos = i;
      else break;
    }
    setQuestion({
      prompt: `Insertion Sort — Q2: If we insert the key (value ${keyVal}) from index ${keyIndex}, which index will it end up at after shifting? Click the destination box (where the key will be placed).`,
      type: "insertion-q2",
      keyIndex,
      keyVal,
      answerIndex: insertPos,
    });
  };

  // Selection Sort Q1:
  // "Click the smallest element in unsorted portion (index 0..end)" for first pass
  const prepareSelectionQ1 = () => {
    // unsorted portion initially from 0..n-1
    const minVal = Math.min(...data);
    setQuestion({
      prompt: `Selection Sort — Q1: Which box has the smallest value in the unsorted portion (entire array)? Click that box.`,
      type: "selection-q1",
      answerValue: minVal,
    });
  };

  // Selection Sort Q2:
  // "Which index will be swapped with index 0?" -> index of min
  const prepareSelectionQ2 = () => {
    const minVal = Math.min(...data);
    const minIndex = data.indexOf(minVal);
    setQuestion({
      prompt: `Selection Sort — Q2: During pass 1, which index will be swapped with index 0? (Click the box that will be swapped with index 0.)`,
      type: "selection-q2",
      answerIndex: minIndex,
    });
  };

  // ------------------ Click handling ------------------
  const handleBoxClick = (i) => {
    if (mode === "intro") {
      // move to first question
      setModeIndex(1);
      return;
    }
    if (!question) return;
    setSelectedIndex(i);

    const markScore = (correct) => {
      if (correct) setScore((s) => s + 1);
    };

    // helper to show feedback then advance
    const showFeedback = (correct, label, callback) => {
      setFeedback({ text: correct ? `Correct — ${label}` : `Incorrect — ${label}`, correct });
      setTimeout(() => {
        setFeedback(null);
        callback && callback();
      }, 900);
    };

    // Mode specific evaluation & small animations
    if (question.type === "bubble-q1") {
      const correct = i === question.answerIndex;
      markScore(correct);
      // highlight pair: i and i+1
      const pairFlags = { [i]: "highlight", [i + 1]: "highlight" };
      setAnimState(pairFlags);
      showFeedback(correct, `Compared: [${data[i]}, ${data[i + 1]}]`, () => {
        setAnimState({});
        nextMode();
      });
    } else if (question.type === "bubble-q2") {
      const correct = data[i] === question.answerValue;
      markScore(correct);
      // simulate bubble pass: move max to end visually
      const maxIndex = data.indexOf(question.answerValue);
      const tmpArr = [...data];
      // visually animate shift of the largest to end
      const moveFlags = { [maxIndex]: "move-right" };
      setAnimState(moveFlags);
      showFeedback(correct, `Clicked ${data[i]}`, () => {
        // perform the visual "placement" (we won't change array order permanently to preserve other questions)
        setTimeout(() => {
          setAnimState({});
          nextMode();
        }, 600);
      });
    } else if (question.type === "insertion-q1") {
      const correct = i === question.answerIndex;
      markScore(correct);
      const selFlag = { [i]: "selected" };
      setAnimState(selFlag);
      showFeedback(correct, `Key: ${data[i]}`, () => {
        setAnimState({});
        nextMode();
      });
    } else if (question.type === "insertion-q2") {
      const correct = i === question.answerIndex;
      markScore(correct);
      // show shift: highlight indices between answerIndex..keyIndex-1 as "shift"
      const flags = {};
      const from = question.answerIndex;
      const to = question.keyIndex;
      for (let idx = from; idx < to; idx++) flags[idx] = "shift";
      setAnimState(flags);
      showFeedback(correct, `Clicked ${data[i]}`, () => {
        // actually perform insertion to update array (so subsequent selection questions see updated array)
        const newArr = [...data];
        const keyVal = newArr.splice(question.keyIndex, 1)[0];
        newArr.splice(question.answerIndex, 0, keyVal);
        setTimeout(() => {
          setAnimState({});
          setData(newArr);
          nextMode();
        }, 600);
      });
    } else if (question.type === "selection-q1") {
      const correct = data[i] === question.answerValue;
      markScore(correct);
      const highlightFlag = { [i]: "highlight" };
      setAnimState(highlightFlag);
      showFeedback(correct, `Clicked ${data[i]}`, () => {
        setAnimState({});
        nextMode();
      });
    } else if (question.type === "selection-q2") {
      const correct = i === question.answerIndex;
      markScore(correct);
      // show swap between i and 0 as animation then mutate array
      const swapFlags = { [i]: "swap", [0]: "swap" };
      setAnimState(swapFlags);
      showFeedback(correct, `Swap ${data[0]} <-> ${data[i]}`, () => {
        const newArr = [...data];
        [newArr[0], newArr[i]] = [newArr[i], newArr[0]];
        setTimeout(() => {
          setAnimState({});
          setData(newArr);
          nextMode();
        }, 700);
      });
    }
  };

  // ------------------ Render ------------------
  return (
    <div className="w-full h-[340px]">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 10, 5]} intensity={0.9} />

        {/* Header */}
        <FadeText
          text={
            mode === "intro"
              ? "Sorting — Assessment"
              : mode === "done"
              ? "Assessment Complete!"
              : `Assessment ${modeIndex}: ${mode.replace("-", " ").toUpperCase()}`
          }
          position={[0, 3.2, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        {/* Instruction / Question */}
        <FadeText
          text={
            mode === "intro"
              ? "Click the box below to start the sorting assessment"
              : mode === "done"
              ? ""
              : question
              ? question.prompt
              : ""
          }
          position={[0, 2.4, 0]}
          fontSize={0.34}
          color="white"
        />

        {/* Progress */}
        {mode !== "intro" && mode !== "done" && (
          <FadeText
            text={`Progress: ${Math.max(0, modeIndex)} / ${totalAssessments}`}
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
              text={`Final array: [${data.join(", ")}]`}
              position={[0, -1.2, 0]}
              fontSize={0.38}
              color="#34d399"
            />
          </>
        ) : (
          data.map((value, i) => {
            let extraPosX = 0;
            let extraOpacity = 1;
            let border = false;
            // animation states:
            if (animState[i] === "shift") extraPosX = 0.22;
            if (animState[i] === "move-right") extraPosX = 0.8;
            if (animState[i] === "fade") extraOpacity = 0.25;
            if (animState[i] === "selected") border = true;
            if (animState[i] === "highlight") border = true;
            if (animState[i] === "swap") border = true;

            const isSelected = selectedIndex === i;
            return (
              <group key={i} position={[positions[i][0] + extraPosX, 0, 0]}>
                <Box
                  index={i}
                  value={value}
                  selected={isSelected || border}
                  onClick={() => handleBoxClick(i)}
                  opacity={extraOpacity}
                />
              </group>
            );
          })
        )}

        {/* Feedback */}
        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 1.2, 0]}
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
const Box = ({ index, value, selected, onClick, opacity = 1 }) => {
  const size = [1.6, 1.2, 1];
  const baseColor = index % 2 === 0 ? "#60a5fa" : "#34d399";
  const color = selected ? "#f87171" : baseColor;
  return (
    <group>
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

export default SortingAssessment;
