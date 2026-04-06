"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  createTextSprite,
  create3DTextBox,
  applyItemAnimation,
  clearGroup,
  createHuman3D,
} from "./Simulationhelpers";

// ==================== CARTOON CAR ====================
function createCar(color, label, isHighlighted) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.5,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.2 : 0,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    roughness: 0.7,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: "#8ec8e8",
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    roughness: 0.9,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: "#888888",
    metalness: 0.6,
    roughness: 0.3,
  });
  const bodyLower = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.24),
    bodyMat,
  );
  bodyLower.position.set(0, 0.08, 0);
  car.add(bodyLower);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), bodyMat);
  cabin.position.set(0.02, 0.18, 0);
  car.add(cabin);
  const cabinTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.03, 0.2),
    bodyMat,
  );
  cabinTop.position.set(0.02, 0.24, 0);
  car.add(cabinTop);
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.08, 0.18),
    glassMat,
  );
  windshield.position.set(-0.07, 0.18, 0);
  windshield.rotation.z = 0.45;
  car.add(windshield);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.22), bodyMat);
  hood.position.set(-0.15, 0.13, 0);
  hood.rotation.z = 0.1;
  car.add(hood);
  car.add(
    Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.22), darkMat),
      { position: new THREE.Vector3(-0.265, 0.045, 0) },
    ),
  );
  car.add(
    Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.22), darkMat),
      { position: new THREE.Vector3(0.265, 0.045, 0) },
    ),
  );
  const lightMat = new THREE.MeshStandardMaterial({
    color: "#ffffcc",
    emissive: "#ffff88",
    emissiveIntensity: 0.5,
  });
  [-0.07, 0.07].forEach((z) => {
    const h = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.018, 12),
      lightMat,
    );
    h.rotation.x = Math.PI / 2;
    h.position.set(-0.265, 0.1, z);
    car.add(h);
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: "#ff4444",
    emissive: "#ff2222",
    emissiveIntensity: 0.4,
  });
  [-0.08, 0.08].forEach((z) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.04), tailMat);
    t.position.set(0.26, 0.1, z);
    car.add(t);
  });
  [
    [-0.14, 0.045, 0.12],
    [0.14, 0.045, 0.12],
    [-0.14, 0.045, -0.12],
    [0.14, 0.045, -0.12],
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16),
      tireMat,
    );
    tire.rotation.x = Math.PI / 2;
    tire.position.set(wx, wy, wz);
    car.add(tire);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.038, 12),
      rimMat,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    car.add(rim);
  });
  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = 100;
  plateCanvas.height = 40;
  const pCtx = plateCanvas.getContext("2d");
  pCtx.fillStyle = "#ffffff";
  pCtx.fillRect(0, 0, 100, 40);
  pCtx.strokeStyle = "#333";
  pCtx.lineWidth = 2;
  pCtx.strokeRect(2, 2, 96, 36);
  pCtx.fillStyle = "#1a3c6e";
  pCtx.font = "bold 18px Arial";
  pCtx.textAlign = "center";
  pCtx.fillText(label, 50, 28);
  const frontPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.03),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(plateCanvas) }),
  );
  frontPlate.position.set(-0.275, 0.06, 0);
  frontPlate.rotation.y = -Math.PI / 2;
  car.add(frontPlate);
  if (isHighlighted)
    car.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.28, 0.28),
        new THREE.MeshBasicMaterial({
          color: "#ffff00",
          transparent: true,
          opacity: 0.1,
        }),
      ),
    );
  return car;
}

// ==================== TOLL BOOTH ====================
function createTollBooth(gateOpenAmount = 0) {
  const toll = new THREE.Group();
  const boothMat = new THREE.MeshStandardMaterial({
    color: "#2c3e50",
    roughness: 0.6,
    metalness: 0.3,
  });
  toll.add(
    Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.35), boothMat),
      { position: new THREE.Vector3(0, 0.325, -0.55) },
    ),
  );
  const postMat = new THREE.MeshStandardMaterial({
    color: "#f39c12",
    roughness: 0.5,
  });
  toll.add(
    Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), postMat),
      { position: new THREE.Vector3(0, 0.15, -0.32) },
    ),
  );
  const gatePivot = new THREE.Group();
  gatePivot.position.set(0, 0.28, -0.32);
  const gateArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.8),
    new THREE.MeshStandardMaterial({ color: "#e74c3c" }),
  );
  gateArm.position.set(0, 0, 0.4);
  gatePivot.add(gateArm);
  const easedOpen =
    gateOpenAmount < 0.5
      ? 2 * gateOpenAmount * gateOpenAmount
      : 1 - Math.pow(-2 * gateOpenAmount + 2, 2) / 2;
  gatePivot.rotation.x = -easedOpen * Math.PI * 0.45;
  toll.add(gatePivot);
  const greenLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.02),
    new THREE.MeshBasicMaterial({
      color: gateOpenAmount > 0.5 ? "#00ff00" : "#003300",
    }),
  );
  greenLight.position.set(0, 0.81, -0.515);
  toll.add(greenLight);
  const redLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.02),
    new THREE.MeshBasicMaterial({
      color: gateOpenAmount > 0.5 ? "#330000" : "#ff0000",
    }),
  );
  redLight.position.set(0, 0.75, -0.515);
  toll.add(redLight);
  return toll;
}

// ==================== TICKET DISPENSER ====================
function createTicketDispenser(
  tickets,
  highlightIndex,
  animPhase,
  animProgress,
) {
  const dispenser = new THREE.Group();
  const groundY = 0;
  const machineMat = new THREE.MeshStandardMaterial({
    color: "#c0392b",
    roughness: 0.4,
    metalness: 0.3,
  });
  const machineBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.9, 0.5),
    machineMat,
  );
  machineBody.position.set(0, groundY + 0.45, -0.6);
  dispenser.add(machineBody);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 170;
  screenCanvas.height = 110;
  const sctx = screenCanvas.getContext("2d");
  sctx.fillStyle = "#001a00";
  sctx.fillRect(0, 0, 170, 110);
  sctx.fillStyle = "#00ff00";
  sctx.font = "bold 16px monospace";
  sctx.textAlign = "center";
  sctx.fillText("🎫 TICKETS 🎫", 85, 28);
  sctx.font = "bold 36px monospace";
  sctx.fillText(`${tickets.length}`, 85, 70);
  sctx.font = "14px monospace";
  sctx.fillText("IN QUEUE", 85, 95);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.18),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(screenCanvas) }),
  );
  screen.position.set(0.19, groundY + 0.62, -0.6);
  screen.rotation.y = Math.PI / 2;
  dispenser.add(screen);
  const ticketWidth = 0.18,
    ticketHeight = 0.1,
    ticketThickness = 0.008,
    ticketGap = 0.002;
  const totalTicketLength = ticketWidth + ticketGap;
  const ticketStartX = 0.28,
    ticketY = groundY + 0.35,
    ticketZ = -0.6;
  const easeInOut = (t) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const isSliding = animPhase === "queue-dequeue-slide";
  const isExiting = animPhase === "queue-dequeue-exit";
  const isSettling = animPhase === "queue-ticket-settle";
  const progress = animProgress || 0;
  tickets.forEach((ticket, i) => {
    const isHl = highlightIndex === i,
      isFront = i === 0;
    const ticketGroup = new THREE.Group();
    let ticketX = ticketStartX + i * totalTicketLength,
      shouldRender = true,
      ticketOpacity = 1;
    if (isFront) {
      if (isSliding)
        ticketX = ticketStartX - easeInOut(progress) * totalTicketLength;
      else if (isExiting) {
        ticketX = ticketStartX - totalTicketLength - easeInOut(progress) * 0.2;
        ticketOpacity = Math.max(0, 1 - easeInOut(progress));
        if (progress > 0.95) shouldRender = false;
      } else if (isSettling) shouldRender = false;
    } else {
      if (isSliding)
        ticketX =
          ticketStartX +
          i * totalTicketLength -
          easeInOut(progress) * totalTicketLength;
      else if (isExiting)
        ticketX = ticketStartX + i * totalTicketLength - totalTicketLength;
      else if (isSettling) {
        const s = easeOut(progress);
        ticketX =
          ticketStartX +
          i * totalTicketLength -
          totalTicketLength +
          (ticketStartX +
            (i - 1) * totalTicketLength -
            (ticketStartX + i * totalTicketLength - totalTicketLength)) *
            s;
      }
    }
    if (!shouldRender) return;
    const ticketMat = new THREE.MeshStandardMaterial({
      color: ticket.color,
      roughness: 0.35,
      emissive: isHl && !isExiting ? "#ffff00" : "#000",
      emissiveIntensity: isHl && !isExiting ? 0.3 : 0,
      transparent: ticketOpacity < 1,
      opacity: ticketOpacity,
    });
    ticketGroup.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(ticketWidth, ticketThickness, ticketHeight),
        ticketMat,
      ),
    );
    const tc = document.createElement("canvas");
    tc.width = 90;
    tc.height = 50;
    const tctx = tc.getContext("2d");
    tctx.fillStyle = "rgba(0,0,0,0.4)";
    tctx.fillRect(0, 0, 90, 14);
    tctx.fillStyle = "#fff";
    tctx.font = "bold 9px Arial";
    tctx.textAlign = "center";
    tctx.fillText("★ TICKET ★", 45, 10);
    tctx.font = "bold 18px Arial";
    tctx.fillText(ticket.label, 45, 36);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ticketWidth - 0.01, ticketHeight - 0.01),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(tc),
        transparent: true,
        opacity: ticketOpacity,
      }),
    );
    labelMesh.position.y = ticketThickness / 2 + 0.001;
    labelMesh.rotation.x = -Math.PI / 2;
    ticketGroup.add(labelMesh);
    ticketGroup.position.set(ticketX, ticketY, ticketZ);
    dispenser.add(ticketGroup);
  });
  if (tickets.length > 0) {
    const frontSprite = createTextSprite("FRONT", "#00ff00", 16);
    frontSprite.position.set(ticketStartX, groundY + 0.2, ticketZ);
    frontSprite.scale.set(0.22, 0.08, 1);
    dispenser.add(frontSprite);
    if (tickets.length > 1) {
      const rearSprite = createTextSprite("REAR", "#ff6600", 16);
      rearSprite.position.set(
        ticketStartX + (tickets.length - 1) * totalTicketLength,
        groundY + 0.2,
        ticketZ,
      );
      rearSprite.scale.set(0.22, 0.08, 1);
      dispenser.add(rearSprite);
    }
  }
  const counterWidth = Math.max(1.2, tickets.length * totalTicketLength + 0.6);
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(counterWidth, 0.04, 0.7),
    new THREE.MeshStandardMaterial({ color: "#34495e", metalness: 0.3 }),
  );
  counter.position.set(counterWidth / 2 - 0.3, groundY - 0.02, -0.6);
  dispenser.add(counter);
  return dispenser;
}

// ==================== BUILD QUEUE SCENE ====================
function buildQueueScene(
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
  const spacing = 1.0,
    startX = -((data.length - 1) * spacing) / 2,
    groundY = 0;

  if (tutorialText)
    group.add(
      create3DTextBox(
        tutorialText.title,
        tutorialText.description,
        tutorialText.step,
        new THREE.Vector3(0, 1.2, 0),
      ),
    );

  let gateOpenAmount = 0;
  if (animPhase === "queue-dequeue-gate-open")
    gateOpenAmount = animProgress || 0;
  else if (animPhase === "queue-dequeue-drive") gateOpenAmount = 1;
  else if (animPhase === "queue-dequeue-gate-close")
    gateOpenAmount = 1 - (animProgress || 0);

  if (environment === "tollgate") {
    const roadLength = Math.max(4.5, data.length * spacing + 4);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(roadLength + 2, 0.55),
      new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.9 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(roadLength / 2 - 2.8, groundY - 0.01, 0);
    group.add(road);
    const dashMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.5,
    });
    for (let i = 0; i < Math.floor((roadLength + 1.5) / 0.3); i++) {
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.005, 0.025),
        dashMat,
      );
      dash.position.set(-2.5 + i * 0.3, groundY, 0);
      group.add(dash);
    }
    const tollBooth = createTollBooth(gateOpenAmount);
    tollBooth.position.set(startX - 0.3, groundY, 0);
    tollBooth.scale.setScalar(0.7);
    group.add(tollBooth);
    data.forEach((item, i) => {
      const isHl = highlightIndex === i,
        isFront = i === 0;
      let extraX = 0,
        shouldRender = true;
      if (isFront) {
        if (animPhase === "queue-dequeue-drive") {
          const p = animProgress || 0;
          extraX = -p * 1.8;
          if (p > 0.5) shouldRender = false;
        } else if (
          animPhase === "queue-dequeue-gate-close" ||
          animPhase === "queue-toll-settle"
        )
          shouldRender = false;
      } else {
        if (animPhase === "queue-dequeue-gate-open")
          extraX = -(animProgress || 0) * spacing * 0.3;
        else if (animPhase === "queue-dequeue-drive")
          extraX = -spacing * 0.3 - (animProgress || 0) * spacing * 0.7;
        else if (
          animPhase === "queue-dequeue-gate-close" ||
          animPhase === "queue-toll-settle"
        )
          extraX = -spacing;
      }
      if (shouldRender) {
        const carObj = createCar(item.color, item.label, isHl);
        carObj.position.set(
          startX + i * spacing + 0.5 + extraX,
          groundY + (isHl ? 0.03 : 0),
          0,
        );
        carObj.scale.setScalar(0.93);
        if (!animPhase?.startsWith("queue-dequeue"))
          applyItemAnimation(
            carObj,
            i,
            animPhase || "",
            animData || {},
            "queue",
            animProgress,
          );
        group.add(carObj);
      }
    });
    if (data.length > 0) {
      const frontSprite = createTextSprite("FRONT", "#00ff00", 18);
      frontSprite.position.set(startX + 0.5, groundY + 0.25, 0);
      frontSprite.scale.set(0.26, 0.09, 1);
      group.add(frontSprite);
      const rearSprite = createTextSprite("REAR", "#ff6600", 18);
      rearSprite.position.set(
        startX + (data.length - 1) * spacing + 0.5,
        groundY + 0.25,
        0,
      );
      rearSprite.scale.set(0.26, 0.09, 1);
      group.add(rearSprite);
    }
  } else if (environment === "tickets") {
    group.add(
      createTicketDispenser(
        data,
        highlightIndex,
        animPhase || "",
        animProgress || 0,
      ),
    );
  } else if (environment === "students") {
    const isWalking = animPhase === "queue-student-walk",
      isEntering = animPhase === "queue-student-enter";
    const isShifting = animPhase === "queue-student-shift",
      isSettling = animPhase === "queue-student-settle";
    const progress = animProgress || 0;
    const easeInOut = (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const doorX = startX - 1.0;
    // Simple school building
    const buildingGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
      color: "#f5e6d3",
      roughness: 0.6,
    });
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.8, 2.4),
      wallMat,
    );
    building.position.y = 0.9;
    buildingGroup.add(building);
    const roofMat = new THREE.MeshStandardMaterial({
      color: "#2c3e50",
      roughness: 0.5,
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 2.5), roofMat);
    roof.position.y = 1.84;
    buildingGroup.add(roof);
    buildingGroup.position.set(startX - 0.8, groundY, 0);
    buildingGroup.scale.setScalar(0.5);
    group.add(buildingGroup);
    data.forEach((item, i) => {
      const isHl = highlightIndex === i,
        isFront = i === 0;
      if (item.appearance) {
        let walkPhase = 0,
          studentX = startX + i * spacing + 0.6,
          studentY = groundY;
        let shouldRender = true;
        if (isFront) {
          if (isWalking) {
            const wp = easeOut(progress);
            studentX = startX + 0.6 + (doorX - startX - 0.6) * wp;
            walkPhase = progress * Math.PI * 8;
            studentY =
              groundY + Math.abs(Math.sin(progress * Math.PI * 8)) * 0.015;
          } else if (isEntering) {
            studentX = doorX - easeInOut(progress) * 0.5;
            if (progress > 0.7) shouldRender = false;
          } else if (isShifting || isSettling) shouldRender = false;
        } else {
          if (isShifting) {
            const sp = easeInOut(progress);
            studentX =
              startX +
              i * spacing +
              0.6 +
              (startX +
                (i - 1) * spacing +
                0.6 -
                (startX + i * spacing + 0.6)) *
                sp;
            walkPhase = progress * Math.PI * 6;
            studentY =
              groundY + Math.abs(Math.sin(progress * Math.PI * 6)) * 0.012;
          } else if (isSettling) studentX = startX + (i - 1) * spacing + 0.6;
        }
        if (shouldRender) {
          const human = createHuman3D(
            item.appearance,
            item.label,
            isHl,
            false,
            walkPhase,
          );
          human.position.set(studentX, studentY, 0);
          human.scale.setScalar(0.55);
          human.rotation.y = -Math.PI / 2;
          group.add(human);
        }
      }
    });
    if (data.length > 0) {
      const frontSprite = createTextSprite("FRONT", "#00ff00", 16);
      frontSprite.position.set(startX + 0.6, groundY - 0.18, 0);
      frontSprite.scale.set(0.26, 0.09, 1);
      group.add(frontSprite);
      if (data.length > 1) {
        const rearSprite = createTextSprite("REAR", "#ff6600", 16);
        rearSprite.position.set(
          startX + (data.length - 1) * spacing + 0.6,
          groundY - 0.18,
          0,
        );
        rearSprite.scale.set(0.26, 0.09, 1);
        group.add(rearSprite);
      }
    }
    const pathway = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(2.5, data.length * spacing + 2.5), 0.5),
      new THREE.MeshStandardMaterial({ color: "#bdc3c7" }),
    );
    pathway.rotation.x = -Math.PI / 2;
    pathway.position.set(0.3, groundY - 0.01, 0);
    group.add(pathway);
  }
}

// ==================== QUEUE SIMULATION WITH WEBXR ====================
export default function QueueSimulation({ onProgress }) {
  const [environment, setEnvironment] = useState("tollgate");
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

  const queueEnqueueTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive || data.length >= 5) return;
    const newItem =
      environment === "students"
        ? {
            id: Date.now(),
            label: `Stu ${data.length + 1}`,
            color: "#1abc9c",
            appearance: {
              skinTone: "#f5c6a0",
              shirtColor: "#1abc9c",
              pantsColor: "#2c3e50",
              hairColor: "#3d2314",
              hairStyle: "short",
              gender: "male",
            },
          }
        : environment === "tollgate"
          ? {
              id: Date.now(),
              label: `NEW-${Math.floor(Math.random() * 900) + 100}`,
              color: "#1abc9c",
            }
          : {
              id: Date.now(),
              label: `T-00${data.length + 1}`,
              color: "#1abc9c",
            };
    startTutorial([
      {
        title: "➕ Queue ENQUEUE",
        description: `Adding "${newItem.label}" to queue.\n\nJoins at REAR! (FIFO)`,
      },
      {
        title: "📍 Find REAR",
        description: `rear = ${data.length - 1}\nnew position = ${data.length}`,
        action: () => setData((prev) => [...prev, newItem]),
      },
      {
        title: "🚶 Joining",
        description: "Joining at rear...",
        highlightIndex: data.length,
        animPhase: "queue-enqueue-enter",
        animDuration: 700,
      },
      {
        title: "✅ Enqueued!",
        description: "Done! Time: O(1)",
        highlightIndex: data.length,
        animPhase: "queue-enqueue-settle",
        animDuration: 400,
      },
    ]);
  };

  const queueDequeueTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive) return;
    if (data.length === 0) {
      startTutorial([
        {
          title: "⚠️ Queue Empty!",
          description: "Queue is EMPTY!\n\nNo one to dequeue.\nEnqueue first!",
        },
      ]);
      return;
    }
    const frontItem = data[0];
    const steps = [
      {
        title: "➖ Queue DEQUEUE",
        description: "Removing from FRONT.\n\nFirst in line served first!",
        highlightIndex: 0,
      },
      {
        title: "🎯 Identify FRONT",
        description: `front = "${frontItem.label}"`,
        highlightIndex: 0,
      },
    ];
    if (environment === "tollgate") {
      steps.push(
        {
          title: "🚧 Opening Gate",
          description: "Gate opening...",
          highlightIndex: 0,
          animPhase: "queue-dequeue-gate-open",
          animDuration: 1000,
        },
        {
          title: "🚗 Driving Through",
          description: `"${frontItem.label}" passing through...`,
          highlightIndex: 0,
          animPhase: "queue-dequeue-drive",
          animDuration: 1500,
        },
        {
          title: "🚧 Closing Gate",
          description: "Gate closing...",
          animPhase: "queue-dequeue-gate-close",
          animDuration: 800,
        },
        {
          title: "🚗 Cars Moving",
          description: "Other cars moving forward...",
          animPhase: "queue-toll-settle",
          animDuration: 800,
        },
        {
          title: "✅ Dequeued!",
          description: `"${frontItem.label}" passed!\n\nTime: O(1)\nFIFO: First In, First Out`,
          action: () => setData((prev) => prev.slice(1)),
        },
      );
    } else if (environment === "tickets") {
      steps.push(
        {
          title: "🎫 Sliding Tickets",
          description: "All tickets sliding toward dispenser...",
          highlightIndex: 0,
          animPhase: "queue-dequeue-slide",
          animDuration: 1500,
        },
        {
          title: "📤 Dispensing",
          description: `"${frontItem.label}" being dispensed...`,
          highlightIndex: 0,
          animPhase: "queue-dequeue-exit",
          animDuration: 1200,
        },
        {
          title: "🎟️ Repositioning",
          description: "Tickets moving to new positions...",
          animPhase: "queue-ticket-settle",
          animDuration: 800,
        },
        {
          title: "✅ Dequeued!",
          description: `"${frontItem.label}" dispensed!\n\nTime: O(1)`,
          action: () => setData((prev) => prev.slice(1)),
        },
      );
    } else {
      steps.push(
        {
          title: "🚶 Walking to Door",
          description: `"${frontItem.label}" walking toward entrance...`,
          highlightIndex: 0,
          animPhase: "queue-student-walk",
          animDuration: 1800,
        },
        {
          title: "🚪 Entering Building",
          description: `"${frontItem.label}" entering...`,
          highlightIndex: 0,
          animPhase: "queue-student-enter",
          animDuration: 1000,
        },
        {
          title: "👥 Line Moving",
          description: "Other students moving up...",
          animPhase: "queue-student-shift",
          animDuration: 1200,
        },
        {
          title: "✅ Settling",
          description: "Students taking new positions...",
          animPhase: "queue-student-settle",
          animDuration: 600,
        },
        {
          title: "✅ Dequeued!",
          description: `"${frontItem.label}" has entered!\n\nTime: O(1)\nFIFO: First In, First Out`,
          action: () => setData((prev) => prev.slice(1)),
        },
      );
    }
    startTutorial(steps);
  };

  const queueFrontTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive) return;
    if (data.length === 0) {
      startTutorial([
        { title: "⚠️ Queue Empty!", description: "Nothing to peek!" },
      ]);
      return;
    }
    startTutorial([
      {
        title: "👁️ Queue FRONT",
        description: "Peek at who's next.",
        highlightIndex: 0,
      },
      {
        title: "🔍 Checking",
        description: `FRONT = "${data[0].label}"\n\nStays in queue!`,
        highlightIndex: 0,
        animPhase: "queue-front-peek",
        animDuration: 1200,
      },
      { title: "✅ Done!", description: "Peek = O(1)\nQueue unchanged." },
    ]);
  };

  const data = getData();

  return (
    <div
      id="ar-overlay-queue"
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
          { id: "tollgate", icon: "🛣️", label: "Toll" },
          { id: "tickets", icon: "🎫", label: "Tickets" },
          { id: "students", icon: "🏫", label: "School" },
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
          }}
        >
          {tutorialCompletedOnce && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
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
                label: "➕ Enqueue",
                color: "#2ecc71",
                disabled: isAnimating || data.length >= 5,
                onClick: queueEnqueueTutorial,
              },
              {
                label: "➖ Dequeue",
                color: "#e74c3c",
                disabled: isAnimating,
                onClick: queueDequeueTutorial,
              },
              {
                label: "👁️ Front",
                color: "#f39c12",
                disabled: isAnimating,
                onClick: queueFrontTutorial,
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
          <div style={{ fontSize: 60 }}>🚗</div>
          <h2 style={{ marginTop: 15 }}>Queue AR</h2>
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            Visualize queues in augmented reality
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
