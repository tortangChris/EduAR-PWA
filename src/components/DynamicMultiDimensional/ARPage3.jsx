import React, { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const ARPage3 = ({ rows = 3, cols = 4, spacing = 2.0, stepDuration = 700 }) => {
  const initialMatrix = useRef(
    Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => r * cols + c + 1)
    )
  );
  const [boxes, setBoxes] = useState(
    createGridBoxes(initialMatrix.current, spacing)
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function createGridBoxes(matrix, spacingVal) {
    const nRows = matrix.length;
    const nCols = matrix[0].length;
    const midY = (nRows - 1) / 2;
    const midX = (nCols - 1) / 2;

    return matrix.flatMap((row, r) =>
      row.map((value, c) => ({
        id: `b${r}-${c}`,
        value,
        row: r,
        col: c,
        position: [(c - midX) * spacingVal, (midY - r) * spacingVal, 0],
        highlight: false,
      }))
    );
  }

  const resetMatrix = () => {
    animRef.current.cancelled = true;
    setBoxes(createGridBoxes(initialMatrix.current, spacing));
    setProgress(0);
    setStatus("Matrix Reset");
    setIsPlaying(false);
  };

  const highlightElement = async (rowIndex, colIndex) => {
    if (isPlaying) return;
    animRef.current.cancelled = false;
    setIsPlaying(true);
    setProgress(0);
    setStatus(`Highlighting element at [${rowIndex}][${colIndex}]`);

    const totalSteps = 20;
    for (let step = 0; step <= totalSteps; step++) {
      if (animRef.current.cancelled) break;
      setBoxes((prev) =>
        prev.map((b) => ({
          ...b,
          highlight:
            b.row === rowIndex && b.col === colIndex
              ? step < totalSteps / 2
              : false,
        }))
      );
      setProgress(Math.round((step / totalSteps) * 100));
      await new Promise((res) => setTimeout(res, stepDuration / totalSteps));
    }

    setStatus("Done Highlight");
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["hit-test", "local-floor"],
              })
              .then((session) => {
                gl.xr.setSession(session);
              })
              .catch((err) => console.error("❌ AR Session failed:", err));
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <Reticle>
          {/* Status & Progress */}
          <Text
            position={[0, rows * spacing * 0.7, 0]}
            fontSize={0.35}
            anchorX="center"
            anchorY="middle"
            color="yellow"
          >
            {status}
          </Text>
          <Text
            position={[0, rows * spacing * 0.5, 0]}
            fontSize={0.25}
            anchorX="center"
            anchorY="middle"
            color="lime"
          >
            Progress: {progress}%
          </Text>

          {/* Boxes */}
          {boxes.map((b) => (
            <Box
              key={b.id}
              value={b.value}
              position={b.position}
              highlight={b.highlight}
            />
          ))}

          {/* Row labels */}
          {Array.from({ length: rows }).map((_, r) => (
            <Text
              key={`row-label-${r}`}
              position={[
                -spacing * 2.5,
                ((rows - 1) / 2) * spacing - r * spacing,
                0,
              ]}
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
              color="#000000"
            >
              Row {r}
            </Text>
          ))}

          {/* Column labels */}
          {Array.from({ length: cols }).map((_, c) => (
            <Text
              key={`col-label-${c}`}
              position={[(c - (cols - 1) / 2) * spacing, spacing * 2.0, 0]}
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
              color="#000000"
            >
              Col {c}
            </Text>
          ))}
        </Reticle>
      </Canvas>

      {/* AR Controls outside Canvas */}
      <div className="absolute bottom-4 w-full flex justify-center gap-4">
        <button
          onClick={() => highlightElement(1, 2)}
          disabled={isPlaying}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
        >
          ▶
        </button>
        <button
          onClick={resetMatrix}
          className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
        >
          ⟳
        </button>
      </div>
    </div>
  );
};

function Reticle({ children }) {
  const { gl } = useThree();
  const reticleRef = useRef();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [hitTestSourceRequested, setHitTestSourceRequested] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [targetPos, setTargetPos] = useState(null);
  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    const session = gl.xr.getSession();
    if (!session) return;
    const frame = gl.xr.getFrame();
    if (!frame) return;

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then((refSpace) => {
        session.requestHitTestSource({ space: refSpace }).then((source) => {
          setHitTestSource(source);
        });
      });
      setHitTestSourceRequested(true);
    }

    if (hitTestSource && !placed) {
      const referenceSpace = gl.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(hitTestSource);

      if (hits.length > 0) {
        const hit = hits[0];
        const pose = hit.getPose(referenceSpace);

        reticleRef.current.visible = true;
        reticleRef.current.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
        reticleRef.current.updateMatrixWorld(true);

        setProgress((prev) => {
          const next = Math.min(prev + delta / 2, 1); // 2s hold
          if (next >= 1 && !placed) {
            setPlaced(true);
            setTargetPos(pose.transform.position);
          }
          return next;
        });
      } else {
        reticleRef.current.visible = false;
        setProgress(0);
      }
    }
  });

  return (
    <group>
      {/* Reticle ring */}
      <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Progress indicator */}
      {reticleRef.current && !placed && (
        <mesh position={reticleRef.current.position} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.05, 0.09, 32, 1, 0, Math.PI * 2 * progress]} />
          <meshBasicMaterial color="lime" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Place children */}
      {placed && targetPos && (
        <group
          position={[targetPos.x, targetPos.y, targetPos.z]}
          scale={[0.1, 0.1, 0.1]}
        >
          {children}
        </group>
      )}
    </group>
  );
}

const Box = ({ value, position, highlight }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={highlight ? "#f59e0b" : "#60a5fa"} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
      >
        {value}
      </Text>
    </group>
  );
};

export default ARPage3;
