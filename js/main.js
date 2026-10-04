import * as THREE from "three";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function metal(color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function glow(color, intensity) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.42,
    metalness: 0.15,
  });
}

function addLights(scene, warm) {
  scene.add(new THREE.HemisphereLight(0xf4ecdf, 0x14161a, 0.55));
  const key = new THREE.DirectionalLight(warm, 2.35);
  key.position.set(3.2, 4.2, 2.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9eb0b8, 0.55);
  fill.position.set(-3.4, 0.6, -2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf0d2a4, 0.85);
  rim.position.set(-1.5, 2.2, -4);
  scene.add(rim);
}

function softShadow() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.95;
  return mesh;
}

function strut(from, to, radius, material) {
  const start = new THREE.Vector3(from[0], from[1], from[2]);
  const end = new THREE.Vector3(to[0], to[1], to[2]);
  const dir = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, Math.max(dir.length(), 0.001), 8),
    material
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

function buildShip(parent) {
  const hull = metal(0x8a8176, 0.36, 0.78);
  const plate = metal(0x2f2c29, 0.48, 0.7);
  const lamp = glow(0xe8b56a, 0.95);
  const ship = new THREE.Group();

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 64), hull);
  saucer.position.set(0, 0.06, 0.42);
  ship.add(saucer);

  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.46, 0.014, 64), plate);
  lip.position.set(0, 0.03, 0.42);
  ship.add(lip);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), plate);
  dome.scale.y = 0.5;
  dome.position.set(0, 0.1, 0.46);
  ship.add(dome);

  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, 0.024, 16), plate);
  bridge.position.set(0, 0.13, 0.5);
  ship.add(bridge);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.78, 8, 16), hull);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, -0.08, -0.28);
  ship.add(body);

  ship.add(strut([0, 0.02, 0.12], [0, -0.06, -0.02], 0.04, plate));

  const deflector = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), lamp);
  deflector.scale.set(1.15, 0.8, 0.42);
  deflector.position.set(0, -0.08, 0.18);
  ship.add(deflector);

  function nacelle(x) {
    const group = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 1.05, 6, 16), hull);
    tube.rotation.x = Math.PI / 2;
    group.add(tube);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.066, 16, 12), lamp);
    cap.scale.z = 0.58;
    cap.position.z = 0.58;
    group.add(cap);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), plate);
    tail.scale.z = 0.6;
    tail.position.z = -0.58;
    group.add(tail);
    group.position.set(x, -0.02, -0.22);
    return group;
  }
  ship.add(nacelle(-0.78));
  ship.add(nacelle(0.78));
  ship.add(strut([-0.32, 0.02, 0.15], [-0.78, -0.02, 0.05], 0.026, plate));
  ship.add(strut([0.32, 0.02, 0.15], [0.78, -0.02, 0.05], 0.026, plate));

  const windows = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 6, 6), lamp, 22);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.44, 0.09, Math.sin(a) * 0.44 + 0.42);
    dummy.scale.setScalar(i % 4 === 0 ? 1.1 : 0.65);
    dummy.updateMatrix();
    windows.setMatrixAt(i, dummy.matrix);
  }
  windows.instanceMatrix.needsUpdate = true;
  ship.add(windows);

  const posed = new THREE.Group();
  const box = new THREE.Box3().setFromObject(ship);
  ship.position.sub(box.getCenter(new THREE.Vector3()));
  posed.add(ship);
  posed.rotation.x = 0.35;
  const wrapper = new THREE.Group();
  wrapper.add(posed);
  parent.add(wrapper);
  return wrapper;
}

function buildEmpty(parent) {
  const bone = metal(0xc6baa8, 0.34, 0.6);
  const dim = metal(0x7d766c, 0.46, 0.48);
  const rig = new THREE.Group();

  // Two concentric broken rings, same gap, so the slot reads as empty.
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.02, 18, 180, Math.PI * 1.62),
    bone
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.012, 14, 140, Math.PI * 1.62),
    dim
  );
  outer.rotation.z = -0.55;
  inner.rotation.z = -0.55;
  rig.add(outer);
  rig.add(inner);

  rig.scale.setScalar(0.78);
  parent.add(rig);
  return rig;
}

function mount(canvas, configure) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const ratioCap = window.innerWidth < 800 ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratioCap));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  const root = new THREE.Group();
  scene.add(root);

  const state = configure(root, scene, camera);
  let onScreen = true;
  let frameId = 0;

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function draw(dt, t) {
    state.tick?.(dt, t);
    renderer.render(scene, camera);
  }

  const clock = new THREE.Clock();
  function loop() {
    frameId = requestAnimationFrame(loop);
    if (document.hidden || !onScreen) {
      clock.getDelta();
      return;
    }
    const dt = Math.min(clock.getDelta(), 0.05);
    draw(dt, clock.elapsedTime);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reducedMotion) draw(0, 0);
  });
  resizeObserver.observe(canvas);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(canvas);

  resize();
  draw(0, 0);
  if (!reducedMotion) loop();

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    renderer.dispose();
  };
}

function start() {
  const star = document.getElementById("stage-star");
  const next = document.getElementById("stage-next");
  if (!star || !next) return;

  mount(star, (root, scene, camera) => {
    addLights(scene, 0xfff1dc);
    scene.add(softShadow());
    const ship = buildShip(root);
    camera.position.set(2.05, 1.05, 2.45);
    camera.lookAt(0, 0, 0);
    ship.rotation.y = 1.25;
    return {
      tick(dt, t) {
        ship.rotation.y += dt * 0.16;
        ship.position.y = Math.sin(t * 0.6) * 0.03;
      },
    };
  });

  mount(next, (root, scene, camera) => {
    addLights(scene, 0xf0e4d2);
    const rig = buildEmpty(root);
    camera.position.set(0.35, 0.35, 3.15);
    camera.lookAt(0, -0.05, 0);
    rig.rotation.y = 0.55;
    return {
      tick(dt, t) {
        rig.rotation.y += dt * 0.16;
      },
    };
  });
}

start();
