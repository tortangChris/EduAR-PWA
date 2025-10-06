import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const AssessmentAR = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState("");

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

    // ✅ Start AR session
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => renderer.xr.setSession(session))
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Main AR group
    const group = new THREE.Group();
    group.position.set(0, 1, -2);
    group.scale.set(0.1, 0.1, 0.1);
    scene.add(group);

    // ✅ Object (cube)
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6),
      new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "black" })
    );
    cube.position.set(0, 3, 0);
    group.add(cube);

    // ✅ Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // ✅ Raycaster + vector for intersection
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    // ✅ onSelect now checks if cube is hit
    const onSelect = () => {
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObject(cube);
      if (intersects.length > 0) {
        // ✅ Only highlight if cube was hit
        setDebugText("✅ Cube tapped!");
        cube.material.color.set("#22c55e");
        setTimeout(() => {
          cube.material.color.set("#60a5fa");
          setDebugText("");
        }, 1000);
      } else {
        // Optional: debug if miss
        setDebugText("❌ Missed the cube");
        setTimeout(() => setDebugText(""), 1000);
      }
    };

    // ✅ Controller setup
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // ✅ Animation loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // ✅ Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg">
          {debugText}
        </div>
      )}
    </div>
  );
};

export default AssessmentAR;
