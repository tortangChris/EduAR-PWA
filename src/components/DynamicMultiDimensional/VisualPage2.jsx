import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, RotateCcw } from "lucide-react";

const VisualPage2 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  stepDuration = 700,
  extraSpace = 2,
}) => {
  const initialData = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxes(
      initialData.current,
      initialData.current.length + extraSpace,
      spacing
    )
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function createBoxes(arr, capacityVal, spacingVal) {
    const n = capacityVal;
    const mid = (n - 1) / 2;
    return Array.from({ length: n }).map((_, i) => ({
      id: `b${i}`,
      value: i < arr.length ? arr[i] : null,
      x: (i - mid) * spacingVal,
      opacity: i < arr.length ? 1 : 0.2,
    }));
  }

  const resetToStart = () => {
    animRef.current.cancelled = true;
    setBoxes(
      createBoxes(
        initialData.current,
        initialData.current.length + extraSpace,
        spacing
      )
    );
    setProgress(0);
    setStatus("");
    setIsPlaying(false);
  };

  const animateAppendWithExtra = async () => {
    if (isPlaying) return;
    animRef.current.cancelled = false;

    let currentArr = initialData.current.slice();
    setBoxes(createBoxes(currentArr, currentArr.length + extraSpace, spacing));
    setProgress(0);
    setStatus("Appending values...");
    setIsPlaying(true);

    const valuesToAdd = [50, 60];

    for (let v = 0; v < valuesToAdd.length; v++) {
      if (animRef.current.cancelled) break;
      currentArr.push(valuesToAdd[v]);
      setBoxes(
        createBoxes(currentArr, currentArr.length + extraSpace, spacing)
      );
      setProgress(Math.round(((v + 1) / valuesToAdd.length) * 100));
      setStatus(`Added ${valuesToAdd[v]} at index ${currentArr.length - 1}`);
      await new Promise((res) => setTimeout(res, stepDuration));
    }

    setIsPlaying(false);
  };

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={animateAppendWithExtra}
            disabled={isPlaying}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Play size={20} />
          </button>
          <button
            onClick={resetToStart}
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
      <div className="w-full h-[75%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          {boxes.map((b, i) => (
            <Box
              key={b.id}
              value={b.value}
              index={i}
              position={[b.x, 0, 0]}
              opacity={b.opacity}
            />
          ))}
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ value, index, position, opacity = 1 }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={opacity} />
      </mesh>
      {value !== null && (
        <>
          <Text
            position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
            fontSize={0.35}
            anchorX="center"
            anchorY="middle"
            color="#ffffff"
          >
            {value}
          </Text>
          <Text
            position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            color="#ffffff"
          >
            [{index}]
          </Text>
        </>
      )}
    </group>
  );
};

export default VisualPage2;
