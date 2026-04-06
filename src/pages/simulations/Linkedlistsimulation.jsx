"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  createTextSprite,
  create3DTextBox,
  create3DArrow,
  applyItemAnimation,
  clearGroup,
  createHuman3D,
} from "./Simulationhelpers";

// ==================== TRAIN CAR ====================
function createTrainCar(isEngine, color, label, isHighlighted) {
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#555555",
    metalness: 0.4,
    roughness: 0.5,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.4 : 0,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.32), bodyMat);
  body.position.y = 0.14;
  train.add(body);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.03, 0.33),
    new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.6 }),
  );
  stripe.position.y = 0.2;
  train.add(stripe);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.06, 0.28),
    new THREE.MeshStandardMaterial({ color: "#333333", metalness: 0.5 }),
  );
  roof.position.y = 0.33;
  train.add(roof);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    metalness: 0.8,
    roughness: 0.2,
  });
  [
    [-0.22, -0.05, 0.17],
    [0.22, -0.05, 0.17],
    [-0.22, -0.05, -0.17],
    [0.22, -0.05, -0.17],
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
      wheelMat,
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    train.add(wheel);
  });
  if (!isEngine) {
    const windowGeo = new THREE.BoxGeometry(0.1, 0.09, 0.01);
    const windowMat = new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      metalness: 0.5,
      roughness: 0.1,
    });
    [-0.22, 0, 0.22].forEach((x) => {
      const wF = new THREE.Mesh(windowGeo, windowMat);
      wF.position.set(x, 0.18, 0.165);
      train.add(wF);
      const wB = new THREE.Mesh(windowGeo, windowMat);
      wB.position.set(x, 0.18, -0.165);
      train.add(wB);
    });
  }
  if (isEngine) {
    const boiler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: "#444444", metalness: 0.5 }),
    );
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(-0.15, 0.16, 0);
    train.add(boiler);
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.05, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.6 }),
    );
    chimney.position.set(-0.08, 0.44, 0);
    train.add(chimney);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = isHighlighted ? "rgba(255,255,0,0.9)" : "rgba(0,0,0,0.75)";
  ctx.beginPath();
  ctx.roundRect(0, 0, 160, 48, 10);
  ctx.fill();
  ctx.fillStyle = isHighlighted ? "#000" : "#fff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, 80, 34);
  const labelSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
    }),
  );
  labelSprite.position.y = isEngine ? 0.75 : 0.55;
  labelSprite.scale.set(0.42, 0.13, 1);
  train.add(labelSprite);
  if (isHighlighted) {
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.42, 0.38),
      new THREE.MeshBasicMaterial({
        color: "#ffff00",
        transparent: true,
        opacity: 0.12,
      }),
    );
    glow.position.y = 0.14;
    train.add(glow);
  }
  train.rotation.y = Math.PI;
  return train;
}

// ==================== DOMINO ====================
function createDomino(value, isHighlighted) {
  const domino = new THREE.Group();
  const tileMat = new THREE.MeshStandardMaterial({
    color: isHighlighted ? "#1abc9c" : "#f8f8f0",
    roughness: 0.25,
    metalness: 0.1,
    emissive: isHighlighted ? "#1abc9c" : "#000",
    emissiveIntensity: isHighlighted ? 0.25 : 0,
  });
  domino.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.07), tileMat));
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.45, 0.065),
    new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.5 }),
  );
  border.position.z = -0.005;
  domino.add(border);
  const centerLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.025, 0.01),
    new THREE.MeshStandardMaterial({ color: "#1a1a1a" }),
  );
  centerLine.position.z = 0.031;
  domino.add(centerLine);
  const dotMat = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    roughness: 0.3,
  });
  const numValue = parseInt(value) || 1;
  const dotPositions = {
    1: [[0, 0]],
    2: [
      [-0.04, 0.04],
      [0.04, -0.04],
    ],
    3: [
      [-0.04, 0.04],
      [0, 0],
      [0.04, -0.04],
    ],
    4: [
      [-0.04, 0.04],
      [0.04, 0.04],
      [-0.04, -0.04],
      [0.04, -0.04],
    ],
    5: [
      [-0.04, 0.04],
      [0.04, 0.04],
      [0, 0],
      [-0.04, -0.04],
      [0.04, -0.04],
    ],
    6: [
      [-0.04, 0.05],
      [0.04, 0.05],
      [-0.04, 0],
      [0.04, 0],
      [-0.04, -0.05],
      [0.04, -0.05],
    ],
  };
  const topNum = Math.min(Math.ceil(numValue / 2), 6);
  const bottomNum = Math.min(numValue, 6);
  (dotPositions[topNum] || dotPositions[1]).forEach(([dx, dy]) => {
    const dot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.015, 12),
      dotMat,
    );
    dot.rotation.x = Math.PI / 2;
    dot.position.set(dx, 0.12 + dy, 0.028);
    domino.add(dot);
  });
  (dotPositions[bottomNum] || dotPositions[1]).forEach(([dx, dy]) => {
    const dot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.015, 12),
      dotMat,
    );
    dot.rotation.x = Math.PI / 2;
    dot.position.set(dx, -0.12 + dy, 0.028);
    domino.add(dot);
  });
  if (isHighlighted) {
    domino.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.48, 0.04),
        new THREE.MeshBasicMaterial({
          color: "#ffff00",
          transparent: true,
          opacity: 0.2,
        }),
      ),
    );
  }
  return domino;
}

// ==================== BUILD LINKED LIST SCENE ====================
function buildLinkedListScene(
  group,
  data,
  highlightIndex,
  environment,
  animPhase,
  animData,
  animProgress,
  tutorialText,
) {
  clearGroup(group);
  if (tutorialText || animPhase) highlightIndex = null;
  const spacing = 1.1;
  const startX = -((data.length - 1) * spacing) / 2;
  const groundY = 0;

  if (tutorialText) {
    group.add(
      create3DTextBox(
        tutorialText.title,
        tutorialText.description,
        tutorialText.step,
        new THREE.Vector3(0, 1.2, 0),
      ),
    );
  }

  if (environment === "train") {
    const arrowY = 0.14;
    const platformMat = new THREE.MeshStandardMaterial({
      color: "#808080",
      roughness: 0.8,
    });
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(3, data.length * spacing + 2), 0.15, 0.8),
      platformMat,
    );
    platform.position.set(0, -0.02, -0.7);
    group.add(platform);
    const safetyLine = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(3, data.length * spacing + 2), 0.02, 0.08),
      new THREE.MeshStandardMaterial({ color: "#f1c40f" }),
    );
    safetyLine.position.set(0, 0.06, -0.32);
    group.add(safetyLine);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(3.5, data.length * spacing + 2.5), 1.8),
      new THREE.MeshStandardMaterial({ color: "#6b6b6b", roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    group.add(ground);
    const railMat = new THREE.MeshStandardMaterial({
      color: "#555555",
      metalness: 0.8,
      roughness: 0.2,
    });
    [-0.11, 0.11].forEach((z) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(2.5, data.length * spacing + 2),
          0.025,
          0.03,
        ),
        railMat,
      );
      rail.position.set(0, -0.08, z);
      group.add(rail);
    });
    data.forEach((item, i) => {
      const isHl = highlightIndex === i;
      const reversedIndex = data.length - 1 - i;
      const posX = startX + reversedIndex * spacing;
      const trainCar = createTrainCar(i === 0, item.color, item.label, isHl);
      trainCar.position.set(posX, isHl ? 0.1 : 0, 0);
      trainCar.scale.setScalar(0.82);
      applyItemAnimation(
        trainCar,
        i,
        animPhase || "",
        animData || {},
        "linkedlist",
        animProgress,
      );
      group.add(trainCar);
    });
    for (let i = 0; i < data.length - 1; i++)
      group.add(
        create3DArrow(
          startX + i * spacing,
          startX + (i + 1) * spacing,
          arrowY,
          false,
        ),
      );
    if (data.length > 0) {
      const nullSprite = createTextSprite("NULL", "#ff0000", 22);
      nullSprite.position.set(
        startX + (data.length - 1) * spacing + spacing * 0.7,
        0.14,
        0,
      );
      nullSprite.scale.set(0.32, 0.22, 1);
      group.add(nullSprite);
      group.add(
        create3DArrow(
          startX + (data.length - 1) * spacing,
          startX + (data.length - 1) * spacing + spacing * 0.7,
          arrowY,
          false,
        ),
      );
    }
  } else if (environment === "people") {
    const arrowY = 0.12;
    const streetWidth = Math.max(6, data.length * spacing + 7);
    const pavement = new THREE.Mesh(
      new THREE.PlaneGeometry(streetWidth, 2.5),
      new THREE.MeshStandardMaterial({ color: "#808080", roughness: 0.8 }),
    );
    pavement.rotation.x = -Math.PI / 2;
    pavement.position.set(0, groundY - 0.01, 0);
    group.add(pavement);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: "#c0c0c0",
      metalness: 0.8,
      roughness: 0.2,
    });
    const ropeMat = new THREE.MeshStandardMaterial({
      color: "#8e44ad",
      roughness: 0.6,
    });
    for (let i = 0; i <= data.length; i++) {
      const poleX = startX + i * spacing - 0.15;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.35, 12),
        barrierMat,
      );
      pole.position.set(poleX, groundY + 0.175, -0.25);
      group.add(pole);
      if (i < data.length) {
        const rope = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, spacing - 0.1, 8),
          ropeMat,
        );
        rope.rotation.z = Math.PI / 2;
        rope.position.set(poleX + spacing / 2, groundY + 0.32, -0.25);
        group.add(rope);
      }
    }
    data.forEach((item, i) => {
      const isHl = highlightIndex === i;
      if (item.appearance) {
        const walkPhase =
          animPhase === "ll-traverse" && isHl ? Math.PI * 0.5 : 0;
        const human = createHuman3D(
          item.appearance,
          item.label,
          isHl,
          false,
          walkPhase,
        );
        human.position.set(startX + i * spacing, isHl ? 0.06 : 0, 0);
        human.scale.setScalar(0.72);
        applyItemAnimation(
          human,
          i,
          animPhase || "",
          animData || {},
          "linkedlist",
          animProgress,
        );
        group.add(human);
      }
      if (i < data.length - 1)
        group.add(
          create3DArrow(
            startX + i * spacing,
            startX + (i + 1) * spacing,
            arrowY,
            false,
          ),
        );
    });
    if (data.length > 0) {
      const nullSprite = createTextSprite("NULL", "#ff0000", 20);
      nullSprite.position.set(startX + data.length * spacing, 0.12, 0);
      nullSprite.scale.set(0.28, 0.18, 1);
      group.add(nullSprite);
      group.add(
        create3DArrow(
          startX + (data.length - 1) * spacing,
          startX + data.length * spacing,
          arrowY,
          false,
        ),
      );
      const headSprite = createTextSprite("HEAD", "#00ff00", 16);
      headSprite.position.set(startX, 0.32, 0);
      headSprite.scale.set(0.24, 0.1, 1);
      group.add(headSprite);
    }
  } else if (environment === "domino") {
    const arrowY = 0;
    const feltMat = new THREE.MeshStandardMaterial({
      color: "#0d5c2e",
      roughness: 0.9,
    });
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32),
      feltMat,
    );
    tableTop.position.y = -0.28;
    tableTop.scale.set(
      Math.max(1.5, (data.length * spacing) / 2 + 0.8),
      1,
      0.6,
    );
    group.add(tableTop);
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(4, data.length * spacing + 3), 2),
      new THREE.MeshStandardMaterial({ color: "#8b0000", roughness: 0.95 }),
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = -0.63;
    group.add(carpet);
    data.forEach((item, i) => {
      const isHl = highlightIndex === i;
      const domino = createDomino(item.label, isHl);
      domino.position.set(startX + i * spacing, isHl ? 0.08 : 0, 0);
      domino.scale.setScalar(0.82);
      applyItemAnimation(
        domino,
        i,
        animPhase || "",
        animData || {},
        "linkedlist",
        animProgress,
      );
      group.add(domino);
      if (i < data.length - 1)
        group.add(
          create3DArrow(
            startX + i * spacing,
            startX + (i + 1) * spacing,
            arrowY,
            false,
          ),
        );
    });
    if (data.length > 0) {
      const nullSprite = createTextSprite("NULL", "#ff0000", 20);
      nullSprite.position.set(startX + data.length * spacing, 0, 0);
      nullSprite.scale.set(0.28, 0.18, 1);
      group.add(nullSprite);
      group.add(
        create3DArrow(
          startX + (data.length - 1) * spacing,
          startX + data.length * spacing,
          arrowY,
          false,
        ),
      );
    }
  }
}

// ==================== LINKED LIST SIMULATION WITH WEBXR ====================
export default function LinkedListSimulation({ onProgress }) {
  const [environment, setEnvironment] = useState("train");
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState("");
  const [animData, setAnimData] = useState({});
  const [animProgress, setAnimProgress] = useState(1);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnimating, setStepAnimating] = useState(false);
  const [tutorialText, setTutorialText] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [tutorialCompletedOnce, setTutorialCompletedOnce] = useState(false); // ✅ NEW

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

  const [trainCars, setTrainCars] = useState([
    { id: 1, label: "Engine", color: "#e74c3c" },
    { id: 2, label: "Coal", color: "#34495e" },
    { id: 3, label: "Cargo", color: "#2ecc71" },
    { id: 4, label: "Pass", color: "#9b59b6" },
  ]);
  const [peopleLine, setPeopleLine] = useState([
    {
      id: 1,
      label: "Alice",
      color: "#e74c3c",
      appearance: {
        skinTone: "#f5c6a0",
        shirtColor: "#e74c3c",
        pantsColor: "#2c3e50",
        hairColor: "#2c1810",
        hairStyle: "long",
        gender: "female",
      },
    },
    {
      id: 2,
      label: "Bob",
      color: "#3498db",
      appearance: {
        skinTone: "#8d5524",
        shirtColor: "#3498db",
        pantsColor: "#2c3e50",
        hairColor: "#1a1a1a",
        hairStyle: "short",
        gender: "male",
      },
    },
    {
      id: 3,
      label: "Carol",
      color: "#2ecc71",
      appearance: {
        skinTone: "#c68642",
        shirtColor: "#2ecc71",
        pantsColor: "#1a1a2e",
        hairColor: "#3d2314",
        hairStyle: "long",
        gender: "female",
      },
    },
  ]);
  const [dominoNodes, setDominoNodes] = useState([
    { id: 1, label: "1", color: "#ecf0f1" },
    { id: 2, label: "2", color: "#ecf0f1" },
    { id: 3, label: "3", color: "#ecf0f1" },
    { id: 4, label: "4", color: "#ecf0f1" },
  ]);

  const getData = () =>
    environment === "train"
      ? trainCars
      : environment === "people"
        ? peopleLine
        : dominoNodes;

  useEffect(() => {
    const checkXR = async () => {
      try {
        if (navigator.xr) {
          const s = await navigator.xr.isSessionSupported("immersive-ar");
          setWebxrSupported(s);
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
    buildLinkedListScene(
      xrGroupRef.current,
      getData(),
      highlightIndex,
      environment,
      animPhase,
      animData,
      animProgress,
      tutorialText,
    );
  }, [
    webxrPlaced,
    trainCars,
    peopleLine,
    dominoNodes,
    highlightIndex,
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
      const overlayEl = document.getElementById("ar-overlay-linkedlist");
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
          buildLinkedListScene(
            xrGroupRef.current,
            getData(),
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

  const runTutorialStep = async (step, stepIdx, allSteps) => {
    setStepAnimating(true);
    setTutorialText({
      title: step.title,
      description: step.description,
      step: `${stepIdx + 1}/${allSteps.length}`,
    });
    setHighlightIndex(step.highlightIndex ?? null);
    if (step.animPhase && step.animDuration)
      await smoothAnimate(step.animDuration, step.animPhase, {
        index: step.highlightIndex,
      });
    else {
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
    } else completeTutorial(); // ✅ Done button
  };

  // ✅ Skip — walang progress
  const skipTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
  };

  // ✅ Complete — may progress
  const completeTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
    setTutorialCompletedOnce(true);
    onProgress?.();
  };

  const startTutorial = (steps) => {
    if (isAnimating || tutorialActive) return;
    setIsAnimating(true);
    setTutorialActive(true);
    setTutorialSteps(steps);
    setCurrentStepIndex(0);
    runTutorialStep(steps[0], 0, steps);
  };

  const linkedListTraverseTutorial = () => {
    if (isAnimating || tutorialActive) return;
    const data = getData();
    if (data.length === 0) {
      startTutorial([
        {
          title: "⚠️ Empty List!",
          description: "List is EMPTY!\n\nAdd nodes first.",
        },
      ]);
      return;
    }
    const steps = [
      {
        title: "🔗 Linked List",
        description:
          "Each node has DATA + POINTER.\nNodes are NOT contiguous in memory!",
      },
      {
        title: "👑 Head Pointer",
        description: "HEAD marks the start.\nWithout it, we lose the list!",
        highlightIndex: 0,
        animPhase: "ll-traverse",
        animDuration: 600,
      },
    ];
    data.forEach((item, i) => {
      steps.push({
        title: `🔍 Node ${i}`,
        description: `current = "${item.label}"\nnext → ${i < data.length - 1 ? `"${data[i + 1]?.label}"` : "NULL"}`,
        highlightIndex: i,
        animPhase: "ll-traverse",
        animDuration: 500,
      });
    });
    steps.push(
      {
        title: "🔚 End (NULL)",
        description: "Last node points to NULL.\nTraversal complete!",
        highlightIndex: data.length - 1,
      },
      {
        title: "📊 Complexity",
        description:
          "Access: O(n) - must traverse\nInsert/Delete: O(1)*\n\n*after finding position",
      },
    );
    startTutorial(steps);
  };

  const data = getData();

  return (
    <div
      id="ar-overlay-linkedlist"
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
          { id: "train", icon: "🚂", label: "Train" },
          { id: "people", icon: "🧑‍🤝‍🧑", label: "Line" },
          { id: "domino", icon: "🁡", label: "Domino" },
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
          onClick={stopWebXR}
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
            textAlign: "center",
          }}
        >
          {/* ✅ Mark as Complete */}
          {tutorialCompletedOnce && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={() => onProgress?.()}
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
                ✅ Mark as Complete
              </button>
            </div>
          )}
          <button
            onClick={linkedListTraverseTutorial}
            disabled={isAnimating}
            style={{
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: "bold",
              border: "none",
              borderRadius: 25,
              background: isAnimating ? "#555" : "#9b59b6",
              color: "white",
              opacity: isAnimating ? 0.5 : 1,
              cursor: isAnimating ? "not-allowed" : "pointer",
            }}
          >
            🔍 Traverse & Learn
          </button>
          <div
            style={{
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
          <div style={{ fontSize: 60 }}>🔗</div>
          <h2 style={{ marginTop: 15 }}>Linked List AR</h2>
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            Visualize linked lists in augmented reality
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
