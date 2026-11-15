import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";

const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Earth() {
  const ref = useRef();
  const map = useTexture("/earth.jpg");
  // slow idle spin; OrbitControls handles drag on top of it
  useFrame((_, dt) => { if (!reduced && ref.current) ref.current.rotation.y += dt * 0.08; });
  return (
    <mesh ref={ref} rotation={[0.2, 4.2, 0]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  );
}

export default function Globe() {
  return (
    <div className="globe-wrap" style={{ width: "min(520px,80vw)", aspectRatio: "1", cursor: "grab", touchAction: "pan-y" }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={2.2} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Suspense fallback={null}><Earth /></Suspense>
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}