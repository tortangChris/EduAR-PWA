import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage1 = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const nodeRefs = useRef([]);

  const addNodeRef = (r) => {
    if (r && !nodeRefs.current.includes(r)) nodeRefs.current.push(r);
  };

  // ✅ Tree node positions kept same x,y, only scaled and moved backward in z
  const scaleFactor = 0.8; // shrink slightly
  const zOffset = -9; // move object farther in AR

  const nodes = [
    { id: "A", pos: [0, 3 * scaleFactor, zOffset] },
    { id: "B", pos: [-2 * scaleFactor, 1.5 * scaleFactor, zOffset] },
    { id: "C", pos: [2 * scaleFactor, 1.5 * scaleFactor, zOffset] },
    { id: "D", pos: [-3 * scaleFactor, 0, zOffset] },
    { id: "E", pos: [-1 * scaleFactor, 0, zOffset] },
    { id: "F", pos: [1 * scaleFactor, 0, zOffset] },
    { id: "G", pos: [3 * scaleFactor, 0, zOffset] },
  ];

  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "F"],
    ["C", "G"],
  ];

  const startAR = (gl) => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["hit-test", "local-floor"],
            })
            .then((session) => {
              gl.xr.setSession(session);
            })
            .catch((err) => console.error("AR session failed:", err));
        } else {
          console.warn("AR not supported on this device.");
        }
      });
    }
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas
        // ✅ Adjusted camera for better distance perception in AR
        camera={{ position: [0, 3, 15], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"Introduction to Trees"}
          position={[0, 5 * scaleFactor, zOffset]}
          fontSize={0.6 * scaleFactor}
          color="white"
        />

        <FadeInText
          show={true}
          text={"A hierarchical, non-linear data structure of connected nodes"}
          position={[0, 4.2 * scaleFactor, zOffset]}
          fontSize={0.32 * scaleFactor}
          color="#fde68a"
        />

        {/* Tree */}
        <TreeVisualization
          nodes={nodes}
          edges={edges}
          onNodeClick={setSelectedNode}
          selectedNode={selectedNode}
          addNodeRef={addNodeRef}
        />

        {/* Info Panel */}
        {selectedNode && (
          <NodeInfoPanel node={selectedNode} position={[6, 2, zOffset]} />
        )}

        <ARInteractionManager
          nodeRefs={nodeRefs}
          setSelectedNode={setSelectedNode}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === AR Interaction ===
const ARInteractionManager = ({ nodeRefs, setSelectedNode }) => {
  const { gl } = useThree();

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      const onSelect = () => {
        const xrCamera = gl.xr.getCamera();
        const raycaster = new THREE.Raycaster();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(cam.quaternion)
          .normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        raycaster.set(origin, dir);

        const candidates = (nodeRefs.current || [])
          .map((group) => (group ? group.children : []))
          .flat();

        const intersects = raycaster.intersectObjects(candidates, true);
        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && hit.userData?.nodeData === undefined && hit.parent)
            hit = hit.parent;
          const nodeData = hit?.userData?.nodeData;
          if (nodeData) setSelectedNode(nodeData);
        }
      };

      session.addEventListener("select", onSelect);
      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, nodeRefs, setSelectedNode]);

  return null;
};

// === Tree Visualization ===
const TreeVisualization = ({
  nodes,
  edges,
  onNodeClick,
  selectedNode,
  addNodeRef,
}) => {
  return (
    <group>
      {edges.map(([a, b], i) => {
        const start = nodes.find((n) => n.id === a).pos;
        const end = nodes.find((n) => n.id === b).pos;
        return <Connection key={i} start={start} end={end} />;
      })}

      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onClick={() => onNodeClick(node)}
          isSelected={selectedNode?.id === node.id}
          ref={(r) => addNodeRef(r)}
        />
      ))}
    </group>
  );
};

// === Node ===
const TreeNode = React.forwardRef(({ node, onClick, isSelected }, ref) => {
  const { id, pos, type } = node;
  const baseColor =
    type === "Root" ? "#60a5fa" : type === "Child" ? "#34d399" : "#fbbf24";
  const color = isSelected ? "#f87171" : baseColor;
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) groupRef.current.userData = { nodeData: node };
  }, [node]);

  return (
    <group
      position={pos}
      ref={(g) => {
        groupRef.current = g;
        if (typeof ref === "function") ref(g);
        else if (ref) ref.current = g;
      }}
      onClick={onClick}
    >
      {/* ✅ Smaller sphere size */}
      <mesh>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {id}
      </Text>
    </group>
  );
});

// === Edge ===
const Connection = ({ start, end }) => {
  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points]
  );

  return (
    <line>
      <primitive object={geometry} />
      <lineBasicMaterial color="#94a3b8" linewidth={2} />
    </line>
  );
};

// === Node Info ===
const NodeInfoPanel = ({ node, position }) => {
  let description = "";
  if (node.type === "Root")
    description = "Topmost node in the tree. Has no parent.";
  else if (node.type === "Child")
    description = "A node that has a parent and may have children.";
  else description = "A leaf node — has no children.";

  const content = [
    `🔹 Node: ${node.id}`,
    `Type: ${node.type}`,
    "",
    description,
  ].join("\n");

  return (
    <FadeInText
      show={true}
      text={content}
      position={position}
      fontSize={0.32}
      color="#a5f3fc"
    />
  );
};

// === Fade-in Text ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.05, 0);
      scale.current = 0.6;
    }
    if (ref.current && ref.current.material) {
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      material-transparent
      maxWidth={10}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default ARPage1;
