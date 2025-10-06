import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const AssessmentAR = () => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [debugMsg, setDebugMsg] = useState("Awaiting tap...");
  const [playCorrect] = useSound(correctSfx);
  const [playWrong] = useSound(wrongSfx);
  const [objects, setObjects] = useState([]);

  const hitTestSource = useRef(null);
  const hitTestSourceRequested = useRef(false);
  const reticleRef = useRef();
  const { gl, scene, camera } = useThree(() => ({}));

  // ✅ Check for AR support and create ARButton
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          setIsARSupported(true);
          const button = ARButton.createButton(gl?.domElement, {
            requiredFeatures: ["hit-test"],
          });
          document.body.appendChild(button);
        } else {
          alert("AR interactive feature is not available on this device.");
        }
      });
    } else {
      alert("WebXR not supported by your browser.");
    }
  }, [gl]);

  // ✅ Start AR session setup
  useEffect(() => {
    if (!gl) return;

    gl.xr.enabled = true;
    const sessionInit = { requiredFeatures: ["hit-test"] };

    navigator.xr
      ?.requestSession("immersive-ar", sessionInit)
      .then((session) => {
        gl.xr.setSession(session);
        setDebugMsg("AR session started!");
        session.addEventListener("select", onSelect);

        const refSpaceType = "viewer";
        session.requestReferenceSpace(refSpaceType).then((refSpace) => {
          session.requestAnimationFrame(onXRFrame);
          setupHitTest(session, refSpace);
        });
      });

    const setupHitTest = async (session, refSpace) => {
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSourceTemp = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSource.current = hitTestSourceTemp;
      hitTestSourceRequested.current = true;
    };

    const onXRFrame = (time, frame) => {
      const session = frame.session;
      const referenceSpace = gl.xr.getReferenceSpace();
      const pose = frame.getViewerPose(referenceSpace);

      if (hitTestSource.current && pose) {
        const hitTestResults = frame.getHitTestResults(hitTestSource.current);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const referenceSpace = gl.xr.getReferenceSpace();
          const hitPose = hit.getPose(referenceSpace);
          if (reticleRef.current) {
            reticleRef.current.visible = true;
            reticleRef.current.position.set(
              hitPose.transform.position.x,
              hitPose.transform.position.y,
              hitPose.transform.position.z
            );
            reticleRef.current.updateMatrixWorld(true);
          }
        }
      }

      session.requestAnimationFrame(onXRFrame);
    };

    // ✅ Tap event (select event handled below)
    const onSelect = (event) => {
      if (!reticleRef.current || !reticleRef.current.visible) {
        alert("No surface detected yet.");
        return;
      }

      // Place box at reticle position
      const newBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshStandardMaterial({ color: "#60a5fa" })
      );

      newBox.position.copy(reticleRef.current.position);
      gl.scene.add(newBox);
      setObjects((prev) => [...prev, newBox]);

      alert("📍 Object anchored!");
      playCorrect();
      setDebugMsg("Anchor placed!");
    };
  }, [gl]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {isARSupported ? (
        <Canvas
          camera={{ position: [0, 1.6, 3] }}
          onCreated={({ gl }) => (gl.xr.enabled = true)}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[1, 3, 2]} intensity={2} />
          <mesh ref={reticleRef} visible={false}>
            <ringGeometry args={[0.05, 0.06, 32]} />
            <meshBasicMaterial color="lime" />
          </mesh>

          <Text position={[0, 1, -1]} fontSize={0.2} color="white">
            Tap surface to anchor box
          </Text>
        </Canvas>
      ) : (
        <div className="p-4 text-center">
          <p>Checking AR capability...</p>
        </div>
      )}

      {/* ✅ Debug UI */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "#0008",
          color: "white",
          padding: "6px 10px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        {debugMsg}
      </div>
    </div>
  );
};

export default AssessmentAR;
