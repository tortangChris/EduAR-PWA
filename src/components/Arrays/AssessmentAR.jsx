import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const AssessmentAR = () => {
  const containerRef = useRef(null);

  // UI state
  const [debugText, setDebugText] = useState("");
  const [overlayText, setOverlayText] = useState(""); // for final score or question feedback
  const [showOverlay, setShowOverlay] = useState(false);

  // quiz state
  const questions = [
    {
      id: 1,
      title: "Identify the Array",
      // correctGroup = "A"
      correctGroup: "A",
      description:
        "Tap the linear, evenly spaced boxes that represent an array.",
    },
    // you can add more questions here following same structure
  ];
  const totalQuestions = questions.length;
  const currentQuestionIndexRef = useRef(0); // ref so event handlers can read/write reliably
  const scoreRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Basic three.js setup
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

    // Light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0.5, 1, 0.25);
    scene.add(hemi);

    // Ground (just visual reference)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Root group for all choices
    const choicesRoot = new THREE.Group();
    scene.add(choicesRoot);

    // Helper: create label (simple Sprite with text)
    function createLabel(text) {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, size, size);
      ctx.font = "bold 120px sans-serif";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, size / 2, size / 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.6, 0.6, 1);
      return sprite;
    }

    // Create 3 groups: A (array), B (scattered), C (stacked)
    const groups = {};

    // Group A: row of evenly spaced boxes (the correct answer)
    const groupA = new THREE.Group();
    groupA.name = "A";
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa })
      );
      box.position.set(i * 0.25, 0.1, 0); // evenly spaced along x
      box.userData.choice = "A";
      groupA.add(box);
    }
    const labelA = createLabel("A");
    labelA.position.set(0.5, 0.5, 0);
    groupA.add(labelA);
    groupA.position.set(-0.8, 1, -2);

    // Group B: scattered boxes
    const groupB = new THREE.Group();
    groupB.name = "B";
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xf97316 })
      );
      box.position.set(
        (Math.random() - 0.5) * 0.6,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.6
      );
      box.userData.choice = "B";
      groupB.add(box);
    }
    const labelB = createLabel("B");
    labelB.position.set(0, 0.5, 0);
    groupB.add(labelB);
    groupB.position.set(0, 1, -2);

    // Group C: stacked cubes
    const groupC = new THREE.Group();
    groupC.name = "C";
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6 })
      );
      box.position.set(0, i * 0.2, 0);
      box.userData.choice = "C";
      groupC.add(box);
    }
    const labelC = createLabel("C");
    labelC.position.set(0, 1.3, 0);
    groupC.add(labelC);
    groupC.position.set(0.8, 0.6, -2);

    groups["A"] = groupA;
    groups["B"] = groupB;
    groups["C"] = groupC;

    choicesRoot.add(groupA, groupB, groupC);

    // Raycaster setup
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    // Controller (XR select)
    const controller = renderer.xr.getController(0);
    scene.add(controller);

    // Function to handle a "hit" choice (groupId: "A"/"B"/"C")
    const handleChoice = (groupId, hitMeshes) => {
      const currentIndex = currentQuestionIndexRef.current;
      const question = questions[currentIndex];
      const correct = question.correctGroup === groupId;

      // Visual highlight: change color of hit meshes briefly
      const originalColors = [];
      hitMeshes.forEach((m) => {
        if (m.material && m.material.color) {
          originalColors.push({ mesh: m, color: m.material.color.getHex() });
          m.material.color.setHex(correct ? 0x22c55e : 0xef4444); // green/red
        }
      });

      if (correct) {
        scoreRef.current += 1;
        setOverlayText("✅ Correct! Arrays store elements contiguously.");
      } else {
        setOverlayText("❌ Not contiguous, that’s not an array.");
      }
      setShowOverlay(true);

      // after short delay, restore colors and proceed
      setTimeout(() => {
        originalColors.forEach(({ mesh, color }) => {
          if (mesh.material && mesh.material.color) {
            mesh.material.color.setHex(color);
          }
        });
        setShowOverlay(false);
        // proceed to next question or show final score
        currentQuestionIndexRef.current += 1;
        if (currentQuestionIndexRef.current >= totalQuestions) {
          // show final score overlay
          const final = `Final Score: ${scoreRef.current} / ${totalQuestions}`;
          setOverlayText(final);
          setShowOverlay(true);
        } else {
          // load next question (if you have different scenes per question you could re-generate)
          // For now we simply continue (only one question exists initially)
        }
      }, 1400);
    };

    // onSelect for XR controller
    const onSelectXR = () => {
      // cast ray from controller
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      const origin = new THREE.Vector3().setFromMatrixPosition(
        controller.matrixWorld
      );
      const direction = new THREE.Vector3(0, 0, -1)
        .applyMatrix4(tempMatrix)
        .normalize();
      raycaster.set(origin, direction);
      // intersect all children of choicesRoot
      const intersects = raycaster.intersectObjects(choicesRoot.children, true);
      if (intersects.length > 0) {
        // find the group id from the first intersected object's userData.choice
        const groupId = intersects[0].object.userData.choice;
        // gather all meshes belonging to that group (for highlight)
        const hitMeshes = intersects
          .filter((i) => i.object.userData.choice === groupId)
          .map((i) => i.object);
        handleChoice(groupId, hitMeshes);
      } else {
        setDebugText("Missed — tap a group");
        setTimeout(() => setDebugText(""), 800);
      }
    };

    controller.addEventListener("select", onSelectXR);

    // Pointer/tap handling for non-XR (touch / click)
    const onPointerDown = (event) => {
      // calculate pointer position in normalized device coords (-1 to +1) for both components
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);

      const intersects = raycaster.intersectObjects(choicesRoot.children, true);
      if (intersects.length > 0) {
        const groupId = intersects[0].object.userData.choice;
        const hitMeshes = intersects
          .filter((i) => i.object.userData.choice === groupId)
          .map((i) => i.object);
        handleChoice(groupId, hitMeshes);
      } else {
        setDebugText("Tap a group to answer");
        setTimeout(() => setDebugText(""), 800);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Resize handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Try to start AR session automatically (if available)
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => {
          renderer.xr.setSession(session);
        })
        .catch((err) => {
          // if AR not available or permission denied, just continue in non-XR mode
          console.warn("AR session failed or unavailable:", err);
        });
    }

    // Animation loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Clean up
    return () => {
      controller.removeEventListener("select", onSelectXR);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", handleResize);
      try {
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch (e) {
        // ignore
      }
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []); // empty deps: run once

  // simple overlay UI for debug/feedback
  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {/* Debug top message */}
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-sm z-40">
          {debugText}
        </div>
      )}

      {/* Overlay for immediate feedback or final score */}
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-black/70 text-white px-6 py-4 rounded-2xl text-center text-lg">
            {overlayText}
          </div>
        </div>
      )}

      {/* If final score is shown (no auto-proceed left), keep overlay visible with a continue hint */}
      {!showOverlay &&
        overlayText &&
        currentQuestionIndexRef.current >= questions.length && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg z-40">
            {overlayText}
          </div>
        )}
    </div>
  );
};

export default AssessmentAR;
