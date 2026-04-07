import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Generate random points in a sphere
function generateSpherePoints(count) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const radius = 1.5 + Math.random() * 0.5
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)
  }
  return positions
}

// Animated particles component
function Particles() {
  const ref = useRef()
  const positions = useMemo(() => generateSpherePoints(5000), [])
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.05
      ref.current.rotation.y += delta * 0.08
      
      // Subtle parallax effect based on mouse position
      const mouseX = (state.mouse.x * 0.1) || 0
      const mouseY = (state.mouse.y * 0.1) || 0
      ref.current.rotation.z = mouseX * 0.2
      ref.current.position.y = mouseY * 0.1
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#a855f7"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}

// Secondary particles for depth
function SecondaryParticles() {
  const ref = useRef()
  const positions = useMemo(() => generateSpherePoints(2000), [])
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.03
      ref.current.rotation.y -= delta * 0.05
    }
  })

  return (
    <group rotation={[0, 0, -Math.PI / 6]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#06b6d4"
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}

// Floating orbs for visual interest
function FloatingOrbs() {
  const orbRef1 = useRef()
  const orbRef2 = useRef()
  const orbRef3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (orbRef1.current) {
      orbRef1.current.position.x = Math.sin(time * 0.5) * 2
      orbRef1.current.position.y = Math.cos(time * 0.3) * 1.5
      orbRef1.current.position.z = Math.sin(time * 0.4) * 0.5
    }
    if (orbRef2.current) {
      orbRef2.current.position.x = Math.cos(time * 0.4) * 2.5
      orbRef2.current.position.y = Math.sin(time * 0.5) * 1.2
      orbRef2.current.position.z = Math.cos(time * 0.3) * 0.8
    }
    if (orbRef3.current) {
      orbRef3.current.position.x = Math.sin(time * 0.3) * 1.8
      orbRef3.current.position.y = Math.cos(time * 0.6) * 2
      orbRef3.current.position.z = Math.sin(time * 0.5) * 0.3
    }
  })

  return (
    <>
      <mesh ref={orbRef1}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
      </mesh>
      <mesh ref={orbRef2}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
      </mesh>
      <mesh ref={orbRef3}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
      </mesh>
    </>
  )
}

// Main Three.js background component
export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-background pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 75 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 1.5, 4]} />
        <ambientLight intensity={0.5} />
        <Particles />
        <SecondaryParticles />
        <FloatingOrbs />
      </Canvas>
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-dark-900 opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-40" />
    </div>
  )
}
