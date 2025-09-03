// ARPage3_Search_Hardcoded.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const ARPage3 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  target = 40,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [fadeValues, setFadeValues] = useState({});
  const [operationText, setOperationText] = useState("");
  const [placed, setPlaced] = useState(false);

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    if (!placed) return;

    let timeoutIds = [];

    const runSearch = () => {
      setOperationText("🔍 Starting search...");
      setActiveIndex(null);
      setFadeValues({});

      data.forEach((val, i) => {
        // Step delay (each step after 3s * index)
        const stepDelay = i * 3000;

        // highlight this box
        timeoutIds.push(
          setTimeout(() => {
            setActiveIndex(i);
            setFadeValues({ [i]: 1 });
            setOperationText(`Checking index ${i}... v=${val}`);
          }, stepDelay)
        );

        // fade out after 1.5s
        timeoutIds.push(
          setTimeout(() => {
            setFadeValues({ [i]: 0 });
          }, stepDelay + 1500)
        );

        // if found target
        if (val === target) {
          timeoutIds.push(
            setTimeout(() => {
              setOperationText(`✅ Found ${target} at index ${i}`);
              setActiveIndex(null);
              setFadeValues({});
            }, stepDelay + 2000)
          );

          // restart loop after 3s
          timeoutIds.push(
            setTimeout(() => {
              runSearch();
            }, stepDelay + 5000)
          );

          return; // stop further steps
        }

        // if last index and not found
        if (i === data.length - 1 && val !== target) {
          timeoutIds.push(
            setTimeout(() => {
              setOperationText(`❌ ${target} not found`);
              setActiveIndex(null);
              setFadeValues({});
            }, stepDelay + 2000)
          );

          timeoutIds.push(
            setTimeout(() => {
              runSearch();
            }, stepDelay + 5000)
          );
        }
      });
    };

    runSearch();

    return () => timeoutIds.forEach((id) => clearTimeout(id));
  }, [placed, data, target]);

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
              .catch((err) => console.error("❌ AR session failed:", err));
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        <Reticle placed={placed} setPlaced={setPlaced}>
          {/* Operation text */}
          {operationText && (
            <Text
              position={[0, 3, 0]}
              fontSize={0.5}
              anchorX="center"
              anchorY="middle"
              color="white"
            >
              {operationText}
            </Text>
          )}

          {/* Boxes */}
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              fade={fadeValues[i] || 0}
            />
          ))}

          {/* Ground plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </Reticle>
      </Canvas>
    </div>
  );
};

function Reticle({ children, placed, setPlaced }) {
  const { gl } = useThree();
  const reticleRef = useRef();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [hitTestSourceRequested, setHitTestSourceRequested] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetPos, setTargetPos] = useState(null);

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
          const next = Math.min(prev + delta / 2, 1);
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

      {/* Progress ring */}
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

const Box = ({ index, value, position = [0, 0, 0], fade }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive="#facc15"
          emissiveIntensity={fade}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

export default ARPage3;
