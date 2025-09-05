import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, RotateCcw } from "lucide-react";

const VisualPage3 = ({ stepDuration = 700 }) => {
  const initialArray = useRef(generateRandomArray(7));
  const [boxes, setBoxes] = useState(createBoxes(initialArray.current));
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function generateRandomArray(n) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1);
  }

  function createBoxes(arr, compare = [], minIdx = -1, sortedIdx = -1) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((val, i) => {
      let color = "#3b82f6"; // blue default unsorted
      if (i === minIdx) color = "#f59e0b"; // orange for current minimum
      if (compare.includes(i)) color = "#f97316"; // comparing element
      if (i < sortedIdx) color = "#22c55e"; // green sorted portion
      return {
        id: `b${i}`,
        value: val,
        x: (i - mid) * 2.0,
        color,
      };
    });
  }

  const resetArray = () => {
    animRef.current.cancelled = true;
    initialArray.current = generateRandomArray(7);
    setBoxes(createBoxes(initialArray.current));
    setProgress(0);
    setStatus("Idle");
    setIsPlaying(false);
  };

  const sortArray = async () => {
    if (isPlaying) return;
    animRef.current.cancelled = false;
    setIsPlaying(true);
    let arr = initialArray.current.slice();
    setStatus("Sorting...");

    const steps = [];
    const n = arr.length;

    // Selection Sort step recording
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        steps.push({ arr: arr.slice(), compare: [j], minIdx, sorted: i });
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        steps.push({
          arr: arr.slice(),
          compare: [],
          minIdx: -1,
          sorted: i + 1,
        });
      } else {
        steps.push({
          arr: arr.slice(),
          compare: [],
          minIdx: -1,
          sorted: i + 1,
        });
      }
    }
    steps.push({ arr: arr.slice(), compare: [], minIdx: -1, sorted: n });

    // Play animation
    for (let step = 0; step < steps.length; step++) {
      if (animRef.current.cancelled) break;
      const { arr, compare, minIdx, sorted } = steps[step];
      setBoxes(createBoxes(arr, compare, minIdx, sorted));
      setProgress(Math.round(((step + 1) / steps.length) * 100));
      await new Promise((res) => setTimeout(res, stepDuration));
    }

    setStatus("Sorted!");
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={sortArray}
            disabled={isPlaying}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Play size={20} />
          </button>
          <button
            onClick={resetArray}
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
        <div className="mt-2 text-black font-mono text-sm text-center">
          {status}
        </div>
      </div>
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 40, 40], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {boxes.map((b) => (
            <Box
              key={b.id}
              value={b.value}
              position={[b.x, 0, 0]}
              height={b.value}
              color={b.color}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ value, position, height, color }) => {
  const size = [1.2, height / 12, 1.2];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, size[1] + 0.5, 0]}
        fontSize={0.4}
        anchorX="center"
        anchorY="middle"
        color="#000000"
      >
        {value}
      </Text>
    </group>
  );
};

export default VisualPage3;
