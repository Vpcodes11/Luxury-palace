import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const viewpoints = [
  { name: 'Estate', position: [19, 15, 24], target: [0, 1, 0] },
  { name: 'Courtyard', position: [0, 4, 7], target: [0, 2, -5] },
  { name: 'Grand salon', position: [0, 3, -7], target: [0, 2, 8] },
  { name: 'Sea terrace', position: [0, 4, 16], target: [0, 2, 0] },
] as const

export default function TourScene() {
  const mount = useRef<HTMLDivElement>(null)
  const sceneApi = useRef<{ go: (index: number) => void; rotate: (angle: number) => void } | null>(null)
  const [failed, setFailed] = useState(false)
  const [view, setView] = useState(0)
  useEffect(() => {
    const host = mount.current!
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) } catch { setFailed(true); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1 : 1.5))
    renderer.setClearColor('#c4bba8')
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-label', 'Interactive conceptual residence model')
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#c4bba8', 45, 110)
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 150)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI * .49
    const stone = new THREE.MeshStandardMaterial({ color: '#e2d4bb', roughness: .9 })
    const roof = new THREE.MeshStandardMaterial({ color: '#b69b7b', roughness: 1 })
    const dark = new THREE.MeshStandardMaterial({ color: '#4a4337', roughness: .75 })
    const glass = new THREE.MeshStandardMaterial({ color: '#526864', metalness: .3, roughness: .2 })
    const water = new THREE.MeshStandardMaterial({ color: '#4b777d', metalness: .45, roughness: .18 })
    const green = new THREE.MeshStandardMaterial({ color: '#64724b', roughness: 1 })
    const box = (x: number, y: number, z: number, w: number, h: number, d: number, material = stone) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
      mesh.position.set(x, y, z); scene.add(mesh); return mesh
    }
    box(0, -.45, 0, 34, .8, 34, roof)
    box(0, -.95, 0, 38, .2, 38, dark)
    box(0, -1.15, 45, 180, .1, 85, water)
    box(0, .02, 5, 6, .08, 12, water)
    box(0, 1, -8, 22, 2, 5)
    box(0, 4.7, -8, 22, 1.3, 5)
    box(-9, 2.8, -1, 4, 5.6, 11)
    box(9, 2.8, -1, 4, 5.6, 11)
    box(0, 5.8, -8, 23, .45, 6, roof)
    box(-9, 5.8, -1, 4.8, .45, 12, roof)
    box(9, 5.8, -1, 4.8, .45, 12, roof)
    // Repeated arcades leave the courtyard and salon open to explore.
    for (let x = -9; x <= 9; x += 3) {
      box(x, 2, -4.9, .45, 4, .5)
      if (x < 9) {
        const shape = new THREE.Shape()
        shape.moveTo(-1.28, 0); shape.lineTo(-1.28, 1.65); shape.lineTo(1.28, 1.65); shape.lineTo(1.28, 0)
        shape.absarc(0, 0, 1.28, 0, Math.PI, false)
        const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .5, bevelEnabled: false, curveSegments: 12 }), stone)
        arch.position.set(x + 1.5, 2.3, -5.15); scene.add(arch)
      }
      box(x, 3.45, -10.55, 1.5, 2.4, .08, glass)
    }
    for (const x of [-6, 6]) {
      for (const z of [-1, 5, 11]) {
        box(x, .3, z, 2, .6, 2, roof)
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.11, .2, 2, 8), dark)
        trunk.position.set(x, 1.6, z); scene.add(trunk)
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), green)
        crown.scale.set(1, .85, 1); crown.position.set(x, 3, z); scene.add(crown)
      }
    }
    box(0, .8, -7.7, 5, .35, 1.2, roof)
    box(-3, .65, -7.7, 1, 1.1, 2, dark)
    box(3, .65, -7.7, 1, 1.1, 2, dark)
    scene.add(new THREE.HemisphereLight('#fff4dc', '#686553', 2.2))
    const sunlight = new THREE.DirectionalLight('#fff0d0', 3)
    sunlight.position.set(-12, 25, 18); scene.add(sunlight)
    const render = () => renderer.render(scene, camera)
    const go = (index: number) => {
      const point = viewpoints[index]
      camera.position.set(point.position[0], point.position[1], point.position[2]); controls.target.set(point.target[0], point.target[1], point.target[2]); controls.update(); render()
    }
    const rotate = (angle: number) => {
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      camera.position.copy(controls.target).add(offset); controls.update(); render()
    }
    sceneApi.current = { go, rotate }
    controls.addEventListener('change', render)
    const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); render() }
    const observer = new ResizeObserver(resize); observer.observe(host)
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true) }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    go(0); resize()
    return () => {
      observer.disconnect(); controls.dispose(); sceneApi.current = null
      scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose() })
      ;[stone, roof, dark, glass, water, green].forEach(material => material.dispose())
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])
  return <div className="tour-interactive">
    {failed ? <div className="tour-fallback"><img src="/optimized/campaign/aerial-estate.webp" srcSet="/optimized/campaign/aerial-estate-mobile.webp 800w, /optimized/campaign/aerial-estate.webp 1600w" sizes="(max-width: 760px) 100vw, 80vw" alt="Aerial view of the conceptual residence" /><p>The 3D view is unavailable on this device. Explore the photographic galleries below.</p></div> : <><div className="tour-canvas" ref={mount} /><div className="tour-controls" aria-label="Tour viewpoints">{viewpoints.map((point, index) => <button key={point.name} aria-pressed={view === index} onClick={() => { setView(index); sceneApi.current?.go(index) }}>{point.name}</button>)}<button aria-label="Rotate model left" onClick={() => sceneApi.current?.rotate(-Math.PI / 8)}>↶</button><button aria-label="Rotate model right" onClick={() => sceneApi.current?.rotate(Math.PI / 8)}>↷</button></div><p className="tour-instructions" aria-live="polite">{viewpoints[view].name} · Drag to look around. Use the buttons to change your perspective.</p></>}
  </div>
}
