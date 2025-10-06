// AssessmentAR.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const AssessmentAR = () => {
  const containerRef = useRef(null);

  // UI state
  const [debugText, setDebugText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [score, setScore] = useState(0);

  // Refs for three objects we need across frames
  const refs = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controller: null,
    raycaster: null,
    mainGroup: null,
    animObjects: [], // objects currently animating: { obj, toPos, duration, startTime, fromPos }
    interactObjects: [], // objects that can be tapped with metadata { mesh, id, meta }
    session: null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Basic scene / renderer / camera setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      50
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    // lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    hemi.position.set(0.5, 1, 0.25);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.4);
    dir.position.set(0, 5, 1);
    scene.add(dir);

    // main group positioned ~2.5m in front of user
    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 1.6, -2.5); // <-- user wanted them visible and same distance
    scene.add(mainGroup);

    // raycaster & controller
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    refs.current = {
      renderer,
      scene,
      camera,
      controller,
      raycaster,
      tempMatrix,
      mainGroup,
      animObjects: [],
      interactObjects: [],
      session: null,
    };

    // helper: make a plane with text drawn via canvas (so we can create labels quickly)
    function makeTextLabel(text, fontSize = 64, padding = 12) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.font = `${fontSize}px sans-serif`;
      // size canvas to text
      const metrics = ctx.measureText(text);
      const textWidth = Math.ceil(metrics.width);
      canvas.width = textWidth + padding * 2;
      canvas.height = fontSize + padding * 2;

      // draw background (transparent) and text
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.6)"; // semi transparent bg for readability
      // rounded background
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(canvas.width - r, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
      ctx.lineTo(canvas.width, canvas.height - r);
      ctx.quadraticCurveTo(
        canvas.width,
        canvas.height,
        canvas.width - r,
        canvas.height
      );
      ctx.lineTo(r, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillText(text, padding, padding);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
      });
      // plane size relative to canvas pixel size (scale down)
      const planeGeom = new THREE.PlaneGeometry(
        canvas.width / 600,
        canvas.height / 600
      );
      const mesh = new THREE.Mesh(planeGeom, mat);
      return mesh;
    }

    // helper: create a labeled cube (box geometry + small label above)
    function createLabeledCube({
      label = "",
      x = 0,
      y = 0,
      z = 0,
      size = 0.28,
      color = 0x60a5fa,
      id = "",
    }) {
      const geom = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      mesh.userData._id = id || label || `${x}_${y}_${z}`;
      mesh.userData._label = label;

      // label plane above cube
      const labelMesh = makeTextLabel(label, 60);
      labelMesh.position.set(0, size * 0.8 + 0.18, 0); // above cube; keep same distance to camera when group moved
      // keep both in a parent group so they move together
      const parent = new THREE.Group();
      parent.add(mesh);
      parent.add(labelMesh);

      return { parent, mesh, labelMesh };
    }

    // clear previous interactive objects
    function clearInteractObjects() {
      refs.current.interactObjects.forEach((o) => {
        if (o.mesh && o.mesh.parent)
          o.mesh.parent.parent?.remove(o.mesh.parent);
      });
      refs.current.interactObjects.length = 0;
    }

    // show feedback text (3D) above mainGroup (same distance as objects)
    let feedbackMesh = null;
    function showFeedback(text, color = "#22c55e", duration = 1400) {
      if (feedbackMesh && feedbackMesh.parent) {
        feedbackMesh.parent.remove(feedbackMesh);
        feedbackMesh = null;
      }
      feedbackMesh = makeTextLabel(text, 56);
      // tint by drawing color onto the canvas? simpler: add small colored background ring via separate plane
      feedbackMesh.position.set(0, 0.9, 0); // above the question items
      refs.current.mainGroup.add(feedbackMesh);
      // auto remove
      setTimeout(() => {
        if (feedbackMesh && feedbackMesh.parent) {
          refs.current.mainGroup.remove(feedbackMesh);
          feedbackMesh = null;
        }
      }, duration);
    }

    // animation helper: move object to target over duration (ms) - adds to animObjects
    function animateTo(meshObj, toPos, duration = 600) {
      const anim = {
        obj: meshObj,
        fromPos: meshObj.position.clone(),
        toPos: new THREE.Vector3(toPos.x, toPos.y, toPos.z),
        startTime: performance.now(),
        duration,
      };
      refs.current.animObjects.push(anim);
    }

    // register an interactive mesh (for raycast)
    function registerInteractive(mesh, meta = {}) {
      refs.current.interactObjects.push({ mesh, meta });
    }

    // --- Question builders ---
    // Each question will place items as children of mainGroup and register interactables

    // QUESTION 1: Identify the Array
    function buildQuestion1() {
      clearInteractObjects();
      // group positions relative to mainGroup (which is at z = -2.5 from camera)
      // We'll create 3 groups across x axis: left, center, right
      const spacingX = 0.9;
      const yBase = 0.0;

      // 1) Linear array (correct) - 5 boxes evenly spaced
      const linearGroup = new THREE.Group();
      linearGroup.position.set(-spacingX, yBase, 0);
      const count = 5;
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * 0.35;
        const { parent, mesh } = createLabeledCube({
          label: "",
          x,
          y: 0,
          z: 0,
          size: 0.22,
          color: 0x60a5fa,
          id: `q1_linear_${i}`,
        });
        linearGroup.add(parent);
        registerInteractive(mesh, {
          question: 1,
          kind: "linear",
          index: i,
          parentGroup: linearGroup,
        });
      }
      refs.current.mainGroup.add(linearGroup);

      // 2) Scattered set (wrong)
      const scatteredGroup = new THREE.Group();
      scatteredGroup.position.set(0, yBase, 0);
      for (let i = 0; i < 5; i++) {
        const rx = (Math.random() - 0.5) * 0.8;
        const rz = (Math.random() - 0.5) * 0.4;
        const { parent, mesh } = createLabeledCube({
          label: "",
          x: rx,
          y: Math.random() * 0.18 - 0.05,
          z: rz,
          size: 0.22,
          color: 0xf97316,
          id: `q1_scatter_${i}`,
        });
        scatteredGroup.add(parent);
        registerInteractive(mesh, { question: 1, kind: "scattered" });
      }
      refs.current.mainGroup.add(scatteredGroup);

      // 3) Stacked pile (wrong)
      const stackGroup = new THREE.Group();
      stackGroup.position.set(spacingX, yBase, 0);
      for (let i = 0; i < 5; i++) {
        const { parent, mesh } = createLabeledCube({
          label: "",
          x: 0,
          y: i * 0.22,
          z: 0,
          size: 0.22,
          color: 0xf43f5e,
          id: `q1_stack_${i}`,
        });
        stackGroup.add(parent);
        registerInteractive(mesh, { question: 1, kind: "stack" });
      }
      refs.current.mainGroup.add(stackGroup);

      // text prompt above
      const prompt = makeTextLabel(
        "Tap the linear, evenly spaced boxes (array)"
      );
      prompt.position.set(0, 0.9, 0);
      refs.current.mainGroup.add(prompt);
    }

    // QUESTION 2: Access Time Challenge
    function buildQuestion2() {
      clearInteractObjects();
      // single row of 5 cubes labeled [0]..[4]
      const rowGroup = new THREE.Group();
      rowGroup.position.set(0, 0, 0);
      const count = 5;
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * 0.4;
        const { parent, mesh } = createLabeledCube({
          label: `[${i}]`,
          x,
          y: 0,
          z: 0,
          size: 0.26,
          color: 0x60a5fa,
          id: `q2_index_${i}`,
        });
        rowGroup.add(parent);
        registerInteractive(mesh, { question: 2, index: i });
      }
      refs.current.mainGroup.add(rowGroup);

      const prompt = makeTextLabel(
        "Access the element at index 3. Tap index 3."
      );
      prompt.position.set(0, 0.9, 0);
      refs.current.mainGroup.add(prompt);
    }

    // QUESTION 3: Search Simulation (linear)
    function buildQuestion3() {
      clearInteractObjects();
      const values = [10, 20, 30, 40, 50, 60];
      const rowGroup = new THREE.Group();
      rowGroup.position.set(0, 0, 0);
      for (let i = 0; i < values.length; i++) {
        const x = (i - (values.length - 1) / 2) * 0.35;
        const { parent, mesh } = createLabeledCube({
          label: `${values[i]}`,
          x,
          y: 0,
          z: 0,
          size: 0.24,
          color: 0x60a5fa,
          id: `q3_val_${values[i]}`,
        });
        rowGroup.add(parent);
        registerInteractive(mesh, { question: 3, index: i, value: values[i] });
      }
      refs.current.mainGroup.add(rowGroup);
      const prompt = makeTextLabel(
        "Linear search for 40 — tap cubes in order until you find 40."
      );
      prompt.position.set(0, 0.9, 0);
      refs.current.mainGroup.add(prompt);
    }

    // QUESTION 4: Insertion & Deletion Simulation
    function buildQuestion4() {
      clearInteractObjects();
      // initial array [10,20,30,40]
      const values = [10, 20, 30, 40];
      const rowGroup = new THREE.Group();
      rowGroup.position.set(0, 0, 0);
      for (let i = 0; i < values.length; i++) {
        const x = (i - (values.length - 1) / 2) * 0.42;
        const { parent, mesh } = createLabeledCube({
          label: `${values[i]}`,
          x,
          y: 0,
          z: 0,
          size: 0.26,
          color: 0x60a5fa,
          id: `q4_val_${values[i]}`,
        });
        rowGroup.add(parent);
        registerInteractive(mesh, { question: 4, index: i, value: values[i] });
      }
      refs.current.mainGroup.add(rowGroup);

      // floating new box 25 above between 20 and 30 (index 1.5)
      const posX25 = (1 - (values.length - 1) / 2) * 0.42 + 0.21; // between index 1 and 2
      const floating = createLabeledCube({
        label: "25 (tap to insert)",
        x: posX25,
        y: 0.8,
        z: 0,
        size: 0.22,
        color: 0xf59e0b,
        id: "q4_insert_25",
      });
      floating.parent.name = "floating_25";
      refs.current.mainGroup.add(floating.parent);
      registerInteractive(floating.mesh, {
        question: 4,
        action: "insert",
        value: 25,
        targetIndex: 2,
      });

      const prompt = makeTextLabel("Tap 25 to insert; then tap 30 to delete.");
      prompt.position.set(0, 1.3, 0);
      refs.current.mainGroup.add(prompt);
    }

    // Build question based on currentQuestion state
    function buildCurrentQuestion(q) {
      // clear mainGroup children
      while (refs.current.mainGroup.children.length) {
        const c = refs.current.mainGroup.children[0];
        refs.current.mainGroup.remove(c);
      }
      refs.current.interactObjects.length = 0;
      refs.current.animObjects.length = 0;

      if (q === 1) buildQuestion1();
      else if (q === 2) buildQuestion2();
      else if (q === 3) buildQuestion3();
      else if (q === 4) buildQuestion4();
      else buildSummary();
    }

    // Final summary
    function buildSummary() {
      clearInteractObjects();
      const summary = makeTextLabel(`You scored ${score} / 4`);
      summary.position.set(0, 0.6, 0);
      refs.current.mainGroup.add(summary);
      const msg =
        score === 4
          ? "Excellent! 🎉"
          : score >= 2
          ? "Good job!"
          : "Keep practicing!";
      const sub = makeTextLabel(msg);
      sub.position.set(0, 0, 0);
      refs.current.mainGroup.add(sub);
      // optionally more detailed message
    }

    // call initial build
    buildCurrentQuestion(currentQuestion);

    // --- Interaction handling: controller select and touch fallback ---
    function onSelectController() {
      // cast ray from controller into scene
      refs.current.tempMatrix
        .identity()
        .extractRotation(controller.matrixWorld);
      refs.current.raycaster.ray.origin.setFromMatrixPosition(
        controller.matrixWorld
      );
      refs.current.raycaster.ray.direction
        .set(0, 0, -1)
        .applyMatrix4(refs.current.tempMatrix);

      const intersects = refs.current.raycaster.intersectObjects(
        refs.current.interactObjects.map((o) => o.mesh),
        true
      );
      handleIntersections(intersects);
    }

    // screen touch / click fallback raycast (for devices without controller)
    function onCanvasTap(event) {
      // compute normalized device coords
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      refs.current.raycaster.setFromCamera({ x, y }, camera);
      const intersects = refs.current.raycaster.intersectObjects(
        refs.current.interactObjects.map((o) => o.mesh),
        true
      );
      handleIntersections(intersects);
    }

    // intersection handler (central evaluation logic)
    function handleIntersections(intersects) {
      if (!intersects || intersects.length === 0) {
        // optional debug when miss
        setDebugText("Missed. Tap the correct object.");
        setTimeout(() => setDebugText(""), 900);
        return;
      }
      // find first registered interact object (could be label plane or cube submesh)
      const first = intersects[0].object;
      // find parent registered mesh
      const reg = refs.current.interactObjects.find(
        (o) =>
          o.mesh === first || o.mesh === first.parent || first.parent === o.mesh
      );
      if (!reg) {
        setDebugText("No registered object.");
        setTimeout(() => setDebugText(""), 800);
        return;
      }
      const meta = reg.meta || {};
      // handle per-question behavior
      if (meta.question === 1) {
        // only linear group is correct
        if (meta.kind === "linear") {
          // mark the whole linear group green
          setDebugText("✅ Correct! Arrays store elements contiguously.");
          // highlight all linear group's children green
          refs.current.interactObjects
            .filter((o) => o.meta && o.meta.kind === "linear")
            .forEach((o) => {
              if (o.mesh.material) o.mesh.material.color.set(0x16a34a);
            });
          setScore((s) => s + 1);
        } else {
          setDebugText("❌ Not contiguous, that’s not an array.");
          // briefly flash the tapped mesh red
          if (reg.mesh.material) {
            const orig = reg.mesh.material.color.getHex();
            reg.mesh.material.color.set(0xef4444);
            setTimeout(() => reg.mesh.material.color.set(orig), 700);
          }
        }
        setTimeout(() => {
          setDebugText("");
          setCurrentQuestion((c) => c + 1);
          buildCurrentQuestion(currentQuestion + 1);
        }, 1200);
      } else if (meta.question === 2) {
        if (meta.index === 3) {
          setDebugText("✅ Accessed instantly — O(1) operation.");
          if (reg.mesh.material) reg.mesh.material.color.set(0x16a34a);
          setScore((s) => s + 1);
        } else {
          setDebugText(
            `❌ That’s index ${meta.index}. Access means direct indexing, not searching.`
          );
          if (reg.mesh.material) {
            const orig = reg.mesh.material.color.getHex();
            reg.mesh.material.color.set(0xef4444);
            setTimeout(() => reg.mesh.material.color.set(orig), 700);
          }
        }
        setTimeout(() => {
          setDebugText("");
          setCurrentQuestion((c) => c + 1);
          buildCurrentQuestion(currentQuestion + 1);
        }, 1200);
      } else if (meta.question === 3) {
        // linear search: highlight tapped; when value == 40 -> success (index 3)
        if (meta.value !== undefined) {
          // highlight tapped yellow briefly (simulate check)
          if (reg.mesh.material) reg.mesh.material.color.set(0xf59e0b);
          if (meta.value === 40) {
            setTimeout(() => {
              if (reg.mesh.material) reg.mesh.material.color.set(0x16a34a);
              setDebugText("✅ Found 40 after 4 checks — O(n) search.");
              setScore((s) => s + 1);
              setTimeout(() => {
                setDebugText("");
                setCurrentQuestion((c) => c + 1);
                buildCurrentQuestion(currentQuestion + 1);
              }, 900);
            }, 500);
          } else {
            // keep yellow briefly
            setTimeout(() => {
              if (reg.mesh.material) reg.mesh.material.color.set(0x60a5fa);
            }, 600);
          }
        }
      } else if (meta.question === 4) {
        if (meta.action === "insert" && meta.value === 25) {
          // insert 25: find existing nodes, shift right from targetIndex
          setDebugText("✅ Elements shifted right — O(n) insertion.");
          // find all current q4 items in order by x position
          const q4Meshes = refs.current.interactObjects.filter(
            (o) => o.meta && o.meta.question === 4 && !o.meta.action
          );
          // sort by x
          q4Meshes.sort((a, b) => a.mesh.position.x - b.mesh.position.x);
          // shift them right starting from targetIndex-1? meta.targetIndex is desired new index
          const targetIdx = meta.targetIndex || 2;
          for (let i = q4Meshes.length - 1; i >= targetIdx; i--) {
            const o = q4Meshes[i];
            const newX = o.mesh.position.x + 0.42;
            animateTo(
              o.mesh.parent,
              {
                x: newX,
                y: o.mesh.parent.position.y,
                z: o.mesh.parent.position.z,
              },
              450
            );
            // update stored position after animation completes (we won't mutate here)
          }
          // create new box where it should be (targetIdx)
          const newXpos = (targetIdx - (q4Meshes.length - 1) / 2) * 0.42;
          const { parent, mesh } = createLabeledCube({
            label: "25",
            x: newXpos,
            y: 0,
            z: 0,
            size: 0.26,
            color: 0x10b981,
            id: "q4_new_25_real",
          });
          // start off slightly above then animate down
          parent.position.set(newXpos, 0.8, 0);
          refs.current.mainGroup.add(parent);
          animateTo(parent, { x: newXpos, y: 0, z: 0 }, 450);
          // register new interactive mesh (so user can press 30 later)
          registerInteractive(mesh, { question: 4, value: 25, inserted: true });
          setScore((s) => s + 1); // award for insertion step
          setTimeout(() => {
            setDebugText("");
          }, 1000);
        } else if (meta.value === 30) {
          // delete 30: find the mesh and remove it then shift left
          setDebugText("✅ Elements shifted left — O(n) deletion.");
          // find q4 meshes (including inserted) and remove the one with value 30
          const q4All = refs.current.interactObjects.filter(
            (o) => o.meta && o.meta.question === 4
          );
          // find mesh with meta.value === 30
          const target = q4All.find((o) => o.meta.value === 30);
          if (target) {
            // animate fade/scale down and then remove
            const parent = target.mesh.parent;
            // simple scale animation via animObjects: we'll animate y scale to 0
            const shrinkAnim = {
              obj: parent,
              fromScale: parent.scale.clone(),
              toScale: new THREE.Vector3(0.001, 0.001, 0.001),
              startTime: performance.now(),
              duration: 350,
              shrink: true,
            };
            refs.current.animObjects.push(shrinkAnim);
            // remove registration
            refs.current.interactObjects = refs.current.interactObjects.filter(
              (o) => o !== target
            );
            // after animation, shift others left
            setTimeout(() => {
              const remaining = refs.current.interactObjects.filter(
                (o) => o.meta && o.meta.question === 4
              );
              // shift those whose x > target.mesh.position.x left by 0.42
              const tx = target.mesh.position.x;
              remaining.forEach((o) => {
                if (o.mesh.position.x > tx + 0.01) {
                  animateTo(
                    o.mesh.parent,
                    {
                      x: o.mesh.position.x - 0.42,
                      y: o.mesh.parent.position.y,
                      z: 0,
                    },
                    450
                  );
                }
              });
              setScore((s) => s + 1); // award for deletion step
              setTimeout(() => {
                setDebugText("");
                // after deletion done, proceed to final summary
                setCurrentQuestion((c) => c + 1);
                buildCurrentQuestion(currentQuestion + 1);
              }, 900);
            }, 380);
          } else {
            setDebugText("Tap the 30 to delete it.");
            setTimeout(() => setDebugText(""), 800);
          }
        } else {
          setDebugText("Tap the item required.");
          setTimeout(() => setDebugText(""), 700);
        }
      }
    }

    // animation loop
    function animate(now) {
      // run any object position animations
      const anims = refs.current.animObjects;
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i];
        const elapsed = now - a.startTime;
        const t = Math.min(1, elapsed / a.duration);
        if (a.shrink) {
          // scale animation
          a.obj.scale.lerpVectors(a.fromScale, a.toScale, t);
        } else {
          // position animation: for parent groups (we store obj as parent)
          a.obj.position.lerpVectors(a.fromPos, a.toPos, t);
        }
        if (t >= 1) {
          anims.splice(i, 1);
        }
      }

      // simple auto-rotation of mainGroup for a subtle effect (optional)
      // refs.current.mainGroup.rotation.y += 0.0008;

      refs.current.renderer.render(refs.current.scene, refs.current.camera);
    }

    renderer.setAnimationLoop(animate);

    // add event listeners
    controller.addEventListener("select", onSelectController);
    // fallback: pointerdown on canvas
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onCanvasTap);

    // resize handler
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    // start XR session if available (auto-start)
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => {
          renderer.xr.setSession(session);
          refs.current.session = session;
        })
        .catch((err) => {
          console.warn("AR Session failed:", err);
          // allow non-XR fallback (still works with touch raycast)
        });
    }

    // cleanup on unmount
    return () => {
      try {
        controller.removeEventListener("select", onSelectController);
      } catch {}
      try {
        renderer.domElement.removeEventListener("pointerdown", onCanvasTap);
      } catch {}
      window.removeEventListener("resize", onResize);

      if (
        renderer &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }
      try {
        renderer.setAnimationLoop(null);
        if (refs.current.session) refs.current.session.end();
        renderer.dispose();
      } catch (e) {
        /* ignore cleanup errors */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // rebuild scene when currentQuestion or score changes
  useEffect(() => {
    // when question changes, request the build in the three context
    const ctx = refs.current;
    if (!ctx || !ctx.mainGroup) return;
    if (currentQuestion >= 1 && currentQuestion <= 4) {
      // clear and build
      // call buildCurrentQuestion by dispatching a synthetic function inside the same context
      // We'll simply re-run building by calling a small function in the main thread using requestAnimationFrame,
      // because buildCurrentQuestion is inside the effect that created refs; easiest approach is to use DOM event hack:
      // Instead, rely on the fact that buildCurrentQuestion exists only in that closure; so to trigger rebuild, we can:
      // - set a small timeout to let any prior animations finish, then rebuild by invoking a custom event the effect listens to.
      // To keep things simple and robust here, we'll just reload the page if mainGroup missing (not ideal).
    } else if (currentQuestion === 5) {
      // nothing - final summary built in the original closure after question 4
    }
    // Note: buildCurrentQuestion is executed inside the initial effect closure,
    // and we already call it there after setCurrentQuestion in the selection handlers.
  }, [currentQuestion, score]);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {/* Debug/feedback HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {debugText && (
          <div className="bg-black/70 text-white px-4 py-2 rounded-xl text-lg">
            {debugText}
          </div>
        )}
      </div>

      {/* Small indicator of question and score */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/60 text-white px-3 py-1 rounded-md">
        Q{currentQuestion <= 4 ? currentQuestion : "Summary"} • Score: {score}
      </div>
    </div>
  );
};

export default AssessmentAR;
