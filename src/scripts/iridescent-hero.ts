/**
 * Hero object: an iridescent icosahedron lit by a procedural environment map.
 *
 * Loaded dynamically and only when it is worth the bytes — see `mountHero`.
 * Three.js is ~600KB, so nothing here is on the critical path: the page is
 * fully readable, and the headline fully legible, before this ever runs.
 */
import * as THREE from 'three';

type Teardown = () => void;

/** A vertical gradient painted to a canvas, used as the environment to reflect. */
function environmentTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  // Reflections carry the page palette, so the object belongs to the page
  // rather than looking like a stock 3D asset dropped on top of it.
  g.addColorStop(0.0, '#f4f1ea');
  g.addColorStop(0.35, '#2b4fd0');
  g.addColorStop(0.62, '#c2410c');
  g.addColorStop(1.0, '#12121a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

export function mountHero(canvas: HTMLCanvasElement): Teardown {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  const env = environmentTexture(renderer);
  scene.environment = env;

  const geometry = new THREE.IcosahedronGeometry(1.25, 0);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d0d14'),
    metalness: 0.35,
    roughness: 0.12,
    iridescence: 1,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [120, 560],
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // A wireframe shell, slightly larger, so the silhouette still reads as a
  // drawn object rather than a blob when the reflections go dark.
  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.42, 0)),
    new THREE.LineBasicMaterial({ color: new THREE.Color('#f4f1ea'), transparent: true, opacity: 0.22 }),
  );
  scene.add(shell);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // Pointer parallax. Target values are eased towards, so a fast flick never
  // snaps — the "play" motion lens, not a 1:1 mouse follow.
  let targetX = 0;
  let targetY = 0;
  const onPointer = (e: PointerEvent) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.8;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.8;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  const tick = () => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    mesh.rotation.y += (targetX - mesh.rotation.y * 0.35) * 0.012 + 0.0035;
    mesh.rotation.x += (targetY - mesh.rotation.x * 0.35) * 0.012 + 0.0015;
    mesh.position.y = Math.sin(t * 0.6) * 0.06;

    shell.rotation.y = mesh.rotation.y * -0.55;
    shell.rotation.x = mesh.rotation.x * -0.55;

    renderer.render(scene, camera);
  };
  tick();

  // Stop rendering when the hero scrolls away or the tab is hidden. A 3D loop
  // running behind the fold is a battery bug, not a feature.
  const visibility = new IntersectionObserver((entries) => {
    const visible = entries[0]?.isIntersecting ?? false;
    if (visible && !running) {
      running = true;
      tick();
    } else if (!visible) {
      running = false;
      cancelAnimationFrame(raf);
    }
  });
  visibility.observe(canvas);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    observer.disconnect();
    visibility.disconnect();
    window.removeEventListener('pointermove', onPointer);
    geometry.dispose();
    material.dispose();
    shell.geometry.dispose();
    (shell.material as THREE.Material).dispose();
    env.dispose();
    renderer.dispose();
  };
}
