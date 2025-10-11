// VisualPage1AR.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * VisualPage1AR
 * - data: array of numbers (default shown)
 * - spacing: spacing between boxes in world units (default 0.9)
 *
 * Notes:
 * - Uses WebXR immersive-ar (auto-start). If XR unavailable, pointer fallback works for testing.
 * - Uses canvas-created textures for labels and panel (no external deps).
 * - Invisible planes placed in front of objects to improve tap hit detection.
 */
const VisualPage1AR = ({ data = [10, 20, 30, 40], spacing = 0.9 }) => {
  const containerRef = useRef(null);
  const debugRef = useRef("");
  const [debugText, setDebugText] = useState("");
  // local refs for internals
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const xrSessionRef = useRef();
  const pickableRef = useRef([]); // objects that raycast can hit
  const spritesRef = useRef({}); // store sprites by key
  const panelStateRef = useRef({ page: 0, visible: false });
  const selectedIndexRef = useRef(null);

  // BOX SIZE in world units before group scale
  const BOX_SIZE = { x: 1.6, y: 1.2, z: 1.0 };

  // helper to briefly show debug
  const flashDebug = (msg, ms = 1400) => {
    setDebugText(msg);
    if (debugRef.current) {
      clearTimeout(debugRef.current);
    }
    debugRef.current = setTimeout(() => setDebugText(""), ms);
  };

  // create canvas texture from text (supports multiline)
  const makeTextTexture = (text, opts = {}) => {
    const {
      font = "600 36px sans-serif",
      padding = 10,
      color = "#ffffff",
      background = "rgba(0,0,0,0.0)",
      maxWidth = 900,
      lineHeight = 40,
    } = opts;

    const lines = String(text).split("\n");
    // measure width
    const measureCanvas = document.createElement("canvas");
    const mctx = measureCanvas.getContext("2d");
    mctx.font = font;
    let w = 0;
    lines.forEach((ln) => {
      const measured = mctx.measureText(ln).width;
      if (measured > w) w = Math.min(measured, maxWidth);
    });
    const h = lineHeight * lines.length;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w + padding * 2);
    canvas.height = Math.ceil(h + padding * 2);
    const ctx = canvas.getContext("2d");

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";

    lines.forEach((ln, i) => {
      ctx.fillText(ln, padding, padding + i * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return { texture, width: canvas.width, height: canvas.height };
  };

  const makeSpriteFromText = (text, opts = {}) => {
    const { texture, width, height } = makeTextTexture(text, opts);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    // scale: choose a base height in world units, then preserve aspect
    const baseHeight = opts.baseHeight || 0.45;
    const aspect = width / height || 1;
    sprite.scale.set(baseHeight * aspect, baseHeight, 1);
    return sprite;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene + Camera + Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      50
    );
    camera.position.set(0, 1.6, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = false; // keep perf good for AR
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Light
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.0);
    hemi.position.set(0.2, 1, 0.1);
    scene.add(hemi);

    // Main group to hold the array - scaled down to fit AR view
    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 1, -1.5); // slightly in front of user
    mainGroup.scale.set(0.12, 0.12, 0.12); // scale so our box sizes from BOX_SIZE are reasonable
    scene.add(mainGroup);

    // Shared geometry and materials
    const boxGeo = new THREE.BoxGeometry(BOX_SIZE.x, BOX_SIZE.y, BOX_SIZE.z);
    const matA = new THREE.MeshStandardMaterial({
      color: "#60a5fa",
      emissive: "#000000",
    });
    const matB = new THREE.MeshStandardMaterial({
      color: "#34d399",
      emissive: "#000000",
    });
    const matSelected = new THREE.MeshStandardMaterial({
      color: "#facc15",
      emissive: "#fbbf24",
      emissiveIntensity: 0.4,
    });

    // precompute positions (unscaled; group scale will apply)
    const mid = (data.length - 1) / 2;
    const positions = data.map((_, i) => [(i - mid) * spacing, 0, 0]);

    // arrays for pickable objects
    pickableRef.current = [];

    // create boxes, value/index sprites, and invisible planes for hits
    data.forEach((val, i) => {
      const pos = positions[i];

      // Box mesh
      const mesh = new THREE.Mesh(boxGeo, i % 2 === 0 ? matA : matB);
      mesh.position.set(pos[0], BOX_SIZE.y / 2, pos[2]);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData = { index: i, value: val, kind: "box" };
      mesh.name = `box-${i}`;
      mainGroup.add(mesh);

      // front value sprite
      const valSprite = makeSpriteFromText(String(val), {
        font: "600 48px sans-serif",
        padding: 8,
        color: "#ffffff",
        background: "rgba(0,0,0,0.55)",
        baseHeight: 0.42,
      });
      valSprite.position.set(
        pos[0],
        BOX_SIZE.y / 2 + 0.22,
        pos[2] + (BOX_SIZE.z / 2 + 0.08)
      );
      mainGroup.add(valSprite);
      spritesRef.current[`val-${i}`] = valSprite;

      // index sprite (visual)
      const idxSprite = makeSpriteFromText(`[${i}]`, {
        font: "600 40px sans-serif",
        padding: 8,
        color: "#ffeb3b",
        background: "rgba(0,0,0,0.4)",
        baseHeight: 0.32,
      });
      idxSprite.position.set(pos[0], -0.36, pos[2] + (BOX_SIZE.z / 2 + 0.08));
      mainGroup.add(idxSprite);
      spritesRef.current[`idx-${i}`] = idxSprite;

      // invisible plane in front of box for better hit detection (value tap)
      const planeGeo = new THREE.PlaneGeometry(0.95, 0.75);
      const planeMat = new THREE.MeshBasicMaterial({ visible: false });
      const valPlane = new THREE.Mesh(planeGeo, planeMat);
      valPlane.position.set(
        pos[0],
        BOX_SIZE.y / 2,
        pos[2] + (BOX_SIZE.z / 2 + 0.06)
      );
      valPlane.userData = { index: i, type: "value-plane" };
      mainGroup.add(valPlane);
      pickableRef.current.push(valPlane);

      // invisible plane for index (below)
      const idxPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.4),
        planeMat
      );
      idxPlane.position.set(pos[0], -0.32, pos[2] + (BOX_SIZE.z / 2 + 0.06));
      idxPlane.userData = { index: i, type: "index-plane" };
      mainGroup.add(idxPlane);
      pickableRef.current.push(idxPlane);

      // also allow raycast to hit the visible mesh as backup
      pickableRef.current.push(mesh);
    });

    // --- Definition panel (sprite) ---
    // placed below boxes (y ≈ -0.6 relative to mainGroup) and faces camera
    const panelSprite = makeSpriteFromText("", {
      font: "600 34px sans-serif",
      padding: 10,
      color: "#fde68a",
      background: "rgba(0,0,0,0.6)",
      baseHeight: 1.1,
      lineHeight: 36,
    });
    panelSprite.position.set(0, -0.9, 0); // relative to mainGroup
    panelSprite.visible = false;
    mainGroup.add(panelSprite);
    spritesRef.current["panel"] = panelSprite;

    // small invisible plane to advance/close panel (placed right beneath panel)
    const panelNextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.45),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    panelNextPlane.position.set(0.9, -1.4, 0.01);
    panelNextPlane.userData = { type: "panel-next" };
    mainGroup.add(panelNextPlane);
    pickableRef.current.push(panelNextPlane);

    // selected label sprite (top)
    const selectedSprite = makeSpriteFromText("", {
      font: "600 44px sans-serif",
      padding: 10,
      color: "#fde68a",
      background: "rgba(0,0,0,0.45)",
      baseHeight: 0.8,
    });
    selectedSprite.position.set(0, BOX_SIZE.y + 1.3, 0);
    selectedSprite.visible = false;
    mainGroup.add(selectedSprite);
    spritesRef.current["selected"] = selectedSprite;

    // small on-screen sprite (for non-XR hint) - visible in both modes
    const hintSprite = makeSpriteFromText(
      "Tap a box to select • Tap an index to open panel",
      {
        font: "500 30px sans-serif",
        padding: 8,
        color: "#e6f4ff",
        background: "rgba(0,0,0,0.45)",
        baseHeight: 0.55,
      }
    );
    hintSprite.position.set(-0.01, -1.9, -0.05);
    mainGroup.add(hintSprite);
    spritesRef.current["hint"] = hintSprite;

    // Raycaster + controller
    const raycaster = new THREE.Raycaster();
    const controller = renderer.xr.getController(0);
    scene.add(controller);

    // handle picking logic
    const handlePick = (hitObj) => {
      if (!hitObj || !hitObj.userData) return;
      const ud = hitObj.userData;

      // Panel next plane
      if (ud.type === "panel-next") {
        if (!panelStateRef.current.visible) return;
        // Advance page or close
        panelStateRef.current.page = (panelStateRef.current.page + 1) % 3;
        updatePanelContent(
          panelStateRef.current.page,
          panelStateRef.current.currentIndex
        );
        // if we wrap to page 0 from 2, close instead of showing again? keep cyclic per original request
        return;
      }

      // Index-plane: show panel
      if (ud.type === "index-plane" && typeof ud.index === "number") {
        openPanelForIndex(ud.index);
        return;
      }

      // Value-plane or mesh: toggle selection
      if (ud.type === "value-plane" || ud.kind === "box") {
        const idx = ud.index;
        toggleSelect(idx);
        return;
      }
    };

    // Toggle selection of a box
    const toggleSelect = (idx) => {
      const prev = selectedIndexRef.current;
      if (prev !== null && prev === idx) {
        // deselect
        selectedIndexRef.current = null;
        // revert material of the box
        const mesh = mainGroup.getObjectByName(`box-${idx}`);
        if (mesh) {
          mesh.material = idx % 2 === 0 ? matA : matB;
        }
        // hide selectedlabel
        spritesRef.current["selected"].visible = false;
        flashDebug(`Deselected index ${idx}`);
      } else {
        // select new
        selectedIndexRef.current = idx;
        // find mesh and set material
        const mesh = mainGroup.getObjectByName(`box-${idx}`);
        if (mesh) {
          mesh.material = matSelected;
        }
        // update selected sprite texture
        const selText = `Value ${data[idx]} at index ${idx}`;
        const { texture, width, height } = makeTextTexture(selText, {
          font: "600 44px sans-serif",
          padding: 10,
          color: "#fde68a",
          background: "rgba(0,0,0,0.45)",
          lineHeight: 48,
        });
        const sp = spritesRef.current["selected"];
        sp.material.map?.dispose();
        sp.material.map = texture;
        sp.material.needsUpdate = true;
        sp.visible = true;
        flashDebug(`Selected index ${idx}`);
        // hide panel if open
        if (panelStateRef.current.visible) {
          panelStateRef.current.visible = false;
          spritesRef.current["panel"].visible = false;
        }
      }
    };

    // Panel content builder
    const buildPanelText = (page, localData = data) => {
      if (page === 0) {
        return [
          "📘 Understanding Index in Arrays:",
          "",
          "• Index is the position assigned to each element.",
          "• Starts at 0, so first element → index 0.",
        ].join("\n");
      } else if (page === 1) {
        return [
          "📗 In Data Structures & Algorithms:",
          "",
          "• Indexing gives O(1) access time.",
          "• Arrays are stored in contiguous memory.",
        ].join("\n");
      } else {
        return [
          "📊 Index Summary:",
          "",
          ...localData.map((v, i) => `• Index ${i} → value ${v}`),
        ].join("\n");
      }
    };

    // Update panel content and show
    const updatePanelContent = (page, indexForContext = null) => {
      const content = buildPanelText(page);
      const { texture } = makeTextTexture(content, {
        font: "600 34px sans-serif",
        padding: 12,
        color: "#fde68a",
        background: "rgba(0,0,0,0.6)",
        lineHeight: 36,
      });
      panelStateRef.current.page = page;
      const p = spritesRef.current["panel"];
      p.material.map?.dispose();
      p.material.map = texture;
      p.material.needsUpdate = true;
      p.visible = true;
      panelStateRef.current.visible = true;
      panelStateRef.current.currentIndex = indexForContext;
      flashDebug(`Panel page ${page + 1}`);
    };

    const openPanelForIndex = (idx) => {
      panelStateRef.current.page = 0;
      updatePanelContent(0, idx);
      // move panel slightly under the clicked index to give context
      const pos = positions[idx];
      spritesRef.current["panel"].position.set(pos[0], -0.9, pos[2]);
      // also move panel-next plane near it
      panelNextPlane.position.set(pos[0] + 1.1, -1.3, pos[2] + 0.01);
      flashDebug(`Opened panel for index ${idx}`);
    };

    // XR select handler
    const tmpMatrix = new THREE.Matrix4();
    const onXRSelect = () => {
      tmpMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpMatrix);
      const intersects = raycaster.intersectObjects(pickableRef.current, true);
      if (intersects.length) {
        handlePick(intersects[0].object);
      } else {
        flashDebug("No hit");
      }
    };
    controller.addEventListener("select", onXRSelect);

    // Pointer fallback (desktop / touch)
    const onPointerDown = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(pickableRef.current, true);
      if (intersects.length) {
        handlePick(intersects[0].object);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Animation loop
    renderer.setAnimationLoop(() => {
      // make panel always face the camera (billboard)
      const p = spritesRef.current["panel"];
      if (p && p.visible) {
        p.quaternion.copy(camera.quaternion);
      }
      // selected and value sprites face camera as well
      Object.keys(spritesRef.current).forEach((k) => {
        const s = spritesRef.current[k];
        if (!s) return;
        if (k !== "hint") s.quaternion.copy(camera.quaternion);
      });

      renderer.render(scene, camera);
    });

    // Try to start XR session
    const tryStartXR = async () => {
      if (navigator.xr && navigator.xr.requestSession) {
        try {
          const sess = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["local-floor"],
          });
          xrSessionRef.current = sess;
          renderer.xr.setSession(sess);
          flashDebug("AR session started ✅", 1200);
        } catch (err) {
          console.warn("AR session failed:", err);
          flashDebug(
            "AR session failed (device/support). Pointer fallback active."
          );
        }
      } else {
        flashDebug("WebXR not available. Pointer fallback active.");
      }
    };
    tryStartXR();

    // resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // cleanup on unmount
    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controller.removeEventListener("select", onXRSelect);

      try {
        if (container.contains(renderer.domElement))
          container.removeChild(renderer.domElement);
      } catch (e) {
        console.warn("Renderer DOM already removed:", e.message);
      }

      if (xrSessionRef.current && xrSessionRef.current.end) {
        xrSessionRef.current.end().catch(() => {});
      }
      renderer.setAnimationLoop(null);
      renderer.dispose();

      // dispose created textures
      Object.values(spritesRef.current).forEach((s) => {
        try {
          s.material.map?.dispose();
          s.material.dispose();
        } catch (e) {}
      });
      spritesRef.current = {};
      pickableRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // simple DOM hint + debug overlay
  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg z-50">
          {debugText}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "8px 12px",
          background: "rgba(0,0,0,0.5)",
          color: "white",
          borderRadius: 8,
          fontSize: 13,
          zIndex: 50,
        }}
      >
        Tip: Tap a box to select. Tap an index to open panel.
      </div>
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          padding: "6px 10px",
          background: "#2563eb",
          color: "white",
          borderRadius: 8,
          fontSize: 13,
          zIndex: 50,
        }}
      >
        Panel: tap the right area near the panel to Next / Close
      </div>
    </div>
  );
};

export default VisualPage1AR;
