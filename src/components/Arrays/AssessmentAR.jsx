import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const AssessmentAR = () => {
  const [supported, setSupported] = useState(true);
  const [reticleVisible, setReticleVisible] = useState(false);
  const reticleRef = useRef();
  const [playCorrect] = useSound(correctSfx);
  const [playWrong] = useSound(wrongSfx);

  useEffect(() => {
    // ✅ Check if AR is available
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (!supported) {
          alert("AR Interactive feature not available on this device.");
          setSupported(false);
        }
      });
    } else {
      alert("WebXR not supported on this device.");
      setSupported(false);
    }
  }, []);

  if (!supported) return null;

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 70 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          document.body.appendChild(
            ARButton.createButton(gl, { requiredFeatures: ["hit-test"] })
          );
        }}
      >
        <ARScene
          reticleRef={reticleRef}
          setReticleVisible={setReticleVisible}
          reticleVisible={reticleVisible}
          playCorrect={playCorrect}
          playWrong={playWrong}
        />
      </Canvas>
    </div>
  );
};

function ARScene({
  reticleRef,
  setReticleVisible,
  reticleVisible,
  playCorrect,
  playWrong,
}) {
  const { gl, scene } = useThree();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [hitTestSourceRequested, setHitTestSourceRequested] = useState(false);
  const [reticleMatrix, setReticleMatrix] = useState(new THREE.Matrix4());

  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    let viewerSpace = null;
    let refSpace = null;

    session.requestReferenceSpace("viewer").then((space) => {
      viewerSpace = space;
      session.requestReferenceSpace("local").then((localRefSpace) => {
        refSpace = localRefSpace;
        session.requestHitTestSource({ space: viewerSpace }).then((source) => {
          setHitTestSource(source);
        });
      });
    });

    setHitTestSourceRequested(true);

    const onSelect = () => {
      if (reticleVisible) {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        reticleMatrix.decompose(position, quaternion, scale);

        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x60a5fa })
        );
        box.position.copy(position);
        scene.add(box);

        playCorrect();
        alert("✅ Object placed successfully in AR space!");
      } else {
        playWrong();
        alert(
          "❌ No surface detected. Try pointing your camera at a flat surface."
        );
      }
    };

    session.addEventListener("select", onSelect);

    return () => {
      session.removeEventListener("select", onSelect);
      if (hitTestSource) hitTestSource.cancel();
    };
  }, [gl, reticleVisible]);

  useFrame((state, delta, frame) => {
    const referenceSpace = gl.xr.getReferenceSpace();
    if (!hitTestSource || !frame) return;

    const hitTestResults = frame.getHitTestResults(hitTestSource);
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);
      reticleRef.current.visible = true;
      setReticleVisible(true);
      reticleMatrix.fromArray(pose.transform.matrix);
      reticleRef.current.matrix.fromArray(pose.transform.matrix);
    } else {
      reticleRef.current.visible = false;
      setReticleVisible(false);
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 10, 5]} />
      <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="lime" />
      </mesh>

      <Text position={[0, 1.5, -1]} fontSize={0.1} color="white">
        Tap to place an object
      </Text>
    </>
  );
}

export default AssessmentAR;
