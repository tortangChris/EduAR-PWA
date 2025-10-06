import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Helper: simple 3D text sprite (fallback, lightweight)
function makeTextSprite(message, params = {}) {
  const fontface = params.fontface || "Arial";
  const fontsize = params.fontsize || 64;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontsize}px ${fontface}`;
  const metrics = context.measureText(message);
  const textWidth = metrics.width;
  canvas.width = textWidth;
  canvas.height = fontsize * 1.2;
  context.font = `${fontsize}px ${fontface}`;
  context.fillStyle = params.fillStyle || "white";
  context.fillText(message, 0, fontsize);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set((canvas.width / canvas.height) * 0.3, 0.3, 1);
  return sprite;
}

const AssessmentAR = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState("");
  const scoreRef = useRef(0);
  const stateRef = useRef({ step: 0 }); // step: 0..4 (4 = summary)
  const interactiveObjectsRef = useRef([]); // objects hittable for current question

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    camera.position.set(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // light
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(hemi);

    // ground (invisible receiver)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Common group for items
    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 0, -2);
    scene.add(mainGroup);

    // Raycaster helpers
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    // Helper: clear interactive objects and remove from scene
    function clearInteractive() {
      (interactiveObjectsRef.current || []).forEach((o) => {
        if (o.parent) o.parent.remove(o);
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      interactiveObjectsRef.current = [];
    }

    // Helper: show floating feedback sprite in front of user
    function showFloatingFeedback(text, color = "white", duration = 1000) {
      const sprite = makeTextSprite(text, { fontsize: 60, fillStyle: color });
      sprite.position.set(0, 1.8, -1.6);
      sprite.renderOrder = 999;
      scene.add(sprite);
      setTimeout(() => {
        scene.remove(sprite);
        if (sprite.material.map) sprite.material.map.dispose();
        if (sprite.material) sprite.material.dispose();
      }, duration);
    }

    // Auto-proceed helper
    function proceedToNext(delay = 900) {
      setTimeout(() => {
        stateRef.current.step = stateRef.current.step + 1;
        loadStep(stateRef.current.step);
      }, delay);
    }

    // ********************
    // --- Assessment Scenes
    // ********************

    // 1) Identify the Array
    function loadAssessment1() {
      clearInteractive();
      const baseY = 1.2;

      // Linear row (correct)
      const rowGroup = new THREE.Group();
      rowGroup.name = "linearRow";
      for (let i = 0; i < 5; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x60a5fa })
        );
        box.position.set((i - 2) * 0.18, baseY, 0);
        rowGroup.add(box);
        interactiveObjectsRef.current.push(box);
      }
      rowGroup.position.set(-0.6, 0, 0);
      mainGroup.add(rowGroup);

      // Scattered
      const scattered = new THREE.Group();
      scattered.name = "scattered";
      for (let i = 0; i < 5; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshStandardMaterial({ color: 0xd1d5db })
        );
        box.position.set(
          Math.random() * 0.5 + 0.8,
          baseY + (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );
        scattered.add(box);
        // Not interactive (or optionally interactive but wrong)
      }
      mainGroup.add(scattered);

      // Stacked pile
      const pile = new THREE.Group();
      pile.name = "stack";
      for (let i = 0; i < 4; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.14, 0.14),
          new THREE.MeshStandardMaterial({ color: 0xfda4af })
        );
        box.position.set(0.6, baseY + i * 0.07, 0);
        pile.add(box);
      }
      mainGroup.add(pile);

      // Instruction text
      const instr = makeTextSprite(
        "Tap the linear row that represents an array",
        { fontsize: 36 }
      );
      instr.position.set(0, 1.6, 0);
      scene.add(instr);
      setTimeout(() => scene.remove(instr), 4000);
    }

    // 2) Access Time Challenge
    function loadAssessment2() {
      clearInteractive();
      const baseY = 1.2;
      const rowGroup = new THREE.Group();
      rowGroup.position.set(0, 0, 0);
      const labels = [];
      for (let i = 0; i < 5; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.16),
          new THREE.MeshStandardMaterial({ color: 0x60a5fa })
        );
        box.position.set((i - 2) * 0.2, baseY, 0);
        box.userData = { index: i };
        rowGroup.add(box);
        interactiveObjectsRef.current.push(box);

        const label = makeTextSprite("[" + i + "]", { fontsize: 36 });
        label.position.set((i - 2) * 0.2, baseY - 0.16, 0);
        scene.add(label);
        labels.push(label);
      }
      mainGroup.add(rowGroup);

      const instr = makeTextSprite("Access the element at index 3 (tap it)", {
        fontsize: 36,
      });
      instr.position.set(0, 1.6, 0);
      scene.add(instr);
      setTimeout(() => scene.remove(instr), 3500);
    }

    // 3) Search Simulation (linear search)
    function loadAssessment3() {
      clearInteractive();
      const baseY = 1.2;
      const values = [10, 20, 30, 40, 50, 60];
      const group = new THREE.Group();
      group.position.set(0, 0, 0);
      let checks = 0;
      for (let i = 0; i < values.length; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.14, 0.14),
          new THREE.MeshStandardMaterial({ color: 0x60a5fa })
        );
        box.position.set((i - 2.5) * 0.18, baseY, 0);
        box.userData = { value: values[i], order: i };
        group.add(box);
        interactiveObjectsRef.current.push(box);

        const label = makeTextSprite(String(values[i]), { fontsize: 36 });
        label.position.set((i - 2.5) * 0.18, baseY - 0.16, 0);
        scene.add(label);
      }
      mainGroup.add(group);

      const instr = makeTextSprite(
        "Find 40 by tapping elements in order (linear search)",
        { fontsize: 34 }
      );
      instr.position.set(0, 1.6, 0);
      scene.add(instr);
      setTimeout(() => scene.remove(instr), 3500);
    }

    // 4) Insertion & Deletion Simulation
    function loadAssessment4() {
      clearInteractive();
      const baseY = 1.2;
      const values = [10, 20, 30, 40];
      const arrGroup = new THREE.Group();
      arrGroup.name = "arr";
      for (let i = 0; i < values.length; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.16),
          new THREE.MeshStandardMaterial({ color: 0x60a5fa })
        );
        box.position.set((i - 1.5) * 0.18, baseY, 0);
        box.userData = { value: values[i], index: i };
        arrGroup.add(box);
        interactiveObjectsRef.current.push(box);
        const label = makeTextSprite(String(values[i]), { fontsize: 36 });
        label.position.set((i - 1.5) * 0.18, baseY - 0.16, 0);
        scene.add(label);
      }
      mainGroup.add(arrGroup);

      // floating 25 to insert
      const newBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
      );
      newBox.position.set(0, baseY + 0.5, 0);
      newBox.userData = { isInsert: true, value: 25 };
      mainGroup.add(newBox);
      interactiveObjectsRef.current.push(newBox);

      const instr = makeTextSprite("Tap 25 to insert between 20 and 30", {
        fontsize: 36,
      });
      instr.position.set(0, 1.6, 0);
      scene.add(instr);
      setTimeout(() => scene.remove(instr), 3500);
    }

    // summary
    function loadSummary() {
      clearInteractive();
      const text = `You scored ${scoreRef.current} / 4`;
      const sprite = makeTextSprite(text, { fontsize: 72, fillStyle: "white" });
      sprite.position.set(0, 1.6, -1.6);
      scene.add(sprite);
    }

    // master loader
    function loadStep(step) {
      // remove any old mainGroup children
      while (mainGroup.children.length) {
        const c = mainGroup.children[0];
        mainGroup.remove(c);
      }
      // also remove text sprites left in scene (quick naive cleanup)
      scene.children = scene.children.filter((ch) => {
        // keep lights, camera-like, ground etc.
        if (ch.type === "Sprite" && ch.renderOrder === 999) {
          scene.remove(ch);
          return false;
        }
        return true;
      });

      switch (step) {
        case 0:
          loadAssessment1();
          break;
        case 1:
          loadAssessment2();
          break;
        case 2:
          loadAssessment3();
          break;
        case 3:
          loadAssessment4();
          break;
        default:
          stateRef.current.step = 4;
          loadSummary();
          break;
      }
    }

    // initial step
    stateRef.current.step = 0;
    loadStep(0);

    // Controller & select handling
    const controller = renderer.xr.getController(0);
    scene.add(controller);

    function handleSelectionEvent() {
      // Build ray from controller
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObjects(
        interactiveObjectsRef.current,
        false
      );
      if (intersects.length === 0) {
        // miss - ignore or show brief "miss" debug
        setDebugText("Missed");
        setTimeout(() => setDebugText(""), 600);
        return;
      }
      const picked = intersects[0].object;
      const currentStep = stateRef.current.step;

      // Step-specific logic
      if (currentStep === 0) {
        // Assessment1: check if picked is part of linearRow group (we placed linearRow objects first)
        // We used negative x shift for linear row; check x < 0
        if (
          (picked.parent && picked.parent.name === "linearRow") ||
          picked.position.x < -0.3
        ) {
          // correct
          scoreRef.current += 1;
          picked.material.color.set(0x22c55e);
          showFloatingFeedback(
            "✅ Correct! Arrays store elements contiguously.",
            "white"
          );
        } else {
          picked.material.color.set(0xef4444);
          showFloatingFeedback("❌ Not contiguous — not an array.", "white");
        }
        proceedToNext();
      } else if (currentStep === 1) {
        // check index
        const idx = picked.userData.index;
        if (idx === 3) {
          scoreRef.current += 1;
          picked.material.color.set(0x22c55e);
          showFloatingFeedback("✅ Accessed instantly — O(1)", "white");
        } else {
          picked.material.color.set(0xef4444);
          showFloatingFeedback(`❌ That's index ${idx}`, "white");
        }
        proceedToNext();
      } else if (currentStep === 2) {
        // linear search: count checks until value 40
        if (!stateRef.current.searchChecks) stateRef.current.searchChecks = 0;
        stateRef.current.searchChecks += 1;
        // highlight picked
        picked.material.color.set(0xf59e0b);
        const val = picked.userData.value;
        if (val === 40) {
          scoreRef.current += 1;
          picked.material.color.set(0x22c55e);
          const k = stateRef.current.searchChecks;
          showFloatingFeedback(`✅ Found 40 after ${k} checks — O(n)`, "white");
          stateRef.current.searchChecks = 0;
          proceedToNext();
        } else {
          showFloatingFeedback(`Checked ${val} — continue`, "white", 700);
        }
      } else if (currentStep === 3) {
        // insertion/deletion sequence
        if (picked.userData && picked.userData.isInsert) {
          // perform insertion: shift existing arr items right visually
          const arr = mainGroup.getObjectByName("arr");
          if (arr) {
            // animate shift (simple immediate positions for brevity)
            arr.children.forEach((child) => {
              child.position.x += 0.09; // shift right
            });
            // create inserted box at correct spot
            const inserted = new THREE.Mesh(
              new THREE.BoxGeometry(0.14, 0.14, 0.14),
              new THREE.MeshStandardMaterial({ color: 0x10b981 })
            );
            inserted.position.set(0.18, 1.2, 0);
            inserted.userData = { value: 25 };
            mainGroup.add(inserted);
            interactiveObjectsRef.current.push(inserted);
            showFloatingFeedback(
              "✅ Elements shifted right — O(n) insertion",
              "white"
            );
          }
          proceedToNext(1100); // go to next subtask (deletion) after delay
        } else if (picked.userData && picked.userData.value === 30) {
          // deletion: shift left and remove
          // naive: remove that mesh, shift others left
          picked.parent.remove(picked);
          interactiveObjectsRef.current = interactiveObjectsRef.current.filter(
            (o) => o !== picked
          );
          const arr = mainGroup.getObjectByName("arr");
          if (arr) {
            arr.children.forEach((child) => {
              child.position.x -= 0.09;
            });
          }
          showFloatingFeedback(
            "✅ Elements shifted left — O(n) deletion",
            "white"
          );
          scoreRef.current += 1; // count this assessment as correct after deletion
          proceedToNext(900);
        } else {
          // tapping wrong object in this step - ignore or hint
          picked.material.color.set(0xef4444);
          showFloatingFeedback(
            "Tap the floating 25 to insert (or later tap 30 to delete).",
            "white"
          );
        }
      }
    }

    controller.addEventListener("select", handleSelectionEvent);

    // Fallback: support screen clicks when not in XR controller mode
    function onScreenClick(e) {
      // compute normalized device coords and raycast from camera
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(
        interactiveObjectsRef.current,
        false
      );
      if (intersects.length > 0) {
        // fake controller matrix for reuse: create a temporary controller matrix at camera origin pointing along camera
        // call handler by selecting first object found
        const picked = intersects[0].object;
        // simulate picking by directly handling logic here:
        // For simplicity, we reuse handleSelectionEvent by temporarily setting controller.matrixWorld to camera.
        // Create temp controller-like object:
        const fakeController = { matrixWorld: camera.matrixWorld.clone() };
        // Instead of refactoring, directly use the same logic as in handleSelectionEvent but with picked
        // We'll just call a condensed version:
        const currentStep = stateRef.current.step;
        if (currentStep === 0) {
          if (
            (picked.parent && picked.parent.name === "linearRow") ||
            picked.position.x < -0.3
          ) {
            scoreRef.current += 1;
            picked.material.color.set(0x22c55e);
            showFloatingFeedback(
              "✅ Correct! Arrays store elements contiguously."
            );
          } else {
            picked.material.color.set(0xef4444);
            showFloatingFeedback("❌ Not contiguous — not an array.");
          }
          proceedToNext();
        } else {
          // For other steps, we simply call handleSelectionEvent fallback by toggling controller matrix and testing intersects again.
          // Simpler: directly trigger the same pick behavior by calling the raycast-based handler above.
          // But to keep code short, we'll just re-use same picked object handling:
          // (copy-paste small logic from above)
          if (currentStep === 1) {
            const idx = picked.userData.index;
            if (idx === 3) {
              scoreRef.current += 1;
              picked.material.color.set(0x22c55e);
              showFloatingFeedback("✅ Accessed instantly — O(1)");
            } else {
              picked.material.color.set(0xef4444);
              showFloatingFeedback(`❌ That's index ${idx}`);
            }
            proceedToNext();
          } else if (currentStep === 2) {
            if (!stateRef.current.searchChecks)
              stateRef.current.searchChecks = 0;
            stateRef.current.searchChecks += 1;
            picked.material.color.set(0xf59e0b);
            const val = picked.userData.value;
            if (val === 40) {
              scoreRef.current += 1;
              picked.material.color.set(0x22c55e);
              const k = stateRef.current.searchChecks;
              showFloatingFeedback(`✅ Found 40 after ${k} checks — O(n)`);
              stateRef.current.searchChecks = 0;
              proceedToNext();
            } else {
              showFloatingFeedback(`Checked ${val} — continue`, "white", 700);
            }
          } else if (currentStep === 3) {
            if (picked.userData && picked.userData.isInsert) {
              const arr = mainGroup.getObjectByName("arr");
              if (arr) {
                arr.children.forEach((child) => (child.position.x += 0.09));
                const inserted = new THREE.Mesh(
                  new THREE.BoxGeometry(0.14, 0.14, 0.14),
                  new THREE.MeshStandardMaterial({ color: 0x10b981 })
                );
                inserted.position.set(0.18, 1.2, 0);
                inserted.userData = { value: 25 };
                mainGroup.add(inserted);
                interactiveObjectsRef.current.push(inserted);
                showFloatingFeedback(
                  "✅ Elements shifted right — O(n) insertion"
                );
              }
              proceedToNext(1100);
            } else if (picked.userData && picked.userData.value === 30) {
              picked.parent.remove(picked);
              interactiveObjectsRef.current =
                interactiveObjectsRef.current.filter((o) => o !== picked);
              const arr = mainGroup.getObjectByName("arr");
              if (arr)
                arr.children.forEach((child) => (child.position.x -= 0.09));
              showFloatingFeedback("✅ Elements shifted left — O(n) deletion");
              scoreRef.current += 1;
              proceedToNext(900);
            } else {
              picked.material.color.set(0xef4444);
              showFloatingFeedback(
                "Tap the floating 25 to insert (or later tap 30 to delete).",
                "white"
              );
            }
          }
        }
      } else {
        setDebugText("Miss");
        setTimeout(() => setDebugText(""), 500);
      }
    }

    window.addEventListener("click", onScreenClick);

    // Animation loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // start AR session if available (same as your previous pattern)
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((s) => {
          renderer.xr.setSession(s);
        })
        .catch((err) => {
          console.warn("AR session failed:", err);
        });
    }

    // cleanup
    return () => {
      controller.removeEventListener("select", handleSelectionEvent);
      window.removeEventListener("click", onScreenClick);
      window.removeEventListener("resize", onResize);
      try {
        if (container.contains(renderer.domElement))
          container.removeChild(renderer.domElement);
      } catch (e) {}
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
