import React, { useMemo, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, Square, RotateCcw } from "lucide-react";

const VisualPage4 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  insertValue = 90,
  insertIndex = 2,
  stepDuration = 700,
}) => {
  const originalRef = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxesFromArray(originalRef.current, spacing)
  );
  const boxesRef = useRef(boxes);
  const animRef = useRef({ rafId: null, cancelled: false });
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // keep boxesRef in sync whenever we setBoxes
  const setBoxesAndRef = (updater) => {
    setBoxes((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      boxesRef.current = next;
      return next;
    });
  };

  // compute x position for a slot index given count
  const posForIndex = (index, count) => (index - (count - 1) / 2) * spacing;

  // compute index label from x
  const computeIndexFromX = (x, count) =>
    Math.round(x / spacing + (count - 1) / 2);

  // reset to original array (no new item appended)
  const resetToOriginal = () => {
    cancelAnimation();
    setBoxesAndRef(createBoxesFromArray(originalRef.current, spacing));
    setStatus("Idle");
    setProgress(0);
    setIsPlaying(false);
    animRef.current.cancelled = false;
  };

  const cancelAnimation = () => {
    animRef.current.cancelled = true;
    if (animRef.current.rafId) cancelAnimationFrame(animRef.current.rafId);
    animRef.current.rafId = null;
  };

  // helper: create boxes from plain array (no new appended)
  function createBoxesFromArray(arr, spacingVal) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((v, i) => ({
      id: `b${i}`,
      value: v,
      slot: i,
      x: (i - mid) * spacingVal,
      startX: (i - mid) * spacingVal,
      targetX: (i - mid) * spacingVal,
      isNew: false,
    }));
  }

  // helper: create appended boxes (with new at the end)
  function createAppendedBoxes(arr, newVal, spacingVal) {
    const n = arr.length;
    const count = n + 1;
    const mid = (count - 1) / 2;
    const res = [];
    for (let i = 0; i < count; i++) {
      if (i < n) {
        res.push({
          id: `b${i}`,
          value: arr[i],
          slot: i,
          x: (i - mid) * spacingVal,
          startX: (i - mid) * spacingVal,
          targetX: (i - mid) * spacingVal,
          isNew: false,
        });
      } else {
        // new item placed at the end (visible as appended)
        res.push({
          id: `new`,
          value: newVal,
          slot: i,
          x: (i - mid) * spacingVal,
          startX: (i - mid) * spacingVal,
          targetX: (i - mid) * spacingVal,
          isNew: true,
        });
      }
    }
    return res;
  }

  // animate swap between slot i and i+1 (new should be at i+1 initially)
  function animateSwapSlots(i, count, spacingVal) {
    return new Promise((resolve) => {
      animRef.current.cancelled = false;

      // capture the two box ids for this step from the current state
      const a = boxesRef.current.find((b) => b.slot === i && !b.isNew);
      const b = boxesRef.current.find((b) => b.slot === i + 1);
      if (!a || !b) {
        resolve();
        return;
      }
      const idA = a.id;
      const idB = b.id;

      const targetA = posForIndex(i + 1, count);
      const targetB = posForIndex(i, count);

      function frame() {
        if (animRef.current.cancelled) return resolve();

        setBoxesAndRef((prev) => {
          const next = prev.map((bx) => {
            if (bx.id === idA) {
              const dx = targetA - bx.x;
              const x = Math.abs(dx) < 0.001 ? targetA : bx.x + dx * 0.2;
              return { ...bx, x };
            }
            if (bx.id === idB) {
              const dx = targetB - bx.x;
              const x = Math.abs(dx) < 0.001 ? targetB : bx.x + dx * 0.2;
              return { ...bx, x };
            }
            return bx;
          });

          return next;
        });

        // check if both have reached targets (approx)
        const nowA = boxesRef.current.find((bb) => bb.id === idA);
        const nowB = boxesRef.current.find((bb) => bb.id === idB);
        const doneA = nowA && Math.abs(nowA.x - targetA) < 0.01;
        const doneB = nowB && Math.abs(nowB.x - targetB) < 0.01;

        if (doneA && doneB) {
          // finalize swap by swapping slot numbers
          setBoxesAndRef((prev) =>
            prev.map((bx) => {
              if (bx.id === idA)
                return {
                  ...bx,
                  slot: i + 1,
                  x: targetA,
                  startX: targetA,
                  targetX: targetA,
                };
              if (bx.id === idB)
                return {
                  ...bx,
                  slot: i,
                  x: targetB,
                  startX: targetB,
                  targetX: targetB,
                };
              return bx;
            })
          );
          resolve();
          return;
        }

        animRef.current.rafId = requestAnimationFrame(frame);
      }

      animRef.current.rafId = requestAnimationFrame(frame);
    });
  }

  // main sequence when Play is pressed
  const handlePlay = async () => {
    if (isPlaying) return;

    // always reset to original before starting to avoid accumulation
    setBoxesAndRef(createBoxesFromArray(originalRef.current, spacing));
    setStatus(`Appending ${insertValue} to the end...`);
    setProgress(5);
    await new Promise((r) => setTimeout(r, 300));

    const n = originalRef.current.length;
    const count = n + 1;

    // create appended state (new at the end)
    setBoxesAndRef(
      createAppendedBoxes(originalRef.current, insertValue, spacing)
    );
    setStatus(`Appended ${insertValue} → starting swaps...`);
    setProgress(12);
    await new Promise((r) => setTimeout(r, 400));

    setIsPlaying(true);

    const totalSwaps = n - insertIndex;
    let completed = 0;

    // perform swaps from i = n-1 down to insertIndex
    for (let i = n - 1; i >= insertIndex; i--) {
      if (animRef.current.cancelled) break;
      setStatus(`Swapping into index ${i} → moving new left`);

      // animate swap of slots i and i+1
      await animateSwapSlots(i, count, spacing);

      completed++;
      setProgress(12 + Math.round((completed / totalSwaps) * 86));
      // small pause between swaps so sequence is legible
      await new Promise((r) => setTimeout(r, 120));
    }

    if (!animRef.current.cancelled) {
      // finalize: produce a clean layout for the final array
      const final = originalRef.current.slice();
      final.splice(insertIndex, 0, insertValue);
      setBoxesAndRef(createBoxesFromArray(final, spacing));
      setStatus("✅ Insertion complete!");
      setProgress(100);
    } else {
      setStatus("Stopped");
    }

    setIsPlaying(false);
    animRef.current.cancelled = false;
  };

  const handleStop = () => {
    cancelAnimation();
    setIsPlaying(false);
    setStatus("Stopped");
  };

  const handleReset = () => {
    resetToOriginal();
  };

  // compute current slot count (if new appended during animation, count = original+1)
  const currentCount =
    boxesRef.current && boxesRef.current.length
      ? Math.max(...boxesRef.current.map((b) => b.slot)) + 1
      : boxes.length;

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      {/* Video Player Style Controls */}
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handlePlay}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={isPlaying}
          >
            <Play size={20} />
          </button>
          <button
            onClick={handleStop}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            disabled={!isPlaying}
          >
            <Square size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="w-full h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-gray-700 font-mono text-sm text-center">
          {status}
        </div>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Render boxes */}
          {boxes.map((b) => (
            <Box
              key={b.id}
              x={b.x}
              value={b.value}
              displayIndex={computeIndexFromX(b.x, currentCount)}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ x = 0, value = null, displayIndex = 0 }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={[x, 0, 0]}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {value != null ? String(value) : ""}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${displayIndex}]`}
      </Text>
    </group>
  );
};

export default VisualPage4;
