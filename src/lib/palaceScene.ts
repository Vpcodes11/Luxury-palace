import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Reflector } from 'three/addons/objects/Reflector.js'

// Reconstructed from Film 02's visible architecture, rather than measured plans.
// Static geometry is batched by material; nothing runs continuously when idle.
export function createPalace(scene: THREE.Scene, mobile: boolean) {
  let seed = 62407
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const textures: THREE.Texture[] = []
  const materials: THREE.Material[] = []
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const root = new THREE.Group()
  root.name = 'Film 02 palace reconstruction'
  scene.add(root)

  function texture(kind: 'stone' | 'paving' | 'roof' | 'linen' | 'shadow') {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const colors = { stone: '#ddd0b5', paving: '#c7b99e', roof: '#947358', linen: '#c6b99f', shadow: 'transparent' }
    ctx.fillStyle = colors[kind]; ctx.fillRect(0, 0, 512, 512)
    if (kind === 'shadow') {
      const gradient = ctx.createRadialGradient(256, 256, 10, 256, 256, 256)
      gradient.addColorStop(0, 'rgba(20,17,13,.5)'); gradient.addColorStop(.45, 'rgba(20,17,13,.23)'); gradient.addColorStop(1, 'rgba(20,17,13,0)')
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512)
    } else {
      for (let i = 0; i < 42000; i++) {
        const light = random() > .48
        ctx.fillStyle = light ? 'rgba(255,250,228,.075)' : 'rgba(72,55,38,.065)'
        ctx.fillRect(random() * 512, random() * 512, random() * 3 + .5, .5 + random() * 2)
      }
      if (kind === 'paving') {
        ctx.strokeStyle = 'rgba(75,64,47,.26)'; ctx.lineWidth = 2
        for (let row = 0; row < 4; row++) {
          ctx.beginPath(); ctx.moveTo(0, row * 128); ctx.lineTo(512, row * 128); ctx.stroke()
          for (let col = 0; col < 4; col++) { const x = col * 192 + (row % 2) * 96; ctx.beginPath(); ctx.moveTo(x, row * 128); ctx.lineTo(x, (row + 1) * 128); ctx.stroke() }
        }
      }
      if (kind === 'roof') {
        for (let row = 0; row < 16; row++) for (let col = 0; col < 8; col++) {
          const x = col * 64, y = row * 32
          const shade = ctx.createLinearGradient(x, 0, x + 64, 0)
          shade.addColorStop(0, '#66503c'); shade.addColorStop(.22, '#a78968'); shade.addColorStop(.6, '#b49a78'); shade.addColorStop(1, '#70513d')
          ctx.fillStyle = shade; ctx.fillRect(x, y, 64, 32)
          ctx.fillStyle = 'rgba(39,26,16,.4)'; ctx.fillRect(x, y, 64, 2)
        }
      }
      if (kind === 'linen') {
        ctx.strokeStyle = 'rgba(246,237,218,.18)'; ctx.lineWidth = 1
        for (let i = 0; i < 512; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke() }
      }
    }
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.anisotropy = mobile ? 2 : 4
    textures.push(map)
    return map
  }
  function material(options: THREE.MeshStandardMaterialParameters) {
    const mat = new THREE.MeshStandardMaterial(options)
    materials.push(mat); return mat
  }
  const stoneMap = texture('stone')
  const stone = material({ map: stoneMap, bumpMap: stoneMap, bumpScale: .025, color: '#f4ead5', roughness: .87 })
  const trim = material({ map: stoneMap, bumpMap: stoneMap, bumpScale: .02, color: '#e9ddc4', roughness: .8 })
  const joint = material({ color: '#b3a48d', roughness: .95 })
  const pavingMap = texture('paving'); pavingMap.repeat.set(8, 8)
  const paving = material({ map: pavingMap, bumpMap: pavingMap, bumpScale: .03, color: '#f2e8d6', roughness: .66 })
  const roofMap = texture('roof'); roofMap.repeat.set(5, 2)
  const roof = material({ map: roofMap, bumpMap: roofMap, bumpScale: .05, roughness: .94 })
  const bronze = material({ color: '#51402d', metalness: .72, roughness: .33 })
  const oak = material({ color: '#59422b', roughness: .65 })
  const plaster = material({ color: '#d9ccb7', roughness: .94 })
  const fabric = material({ map: texture('linen'), color: '#f0e3c9', roughness: 1 })
  const oliveFabric = material({ color: '#898476', roughness: 1 })
  const dark = material({ color: '#34322a', roughness: .82 })
  const glass = material({ color: '#a6c2cb', transparent: true, opacity: .14, metalness: .5, roughness: .18, depthWrite: false, side: THREE.DoubleSide })
  const lamp = material({ color: '#ffedba', emissive: '#ffc56c', emissiveIntensity: 1.5, roughness: .7 })
  const shadow = new THREE.MeshBasicMaterial({ map: texture('shadow'), transparent: true, opacity: .75, depthWrite: false })
  materials.push(shadow)

  function add(geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, rotation = new THREE.Euler()) {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(1, 1, 1))
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    transformed.applyMatrix4(matrix)
    geometry.dispose()
    const list = batches.get(mat) ?? []; list.push(transformed); batches.set(mat, list)
  }
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material = stone, rotation = new THREE.Euler()) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rotation)
  const cylinder = (x: number, y: number, z: number, top: number, bottom: number, height: number, mat: THREE.Material, segments = 20) => add(new THREE.CylinderGeometry(top, bottom, height, segments), mat, x, y, z)
  const contact = (x: number, y: number, z: number, w: number, d: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadow)
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); root.add(mesh)
  }
  function archPanel(x: number, z: number, spring = 5.45, radius = 1.69, depth = .58) {
    const shape = new THREE.Shape()
    shape.moveTo(-2, 0); shape.lineTo(-2, 2.55); shape.lineTo(2, 2.55); shape.lineTo(2, 0); shape.lineTo(radius, 0)
    shape.absarc(0, 0, radius, 0, Math.PI, false); shape.lineTo(-2, 0)
    add(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 28 }), stone, x, spring, z)
    const band = new THREE.Shape()
    band.absarc(0, 0, radius + .18, 0, Math.PI, false)
    band.absarc(0, 0, radius, Math.PI, 0, true)
    band.closePath()
    add(new THREE.ExtrudeGeometry(band, { depth: .1, bevelEnabled: false, curveSegments: 28 }), trim, x, spring, z + depth)
    for (const row of [.65, 1.35, 2.12]) {
      const opening = row < radius ? Math.sqrt(radius * radius - row * row) + .2 : 0
      for (const side of [-1, 1]) box(x + side * (2 + opening) / 2, spring + row, z + depth + .005, 2 - opening, .008, .008, joint)
    }
    for (let slice = 1; slice < 14; slice++) {
      const angle = slice / 14 * Math.PI
      box(x + Math.cos(angle) * (radius + .09), spring + Math.sin(angle) * (radius + .09), z + depth + .106, .009, .175, .008, joint, new THREE.Euler(0, 0, angle - Math.PI / 2))
    }
  }
  function column(x: number, z: number) {
    box(x, .82, z, .95, .3, .95, trim)
    const profile = [[.46, 0], [.46, .12], [.4, .18], [.39, .24], [.33, .31], [.3, .43], [.295, 1.4], [.285, 2.5], [.26, 3.7], [.27, 4.12], [.32, 4.17], [.38, 4.25], [.4, 4.34]]
    add(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 32), trim, x, .98, z)
    cylinder(x, 5.34, z, .43, .38, .13, trim, 32)
    box(x, 5.45, z, .92, .15, .92, trim)
    box(x, 5.57, z, 1, .09, 1, trim)
    contact(x, .665, z, 1.5, 1.5)
  }
  function windowFrame(x: number) {
    const z = -2.8, r = 1.58
    box(x - 1.85, 3.01, z, .3, 4.7, .4)
    box(x + 1.85, 3.01, z, .3, 4.7, .4)
    archPanel(x, z - .25, 5.45, r, .45)
    box(x, 5.24, z + .07, 3.35, .25, .24, trim)
    const half = new THREE.Shape(); half.absarc(0, 0, r - .05, 0, Math.PI, false); half.closePath()
    add(new THREE.ShapeGeometry(half, 28), glass, x, 5.45, z + .03)
    const ring = new THREE.Shape(); ring.absarc(0, 0, r, 0, Math.PI, false); ring.absarc(0, 0, r - .07, Math.PI, 0, true); ring.closePath()
    add(new THREE.ShapeGeometry(ring, 28), bronze, x, 5.45, z + .06)
    for (const angle of [.25, .5, .75]) {
      const a = Math.PI * angle
      box(x + Math.cos(a) * r / 2, 5.45 + Math.sin(a) * r / 2, z + .06, .035, r, .055, bronze, new THREE.Euler(0, 0, a - Math.PI / 2))
    }
    for (const side of [-1, 1]) {
      const door = new THREE.Group()
      const hingeX = x + side * 1.59
      // Open leaves expose the furnished salon, as in the source photograph.
      door.position.set(hingeX, .7, z); door.rotation.y = side * .72
      const leafMaterial = bronze
      function part(px: number, py: number, width: number, height: number, mat = leafMaterial) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, .055), mat)
        mesh.position.set(-side * px, py, 0); door.add(mesh)
      }
      part(.79, 2.1, 1.5, 4.12, glass)
      for (const px of [.035, 1.545]) part(px, 2.1, .055, 4.2)
      for (const py of [.03, .83, 3.36, 4.18]) part(.79, py, 1.58, .055)
      part(1.4, 1.96, .035, .36)
      door.updateMatrixWorld(true)
      door.children.forEach(child => {
        const mesh = child as THREE.Mesh
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
        geometry.applyMatrix4(mesh.matrixWorld); mesh.geometry.dispose()
        const list = batches.get(mesh.material as THREE.Material) ?? []; list.push(geometry); batches.set(mesh.material as THREE.Material, list)
      })
    }
  }

  // Terrace with a true pool cutout, broad arrival steps and a stone plinth.
  const terrace = new THREE.Shape()
  terrace.moveTo(-22, 14); terrace.lineTo(22, 14); terrace.lineTo(22, -26); terrace.lineTo(-22, -26); terrace.closePath()
  const poolHole = new THREE.Path(); poolHole.moveTo(1, -3); poolHole.lineTo(1, -21); poolHole.lineTo(10, -21); poolHole.lineTo(10, -3); poolHole.closePath()
  terrace.holes.push(poolHole)
  add(new THREE.ShapeGeometry(terrace), paving, 0, .02, 0, new THREE.Euler(-Math.PI / 2, 0, 0))
  box(0, -.78, 5.5, 44, 1.5, 41, stone)
  // Remove the solid upper surface over water; the plinth lies below the pool.
  box(0, .46, -4.8, 27, .4, 11, paving)
  for (let step = 0; step < 3; step++) box(0, .11 + step * .11, 1.85 - step * .52, 27.1, .22 + step * .22, 1.15, trim)
  box(5.5, -.15, 12, 9, .12, 18, material({ color: '#315e67', roughness: .25 }))
  for (const x of [.77, 10.23]) box(x, .04, 12, .46, .16, 18.7, trim)
  for (const z of [2.77, 21.23]) box(5.5, .04, z, 9.9, .16, .46, trim)
  const water = new Reflector(new THREE.PlaneGeometry(9, 18), { color: '#8ba6a5', textureWidth: mobile ? 384 : 768, textureHeight: mobile ? 384 : 768, clipBias: .003, multisample: 0 })
  water.name = 'Reflecting pool'; water.rotation.x = -Math.PI / 2; water.position.set(5.5, .065, 12)
  const waterMaterial = water.material as THREE.ShaderMaterial
  waterMaterial.fragmentShader = waterMaterial.fragmentShader.replace('texture2DProj( tDiffuse, vUv )', 'texture2DProj( tDiffuse, vUv + vec4( sin( vUv.y * 140.0 ) * .0007 * vUv.w, cos( vUv.x * 160.0 ) * .0004 * vUv.w, 0., 0. ) )')
  root.add(water)

  // Six deep loggia bays, with turned columns, archivolts and round medallions.
  for (let x = -12; x <= 12; x += 4) column(x, 0)
  for (let x = -10; x <= 10; x += 4) {
    archPanel(x, -.25); windowFrame(x)
    const vault = new THREE.Shape()
    vault.absarc(0, 0, 1.76, 0, Math.PI, false); vault.absarc(0, 0, 1.69, Math.PI, 0, true); vault.closePath()
    add(new THREE.ExtrudeGeometry(vault, { depth: 2.65, bevelEnabled: false, curveSegments: 28 }), trim, x, 5.45, -2.7)
  }
  for (let x = -8; x <= 8; x += 4) {
    add(new THREE.TorusGeometry(.23, .045, 8, 28), trim, x, 7.46, .36)
  }
  // Side walls and back wall enclose genuine, navigable interior volume.
  box(-12.15, 4.15, -6.5, .5, 7, 7.6)
  box(12.15, 4.15, -6.5, .5, 7, 7.6)
  box(0, 4.15, -10.4, 24.8, 7, .45, plaster)
  box(0, 7.65, -5.2, 24.4, .28, 10.8, plaster)
  for (const y of [.89, 1.09, 7.05]) box(0, y, -10.14, 24, .13, .12, trim)
  for (const x of [-8, 0, 8]) {
    box(x, 3.5, -10.1, 2.3, 4.6, .07, dark)
    for (const dx of [-1.2, 1.2]) box(x + dx, 3.5, -9.98, .12, 4.9, .16, oak)
    for (const y of [1.07, 3.5, 5.95]) box(x, y, -9.97, 2.5, .1, .16, oak)
    box(x, 3.5, -9.96, .08, 4.9, .1, oak)
  }
  // Layered entablature continues around all elevations; roof has real hip faces.
  for (const [y, w, d, h] of [[8.04, 25.3, 11, .18], [8.2, 25.65, 11.3, .16], [8.35, 26, 11.55, .13], [8.47, 26.25, 11.8, .1]]) box(0, y, -4.9, w, h, d, trim)
  const roofGeometry = new THREE.BufferGeometry()
  const a = [-13.4, 8.5, 1.2], b = [13.4, 8.5, 1.2], c = [13.4, 8.5, -11], d = [-13.4, 8.5, -11], e = [-9.7, 10.1, -4.9], f = [9.7, 10.1, -4.9]
  const vertices = [...a, ...b, ...f, ...a, ...f, ...e, ...b, ...c, ...f, ...c, ...d, ...e, ...c, ...e, ...f, ...d, ...a, ...e]
  roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  roofGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(vertices.flatMap((_, i) => i % 3 === 0 ? [(vertices[i] + 13.4) / 26.8, (vertices[i + 2] + 11) / 12.2] : []), 2))
  roofGeometry.computeVertexNormals(); add(roofGeometry, roof)
  for (let x = -10; x <= 10; x += .45) add(new THREE.CylinderGeometry(.13, .13, .43, 10, 1, true, 0, Math.PI), roof, x, 10.13, -4.9, new THREE.Euler(0, 0, Math.PI / 2))
  for (let x = -12.8; x < 13; x += .45) add(new THREE.CylinderGeometry(.1, .1, .3, 8, 1, true, 0, Math.PI), roof, x, 8.51, .97, new THREE.Euler(Math.PI / 2, 0, 0))

  // Furnished salon: upholstered seating, stone tables, lamps and sheer curtains.
  function sofa(x: number, z: number, rotation = 0) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotation
    const parts: [number, number, number, number, number, number, THREE.Material][] = [
      [0, 1.01, 0, 3.2, .4, 1.1, oak], [0, 1.29, .08, 3.05, .26, 1, fabric], [0, 1.71, -.44, 3.2, .75, .21, fabric],
      [-1.52, 1.5, 0, .22, .65, 1.17, fabric], [1.52, 1.5, 0, .22, .65, 1.17, fabric],
    ]
    for (const [px, py, pz, w, h, depth, mat] of parts) {
      const shape = new THREE.Shape(); const r = .06
      shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
      shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
      shape.lineTo(-w / 2 + r, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
      shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
      const pos = new THREE.Vector3(px, py, pz - depth / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation).add(new THREE.Vector3(x, 0, z))
      add(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, steps: 1, curveSegments: 4 }), mat, pos.x, pos.y, pos.z, new THREE.Euler(0, rotation, 0))
    }
    for (const dx of [-.8, .8]) box(x + dx * Math.cos(rotation), 1.57, z - dx * Math.sin(rotation) - .18, .6, .4, .22, oliveFabric, new THREE.Euler(.16, rotation, 0))
    contact(x, .675, z, 4.2, 2.2)
  }
  sofa(-4.8, -7.9); sofa(-7.5, -5.8, Math.PI / 2); sofa(4.8, -7.9); sofa(7.5, -5.8, -Math.PI / 2)
  for (const x of [-4.8, 4.8]) {
    box(x, .675, -6.3, 6.4, .018, 4.2, fabric)
    cylinder(x, 1.05, -6.2, 1.04, .8, .6, trim, 32)
    cylinder(x, 1.38, -6.2, 1.23, 1.23, .12, trim, 40)
    cylinder(x + .4, 1.59, -6.1, .14, .21, .3, bronze)
    cylinder(x - .3, 1.48, -6.1, .25, .25, .08, dark)
    box(x + 2, 1.18, -8, .85, 1.02, .85, oak)
    cylinder(x + 2, 1.99, -8, .05, .07, .66, bronze)
    add(new THREE.ConeGeometry(.47, .6, 24, 1, true), lamp, x + 2, 2.47, -8)
    for (const dx of [-1.45, 1.45]) {
      // Thin folded fabric panels leave the central sightlines open.
      for (let fold = 0; fold < 4; fold++) cylinder(x + dx + fold * .05, 3.1, -3.04, .042, .055, 4.65, fabric, 8)
    }
  }
  for (const x of [-10, -2, 2, 10]) {
    cylinder(x, 3.16, -2.96, .07, .07, .8, bronze)
    add(new THREE.SphereGeometry(.105, 10, 6), lamp, x, 3.58, -2.95)
  }
  const roomLights = [-7, 0, 7].map(x => {
    const light = new THREE.PointLight('#ffc987', 45, 13, 2)
    light.position.set(x, 3.7, -6.5); scene.add(light); return light
  })
  // Subtle, precomputed light spill instead of six costly shadow-casting lamps.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128
  const glowCtx = glowCanvas.getContext('2d')!
  const glowGradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
  glowGradient.addColorStop(0, 'rgba(255,183,76,.45)'); glowGradient.addColorStop(1, 'rgba(255,183,76,0)')
  glowCtx.fillStyle = glowGradient; glowCtx.fillRect(0, 0, 128, 128)
  const glowMap = new THREE.CanvasTexture(glowCanvas); glowMap.colorSpace = THREE.SRGBColorSpace; textures.push(glowMap)
  const spill = new THREE.MeshBasicMaterial({ map: glowMap, transparent: true, depthWrite: false, opacity: .65, blending: THREE.AdditiveBlending })
  materials.push(spill)
  for (const x of [-10, -6, -2, 2, 6, 10]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 5.5), spill)
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .672, -1.1); root.add(mesh)
  }

  // Branching olive silhouettes and many individual leaves, not solid green blobs.
  const bark = material({ color: '#665642', roughness: 1 })
  const leaves = material({ color: '#d2d6c2', roughness: .92, side: THREE.DoubleSide })
  const leafTransforms: THREE.Matrix4[] = []
  const leafColors: THREE.Color[] = []
  function branch(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
    const delta = to.clone().sub(from), middle = from.clone().add(to).multiplyScalar(.5)
    const geometry = new THREE.CylinderGeometry(radius * .6, radius, delta.length(), 8)
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()))
    add(geometry, bark, middle.x, middle.y, middle.z)
  }
  function olive(x: number, z: number, size = 1) {
    box(x, .24, z, 3.3 * size, .5, 3.3 * size, stone)
    box(x, .5, z, 3.48 * size, .12, 3.48 * size, trim)
    box(x, .54, z, 2.98 * size, .06, 2.98 * size, dark)
    const foot = new THREE.Vector3(x, .56, z), fork = new THREE.Vector3(x + .2 * size, 2.8 * size, z)
    branch(foot, fork, .17 * size)
    for (let arm = 0; arm < 7; arm++) {
      const angle = arm / 7 * Math.PI * 2
      const end = new THREE.Vector3(x + Math.cos(angle) * 1.35 * size, (3.7 + random()) * size, z + Math.sin(angle) * 1.35 * size)
      branch(fork, end, .075 * size)
      for (let twig = 0; twig < 3; twig++) branch(end, end.clone().add(new THREE.Vector3((random() - .5) * 1.4, .35 + random() * .5, (random() - .5) * 1.4).multiplyScalar(size)), .025 * size)
      const count = mobile ? 110 : 180
      for (let leaf = 0; leaf < count; leaf++) {
        const azimuth = random() * Math.PI * 2, height = random() * 2 - 1, radius = Math.cbrt(random()) * 1.25
        const ring = Math.sqrt(1 - height * height)
        const pos = end.clone().add(new THREE.Vector3(Math.cos(azimuth) * ring * radius, height * radius * .68, Math.sin(azimuth) * ring * radius).multiplyScalar(size))
        const scale = new THREE.Vector3(.06 + random() * .055, .08 + random() * .03, .12 + random() * .09).multiplyScalar(size)
        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(random() * 3, random() * 6, random() * 3))
        leafTransforms.push(new THREE.Matrix4().compose(pos, rotation, scale))
        leafColors.push(new THREE.Color().setHSL(.2 + random() * .07, .12 + random() * .14, .38 + random() * .22))
      }
    }
    for (let leaf = 0; leaf < 150; leaf++) {
      const angle = random() * Math.PI * 2, radius = .2 + random() * 1.15
      leafTransforms.push(new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(angle) * radius * size, .67 + random() * .26, z + Math.sin(angle) * radius * size), new THREE.Quaternion().setFromEuler(new THREE.Euler(random(), angle, random())), new THREE.Vector3(.09, .1, .18)))
      leafColors.push(new THREE.Color('#728169'))
    }
    contact(x, .03, z, 5.5 * size, 5.5 * size)
  }
  olive(-15.5, 5.1, 1.15); olive(15.2, 3.9, 1.08); olive(-15.4, 19.8, 1); olive(15.8, 20.3, .9)
  const leafShape = new THREE.Shape()
  leafShape.moveTo(0, -1); leafShape.bezierCurveTo(.58, -.45, .58, .45, 0, 1); leafShape.bezierCurveTo(-.58, .45, -.58, -.45, 0, -1)
  const leafGeometry = new THREE.ShapeGeometry(leafShape, 5); leafGeometry.rotateX(-Math.PI / 2)
  const foliage = new THREE.InstancedMesh(leafGeometry, leaves, leafTransforms.length)
  leafTransforms.forEach((matrix, i) => { foliage.setMatrixAt(i, matrix); foliage.setColorAt(i, leafColors[i]) })
  foliage.castShadow = true; foliage.receiveShadow = true; foliage.computeBoundingSphere(); root.add(foliage)
  const cypress = material({ color: '#394b32', roughness: 1 })
  for (const x of [-17.5, 17.5]) for (const z of [-6, -11]) {
    cylinder(x, 2.3, z, .11, .21, 4.4, bark, 8)
    add(new THREE.LatheGeometry([[.14, 0], [.42, .45], [.59, 1.1], [.65, 2.4], [.54, 3.8], [.35, 5], [.16, 6], [0, 6.5]].map(([r, y]) => new THREE.Vector2(r, y)), 16), cypress, x, .55, z)
  }
  // Low garden wall frames the horizon; urns, lanterns and small terrace furniture.
  box(0, .48, 25.6, 43.4, .96, .46)
  box(0, 1, 25.6, 44, .12, .7, trim)
  for (const x of [-21, 21]) { box(x, .46, 6, .48, .92, 38); box(x, .97, 6, .68, .11, 38.4, trim) }
  for (const x of [-18.5, 18.5]) {
    box(x, .75, 25, 1, 1.5, 1)
    add(new THREE.LatheGeometry([[0, 0], [.37, .03], [.28, .18], [.55, .45], [.58, .57]].map(([r, y]) => new THREE.Vector2(r, y)), 20), trim, x, 1.5, 25)
  }
  for (const x of [-11.5, 12]) {
    for (const dx of [-.17, .17]) for (const dz of [-.17, .17]) box(x + dx, .46, 2.3 + dz, .025, .75, .025, bronze)
    box(x, .07, 2.3, .4, .06, .4, bronze); box(x, .86, 2.3, .4, .055, .4, bronze)
    cylinder(x, .35, 2.3, .075, .075, .38, lamp)
    add(new THREE.TorusGeometry(.11, .02, 6, 12), bronze, x, 1.02, 2.3)
  }
  for (const z of [8, 12.5]) {
    box(-5, .75, z, 1.8, .22, 3.2, fabric, new THREE.Euler(-.08, 0, 0))
    for (const x of [-5.65, -4.35]) box(x, .38, z, .1, .7, 2.85, oak)
    box(-5, 1.08, z - 1.15, 1.8, .58, .15, fabric, new THREE.Euler(-.35, 0, 0))
    contact(-5, .04, z, 2.5, 4)
  }

  // Consolidate opaque architecture into a small number of draw calls.
  for (const [mat, geometries] of batches) {
    const merged = mergeGeometries(geometries, false)!
    const mesh = new THREE.Mesh(merged, mat)
    mesh.castShadow = !(mat as THREE.MeshStandardMaterial).transparent
    mesh.receiveShadow = true; root.add(mesh)
    geometries.forEach(geometry => geometry.dispose())
  }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#112c50') }, horizon: { value: new THREE.Color('#687b8a') } },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDirection; void main(){float h=clamp(normalize(vDirection).y,0.,1.); gl_FragColor=vec4(mix(horizon,top,pow(h,.48)),1.); #include <colorspace_fragment> }'.replace('; #include', ';\n#include').replace('> }', '>\n}'),
  }))
  scene.add(sky)
  const seaMaterial = new THREE.ShaderMaterial({
    uniforms: { nearColor: { value: new THREE.Color('#294257') }, horizonColor: { value: new THREE.Color('#687b8a') } },
    vertexShader: 'varying vec3 w; void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 nearColor; uniform vec3 horizonColor; varying vec3 w;
      void main(){float distanceFade=clamp(length(w.xz-cameraPosition.xz)/155.,0.,1.);
      float ripple=sin(w.x*.4+w.z*3.1)*sin(w.x*.13-w.z*1.7);
      gl_FragColor=vec4(mix(nearColor,horizonColor,distanceFade)+vec3(ripple*.009*(1.-distanceFade)),1.);
      #include <colorspace_fragment>
      }`,
  })
  const sea = new THREE.Mesh(new THREE.CircleGeometry(440, 64), seaMaterial)
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.54, 45); scene.add(sea)
  const hemisphere = new THREE.HemisphereLight('#b8cde3', '#766954', .85); scene.add(hemisphere)
  const sun = new THREE.DirectionalLight('#adc5ed', .75)
  sun.position.set(-18, 27, 20); sun.castShadow = true
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048)
  sun.shadow.camera.left = sun.shadow.camera.bottom = -26; sun.shadow.camera.right = sun.shadow.camera.top = 26
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 80; sun.shadow.normalBias = .035; sun.shadow.bias = -.00015
  scene.add(sun)
  const fill = new THREE.AmbientLight('#fff0d5', .16); scene.add(fill)
  const mix = (from: string, to: string, amount: number) => new THREE.Color(from).lerp(new THREE.Color(to), amount)
  function light(amount: number) {
    const shader = sky.material as THREE.ShaderMaterial
    shader.uniforms.top.value.copy(mix('#5b91b3', '#112c50', amount))
    shader.uniforms.horizon.value.copy(mix('#e4d8c3', '#687b8a', amount))
    hemisphere.color.copy(mix('#fff2d9', '#b8cde3', amount)); hemisphere.intensity = 1.65 - amount * 1.1
    sun.color.copy(mix('#fff0d0', '#adc5ed', amount)); sun.intensity = 2.5 - amount * 1.95
    roomLights.forEach(point => { point.intensity = 12 + amount * 30 })
    lamp.emissiveIntensity = .35 + amount * 1.7; spill.opacity = .08 + amount * .57
    seaMaterial.uniforms.nearColor.value.copy(mix('#819dac', '#294257', amount))
    seaMaterial.uniforms.horizonColor.value.copy(mix('#e4d8c3', '#687b8a', amount))
    scene.fog = new THREE.Fog(mix('#e4d8c3', '#687b8a', amount), 80, 245)
  }
  light(1)
  const triangleCount = [...root.children, sky, sea].reduce((sum, object) => {
    if (!(object instanceof THREE.Mesh)) return sum
    return sum + (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1)
  }, 0)
  return { light, triangleCount, dispose() {
    const disposed = new Set<THREE.BufferGeometry>()
    ;[root, sky, sea].forEach(object => object.traverse(child => {
      if (child instanceof THREE.Mesh && !disposed.has(child.geometry)) { disposed.add(child.geometry); child.geometry.dispose() }
    }))
    water.getRenderTarget().dispose(); waterMaterial.dispose(); (sky.material as THREE.Material).dispose(); seaMaterial.dispose()
    textures.forEach(map => map.dispose()); materials.forEach(mat => mat.dispose())
    roomLights.forEach(point => scene.remove(point)); scene.remove(root, sky, sea, hemisphere, sun, fill)
    sun.shadow.map?.dispose()
  } }
}
