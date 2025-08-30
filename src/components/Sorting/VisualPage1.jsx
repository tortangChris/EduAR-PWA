import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, RotateCcw } from "lucide-react";

const VisualPage1 = ({
  data = [40, 10, 30, 20, 50],
  spacing = 2.0,
  stepDuration = 700,
}) => {
  const initialArray = useRef(data.slice());
  const [boxes, setBoxes] = useState(
    createBoxes(initialArray.current, spacing)
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function createBoxes(arr, spacingVal) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((val, i) => ({
      id: `b${i}`,
      value: val,
      x: (i - mid) * spacingVal,
      height: val / 10, // scale value into height for bar graph effect
      highlight: false,
    }));
  }

  const resetArray = () => {
    animRef.current.cancelled = true;
    setBoxes(createBoxes(initialArray.current, spacing));
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
    let tempArr = arr.slice();

    // Bubble Sort steps
    for (let i = 0; i < tempArr.length - 1; i++) {
      for (let j = 0; j < tempArr.length - i - 1; j++) {
        if (tempArr[j] > tempArr[j + 1]) {
          [tempArr[j], tempArr[j + 1]] = [tempArr[j + 1], tempArr[j]];
          steps.push(tempArr.slice());
        }
      }
    }

    for (let step = 0; step < steps.length; step++) {
      if (animRef.current.cancelled) break;
      setBoxes(createBoxes(steps[step], spacing));
      setProgress(Math.round(((step + 1) / steps.length) * 100));
      await new Promise((res) => setTimeout(res, stepDuration));
    }

    setStatus("Sorted!");
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-[300px] bg-gray-50 flex flex-col items-center justify-center">
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
        <div className="mt-2 text-gray-700 font-mono text-sm text-center">
          {status}
        </div>
      </div>
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {boxes.map((b) => (
            <Bar
              key={b.id}
              value={b.value}
              height={b.height}
              position={[b.x, 0, 0]}
              highlight={b.highlight}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Bar = ({ value, height, position, highlight }) => {
  const width = 1;
  const depth = 1;
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={highlight ? "#f59e0b" : "#60a5fa"} />
      </mesh>
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="#000000"
      >
        {value}
      </Text>
    </group>
  );
};

export default VisualPage1;
