"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  createTextSprite,
  create3DTextBox,
  applyItemAnimation,
  clearGroup,
  createHuman3D,
} from "../../pages/simulations/Simulationhelpers";

function createGroceryBox(color, label, isHighlighted) {
  const product = new THREE.Group();
  const boxWidth = 0.28,
    boxHeight = 0.42,
    boxDepth = 0.08;
  const bodyGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.05,
    emissive: isHighlighted ? "#ffff00" : "#000000",
    emissiveIntensity: isHighlighted ? 0.4 : 0,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = boxHeight / 2;
  product.add(body);
  const frontCanvas = document.createElement("canvas");
  frontCanvas.width = 140;
  frontCanvas.height = 210;
  const fctx = frontCanvas.getContext("2d");
  const grad = fctx.createLinearGradient(0, 0, 0, 210);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, "#ffffff");
  fctx.fillStyle = grad;
  fctx.fillRect(0, 0, 140, 210);
  fctx.fillStyle = "#fff";
  fctx.fillRect(5, 5, 130, 30);
  fctx.fillStyle = "#e74c3c";
  fctx.font = "bold 12px Arial";
  fctx.textAlign = "center";
  fctx.fillText("★ BREAKFAST ★", 70, 24);
  fctx.fillStyle = "#2c3e50";
  fctx.font = "bold 16px Arial";
  fctx.fillText(label, 70, 155);
  const frontTex = new THREE.CanvasTexture(frontCanvas);
  const frontLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(boxWidth - 0.01, boxHeight - 0.01),
    new THREE.MeshBasicMaterial({ map: frontTex, transparent: true }),
  );
  frontLabel.position.set(0, boxHeight / 2, boxDepth / 2 + 0.001);
  product.add(frontLabel);
  if (isHighlighted) {
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(boxWidth + 0.04, boxHeight + 0.04, boxDepth + 0.04),
      new THREE.MeshBasicMaterial({
        color: "#ffff00",
        transparent: true,
        opacity: 0.15,
      }),
    );
    glow.position.y = boxHeight / 2;
    product.add(glow);
  }
  return product;
}

function createChair() {
  const chair = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0.8,
    roughness: 0.3,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: "#2c3e50",
    roughness: 0.8,
  });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.26), seatMat);
  seat.position.y = 0;
  chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.03), seatMat);
  back.position.set(0, 0.14, -0.12);
  chair.add(back);
  const legGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
  [
    [-0.11, -0.14, 0.1],
    [0.11, -0.14, 0.1],
    [-0.11, -0.14, -0.1],
    [0.11, -0.14, -0.1],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(lx, ly, lz);
    chair.add(leg);
  });
  return chair;
}

function createDesk() {
  const desk = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: "#a0855b",
    roughness: 0.7,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: "#555555",
    metalness: 0.6,
    roughness: 0.4,
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.025, 0.28), woodMat);
  top.position.y = 0;
  desk.add(top);
  const legGeo = new THREE.BoxGeometry(0.025, 0.28, 0.025);
  [
    [-0.17, -0.15, 0.11],
    [0.17, -0.15, 0.11],
    [-0.17, -0.15, -0.11],
    [0.17, -0.15, -0.11],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(lx, ly, lz);
    desk.add(leg);
  });
  return desk;
}

function createClipboard(label, color, isHighlighted) {
  const clipboard = new THREE.Group();
  const boardMat = new THREE.MeshStandardMaterial({
    color: "#6d4c2a",
    roughness: 0.65,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.25 : 0,
  });
  clipboard.add(
    new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.025), boardMat),
  );
  const paperCanvas = document.createElement("canvas");
  paperCanvas.width = 190;
  paperCanvas.height = 280;
  const pctx = paperCanvas.getContext("2d");
  pctx.fillStyle = "#fefef6";
  pctx.fillRect(0, 0, 190, 280);
  pctx.fillStyle = color;
  pctx.fillRect(0, 0, 190, 40);
  pctx.fillStyle = "#fff";
  pctx.font = "bold 18px Arial";
  pctx.textAlign = "center";
  pctx.fillText("TO-DO", 95, 28);
  pctx.fillStyle = "#333";
  pctx.font = "bold 22px Arial";
  pctx.fillText(label, 95, 100);
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.46),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(paperCanvas) }),
  );
  paper.position.z = 0.014;
  clipboard.add(paper);
  if (isHighlighted) {
    clipboard.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.54, 0.04),
        new THREE.MeshBasicMaterial({
          color: "#ffff00",
          transparent: true,
          opacity: 0.12,
        }),
      ),
    );
  }
  return clipboard;
}

function buildArrayScene(
  group,
  data,
  highlightIndex,
  highlightIndex2,
  environment,
  animPhase,
  animData,
  animProgress,
  tutorialText,
) {
  clearGroup(group);
  if (tutorialText || animPhase) {
    highlightIndex = null;
    highlightIndex2 = null;
  }
  const groundY = 0;
  if (tutorialText) {
    let textY = environment === "grocery" ? 1.6 : 1.2;
    group.add(
      create3DTextBox(
        tutorialText.title,
        tutorialText.description,
        tutorialText.step,
        new THREE.Vector3(0, textY, 0),
      ),
    );
  }
  if (environment === "grocery") {
    const itemsPerRow = 4,
      rowSpacing = 0.55,
      itemSpacing = 0.38;
    const numRows = Math.max(2, Math.ceil(data.length / itemsPerRow));
    const shelfWidth = itemsPerRow * itemSpacing + 0.4;
    const metalMat = new THREE.MeshStandardMaterial({
      color: "#666666",
      metalness: 0.8,
      roughness: 0.3,
    });
    const shelfBoardMat = new THREE.MeshStandardMaterial({
      color: "#d0d0d0",
      metalness: 0.3,
      roughness: 0.5,
    });
    [-shelfWidth / 2 - 0.05, shelfWidth / 2 + 0.05].forEach((x) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, numRows * rowSpacing + 0.3, 0.04),
        metalMat,
      );
      post.position.set(x, (numRows * rowSpacing) / 2 - 0.1, -0.15);
      group.add(post);
    });
    for (let row = 0; row < numRows; row++) {
      const shelfY = groundY + 0.08 + row * rowSpacing;
      const shelfBoard = new THREE.Mesh(
        new THREE.BoxGeometry(shelfWidth, 0.02, 0.35),
        shelfBoardMat,
      );
      shelfBoard.position.set(0, shelfY, 0);
      group.add(shelfBoard);
      const rowStartIdx = row * itemsPerRow;
      const rowItems = data.slice(rowStartIdx, rowStartIdx + itemsPerRow);
      rowItems.forEach((item, i) => {
        const actualIndex = rowStartIdx + i;
        const isHl =
          highlightIndex === actualIndex || highlightIndex2 === actualIndex;
        const itemX = -((itemsPerRow - 1) * itemSpacing) / 2 + i * itemSpacing;
        const cerealLabels = [
          "Coco Crunch",
          "Corn Flakes",
          "Froot Loops",
          "Cheerios",
          "Frosted",
          "Granola",
        ];
        const product = createGroceryBox(
          item.color,
          cerealLabels[actualIndex % cerealLabels.length] || item.label,
          isHl,
        );
        product.position.set(itemX, shelfY + 0.08, 0);
        if (isHl) product.position.y += 0.06;
        applyItemAnimation(
          product,
          actualIndex,
          animPhase || "",
          animData || {},
          "array",
          animProgress,
        );
        group.add(product);
        const idx = createTextSprite(
          `[${actualIndex}]`,
          isHl ? "#ffff00" : "#ffffff",
          18,
        );
        idx.position.set(itemX, shelfY - 0.08, 0.2);
        idx.scale.set(0.22, 0.11, 1);
        group.add(idx);
      });
    }
  } else if (environment === "classroom") {
    const floorY = groundY - 0.25;
    const roomWidth = Math.max(2.5, data.length * 0.85 + 1.5);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, 2.2),
      new THREE.MeshStandardMaterial({ color: "#c4a882", roughness: 0.7 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    group.add(floor);
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, 1.2),
      new THREE.MeshStandardMaterial({ color: "#f5f0e6", roughness: 0.9 }),
    );
    backWall.position.set(0, floorY + 0.6, -1.1);
    group.add(backWall);
    const whiteBoard = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth * 0.6, 0.45, 0.02),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 }),
    );
    whiteBoard.position.set(0, floorY + 0.7, -1.08);
    group.add(whiteBoard);
    const studentsPerRow = 3,
      colSpacing = 0.65;
    data.forEach((item, i) => {
      const row = Math.floor(i / studentsPerRow),
        col = i % studentsPerRow;
      const isHl = highlightIndex === i || highlightIndex2 === i;
      const rowItemCount = Math.min(
        studentsPerRow,
        data.length - row * studentsPerRow,
      );
      const rowStartX = -((rowItemCount - 1) * colSpacing) / 2;
      const posX = rowStartX + col * colSpacing,
        posZ = -0.5 + row * 0.5;
      const chair = createChair();
      chair.position.set(posX, floorY + 0.25, posZ);
      chair.scale.setScalar(0.7);
      group.add(chair);
      const desk = createDesk();
      desk.position.set(posX, floorY + 0.28, posZ + 0.25);
      desk.scale.setScalar(0.7);
      group.add(desk);
      const appearance = item.appearance || {
        skinTone: "#f5c6a0",
        shirtColor: item.color,
        pantsColor: "#2c3e50",
        hairColor: "#3d2314",
        hairStyle: "short",
        gender: "male",
      };
      const human = createHuman3D(appearance, item.label, isHl, true, 0);
      human.position.set(posX, floorY + 0.25, posZ);
      human.scale.setScalar(0.7);
      applyItemAnimation(
        human,
        i,
        animPhase || "",
        animData || {},
        "array",
        animProgress,
      );
      group.add(human);
      const idx = createTextSprite(`[${i}]`, isHl ? "#ffff00" : "#ffffff", 20);
      idx.position.set(posX, floorY - 0.06, posZ + 0.3);
      idx.scale.set(0.22, 0.11, 1);
      group.add(idx);
    });
  } else if (environment === "todo") {
    const floorY = groundY - 0.25,
      deskSpacing = 0.55;
    const numDesks = Math.max(4, data.length);
    const rowStartX = -((numDesks - 1) * deskSpacing) / 2;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(2.5, numDesks * deskSpacing + 1), 1.2),
      new THREE.MeshStandardMaterial({ color: "#c4a882", roughness: 0.7 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    group.add(floor);
    for (let i = 0; i < numDesks; i++) {
      const posX = rowStartX + i * deskSpacing;
      const desk = createDesk();
      desk.position.set(posX, floorY + 0.28, 0);
      desk.scale.setScalar(0.65);
      group.add(desk);
      const idx = createTextSprite(
        `[${i}]`,
        i < data.length ? "#ffffff" : "#555555",
        16,
      );
      idx.position.set(posX, floorY + 0.08, 0.2);
      idx.scale.set(0.18, 0.09, 1);
      group.add(idx);
    }
    data.forEach((item, i) => {
      const isHl = highlightIndex === i || highlightIndex2 === i;
      const posX = rowStartX + i * deskSpacing;
      const clipboard = createClipboard(item.label, item.color, isHl);
      clipboard.position.set(posX, floorY + 0.38, 0);
      clipboard.scale.setScalar(0.35);
      clipboard.rotation.x = -0.3;
      applyItemAnimation(
        clipboard,
        i,
        animPhase || "",
        animData || {},
        "array",
        animProgress,
      );
      group.add(clipboard);
    });
  }
}

export default function ArraySimulation({ onExit }) {
  const [environment, setEnvironment] = useState("grocery");
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [highlightIndex2, setHighlightIndex2] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState("");
  const [animData, setAnimData] = useState({});
  const [animProgress, setAnimProgress] = useState(1);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnimating, setStepAnimating] = useState(false);
  const [tutorialText, setTutorialText] = useState(null);
  const [selectionMode, setSelectionMode] = useState("none");
  const [swapFirstIndex, setSwapFirstIndex] = useState(null);
  const [pendingOperation, setPendingOperation] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1.0);
  // ✅ NEW: track if at least one tutorial was fully completed
  const [tutorialCompletedOnce, setTutorialCompletedOnce] = useState(false);

  const [webxrSupported, setWebxrSupported] = useState(false);
  const [webxrActive, setWebxrActive] = useState(false);
  const [webxrPlaced, setWebxrPlaced] = useState(false);

  const xrSessionRef = useRef(null);
  const xrRendererRef = useRef(null);
  const xrSceneRef = useRef(null);
  const xrCameraRef = useRef(null);
  const xrGroupRef = useRef(null);
  const xrReticleRef = useRef(null);
  const xrHitTestSourceRef = useRef(null);
  const xrContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [groceryItems, setGroceryItems] = useState([
    { id: 1, label: "Coco Crunch", color: "#8B4513" },
    { id: 2, label: "Corn Flakes", color: "#f39c12" },
    { id: 3, label: "Froot Loops", color: "#e74c3c" },
    { id: 4, label: "Cheerios", color: "#f1c40f" },
    { id: 5, label: "Frosted", color: "#3498db" },
  ]);
  const [students, setStudents] = useState([
    {
      id: 1,
      label: "Alex",
      color: "#3498db",
      appearance: {
        skinTone: "#f5c6a0",
        shirtColor: "#3498db",
        pantsColor: "#2c3e50",
        hairColor: "#3d2314",
        hairStyle: "short",
        gender: "male",
      },
    },
    {
      id: 2,
      label: "Beth",
      color: "#e91e63",
      appearance: {
        skinTone: "#f5c6a0",
        shirtColor: "#e91e63",
        pantsColor: "#1a1a2e",
        hairColor: "#2c1810",
        hairStyle: "long",
        gender: "female",
      },
    },
    {
      id: 3,
      label: "Carl",
      color: "#27ae60",
      appearance: {
        skinTone: "#8d5524",
        shirtColor: "#27ae60",
        pantsColor: "#2c3e50",
        hairColor: "#1a1a1a",
        hairStyle: "short",
        gender: "male",
      },
    },
    {
      id: 4,
      label: "Dana",
      color: "#f39c12",
      appearance: {
        skinTone: "#c68642",
        shirtColor: "#f39c12",
        pantsColor: "#3498db",
        hairColor: "#3d2314",
        hairStyle: "long",
        gender: "female",
      },
    },
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, label: "Study", color: "#e74c3c" },
    { id: 2, label: "Code", color: "#3498db" },
    { id: 3, label: "Read", color: "#f39c12" },
    { id: 4, label: "Rest", color: "#2ecc71" },
  ]);

  const getData = () =>
    environment === "grocery"
      ? groceryItems
      : environment === "classroom"
        ? students
        : tasks;
  const setData =
    environment === "grocery"
      ? setGroceryItems
      : environment === "classroom"
        ? setStudents
        : setTasks;

  useEffect(() => {
    const checkXR = async () => {
      try {
        if (navigator.xr) {
          const supported =
            await navigator.xr.isSessionSupported("immersive-ar");
          setWebxrSupported(supported);
        }
      } catch {}
    };
    checkXR();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!webxrPlaced || !xrGroupRef.current) return;
    buildArrayScene(
      xrGroupRef.current,
      getData(),
      highlightIndex,
      highlightIndex2,
      environment,
      animPhase,
      animData,
      animProgress,
      tutorialText,
    );
  }, [
    webxrPlaced,
    groceryItems,
    students,
    tasks,
    highlightIndex,
    highlightIndex2,
    environment,
    animPhase,
    animData,
    animProgress,
    tutorialText,
  ]);

  useEffect(() => {
    if (xrGroupRef.current && webxrActive && webxrPlaced)
      xrGroupRef.current.scale.setScalar(0.3 * zoomLevel);
  }, [zoomLevel, webxrActive, webxrPlaced]);

  const cleanupWebXR = useCallback(() => {
    if (xrRendererRef.current) {
      xrRendererRef.current.setAnimationLoop(null);
      xrRendererRef.current.dispose();
      if (
        xrContainerRef.current &&
        xrRendererRef.current.domElement.parentNode === xrContainerRef.current
      )
        xrContainerRef.current.removeChild(xrRendererRef.current.domElement);
    }
    xrSessionRef.current = null;
    xrRendererRef.current = null;
    xrSceneRef.current = null;
    xrCameraRef.current = null;
    xrGroupRef.current = null;
    xrReticleRef.current = null;
    xrHitTestSourceRef.current = null;
    setWebxrActive(false);
    setWebxrPlaced(false);
  }, []);

  const stopWebXR = useCallback(() => {
    if (xrSessionRef.current) {
      try {
        xrSessionRef.current.end();
      } catch {
        cleanupWebXR();
      }
    } else cleanupWebXR();
  }, [cleanupWebXR]);

  const resetWebXRPlacement = useCallback(() => {
    if (xrGroupRef.current) xrGroupRef.current.visible = false;
    if (xrReticleRef.current) xrReticleRef.current.visible = true;
    setWebxrPlaced(false);
  }, []);

  const startWebXR = async () => {
    const xr = navigator.xr;
    if (!xr) {
      alert("WebXR not available.");
      return;
    }
    try {
      const sessionInit = {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
      };
      const overlayEl = document.getElementById("ar-overlay-array");
      if (overlayEl) sessionInit.domOverlay = { root: overlayEl };
      const session = await xr.requestSession("immersive-ar", sessionInit);
      xrSessionRef.current = session;
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local");
      xrRendererRef.current = renderer;
      if (xrContainerRef.current)
        xrContainerRef.current.appendChild(renderer.domElement);
      await renderer.xr.setSession(session);
      const scene = new THREE.Scene();
      xrSceneRef.current = scene;
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(1, 3, 2);
      scene.add(dirLight);
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        100,
      );
      xrCameraRef.current = camera;
      const group = new THREE.Group();
      group.visible = false;
      scene.add(group);
      xrGroupRef.current = group;
      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      xrReticleRef.current = reticle;
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      xrHitTestSourceRef.current = hitTestSource;
      session.addEventListener("select", () => {
        if (
          xrReticleRef.current?.visible &&
          xrGroupRef.current &&
          !xrGroupRef.current.visible
        ) {
          xrGroupRef.current.position.setFromMatrixPosition(
            xrReticleRef.current.matrix,
          );
          xrGroupRef.current.visible = true;
          xrGroupRef.current.scale.setScalar(0.3 * zoomLevel);
          xrReticleRef.current.visible = false;
          setWebxrPlaced(true);
          buildArrayScene(
            xrGroupRef.current,
            getData(),
            null,
            null,
            environment,
            "",
            {},
            1,
            null,
          );
        }
      });
      session.addEventListener("end", () => cleanupWebXR());
      renderer.setAnimationLoop((_ts, frame) => {
        if (
          frame &&
          xrHitTestSourceRef.current &&
          xrGroupRef.current &&
          !xrGroupRef.current.visible
        ) {
          const refSpace = renderer.xr.getReferenceSpace();
          if (refSpace) {
            const results = frame.getHitTestResults(xrHitTestSourceRef.current);
            if (results.length > 0) {
              const pose = results[0].getPose(refSpace);
              if (pose && xrReticleRef.current) {
                xrReticleRef.current.visible = true;
                xrReticleRef.current.matrix.fromArray(pose.transform.matrix);
              }
            } else if (xrReticleRef.current)
              xrReticleRef.current.visible = false;
          }
        }
        renderer.render(scene, camera);
      });
      setWebxrActive(true);
      setWebxrPlaced(false);
    } catch (err) {
      console.error(err);
      alert("WebXR failed: " + err.message);
    }
  };

  const smoothAnimate = (duration, phase, data) =>
    new Promise((resolve) => {
      const startTime = Date.now();
      setAnimPhase(phase);
      setAnimData(data);
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimProgress(progress);
        if (progress < 1) animFrameRef.current = requestAnimationFrame(animate);
        else resolve();
      };
      animFrameRef.current = requestAnimationFrame(animate);
    });

  const generateNewItem = () => {
    if (environment === "classroom") {
      const names = ["Emma", "Liam", "Mia", "Noah", "Ava", "Jack"];
      const shirtColors = [
        "#1abc9c",
        "#9b59b6",
        "#e74c3c",
        "#3498db",
        "#f39c12",
      ];
      const color = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      return {
        id: Date.now(),
        label: names[Math.floor(Math.random() * names.length)],
        color,
        appearance: {
          skinTone: "#f5c6a0",
          shirtColor: color,
          pantsColor: "#2c3e50",
          hairColor: "#3d2314",
          hairStyle: "short",
          gender: "male",
        },
      };
    } else if (environment === "todo") {
      const taskNames = ["Meeting", "Email", "Report", "Call", "Review"];
      const taskColors = [
        "#e74c3c",
        "#3498db",
        "#2ecc71",
        "#f39c12",
        "#9b59b6",
      ];
      return {
        id: Date.now(),
        label: taskNames[Math.floor(Math.random() * taskNames.length)],
        color: taskColors[Math.floor(Math.random() * taskColors.length)],
      };
    } else {
      const cerealNames = ["Granola", "Muesli", "Bran", "Oats"];
      const cerealColors = ["#8B4513", "#D2691E", "#CD853F", "#DEB887"];
      return {
        id: Date.now(),
        label: cerealNames[Math.floor(Math.random() * cerealNames.length)],
        color: cerealColors[Math.floor(Math.random() * cerealColors.length)],
      };
    }
  };

  const runTutorialStep = async (step, stepIdx, allSteps) => {
    setStepAnimating(true);
    setTutorialText({
      title: step.title,
      description: step.description,
      step: `${stepIdx + 1}/${allSteps.length}`,
    });
    setHighlightIndex(step.highlightIndex ?? null);
    setHighlightIndex2(step.highlightIndex2 ?? null);
    if (step.animPhase && step.animDuration) {
      await smoothAnimate(step.animDuration, step.animPhase, {
        index: step.highlightIndex,
        index1: step.highlightIndex,
        index2: step.highlightIndex2,
      });
    } else {
      setAnimPhase("");
      setAnimData({});
      setAnimProgress(1);
    }
    if (step.action) step.action();
    setStepAnimating(false);
  };

  const nextStep = async () => {
    if (stepAnimating) return;
    if (currentStepIndex < tutorialSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      await runTutorialStep(tutorialSteps[nextIdx], nextIdx, tutorialSteps);
    } else {
      // ✅ Reached last step via Next — mark as completed
      completeTutorial();
    }
  };

  // ✅ Skip — hindi nagbi-bigay ng progress
  const skipTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setHighlightIndex2(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
    // walang onProgress call dito
  };

  // ✅ Complete — nagbi-bigay ng progress
  const completeTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setHighlightIndex2(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
    setTutorialCompletedOnce(true);
    onProgress?.(); // ✅ progress only on actual completion
  };

  const startTutorial = (steps) => {
    if (isAnimating || tutorialActive) return;
    setIsAnimating(true);
    setTutorialActive(true);
    setTutorialSteps(steps);
    setCurrentStepIndex(0);
    runTutorialStep(steps[0], 0, steps);
  };

  const arrayAppendTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive || data.length >= 8) return;
    const newIndex = data.length;
    const newItem = generateNewItem();
    startTutorial([
      {
        title: "➕ Append to End",
        description: `Adding "${newItem.label}" to the END.\n\nCurrent length: ${data.length}\nNew element at: [${newIndex}]`,
      },
      {
        title: "📍 Direct Placement",
        description: `No shifting needed!\n\narray[${newIndex}] = "${newItem.label}"\nlength = ${newIndex + 1}`,
        highlightIndex: newIndex,
        action: () => setData((prev) => [...prev, newItem]),
      },
      {
        title: "⚡ Placing...",
        description: "Placing element at end...",
        highlightIndex: newIndex,
        animPhase: "insert-drop",
        animDuration: 600,
      },
      {
        title: "✅ Appended!",
        description: `"${newItem.label}" added!\n\nTime: O(1) - Constant!`,
        highlightIndex: newIndex,
        animPhase: "insert-settle",
        animDuration: 400,
      },
    ]);
  };

  const arrayInsertTutorial = (insertIndex) => {
    const data = getData();
    const newItem = generateNewItem();
    const steps = [
      {
        title: "➕ Array Insert",
        description: `Inserting at index [${insertIndex}].\n\nMust shift elements first!`,
      },
    ];
    for (let i = data.length - 1; i >= insertIndex; i--) {
      steps.push({
        title: `↗️ Shift [${i}] → [${i + 1}]`,
        description: "Moving element right",
        highlightIndex: i,
        animPhase: "access-lift",
        animDuration: 250,
      });
    }
    steps.push(
      {
        title: "📦 Place Element",
        description: `array[${insertIndex}] = "${newItem.label}"`,
        highlightIndex: insertIndex,
        animPhase: "insert-drop",
        animDuration: 600,
        action: () =>
          setData((prev) => {
            const arr = [...prev];
            arr.splice(insertIndex, 0, newItem);
            return arr;
          }),
      },
      {
        title: "✅ Inserted!",
        description: "Done! Time: O(n)",
        highlightIndex: insertIndex,
        animPhase: "insert-settle",
        animDuration: 400,
      },
    );
    startTutorial(steps);
  };

  const arrayDeleteTutorial = (deleteIndex) => {
    const data = getData();
    if (data.length === 0) {
      startTutorial([
        { title: "⚠️ Cannot Delete!", description: "Array is EMPTY!" },
      ]);
      return;
    }
    const deletedItem = data[deleteIndex];
    const steps = [
      {
        title: "🗑️ Array Delete",
        description: `Deleting "${deletedItem?.label}" at [${deleteIndex}]`,
        highlightIndex: deleteIndex,
      },
      {
        title: "🎯 Remove Element",
        description: "Removing element...",
        highlightIndex: deleteIndex,
        animPhase: "delete-lift",
        animDuration: 600,
      },
      {
        title: "💨 Element Gone",
        description: "Removed!",
        highlightIndex: deleteIndex,
        animPhase: "delete-shrink",
        animDuration: 600,
      },
    ];
    if (data.length > 1 && deleteIndex < data.length - 1) {
      for (let i = deleteIndex; i < data.length - 1; i++) {
        steps.push({
          title: `↙️ Shift [${i + 1}] → [${i}]`,
          description: "Filling gap",
          highlightIndex: i,
          animPhase: "access-settle",
          animDuration: 250,
        });
      }
    }
    steps.push({
      title: "✅ Deleted!",
      description: `Size: ${data.length} → ${data.length - 1}`,
      animPhase: "delete-close",
      animDuration: 500,
      action: () => setData((prev) => prev.filter((_, i) => i !== deleteIndex)),
    });
    startTutorial(steps);
  };

  const arraySwapTutorial = (idx1, idx2) => {
    startTutorial([
      {
        title: "🔀 Array Swap",
        description: `Swapping [${idx1}] ↔ [${idx2}]`,
        highlightIndex: idx1,
        highlightIndex2: idx2,
      },
      {
        title: "📦 Save temp",
        description: `temp = array[${idx1}]`,
        highlightIndex: idx1,
        highlightIndex2: idx2,
        animPhase: "swap-lift",
        animDuration: 500,
      },
      {
        title: "➡️ Copy",
        description: `array[${idx1}] = array[${idx2}]`,
        highlightIndex: idx1,
        highlightIndex2: idx2,
        animPhase: "swap-cross",
        animDuration: 500,
      },
      {
        title: "⬅️ Use temp",
        description: `array[${idx2}] = temp`,
        highlightIndex: idx1,
        highlightIndex2: idx2,
        action: () =>
          setData((prev) => {
            const arr = [...prev];
            [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
            return arr;
          }),
      },
      {
        title: "✅ Swapped!",
        description: "Done! Time: O(1)",
        highlightIndex: idx1,
        highlightIndex2: idx2,
        animPhase: "swap-drop",
        animDuration: 500,
      },
    ]);
  };

  const handleIndexSelect = (index) => {
    if (selectionMode === "insert") {
      setSelectionMode("none");
      setPendingOperation("");
      arrayInsertTutorial(index);
    } else if (selectionMode === "delete") {
      setSelectionMode("none");
      setPendingOperation("");
      arrayDeleteTutorial(index);
    } else if (selectionMode === "swap-first") {
      setSwapFirstIndex(index);
      setHighlightIndex(index);
      setSelectionMode("swap-second");
      setPendingOperation(`Selected [${index}]. Now select SECOND:`);
    } else if (
      selectionMode === "swap-second" &&
      swapFirstIndex !== null &&
      index !== swapFirstIndex
    ) {
      setSelectionMode("none");
      setPendingOperation("");
      setHighlightIndex(null);
      arraySwapTutorial(swapFirstIndex, index);
      setSwapFirstIndex(null);
    }
  };

  const cancelSelection = () => {
    setSelectionMode("none");
    setPendingOperation("");
    setSwapFirstIndex(null);
    setHighlightIndex(null);
    setHighlightIndex2(null);
  };

  const data = getData();

  return (
    <div
      id="ar-overlay-array"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <div
        ref={xrContainerRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: webxrActive ? 1 : -1,
          pointerEvents: "none",
        }}
      />

      {/* Environment Tabs */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          background: "rgba(0,0,0,0.8)",
          padding: 4,
          borderRadius: 25,
          zIndex: 10,
        }}
      >
        {[
          { id: "grocery", icon: "🛒", label: "Shelf" },
          { id: "classroom", icon: "🧑‍🎓", label: "Class" },
          { id: "todo", icon: "📝", label: "Tasks" },
        ].map((e) => (
          <button
            key={e.id}
            onClick={() => !isAnimating && setEnvironment(e.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: "bold",
              border: "none",
              borderRadius: 20,
              background: environment === e.id ? "#10b981" : "transparent",
              color: "white",
              opacity: environment === e.id ? 1 : 0.6,
              cursor: "pointer",
            }}
          >
            {e.icon} {e.label}
          </button>
        ))}
      </div>

      {webxrActive && (
        <button
          onClick={() => {
            stopWebXR();
            onExit?.();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "12px 20px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: "bold",
            zIndex: 300,
            cursor: "pointer",
          }}
        >
          ✕ Exit AR
        </button>
      )}

      {webxrPlaced && !tutorialActive && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 200,
          }}
        >
          <button
            onPointerDown={() => setZoomLevel((p) => Math.min(p + 0.25, 3))}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#667eea",
              color: "white",
              fontSize: 28,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#000",
              border: "3px solid #0f0",
              color: "#0f0",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onPointerDown={() => setZoomLevel((p) => Math.max(p - 0.25, 0.3))}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#f5576c",
              color: "white",
              fontSize: 32,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            −
          </button>
          <button
            onPointerDown={() => setZoomLevel(1.0)}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#4facfe",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ⟲
          </button>
        </div>
      )}

      {webxrPlaced && (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
          }}
        >
          <button
            onClick={resetWebXRPlacement}
            style={{
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: "bold",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20,
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
            }}
          >
            📍 Reposition AR
          </button>
        </div>
      )}

      {/* Tutorial Progress Bar */}
      {tutorialActive && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,0,0,0.7)",
            padding: "10px 20px",
            borderRadius: 30,
            border: "1px solid rgba(255,255,255,0.2)",
            zIndex: 200,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: "bold",
              minWidth: 50,
            }}
          >
            {currentStepIndex + 1}/{tutorialSteps.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    i <= currentStepIndex ? "#667eea" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
          {/* ✅ Skip — walang progress */}
          <button
            onClick={skipTutorial}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20,
              color: "white",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Skip
          </button>
          {/* ✅ Next / Done — may progress kapag Done */}
          <button
            onClick={nextStep}
            disabled={stepAnimating}
            style={{
              padding: "10px 24px",
              background: stepAnimating
                ? "#555"
                : "linear-gradient(135deg,#667eea,#764ba2)",
              border: "none",
              borderRadius: 20,
              color: "white",
              fontSize: 14,
              fontWeight: "bold",
              cursor: stepAnimating ? "not-allowed" : "pointer",
              opacity: stepAnimating ? 0.7 : 1,
            }}
          >
            {stepAnimating
              ? "⏳"
              : currentStepIndex >= tutorialSteps.length - 1
                ? "✓ Done"
                : "Next →"}
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      {!tutorialActive && (webxrPlaced || !webxrActive) && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 10px 30px",
            background: "linear-gradient(to top,rgba(0,0,0,0.95),transparent)",
            zIndex: 100,
          }}
        >
          {/* ✅ Mark as Complete button — visible after at least 1 tutorial completed */}
          {tutorialCompletedOnce && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <button
                onClick={() => onFinish?.()}
                style={{
                  padding: "12px 28px",
                  fontSize: 13,
                  fontWeight: "bold",
                  border: "2px solid #10b981",
                  borderRadius: 25,
                  background: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                  cursor: "pointer",
                }}
              >
                ✅ Finish & Continue
              </button>
            </div>
          )}

          {selectionMode !== "none" && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  textAlign: "center",
                  color: "#ffff00",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                {pendingOperation}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {data.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleIndexSelect(i)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border:
                        highlightIndex === i || swapFirstIndex === i
                          ? "3px solid #ffff00"
                          : "2px solid rgba(255,255,255,0.5)",
                      background:
                        highlightIndex === i || swapFirstIndex === i
                          ? "#ffff00"
                          : "rgba(255,255,255,0.15)",
                      color:
                        highlightIndex === i || swapFirstIndex === i
                          ? "#000"
                          : "#fff",
                      fontSize: 16,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    [{i}]
                  </button>
                ))}
                {selectionMode === "insert" && (
                  <button
                    onClick={() => handleIndexSelect(data.length)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "2px dashed rgba(255,255,255,0.5)",
                      background: "rgba(46,204,113,0.3)",
                      color: "#2ecc71",
                      fontSize: 14,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    [{data.length}]
                  </button>
                )}
              </div>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button
                  onClick={cancelSelection}
                  style={{
                    padding: "8px 20px",
                    fontSize: 12,
                    fontWeight: "bold",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 20,
                    background: "rgba(231,76,60,0.3)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {selectionMode === "none" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "➕ Append",
                  color: "#2ecc71",
                  disabled: isAnimating || data.length >= 8,
                  onClick: arrayAppendTutorial,
                },
                {
                  label: "📥 Insert",
                  color: "#3498db",
                  disabled: isAnimating || data.length >= 8,
                  onClick: () => {
                    if (
                      !isAnimating &&
                      selectionMode === "none" &&
                      !tutorialActive &&
                      data.length < 8
                    ) {
                      setSelectionMode("insert");
                      setPendingOperation("Select index to INSERT at:");
                    }
                  },
                },
                {
                  label: "🗑️ Delete",
                  color: "#e74c3c",
                  disabled: isAnimating,
                  onClick: () => {
                    if (
                      !isAnimating &&
                      selectionMode === "none" &&
                      !tutorialActive
                    ) {
                      if (data.length === 0) {
                        startTutorial([
                          {
                            title: "⚠️ Cannot Delete!",
                            description: "Array is EMPTY!",
                          },
                        ]);
                        return;
                      }
                      setSelectionMode("delete");
                      setPendingOperation("Select index to DELETE:");
                    }
                  },
                },
                {
                  label: "🔀 Swap",
                  color: "#9b59b6",
                  disabled: isAnimating || data.length < 2,
                  onClick: () => {
                    if (
                      !isAnimating &&
                      selectionMode === "none" &&
                      !tutorialActive &&
                      data.length >= 2
                    ) {
                      setSelectionMode("swap-first");
                      setSwapFirstIndex(null);
                      setPendingOperation("Select FIRST index to swap:");
                    }
                  },
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: 25,
                    background: btn.disabled ? "#555" : btn.color,
                    color: "white",
                    opacity: btn.disabled ? 0.5 : 1,
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    minWidth: 70,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              textAlign: "center",
              marginTop: 10,
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
            }}
          >
            Size: {data.length}
          </div>
        </div>
      )}

      {!webxrActive && webxrSupported && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "40px 50px",
            borderRadius: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60 }}>📊</div>
          <h2 style={{ marginTop: 15 }}>Array AR</h2>
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            Visualize arrays in augmented reality
          </p>
          <button
            onClick={startWebXR}
            style={{
              marginTop: 25,
              padding: "15px 40px",
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              border: "none",
              borderRadius: 30,
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🌐 Start AR
          </button>
        </div>
      )}
      {!webxrActive && !webxrSupported && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "40px 50px",
            borderRadius: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60 }}>📷</div>
          <h2 style={{ marginTop: 15 }}>Camera Access Needed</h2>
          <p style={{ opacity: 0.7 }}>
            WebXR AR not supported on this device/browser.
          </p>
        </div>
      )}
    </div>
  );
}
