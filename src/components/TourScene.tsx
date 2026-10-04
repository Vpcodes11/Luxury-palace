import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createPalace } from '../lib/palaceScene'

const viewpoints = [
  { name: 'Estate', position: [-11, 3.1, 12.5], target: [0, 3.9, -1.8], detail: 'The limestone loggia, opened toward the Mediterranean.' },
  { name: 'Courtyard', position: [-10, 2.35, -1.1], target: [1, 3.25, -1.1], detail: 'A rhythm of turned columns, deep arches and bronze-framed doors.' },
  { name: 'Grand salon', position: [10.6, 2.85, -7.1], target: [0, 3, -5.8], detail: 'Linen seating, carved stone tables and warm light behind the arcade.' },
  { name: 'Sea terrace', position: [14, 2.7, 18], target: [0, 3.4, -1], detail: 'Still water holds the façade and the warmth of the rooms.' },
] as const
type SceneAPI = { go: (index: number) => void; rotate: (angle: number) => void; light: (night: boolean) => void }

export default function TourScene() {
  const mount = useRef<HTMLDivElement>(null)
  const sceneApi = useRef<SceneAPI | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [view, setView] = useState(0)
  const [night, setNight] = useState(true)
  useEffect(() => {
    if (failed) return
    const host = mount.current!
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) } catch { setFailed(true); return }
    const mobile = window.innerWidth < 760
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1 : 1.5))
    renderer.setClearColor('#687b8a')
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    const canvas = renderer.domElement
    host.appendChild(canvas)
    canvas.setAttribute('aria-label', 'Interactive palace with stone arcades, furnished salon and reflecting pool')
    canvas.setAttribute('aria-describedby', 'palace-tour-instructions')
    canvas.tabIndex = 0
    canvas.style.touchAction = 'pan-y'
    canvas.dataset.state = 'loading'; canvas.dataset.view = 'Estate'; canvas.dataset.lighting = 'night'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(mobile ? 53 : 45, 1, .12, 600)
    const controls = new OrbitControls(camera, canvas)
    controls.enableZoom = false; controls.enablePan = false
    controls.minPolarAngle = .18
    controls.rotateSpeed = .55; controls.touches.TWO = THREE.TOUCH.ROTATE
    canvas.style.touchAction = 'pan-y'
    const updateControls = () => {
      // Keep the camera above the paving without forcing eye-level views above their target.
      const distance = Math.max(camera.position.distanceTo(controls.target), 1)
      controls.maxPolarAngle = Math.acos(THREE.MathUtils.clamp((.95 - controls.target.y) / distance, -.98, .98))
      controls.update()
    }
    let disposed = false, shadersReady = false, drawFrame = 0, cameraFrame = 0, lightFrame = 0, lightAmount = 1, lightDestination = 1, visible = true
    let palace: ReturnType<typeof createPalace>
    try { palace = createPalace(scene, mobile) } catch {
      controls.dispose(); renderer.dispose(); canvas.remove(); setFailed(true); return
    }
    canvas.dataset.triangles = String(Math.round(palace.triangleCount)); canvas.dataset.renders = '0'
    const render = () => {
      if (disposed || !shadersReady || !visible || drawFrame) return
      drawFrame = requestAnimationFrame(() => {
        drawFrame = 0
        if (disposed || !visible) return
        try {
          renderer.render(scene, camera)
          canvas.dataset.renders = String(Number(canvas.dataset.renders) + 1)
          canvas.dataset.drawCalls = String(renderer.info.render.calls)
          setReady(true)
        } catch { setFailed(true) }
      })
    }
    const stopCamera = () => { cancelAnimationFrame(cameraFrame); cameraFrame = 0; canvas.dataset.state = 'ready' }
    const go = (index: number, immediate = false) => {
      stopCamera()
      const point = viewpoints[index]
      const destination = new THREE.Vector3(...point.position), target = new THREE.Vector3(...point.target)
      if (mobile && index === 0) destination.sub(target).multiplyScalar(1.1).add(target)
      canvas.dataset.view = point.name
      if (immediate || reduced) {
        camera.position.copy(destination); controls.target.copy(target); updateControls()
        canvas.dataset.state = 'ready'; render(); return
      }
      const from = camera.position.clone(), fromTarget = controls.target.clone(), start = performance.now()
      canvas.dataset.state = 'moving'
      const tick = (time: number) => {
        if (disposed) return
        const t = Math.min((time - start) / 1250, 1), eased = t * t * t * (t * (t * 6 - 15) + 10)
        camera.position.lerpVectors(from, destination, eased); controls.target.lerpVectors(fromTarget, target, eased)
        updateControls(); render()
        if (t < 1) cameraFrame = requestAnimationFrame(tick)
        else { cameraFrame = 0; canvas.dataset.state = 'ready' }
      }
      cameraFrame = requestAnimationFrame(tick)
    }
    const rotate = (angle: number) => {
      stopCamera()
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      camera.position.copy(controls.target).add(offset); updateControls(); render()
    }
    const light = (toNight: boolean) => {
      cancelAnimationFrame(lightFrame)
      const from = lightAmount, to = Number(toNight), start = performance.now()
      lightDestination = to
      canvas.dataset.lighting = 'changing'
      const tick = (time: number) => {
        if (disposed) return
        const t = reduced ? 1 : Math.min((time - start) / 1450, 1)
        lightAmount = THREE.MathUtils.lerp(from, to, t * t * (3 - 2 * t))
        palace.light(lightAmount); render()
        if (t < 1) lightFrame = requestAnimationFrame(tick)
        else { lightFrame = 0; canvas.dataset.lighting = toNight ? 'night' : 'day' }
      }
      lightFrame = requestAnimationFrame(tick)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -.18 : .18) }
    }
    canvas.addEventListener('keydown', onKey)
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true) }
    canvas.addEventListener('webglcontextlost', contextLost)
    controls.addEventListener('change', render); controls.addEventListener('start', stopCamera)
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render()
    }
    const observer = new ResizeObserver(resize); observer.observe(host)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) render()
      else {
        stopCamera(); cancelAnimationFrame(lightFrame); lightFrame = 0
        lightAmount = lightDestination; palace.light(lightAmount)
        canvas.dataset.lighting = lightAmount === 1 ? 'night' : 'day'
      }
    })
    visibility.observe(host)
    sceneApi.current = { go, rotate, light }
    go(0, true); resize()
    host.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
    void renderer.compileAsync(scene, camera).then(() => {
      if (disposed) return
      shadersReady = true; renderer.shadowMap.needsUpdate = true; render()
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => {
      disposed = true; cancelAnimationFrame(drawFrame); cancelAnimationFrame(cameraFrame); cancelAnimationFrame(lightFrame)
      observer.disconnect(); visibility.disconnect(); controls.dispose(); sceneApi.current = null
      canvas.removeEventListener('keydown', onKey); canvas.removeEventListener('webglcontextlost', contextLost)
      palace.dispose(); renderer.dispose(); canvas.remove()
    }
  }, [failed])
  return <div className="tour-interactive">
    {failed ? <div className="tour-fallback"><img src="/optimized/campaign/tour-palace.webp" srcSet="/optimized/campaign/tour-palace-mobile.webp 800w, /optimized/campaign/tour-palace.webp 1600w" sizes="(max-width: 760px) 100vw, 80vw" alt="The palace arcade and reflecting pool" /><p>The 3D view is unavailable on this device. Explore the photographic galleries below.</p></div> : <>
      <div className="tour-viewer" aria-busy={!ready}>
        <div className="tour-canvas" ref={mount} />
        {!ready && <div className="tour-loading" role="status">Opening the residence…</div>}
        <div className="tour-scene-label"><span>OMNIS / SPATIAL EXPERIENCE</span><strong>{viewpoints[view].name}</strong></div>
        <div className="tour-atmosphere" role="group" aria-label="Time of day">
          <button disabled={!ready} aria-pressed={!night} onClick={() => { setNight(false); sceneApi.current?.light(false) }}>Daylight</button>
          <button disabled={!ready} aria-pressed={night} onClick={() => { setNight(true); sceneApi.current?.light(true) }}>Blue hour</button>
        </div>
      </div>
      <div className="tour-controls" aria-label="Tour viewpoints">
        {viewpoints.map((point, index) => <button key={point.name} disabled={!ready} aria-label={point.name} aria-pressed={view === index} onClick={() => { setView(index); sceneApi.current?.go(index) }}><span aria-hidden="true">0{index + 1}</span>{point.name}</button>)}
        <button disabled={!ready} aria-label="Rotate model left" onClick={() => sceneApi.current?.rotate(-Math.PI / 8)}>↶</button>
        <button disabled={!ready} aria-label="Rotate model right" onClick={() => sceneApi.current?.rotate(Math.PI / 8)}>↷</button>
      </div>
      <p className="tour-view-detail">{viewpoints[view].detail}</p>
      <p id="palace-tour-instructions" className="tour-instructions" aria-live="polite">{viewpoints[view].name} · Drag to look around, or use the arrow keys. Choose a viewpoint and change the light.</p>
    </>}
  </div>
}
