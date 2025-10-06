import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const AssessmentAR = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState(""); // ✅ Non-blocking debug text

  useEffect(() => {
    const container = containerRef.current;

    // ✅ Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // ✅ Add AR Button
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Create object (your given geometry)
    const meshRef = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "black" })
    );
    meshRef.position.set(0, 0, -1);
    scene.add(meshRef);

    // ✅ Raycaster for detecting taps
    const raycaster = new THREE.Raycaster();
    const tapPosition = new THREE.Vector2();

    const onSelect = (event) => {
      setDebugText("Tapped object!"); // ✅ Show debug text
      setTimeout(() => setDebugText(""), 2000); // Auto hide after 2s

      // Optional: Change color for feedback
      meshRef.material.color.set("#22c55e");
      setTimeout(() => meshRef.material.color.set("#60a5fa"), 1500);
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // ✅ Render loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // ✅ Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      document.body.removeChild(document.querySelector(".ar-button"));
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {/* ✅ Non-blocking temporary debug text */}
      {debugText && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg animate-fade"
          style={{ transition: "opacity 0.5s" }}
        >
          {debugText}
        </div>
      )}
    </div>
  );
};

export default AssessmentAR;
