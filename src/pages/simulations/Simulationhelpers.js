import * as THREE from "three";

// ==================== 3D TEXT SPRITE ====================
export function createTextSprite(text, color, fontSize = 20) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
  ctx.fill();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize * 2}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.renderOrder = 999;
  return sprite;
}

// ==================== 3D FLOATING TEXT BOX ====================
export function create3DTextBox(title, description, step, position) {
  const group = new THREE.Group();
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "rgba(30, 30, 60, 0.95)");
  gradient.addColorStop(1, "rgba(20, 20, 40, 0.95)");
  ctx.fillStyle = gradient;
  ctx.roundRect(0, 0, 512, 256, 20);
  ctx.fill();
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 4;
  ctx.roundRect(2, 2, 508, 252, 18);
  ctx.stroke();
  ctx.fillStyle = "#667eea";
  ctx.roundRect(15, 15, 80, 30, 10);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(step, 55, 35);
  ctx.fillStyle = "#00ff88";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(title, 110, 38);
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  const words = description.split(" ");
  let line = "";
  let y = 80;
  const maxWidth = 480;
  const lineHeight = 26;
  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), 20, y);
      line = word + " ";
      y += lineHeight;
      if (y > 230) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 20, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.75, 1);
  sprite.position.copy(position);
  sprite.renderOrder = 1000;
  group.add(sprite);
  return group;
}

// ==================== 3D ARROW ====================
export function create3DArrow(fromX, toX, yHeight, isHighlighted) {
  const arrow = new THREE.Group();
  const color = isHighlighted ? 0xffff00 : 0x00ff00;
  const shaftRadius = 0.025;
  const headRadius = 0.06;
  const headLength = 0.1;
  const gap = 0.32;
  const startX = fromX + gap;
  const endX = toX - gap;
  const shaftLen = endX - startX - headLength;
  if (shaftLen <= 0) return arrow;
  const shaftGeo = new THREE.CylinderGeometry(
    shaftRadius,
    shaftRadius,
    shaftLen,
    8,
  );
  const shaftMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.5,
    roughness: 0.3,
    emissive: color,
    emissiveIntensity: 0.15,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(startX + shaftLen / 2, yHeight, 0);
  arrow.add(shaft);
  const headGeo = new THREE.ConeGeometry(headRadius, headLength, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.5,
    roughness: 0.3,
    emissive: color,
    emissiveIntensity: 0.2,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.z = -Math.PI / 2;
  head.position.set(endX - headLength / 2, yHeight, 0);
  arrow.add(head);
  const ringGeo = new THREE.TorusGeometry(headRadius * 0.6, 0.008, 6, 12);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(endX, yHeight, 0);
  arrow.add(ring);
  return arrow;
}

// ==================== HUMAN 3D ====================
export function createHuman3D(
  appearance,
  name,
  isHighlighted,
  isSeated = false,
  walkPhase = 0,
) {
  const human = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinTone,
    roughness: 0.7,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.15 : 0,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: appearance.shirtColor,
    roughness: 0.6,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.15 : 0,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: appearance.pantsColor,
    roughness: 0.7,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: "#222222",
    roughness: 0.5,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor,
    roughness: 0.8,
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: "#111111" });
  const mouthMat = new THREE.MeshStandardMaterial({ color: "#cc6666" });
  const scale = 0.12;
  const groundY = 0;
  const shoeHeight = 0.18 * scale;
  const lowerLegHeight = 0.7 * scale;
  const upperLegHeight = 0.75 * scale;
  const torsoHeight = 1.0 * scale;
  const neckHeight = 0.15 * scale;
  const headHeight = 0.75 * scale;

  if (isSeated) {
    const seatHeight = groundY + 0.02;
    [-1, 1].forEach((side) => {
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.32 * scale, shoeHeight, 0.42 * scale),
        shoeMat,
      );
      shoe.position.set(
        side * 0.22 * scale,
        groundY + shoeHeight / 2,
        0.4 * scale,
      );
      human.add(shoe);
    });
    [-1, 1].forEach((side) => {
      const lowerLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 * scale, lowerLegHeight, 0.3 * scale),
        pantsMat,
      );
      lowerLeg.position.set(
        side * 0.22 * scale,
        groundY + shoeHeight + lowerLegHeight / 2,
        0.38 * scale,
      );
      human.add(lowerLeg);
    });
    const upperLegY = seatHeight + 0.04 * scale;
    [-1, 1].forEach((side) => {
      const upperLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.32 * scale, 0.14 * scale, upperLegHeight),
        pantsMat,
      );
      upperLeg.position.set(side * 0.22 * scale, upperLegY, 0.18 * scale);
      human.add(upperLeg);
    });
    const hips = new THREE.Mesh(
      new THREE.BoxGeometry(0.75 * scale, 0.18 * scale, 0.38 * scale),
      pantsMat,
    );
    hips.position.set(0, upperLegY + 0.04 * scale, -0.05 * scale);
    human.add(hips);
    const torsoY = upperLegY + 0.12 * scale + torsoHeight / 2;
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.9 * scale, torsoHeight, 0.5 * scale),
      shirtMat,
    );
    torso.position.set(0, torsoY, -0.05 * scale);
    human.add(torso);
    const neckY = torsoY + torsoHeight / 2 + neckHeight / 2;
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 * scale, neckHeight, 0.25 * scale),
      skinMat,
    );
    neck.position.set(0, neckY, -0.05 * scale);
    human.add(neck);
    const headY = neckY + neckHeight / 2 + headHeight / 2;
    const headGroup = new THREE.Group();
    headGroup.position.set(0, headY, -0.05 * scale);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.7 * scale, headHeight, 0.7 * scale),
      skinMat,
    );
    headGroup.add(head);
    if (appearance.hairStyle !== "bald") {
      const hairTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.74 * scale, 0.3 * scale, 0.74 * scale),
        hairMat,
      );
      hairTop.position.y = 0.3 * scale;
      headGroup.add(hairTop);
    }
    if (appearance.hairStyle === "long") {
      const hairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.74 * scale, 0.6 * scale, 0.15 * scale),
        hairMat,
      );
      hairBack.position.set(0, 0, -0.32 * scale);
      headGroup.add(hairBack);
    }
    const eyeGeo = new THREE.BoxGeometry(
      0.1 * scale,
      0.08 * scale,
      0.05 * scale,
    );
    [-0.15, 0.15].forEach((x) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x * scale, 0.05 * scale, 0.35 * scale);
      headGroup.add(eye);
    });
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.2 * scale, 0.05 * scale, 0.05 * scale),
      mouthMat,
    );
    mouth.position.set(0, -0.15 * scale, 0.35 * scale);
    headGroup.add(mouth);
    human.add(headGroup);
    [-1, 1].forEach((side) => {
      const upperArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.25 * scale, 0.55 * scale, 0.25 * scale),
        shirtMat,
      );
      upperArm.position.set(side * 0.6 * scale, torsoY, 0.1 * scale);
      upperArm.rotation.x = -0.8;
      human.add(upperArm);
      const lowerArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.22 * scale, 0.5 * scale, 0.22 * scale),
        skinMat,
      );
      lowerArm.position.set(
        side * 0.55 * scale,
        torsoY - 0.15 * scale,
        0.35 * scale,
      );
      lowerArm.rotation.x = -1.2;
      human.add(lowerArm);
      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.18 * scale, 0.18 * scale, 0.18 * scale),
        skinMat,
      );
      hand.position.set(
        side * 0.5 * scale,
        torsoY - 0.25 * scale,
        0.45 * scale,
      );
      human.add(hand);
    });
    if (isHighlighted) {
      const plumbob = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.025, 0),
        new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          emissive: 0x00ff00,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.85,
        }),
      );
      plumbob.position.set(0, headY + headHeight / 2 + 0.06, -0.05 * scale);
      human.add(plumbob);
    }
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 200;
    labelCanvas.height = 48;
    const lctx = labelCanvas.getContext("2d");
    if (isHighlighted) {
      lctx.fillStyle = "#00ff00";
    } else {
      lctx.fillStyle = "rgba(0,0,0,0.85)";
    }
    lctx.beginPath();
    lctx.roundRect(0, 0, 200, 48, 12);
    lctx.fill();
    lctx.fillStyle = isHighlighted ? "#000" : "#ffffff";
    lctx.font = "bold 24px Arial";
    lctx.textAlign = "center";
    lctx.fillText(name, 100, 34);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTex, transparent: true }),
    );
    labelSprite.position.set(0, headY + headHeight / 2 + 0.1, 0);
    labelSprite.scale.set(0.32, 0.08, 1);
    human.add(labelSprite);
  } else {
    const totalLegHeight = shoeHeight + lowerLegHeight + upperLegHeight;
    const hipY = groundY + totalLegHeight;
    const torsoY = hipY + torsoHeight / 2;
    const neckY = torsoY + torsoHeight / 2;
    const headY = neckY + neckHeight + headHeight / 2;
    [-1, 1].forEach((side, idx) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.22 * scale, hipY, 0);
      const upperLegPivot = new THREE.Group();
      const upperLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.32 * scale, upperLegHeight, 0.32 * scale),
        pantsMat,
      );
      upperLeg.position.y = -upperLegHeight / 2;
      upperLegPivot.add(upperLeg);
      const lowerLegPivot = new THREE.Group();
      lowerLegPivot.position.y = -upperLegHeight;
      const lowerLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 * scale, lowerLegHeight, 0.3 * scale),
        pantsMat,
      );
      lowerLeg.position.y = -lowerLegHeight / 2;
      lowerLegPivot.add(lowerLeg);
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.32 * scale, shoeHeight, 0.42 * scale),
        shoeMat,
      );
      shoe.position.set(0, -lowerLegHeight - shoeHeight / 2, 0.05 * scale);
      lowerLegPivot.add(shoe);
      upperLegPivot.add(lowerLegPivot);
      legGroup.add(upperLegPivot);
      if (walkPhase > 0) {
        const swing = Math.sin(walkPhase + (idx === 0 ? 0 : Math.PI)) * 0.5;
        upperLegPivot.rotation.x = swing;
        const kneeBend =
          Math.max(0, -Math.sin(walkPhase + (idx === 0 ? 0 : Math.PI))) * 0.6;
        lowerLegPivot.rotation.x = kneeBend;
      }
      human.add(legGroup);
    });
    const hips = new THREE.Mesh(
      new THREE.BoxGeometry(0.75 * scale, 0.18 * scale, 0.42 * scale),
      pantsMat,
    );
    hips.position.set(0, hipY, 0);
    human.add(hips);
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.9 * scale, torsoHeight, 0.5 * scale),
      shirtMat,
    );
    torso.position.set(0, torsoY, 0);
    human.add(torso);
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 * scale, neckHeight, 0.25 * scale),
      skinMat,
    );
    neck.position.set(0, neckY + neckHeight / 2, 0);
    human.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.set(0, headY, 0);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.7 * scale, headHeight, 0.7 * scale),
      skinMat,
    );
    headGroup.add(head);
    if (appearance.hairStyle !== "bald") {
      const hairTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.74 * scale, 0.3 * scale, 0.74 * scale),
        hairMat,
      );
      hairTop.position.y = 0.3 * scale;
      headGroup.add(hairTop);
    }
    if (appearance.hairStyle === "long") {
      const hairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.74 * scale, 0.6 * scale, 0.15 * scale),
        hairMat,
      );
      hairBack.position.set(0, 0, -0.32 * scale);
      headGroup.add(hairBack);
      [-0.35, 0.35].forEach((x) => {
        const hairSide = new THREE.Mesh(
          new THREE.BoxGeometry(0.15 * scale, 0.5 * scale, 0.3 * scale),
          hairMat,
        );
        hairSide.position.set(x * scale, -0.05 * scale, -0.1 * scale);
        headGroup.add(hairSide);
      });
    }
    const eyeGeo = new THREE.BoxGeometry(
      0.1 * scale,
      0.08 * scale,
      0.05 * scale,
    );
    [-0.15, 0.15].forEach((x) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x * scale, 0.05 * scale, 0.35 * scale);
      headGroup.add(eye);
    });
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.2 * scale, 0.05 * scale, 0.05 * scale),
      mouthMat,
    );
    mouth.position.set(0, -0.15 * scale, 0.35 * scale);
    headGroup.add(mouth);
    human.add(headGroup);
    [-1, 1].forEach((side, idx) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(
        side * 0.575 * scale,
        torsoY + torsoHeight * 0.35,
        0,
      );
      const upperArmPivot = new THREE.Group();
      const upperArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.25 * scale, 0.55 * scale, 0.25 * scale),
        shirtMat,
      );
      upperArm.position.y = -0.275 * scale;
      upperArmPivot.add(upperArm);
      const lowerArmPivot = new THREE.Group();
      lowerArmPivot.position.y = -0.55 * scale;
      const lowerArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.22 * scale, 0.5 * scale, 0.22 * scale),
        skinMat,
      );
      lowerArm.position.y = -0.25 * scale;
      lowerArmPivot.add(lowerArm);
      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.18 * scale, 0.18 * scale, 0.18 * scale),
        skinMat,
      );
      hand.position.y = -0.55 * scale;
      lowerArmPivot.add(hand);
      upperArmPivot.add(lowerArmPivot);
      armGroup.add(upperArmPivot);
      if (walkPhase > 0) {
        const swing = Math.sin(walkPhase) * 0.7;
        upperArmPivot.rotation.x = side === -1 ? swing : -swing;
        lowerArmPivot.rotation.x =
          Math.max(0, Math.sin(walkPhase + (side === -1 ? 0 : Math.PI))) * 0.3;
      }
      human.add(armGroup);
    });
    if (isHighlighted) {
      const plumbob = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.025, 0),
        new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          emissive: 0x00ff00,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.85,
        }),
      );
      plumbob.position.set(0, headY + headHeight / 2 + 0.06, 0);
      human.add(plumbob);
    }
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 200;
    labelCanvas.height = 48;
    const lctx = labelCanvas.getContext("2d");
    if (isHighlighted) {
      lctx.fillStyle = "#00ff00";
    } else {
      lctx.fillStyle = "rgba(0,0,0,0.85)";
    }
    lctx.beginPath();
    lctx.roundRect(0, 0, 200, 48, 12);
    lctx.fill();
    lctx.fillStyle = isHighlighted ? "#000" : "#ffffff";
    lctx.font = "bold 24px Arial";
    lctx.textAlign = "center";
    lctx.fillText(name, 100, 34);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTex, transparent: true }),
    );
    labelSprite.position.set(0, headY + headHeight / 2 + 0.1, 0);
    labelSprite.scale.set(0.32, 0.08, 1);
    human.add(labelSprite);
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.06, 16),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = groundY + 0.001;
  human.add(shadow);
  return human;
}

// ==================== ANIMATION HELPER ====================
export function applyItemAnimation(
  obj,
  itemIndex,
  animPhase,
  animData,
  structure,
  animProgress = 1,
) {
  if (!animPhase) return;
  const isTarget = animData.index === itemIndex;
  const isTarget1 = animData.index1 === itemIndex;
  const isTarget2 = animData.index2 === itemIndex;
  const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const p = ease(animProgress);

  if (structure === "array") {
    if (animPhase === "access-lift" && isTarget) {
      obj.position.y += 0.4 * p;
      obj.rotation.z = 0.15 * p;
    } else if (animPhase === "access-bounce" && isTarget) {
      obj.position.y += 0.28 * p;
      obj.scale.setScalar(1 + 0.2 * p);
      obj.rotation.z = -0.1 * p;
    } else if (animPhase === "access-settle" && isTarget) {
      obj.position.y += 0.08 * (1 - p);
    } else if (animPhase === "insert-appear" && isTarget) {
      obj.position.y += 0.5 * (1 - p);
      obj.scale.setScalar(0.3 + 0.7 * p);
      obj.rotation.y = Math.PI * 2 * (1 - p);
    } else if (animPhase === "insert-drop" && isTarget) {
      obj.position.y += 0.7 * (1 - p);
      obj.scale.setScalar(0.5 + 0.5 * p);
      obj.rotation.z = 0.3 * (1 - p);
    } else if (animPhase === "insert-settle" && isTarget) {
      obj.position.y += 0.15 * (1 - p);
      obj.scale.setScalar(1 + 0.1 * (1 - p));
    } else if (animPhase === "delete-lift" && isTarget) {
      obj.position.y += 0.45 * p;
      obj.rotation.z = 0.4 * p;
      obj.scale.setScalar(1 + 0.2 * p);
    } else if (animPhase === "delete-shrink" && isTarget) {
      obj.position.y += 0.8 * p;
      obj.scale.setScalar(Math.max(0.01, 1 - p));
      obj.rotation.z = 3.0 * p;
    } else if (
      animPhase === "delete-close" &&
      animData.deleteIndex !== undefined &&
      itemIndex >= animData.deleteIndex
    ) {
      obj.position.y += 0.06 * (1 - p);
    } else if (animPhase === "swap-lift" && (isTarget1 || isTarget2)) {
      obj.position.y += 0.45 * p;
      obj.rotation.z = (isTarget1 ? 0.15 : -0.15) * p;
    } else if (animPhase === "swap-cross" && (isTarget1 || isTarget2)) {
      obj.position.y += 0.5;
      obj.rotation.z = (isTarget1 ? -0.2 : 0.2) * p;
    } else if (animPhase === "swap-drop" && (isTarget1 || isTarget2)) {
      obj.position.y += 0.12 * (1 - p);
      obj.scale.setScalar(1 + 0.12 * (1 - p));
    }
  }
  if (structure === "linkedlist") {
    if (animPhase === "ll-insert-head" && isTarget) {
      obj.position.y += 0.5 * (1 - p);
      obj.scale.setScalar(0.6 + 0.4 * p);
      obj.rotation.z = 0.2 * (1 - p);
    } else if (animPhase === "ll-insert-head-settle" && isTarget) {
      obj.position.y += 0.1 * (1 - p);
      obj.scale.setScalar(1 + 0.05 * (1 - p));
    } else if (animPhase === "ll-insert-tail" && isTarget) {
      obj.position.y += 0.5 * (1 - p);
      obj.scale.setScalar(0.6 + 0.4 * p);
    } else if (animPhase === "ll-insert-tail-settle" && isTarget) {
      obj.position.y += 0.1 * (1 - p);
      obj.scale.setScalar(1 + 0.05 * (1 - p));
    } else if (animPhase === "ll-delete-lift" && isTarget) {
      obj.position.y += 0.5 * p;
      obj.rotation.z = 0.3 * p;
    } else if (animPhase === "ll-delete-shrink" && isTarget) {
      obj.position.y += 0.8 * p;
      obj.scale.setScalar(Math.max(0.01, 1 - p));
      obj.rotation.z = 2.5 * p;
    } else if (animPhase === "ll-traverse" && isTarget) {
      obj.position.y += 0.2 * p;
      obj.scale.setScalar(1 + 0.15 * p);
    }
  }
  if (structure === "stack") {
    if (animPhase === "stack-push-drop" && isTarget) {
      obj.position.y += 0.6 * (1 - p);
      obj.scale.setScalar(0.7 + 0.3 * p);
      obj.rotation.z = 0.2 * (1 - p);
    } else if (animPhase === "stack-push-settle" && isTarget) {
      obj.position.y += 0.1 * (1 - p);
      obj.scale.setScalar(1 + 0.08 * (1 - p));
    } else if (animPhase === "stack-pop-lift" && isTarget) {
      obj.position.y += 0.4 * p;
      obj.rotation.z = -0.3 * p;
    } else if (animPhase === "stack-pop-fly" && isTarget) {
      obj.position.y += 0.9 * p;
      obj.scale.setScalar(Math.max(0.01, 1 - p));
      obj.rotation.z = 3.0 * p;
    } else if (animPhase === "stack-peek-lift" && isTarget) {
      obj.position.y += 0.15 * p;
      obj.rotation.z = 0.05 * p;
    } else if (animPhase === "stack-peek-settle" && isTarget) {
      obj.position.y += 0.08 * (1 - p);
    }
  }
  if (structure === "queue") {
    if (animPhase === "queue-enqueue-enter" && isTarget) {
      obj.position.x += 1.2 * (1 - p);
      obj.scale.setScalar(0.6 + 0.4 * p);
    } else if (animPhase === "queue-enqueue-settle" && isTarget) {
      obj.position.x += 0.2 * (1 - p);
      obj.scale.setScalar(1 + 0.05 * (1 - p));
    } else if (animPhase === "queue-front-peek" && isTarget) {
      obj.position.y += 0.2 * p;
      obj.scale.setScalar(1 + 0.15 * p);
    }
  }
}

// ==================== SCENE CLEANUP HELPER ====================
export function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material))
        child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  }
}
