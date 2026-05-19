'use client';

import { type ReactNode, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

type SceneMode = 'lab' | 'company';

type Atom = {
  position: THREE.Vector3;
  radius: number;
  tone: number;
};

type Bond = [number, number];

type Molecule = {
  atoms: Atom[];
  bonds: Bond[];
  position: [number, number, number];
  rotation: [number, number, number];
  speed: [number, number, number];
  scale: number;
  opacity: number;
};

const moleculeCount = 14;
const particleCount = 680;

const palette = {
  lab: {
    primary: new THREE.Color('#28d7ff'),
    secondary: new THREE.Color('#0b68ff'),
    accent: new THREE.Color('#dffaff'),
    backgroundA: '#051328',
    backgroundB: '#082f55',
    glow: 'rgba(40, 215, 255, 0.34)',
  },
  company: {
    primary: new THREE.Color('#ff9a2f'),
    secondary: new THREE.Color('#ffcc62'),
    accent: new THREE.Color('#fff1cc'),
    backgroundA: '#190d05',
    backgroundB: '#58300a',
    glow: 'rgba(255, 154, 47, 0.34)',
  },
};

export function AdvancedChemicalScene({ mode }: { mode: SceneMode }) {
  const colors = palette[mode];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 42% 38%, ${colors.backgroundB} 0%, ${colors.backgroundA} 48%, #02050d 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 72% 24%, ${colors.glow}, transparent 34%)`,
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#02050d']} />
        <fog attach="fog" args={['#02050d', 8, 18]} />
        <ambientLight intensity={0.38} />
        <pointLight position={[5, 5, 5]} intensity={2} color={colors.accent} />
        <pointLight position={[-4, -3, 4]} intensity={1.2} color={colors.primary} />
        <SceneRig>
          <MolecularField mode={mode} />
          <ParticleVolume mode={mode} />
        </SceneRig>
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.25}
            luminanceSmoothing={0.8}
            intensity={0.58}
            radius={0.55}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function SceneRig({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, pointer.x * 0.16, 0.045);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -pointer.y * 0.1, 0.045);
    group.position.x = THREE.MathUtils.lerp(group.position.x, pointer.x * 0.22, 0.035);
    group.position.y = THREE.MathUtils.lerp(group.position.y, pointer.y * 0.14, 0.035);
    group.position.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.14;
  });

  return <group ref={groupRef}>{children}</group>;
}

function MolecularField({ mode }: { mode: SceneMode }) {
  const molecules = useMemo(() => createMolecules(), []);

  return (
    <group>
      {molecules.map((molecule, index) => (
        <MoleculeCluster key={index} molecule={molecule} mode={mode} index={index} blurred />
      ))}
    </group>
  );
}

function MoleculeCluster({
  molecule,
  mode,
  index,
  blurred,
}: {
  molecule: Molecule;
  mode: SceneMode;
  index: number;
  blurred: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const atomsRef = useRef<THREE.InstancedMesh>(null);
  const colors = palette[mode];

  const atomMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.primary,
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.12,
        transparent: true,
        opacity: molecule.opacity,
        depthWrite: false,
        vertexColors: true,
      }),
    [colors.primary, molecule.opacity],
  );

  const bondMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      }),
    [colors.accent],
  );

  const bondGeometry = useMemo(() => {
    const vertices: number[] = [];
    molecule.bonds.forEach(([from, to]) => {
      const start = molecule.atoms[from].position;
      const end = molecule.atoms[to].position;
      vertices.push(start.x, start.y, start.z, end.x, end.y, end.z);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [molecule]);

  useLayoutEffect(() => {
    const mesh = atomsRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    molecule.atoms.forEach((atom, atomIndex) => {
      matrix.compose(
        atom.position,
        new THREE.Quaternion(),
        new THREE.Vector3(atom.radius, atom.radius, atom.radius),
      );
      mesh.setMatrixAt(atomIndex, matrix);
      color.copy(colors.secondary).lerp(colors.accent, atom.tone);
      mesh.setColorAt(atomIndex, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors.accent, colors.secondary, molecule]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.x += molecule.speed[0] * delta;
    group.rotation.y += molecule.speed[1] * delta;
    group.rotation.z += molecule.speed[2] * delta;
    group.position.y =
      molecule.position[1] + Math.sin(state.clock.elapsedTime * 0.45 + index * 0.73) * 0.08;
  });

  return (
    <group
      ref={groupRef}
      position={molecule.position}
      rotation={molecule.rotation}
      scale={molecule.scale}
    >
      <lineSegments geometry={bondGeometry} material={bondMaterial} />
      <instancedMesh ref={atomsRef} args={[undefined, undefined, molecule.atoms.length]}>
        <sphereGeometry args={[1, blurred ? 8 : 12, blurred ? 8 : 12]} />
        <primitive object={atomMaterial} attach="material" />
      </instancedMesh>
    </group>
  );
}

function ParticleVolume({ mode }: { mode: SceneMode }) {
  const pointsRef = useRef<THREE.Points>(null);
  const noise = useMemo(() => createNoise3D(seedRandom(12)), []);
  const colors = palette[mode];

  const { geometry, bases } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const random = seedRandom(42);
    const base: THREE.Vector3[] = [];

    for (let index = 0; index < particleCount; index += 1) {
      const depth = random() * 14 - 7;
      const spread = 4.2 + Math.abs(depth) * 0.28;
      const x = (random() - 0.5) * spread * 2;
      const y = (random() - 0.5) * 7.2;
      const z = depth;

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      sizes[index] = 1.6 + random() * 3.8;
      base.push(new THREE.Vector3(x, y, z));
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { geometry: bufferGeometry, bases: base };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: colors.primary },
          uAccent: { value: colors.accent },
        },
        vertexShader: `
          attribute float size;
          varying float vDepth;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vDepth = smoothstep(-7.0, 7.0, position.z);
            gl_PointSize = size * (260.0 / max(2.0, -mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform vec3 uAccent;
          varying float vDepth;
          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            float alpha = smoothstep(0.5, 0.0, dist) * 0.22;
            vec3 color = mix(uColor, uAccent, vDepth);
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [colors.accent, colors.primary],
  );

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const positions = points.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime * 0.17;

    bases.forEach((base, index) => {
      const offset = index * 3;
      const n1 = noise(base.x * 0.18, base.y * 0.18, time + base.z * 0.08);
      const n2 = noise(base.y * 0.2, time + base.x * 0.1, base.z * 0.2);
      const n3 = noise(time + base.z * 0.12, base.x * 0.16, base.y * 0.16);

      positions[offset] = base.x + n1 * 0.32;
      positions[offset + 1] = base.y + n2 * 0.24;
      positions[offset + 2] = base.z + n3 * 0.2;
    });

    points.geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function createMolecules() {
  const random = seedRandom(7);
  const molecules: Molecule[] = [];

  for (let moleculeIndex = 0; moleculeIndex < moleculeCount; moleculeIndex += 1) {
    const atomCount = 8 + Math.floor(random() * 11);
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const branchBias = random() * Math.PI * 2;

    atoms.push({
      position: new THREE.Vector3(0, 0, 0),
      radius: 0.09 + random() * 0.04,
      tone: random(),
    });

    for (let atomIndex = 1; atomIndex < atomCount; atomIndex += 1) {
      const parent = Math.max(0, Math.floor((atomIndex - 1) * Math.pow(random(), 0.72)));
      const angle = branchBias + atomIndex * 1.77 + random() * 0.8;
      const elevation = (random() - 0.5) * 1.1;
      const distance = 0.34 + random() * 0.28;
      const parentPosition = atoms[parent].position;
      const position = new THREE.Vector3(
        parentPosition.x + Math.cos(angle) * distance,
        parentPosition.y + Math.sin(angle) * distance * 0.78,
        parentPosition.z + elevation * distance,
      );

      atoms.push({
        position,
        radius: 0.07 + random() * 0.055,
        tone: random(),
      });
      bonds.push([parent, atomIndex]);

      if (atomIndex > 4 && random() > 0.68) {
        const crossTarget = Math.floor(random() * (atomIndex - 2));
        bonds.push([crossTarget, atomIndex]);
      }
    }

    const z = -7.4 + random() * 3.4;
    molecules.push({
      atoms,
      bonds,
      position: [(random() - 0.5) * 7.8, (random() - 0.5) * 5.2, z],
      rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
      speed: [(random() - 0.5) * 0.18, 0.08 + random() * 0.2, (random() - 0.5) * 0.14],
      scale: 0.86 + random() * 0.46,
      opacity: 0.14 + random() * 0.16,
    });
  }

  return molecules;
}

function seedRandom(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
