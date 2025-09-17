// ARPage2_Access.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Smartphone } from "lucide-react"; // sample icon

const ARPage2_Access = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  accessValue = 30,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [fadeValues, setFadeValues] = useState({});
  const [operationText, setOperationText] = useState("");
  const [placed, setPlaced] = useState(false);

  // AR session state
  const [xrSupported, setXrSupported] = useState(false);
  const [xrSession, setXrSession] = useState(null);

  // check if AR is supported
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        setXrSupported(supported);
      });
    }
  }, []);

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // looped access operation (triggered after placement)
  useEffect(() => {
    if (!placed) return;

    let targetIndex = data.findIndex((v) => v === accessValue);
    if (targetIndex === -1) return;

    let loopTimeout;

    const runAccess = () => {
      setOperationText(`Access v=${accessValue}`);
      setActiveIndex(null);

      loopTimeout = setTimeout(() => {
        setActiveIndex(targetIndex);

        let start;
        const duration = 2000;
        const animate = (timestamp) => {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const progress = Math.min(elapsed / duration, 1);
          const fade = 1 - progress;

          setFadeValues({ [targetIndex]: fade });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            loopTimeout = setTimeout(() => {
              setFadeValues({});
              setActiveIndex(null);
              runAccess();
            }, 3000);
          }
        };

        requestAnimationFrame(animate);
      }, 3000);
    };

    runAccess();
    return () => clearTimeout(loopTimeout);
  }, [placed, data, accessValue]);

  // start AR session
  const startAR = () => {
    if (!navigator.xr) return;
    navigator.xr
      .requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local-floor"],
      })
      .then((session) => {
        setXrSession(session);
      })
      .catch((err) => console.error("❌ Failed to start AR session:", err));
  };

  // end AR session
  const endAR = () => {
    if (xrSession) {
      xrSession.end();
      setXrSession(null);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* AR Control Button */}
      <div className="p-2">
        <button
          onClick={xrSession ? endAR : startAR}
          disabled={!xrSupported}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-semibold 
            ${
              !xrSupported
                ? "bg-gray-400 cursor-not-allowed"
                : xrSession
                ? "bg-red-500"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          <Smartphone className="w-5 h-5" />
          {xrSession
            ? "EXIT AR"
            : xrSupported
            ? "START AR"
            : "AR NOT SUPPORTED"}
        </button>
      </div>

      {/* 3D Scene */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [0, 2, 6], fov: 50 }}
          gl={{ alpha: true }}
          shadows
          onCreated={({ gl }) => {
            gl.xr.enabled = true;
            if (xrSession) {
              gl.xr.setSession(xrSession);
            }
          }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

          <Reticle placed={placed} setPlaced={setPlaced}>
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

            {data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i]}
                fade={fadeValues[i] || 0}
              />
            ))}

            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
          </Reticle>
        </Canvas>
      </div>
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
      <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {reticleRef.current && !placed && (
        <mesh position={reticleRef.current.position} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.05, 0.09, 32, 1, 0, Math.PI * 2 * progress]} />
          <meshBasicMaterial color="lime" transparent opacity={0.8} />
        </mesh>
      )}

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

export default ARPage2_Access;
