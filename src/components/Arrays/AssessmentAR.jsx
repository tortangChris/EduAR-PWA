import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

// ===================== ARScene Component =====================
const ARScene = ({ playCorrect }) => {
  const { gl, scene } = useThree();
  const reticleRef = useRef();
  const hitTestSource = useRef(null);
  const hitTestSourceRequested = useRef(false);
  const [debugMsg, setDebugMsg] = useState("Awaiting AR surface...");

  // Enable WebXR
  useEffect(() => {
    gl.xr.enabled = true;
    const sessionInit = { requiredFeatures: ["hit-test"] };

    navigator.xr.requestSession("immersive-ar", sessionInit).then((session) => {
      gl.xr.setSession(session);
      session.addEventListener("select", onSelect);

      session.requestReferenceSpace("viewer").then((refSpace) => {
        session.requestHitTestSource({ space: refSpace }).then((source) => {
          hitTestSource.current = source;
          hitTestSourceRequested.current = true;
        });
      });

      const onXRFrame = (time, frame) => {
        const referenceSpace = gl.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(hitTestSource.current);

        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);

          if (pose && reticleRef.current) {
            reticleRef.current.visible = true;
            reticleRef.current.position.set(
              pose.transform.position.x,
              pose.transform.position.y,
              pose.transform.position.z
            );
            reticleRef.current.updateMatrixWorld(true);
            setDebugMsg("Surface detected — tap to place!");
          }
        }

        session.requestAnimationFrame(onXRFrame);
      };

      session.requestAnimationFrame(onXRFrame);

      // When user taps
      function onSelect() {
        if (!reticleRef.current || !reticleRef.current.visible) {
          alert("No surface detected yet!");
          return;
        }

        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshStandardMaterial({ color: "#60a5fa" })
        );
        box.position.copy(reticleRef.current.position);
        scene.add(box);
        setDebugMsg("✅ Anchor placed!");
        playCorrect();
      }
    });
  }, [gl]);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[1, 3, 2]} intensity={2} />
      <mesh ref={reticleRef} visible={false}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="lime" />
      </mesh>

      <Text position={[0, 1, -1]} fontSize={0.2} color="white">
        Tap surface to place object
      </Text>

      {/* ✅ Debug Overlay */}
      <Html position={[0, 0.3, -0.5]}>
        <div
          style={{
            background: "#000a",
            color: "white",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          {debugMsg}
        </div>
      </Html>
    </>
  );
};

// ===================== Main Component =====================
const AssessmentAR = () => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [playCorrect] = useSound(correctSfx);
  const [playWrong] = useSound(wrongSfx);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          setIsARSupported(true);
          const button = ARButton.createButton({
            requiredFeatures: ["hit-test"],
          });
          document.body.appendChild(button);
        } else {
          alert("❌ AR interactive feature is not available on this device.");
        }
      });
    } else {
      alert("❌ WebXR not supported by your browser.");
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {isARSupported ? (
        <Canvas camera={{ position: [0, 1.6, 3] }}>
          <ARScene playCorrect={playCorrect} />
        </Canvas>
      ) : (
        <div className="p-4 text-center">
          <p>Checking AR capability...</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentAR;
