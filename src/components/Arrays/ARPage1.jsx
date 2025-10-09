import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * VisualPage1AR
 *
 * Props:
 *  - data: number[] (default [10,20,30,40])
 *  - spacing: number (default 2.0)
 *
 * Notes:
 *  - Directly requests immersive-ar session (no start button).
 *  - Uses XR controller "select" event + raycasting for tap detection.
 *  - Fallback pointer/tap raycast when XR not available for debugging in browser.
 *  - Uses canvas textures for text labels and the side definition panel.
 */
const VisualPage1AR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const xrSessionRef = useRef(null);

  const [debugText, setDebugText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const pickableMeshesRef = useRef([]); // pickable box meshes
  const spriteRefs = useRef({}); // store sprites like value label and selected label
  const panelSpriteRef = useRef(null);

  // precompute positions
  const positions = (() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  })();

  // helpers ---------------------------------------------------------------
  const makeTextTexture = (
    text,
    {
      font = "bold 48px sans-serif",
      padding = 10,
      background = "rgba(0,0,0,0)",
      color = "white",
      maxWidth = 800,
      lineHeight = 58,
    } = {}
  ) => {
    // support multi-line
    const lines = String(text).split("\n");
    // measure canvas width and height
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d");
    tctx.font = font;
    let width = 0;
    lines.forEach((line) => {
      width = Math.max(width, Math.min(tctx.measureText(line).width, maxWidth));
    });
    const height = lineHeight * lines.length;

    const canvas = document.createElement("canvas");
    // account for padding
    canvas.width = Math.ceil(width + padding * 2);
    canvas.height = Math.ceil(height + padding * 2);
    const ctx = canvas.getContext("2d");

    // optional background
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";

    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    return { texture, width: canvas.width, height: canvas.height };
  };

  const makeSpriteFromText = (text, options = {}) => {
    const { texture, width, height } = makeTextTexture(text, options);
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    // scale sprite in world units: scale relative to width/height
    const aspect = width / height;
    const baseHeight = 0.5; // world units for height
    sprite.scale.set(baseHeight * aspect, baseHeight, 1);
    return sprite;
  };

  // create box mesh
  const createBox = (value, idx, pos, sharedGeometries, sharedMaterials) => {
    const size = [1.6, 1.2, 1.0];
    const geo = sharedGeometries.boxGeo;
    const mat = sharedMaterials[idx % sharedMaterials.length];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], size[1] / 2, pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { index: idx, value };
    mesh.name = `box-${idx}`;
    return mesh;
  };

  // show debug message briefly
  const flashDebug = (msg, ms = 1500) => {
    setDebugText(msg);
    setTimeout(() => setDebugText(""), ms);
  };

  // main effect -----------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      50
    );
    camera.position.set(0, 1.6, 0); // typical eye height for AR
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.shadowMap.enabled = false; // shadows heavy for AR - disable for perf
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    rendererRef.current = renderer;

    // append DOM
    container.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.0);
    scene.add(hemi);

    // Main group that will hold the array visualization
    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 1, -2); // placed in front of user
    mainGroup.scale.set(0.12, 0.12, 0.12); // scale down to fit AR view
    scene.add(mainGroup);

    // Shared geometries/materials to optimize
    const boxGeo = new THREE.BoxGeometry(1.6, 1.2, 1.0);
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
    const sharedMaterials = [matA, matB, matSelected];

    // pickable meshes list
    pickableMeshesRef.current = [];

    // create boxes
    data.forEach((value, i) => {
      const pos = positions[i];
      const mesh = createBox(value, i, pos, { boxGeo }, sharedMaterials);
      // initially set correct material (alternate)
      mesh.material = i % 2 === 0 ? matA : matB;
      mainGroup.add(mesh);
      pickableMeshesRef.current.push(mesh);

      // value sprite (above front face)
      const valSprite = makeSpriteFromText(String(value), {
        font: "bold 60px sans-serif",
        padding: 8,
        color: "#ffffff",
        background: "rgba(0,0,0,0.55)",
      });
      valSprite.position.set(pos[0], 1.2 / 2 + 0.22, pos[2] + 0.55);
      // smaller scale since group scaled
      mainGroup.add(valSprite);
      spriteRefs.current[`val-${i}`] = valSprite;

      // index sprite (clickable area) below the box - we'll use invisible plane for raycast target
      const indexSprite = makeSpriteFromText(`[${i}]`, {
        font: "bold 42px sans-serif",
        padding: 8,
        color: "#ffeb3b",
        background: "rgba(0,0,0,0.35)",
      });
      indexSprite.position.set(pos[0], -0.36, pos[2] + 0.55);
      mainGroup.add(indexSprite);
      spriteRefs.current[`idx-${i}`] = indexSprite;

      // create an invisible thin plane in front for easier tapping (so raycast hits)
      const planeGeo = new THREE.PlaneGeometry(1.0, 0.6);
      const planeMat = new THREE.MeshBasicMaterial({ visible: false });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.set(pos[0], size[1] / 2, pos[2] + 0.51);
      plane.userData = { index: i, type: "value-plane" }; // used to detect index/value taps
      mainGroup.add(plane);
      pickableMeshesRef.current.push(plane);
      // also create small plane for index (below)
      const idxPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.4),
        planeMat
      );
      idxPlane.position.set(pos[0], -0.3, pos[2] + 0.51);
      idxPlane.userData = { index: i, type: "index-plane" };
      mainGroup.add(idxPlane);
      pickableMeshesRef.current.push(idxPlane);
    });

    // Definition panel sprite (hidden initially)
    const panelSprite = makeSpriteFromText("", {
      font: "bold 36px sans-serif",
      padding: 12,
      color: "#fde68a",
      background: "rgba(0,0,0,0.6)",
      lineHeight: 44,
    });
    panelSprite.visible = false;
    // position it to the right of main group
    panelSprite.position.set(1.5, 0.4, 0);
    panelSprite.scale.set(1.4, 1.4, 1);
    mainGroup.add(panelSprite);
    panelSpriteRef.current = panelSprite;

    // Selected label sprite (shows "Value X at index Y")
    const selSprite = makeSpriteFromText("", {
      font: "bold 44px sans-serif",
      padding: 12,
      color: "#fde68a",
      background: "rgba(0,0,0,0.45)",
    });
    selSprite.visible = false;
    selSprite.position.set(0, 2.0, 0);
    mainGroup.add(selSprite);
    spriteRefs.current["selectedLabel"] = selSprite;

    // Raycaster + controller handling
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    // controller (XR)
    const controller = renderer.xr.getController(0);

    const onXRSelect = () => {
      // cast a ray from controller forward
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObjects(
        pickableMeshesRef.current,
        true
      );
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        handlePick(hit);
      } else {
        flashDebug("No hit");
      }
    };

    controller.addEventListener("select", onXRSelect);
    scene.add(controller);

    // pointer fallback for non-XR (desktop testing & touch)
    const onPointerDown = (event) => {
      // get normalized device coords
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(
        pickableMeshesRef.current,
        true
      );
      if (intersects.length) {
        handlePick(intersects[0].object);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // handle pick logic (index or value)
    const handlePick = (object) => {
      const ud = object.userData || {};
      const idx = ud.index;
      const type = ud.type || "value-plane";
      if (typeof idx === "number") {
        if (type === "index-plane") {
          // show definition panel (pages inside sprite)
          const content = buildPanelContent(0); // page 0 initially
          updatePanel(content);
          panelSprite.visible = true;
          flashDebug(`Opened panel for index ${idx}`);
        } else {
          // value clicked: toggle selection
          toggleSelect(idx);
        }
      } else {
        flashDebug("Tapped object has no index");
      }
    };

    // build definition panel text content (string)
    const buildPanelContent = (page, localData = data) => {
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

    let panelPage = 0;
    const updatePanel = (text) => {
      if (!panelSpriteRef.current) return;
      // replace material map
      const { texture, width, height } = makeTextTexture(text, {
        font: "bold 36px sans-serif",
        padding: 12,
        color: "#fde68a",
        background: "rgba(0,0,0,0.6)",
        lineHeight: 40,
      });
      panelSpriteRef.current.material.map.dispose?.();
      panelSpriteRef.current.material.map = texture;
      panelSpriteRef.current.material.needsUpdate = true;
      panelSpriteRef.current.visible = true;
    };

    // toggle selection and update visuals
    const toggleSelect = (idx) => {
      if (selectedIndex === idx) {
        // deselect
        setSelectedIndex(null);
        flashDebug(`Deselected ${idx}`);
        // revert material
        const mesh = pickableMeshesRef.current.find(
          (m) => m.userData?.index === idx && m.type === "Mesh"
        );
        if (mesh) {
          mesh.material = idx % 2 === 0 ? matA : matB;
        }
        // hide selected label
        const s = spriteRefs.current["selectedLabel"];
        if (s) s.visible = false;
      } else {
        // select new
        setSelectedIndex(idx);
        flashDebug(`Selected index ${idx}`);
        // find the actual box mesh (not plane)
        const boxMesh = pickableMeshesRef.current.find(
          (m) =>
            m.userData?.index === idx &&
            m.geometry &&
            m.geometry.type === "BoxGeometry"
        );
        if (boxMesh) {
          boxMesh.material = matSelected;
        }
        // update selected label sprite
        const selText = `Value ${data[idx]} at index ${idx}`;
        const selSprite = spriteRefs.current["selectedLabel"];
        if (selSprite) {
          // replace texture
          const { texture, width, height } = makeTextTexture(selText, {
            font: "bold 44px sans-serif",
            padding: 12,
            color: "#fde68a",
            background: "rgba(0,0,0,0.45)",
            lineHeight: 48,
          });
          selSprite.material.map.dispose?.();
          selSprite.material.map = texture;
          selSprite.material.needsUpdate = true;
          selSprite.visible = true;
        }
        // hide panel if open
        if (panelSpriteRef.current) panelSpriteRef.current.visible = false;
      }
    };

    // simple UI: advance panel page when tapping to the right of panel area on pointerdown (desktop)
    // Also add small next/close area as plane (visible false)
    const panelNextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    panelNextPlane.position.set(1.5, -0.6, 0);
    mainGroup.add(panelNextPlane);
    pickableMeshesRef.current.push(panelNextPlane);
    panelNextPlane.userData = { type: "panel-next" };

    // handle panel next/close
    const handlePanelNext = () => {
      panelPage = (panelPage + 1) % 3;
      updatePanel(buildPanelContent(panelPage));
      if (panelPage === 0) flashDebug("Panel: page 1");
      if (panelPage === 2) flashDebug("Panel: summary");
    };

    // make sure pick handler reacts to panelNext
    const handlePickWrapper = (obj) => {
      if (!obj || !obj.userData) return;
      if (obj.userData.type === "panel-next") {
        // next page or close
        if (!panelSpriteRef.current.visible) return;
        if (panelPage < 2) {
          handlePanelNext();
        } else {
          panelSpriteRef.current.visible = false;
        }
        return;
      }
      handlePick(obj);
    };

    // replace earlier handlePick usage to wrapper
    // (we'll keep onXRSelect and onPointerDown calling handlePickWrapper)
    // Update onXRSelect and pointer handler to call wrapper:
    controller.removeEventListener("select", onXRSelect); // remove earlier bound
    const onXRSelect2 = () => {
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
      const intersects = raycaster.intersectObjects(
        pickableMeshesRef.current,
        true
      );
      if (intersects.length > 0) {
        handlePickWrapper(intersects[0].object);
      } else {
        flashDebug("No hit");
      }
    };
    controller.addEventListener("select", onXRSelect2);

    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    const onPointerDown2 = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(
        pickableMeshesRef.current,
        true
      );
      if (intersects.length) handlePickWrapper(intersects[0].object);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown2);

    // Animation loop
    renderer.setAnimationLoop(() => {
      // subtle hover animation for labels
      Object.values(spriteRefs.current).forEach((s) => {
        if (!s) return;
        s.material.rotation = (s.material.rotation || 0) * 0 + 0; // no-op for now
      });
      renderer.render(scene, camera);
    });

    // request XR session
    const tryStartXR = async () => {
      if (navigator.xr && navigator.xr.requestSession) {
        try {
          const session = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["local-floor"],
          });
          xrSessionRef.current = session;
          renderer.xr.setSession(session);
          flashDebug("AR session started ✅", 1200);
        } catch (err) {
          console.error("AR session failed:", err);
          flashDebug("AR session failed (check device/support)");
        }
      } else {
        flashDebug("WebXR not available on this browser");
      }
    };

    tryStartXR();

    // resize handler
    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown2);
      controller.removeEventListener("select", onXRSelect2);

      try {
        if (container.contains(renderer.domElement))
          container.removeChild(renderer.domElement);
      } catch (e) {
        console.warn("Renderer already removed:", e.message);
      }
      // End XR session if started
      if (xrSessionRef.current && xrSessionRef.current.end) {
        xrSessionRef.current.end().catch(() => {});
      }
      // stop render loop & dispose
      renderer.setAnimationLoop(null);
      renderer.dispose();
      // clear textures
      Object.values(spriteRefs.current).forEach((s) => {
        try {
          s.material.map?.dispose();
          s.material.dispose();
        } catch {}
      });
      panelSpriteRef.current?.material.map?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // small controls for panel navigation (desktop UI)
  const onPanelNextClick = () => {
    // simulate next press by raycasting to the panel-next plane
    setDebugText("Panel next (desktop)");
    setTimeout(() => setDebugText(""), 1000);
    // we can't directly access internals here safely; user should tap in AR or use pointer on canvas
  };

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg z-50">
          {debugText}
        </div>
      )}

      {/* Small on-screen hint for non-XR testing */}
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

      {/* Optional small control for panel next (desktop only) */}
      <button
        onClick={onPanelNextClick}
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          zIndex: 50,
        }}
      >
        Panel Next (desktop)
      </button>
    </div>
  );
};

export default VisualPage1AR;
