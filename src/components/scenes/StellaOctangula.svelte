<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  let {
    height = 480,
    R = 1.4,
    r = 1.4,
    blueColor = 0x3b82f6,
    redColor = 0xef4444,
    showLabels = true,
  }: {
    height?: number;
    R?: number;
    r?: number;
    blueColor?: number;
    redColor?: number;
    showLabels?: boolean;
  } = $props();

  let container: HTMLDivElement;

  type ViewKey = "free" | "111" | "1nn" | "n1n" | "nn1";

  const VIEWS: { key: ViewKey; label: string; pair: string; dir: [number, number, number] }[] = [
    { key: "free", label: "free orbit", pair: "—", dir: [3, 2, 4] },
    { key: "111", label: "(1, 1, 1)", pair: "B0 ↔ R2", dir: [1, 1, 1] },
    { key: "1nn", label: "(1, -1, -1)", pair: "B1 ↔ R3", dir: [1, -1, -1] },
    { key: "n1n", label: "(-1, 1, -1)", pair: "B2 ↔ R0", dir: [-1, 1, -1] },
    { key: "nn1", label: "(-1, -1, 1)", pair: "B3 ↔ R1", dir: [-1, -1, 1] },
  ];

  let activeView: ViewKey = $state("free");
  let snapTo: ((key: ViewKey) => void) | null = null;

  const onSnap = (key: ViewKey) => {
    activeView = key;
    snapTo?.(key);
  };

  onMount(() => {
    const scene = new THREE.Scene();
    const w = container.clientWidth;

    const frustumHeight = Math.max(R, r) * 3.0;
    const aspect = w / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumHeight * aspect) / 2,
      (frustumHeight * aspect) / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.01,
      100,
    );
    const initialDir = new THREE.Vector3(3, 2, 4).normalize();
    camera.position.copy(initialDir.multiplyScalar(10));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.addEventListener("start", () => {
      tween = null;
      activeView = "free";
    });

    const CAM_RADIUS = 10;
    const TWEEN_DURATION = 0.6;

    type Tween = {
      from: THREE.Vector3;
      to: THREE.Vector3;
      start: number;
    };
    let tween: Tween | null = null;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    snapTo = (key: ViewKey) => {
      const view = VIEWS.find((v) => v.key === key);
      if (!view) return;
      const target = new THREE.Vector3(...view.dir).normalize().multiplyScalar(CAM_RADIUS);
      tween = {
        from: camera.position.clone().normalize().multiplyScalar(CAM_RADIUS),
        to: target,
        start: performance.now() / 1000,
      };
      controls.enabled = false;
    };

    // Outer (blue) tetrahedron
    const outerGeom = new THREE.TetrahedronGeometry(R);
    const outerMat = new THREE.MeshStandardMaterial({
      color: blueColor,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const outer = new THREE.Mesh(outerGeom, outerMat);
    scene.add(outer);

    const outerEdgesGeom = new THREE.EdgesGeometry(outerGeom);
    const outerEdgesMat = new THREE.LineBasicMaterial({ color: blueColor });
    scene.add(new THREE.LineSegments(outerEdgesGeom, outerEdgesMat));

    // Inner (red) tetrahedron, Y-flipped — the dual
    const innerGeom = new THREE.TetrahedronGeometry(r);
    const innerMat = new THREE.MeshStandardMaterial({
      color: redColor,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    inner.scale.y = -1;
    scene.add(inner);

    const innerEdgesGeom = new THREE.EdgesGeometry(innerGeom);
    const innerEdgesMat = new THREE.LineBasicMaterial({ color: redColor });
    const innerEdges = new THREE.LineSegments(innerEdgesGeom, innerEdgesMat);
    innerEdges.scale.y = -1;
    scene.add(innerEdges);

    // Vertex spheres + labels
    const s = 1 / Math.sqrt(3);
    const vBase: [number, number, number][] = [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ];

    const labelSprites: THREE.Sprite[] = [];

    const makeLabel = (text: string, color: number) => {
      const canvas = document.createElement("canvas");
      const size = 128;
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.font = "bold 72px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, size / 2, size / 2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.32, 0.32, 1);
      labelSprites.push(sprite);
      return sprite;
    };

    const vertexGeom = new THREE.SphereGeometry(0.045, 16, 12);
    const blueVertMat = new THREE.MeshBasicMaterial({ color: blueColor });
    const redVertMat = new THREE.MeshBasicMaterial({ color: redColor });

    vBase.forEach(([x, y, z], i) => {
      const bx = R * x * s, by = R * y * s, bz = R * z * s;
      const blueDot = new THREE.Mesh(vertexGeom, blueVertMat);
      blueDot.position.set(bx, by, bz);
      scene.add(blueDot);
      if (showLabels) {
        const label = makeLabel(`B${i}`, blueColor);
        label.position.set(bx * 1.18, by * 1.18, bz * 1.18);
        scene.add(label);
      }

      // Inner: same base coords scaled by r, then Y-flipped
      const rx = r * x * s, ry = -r * y * s, rz = r * z * s;
      const redDot = new THREE.Mesh(vertexGeom, redVertMat);
      redDot.position.set(rx, ry, rz);
      scene.add(redDot);
      if (showLabels) {
        const label = makeLabel(`R${i}`, redColor);
        label.position.set(rx * 1.18, ry * 1.18, rz * 1.18);
        scene.add(label);
      }
    });

    // Origin marker
    const originGeom = new THREE.SphereGeometry(0.03, 12, 8);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    scene.add(new THREE.Mesh(originGeom, originMat));

    // Lighting
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -2, -3);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    let rafId = 0;
    let stopped = false;
    const tmpFrom = new THREE.Vector3();
    const tmpTo = new THREE.Vector3();

    const tick = () => {
      if (stopped) return;

      if (tween) {
        const elapsed = performance.now() / 1000 - tween.start;
        const t = Math.min(elapsed / TWEEN_DURATION, 1);
        const eased = easeInOutCubic(t);
        // Spherical lerp keeps the camera on the radius-10 sphere.
        tmpFrom.copy(tween.from);
        tmpTo.copy(tween.to);
        const dot = THREE.MathUtils.clamp(tmpFrom.dot(tmpTo) / (CAM_RADIUS * CAM_RADIUS), -1, 1);
        const omega = Math.acos(dot);
        if (omega < 1e-4) {
          camera.position.copy(tmpTo);
        } else {
          const sinO = Math.sin(omega);
          const a = Math.sin((1 - eased) * omega) / sinO;
          const b = Math.sin(eased * omega) / sinO;
          camera.position.copy(tmpFrom).multiplyScalar(a).addScaledVector(tmpTo, b);
        }
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        if (t >= 1) {
          tween = null;
          controls.target.set(0, 0, 0);
          controls.enabled = true;
        }
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      const w2 = container.clientWidth;
      const a2 = w2 / height;
      camera.left = (-frustumHeight * a2) / 2;
      camera.right = (frustumHeight * a2) / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      outerGeom.dispose();
      outerMat.dispose();
      outerEdgesGeom.dispose();
      outerEdgesMat.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      innerEdgesGeom.dispose();
      innerEdgesMat.dispose();
      vertexGeom.dispose();
      blueVertMat.dispose();
      redVertMat.dispose();
      originGeom.dispose();
      originMat.dispose();
      labelSprites.forEach((s) => {
        (s.material.map as THREE.Texture | null)?.dispose();
        s.material.dispose();
      });
      snapTo = null;
    };
  });
</script>

<div class="scene-wrap">
  <div bind:this={container} style="width: 100%; height: {height}px;"></div>
  <div class="view-bar">
    {#each VIEWS as v (v.key)}
      <button
        type="button"
        class:active={activeView === v.key}
        onclick={() => onSnap(v.key)}
        title={v.pair === "—" ? "Free orbit" : `View along ${v.label} — overlapping ${v.pair}`}
      >
        {v.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .scene-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .view-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    justify-content: center;
  }
  .view-bar button {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.25rem 0.625rem;
    border: 1px solid color-mix(in srgb, var(--theme-secondary) 50%, transparent);
    background: color-mix(in srgb, var(--theme-bg) 70%, transparent);
    color: var(--theme-muted);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 120ms, color 120ms, border-color 120ms;
  }
  .view-bar button:hover {
    color: var(--theme-primary);
    border-color: var(--theme-primary);
  }
  .view-bar button.active {
    color: var(--theme-bg);
    background: var(--theme-primary);
    border-color: var(--theme-primary);
  }
</style>

<div bind:this={container} style="width: 100%; height: {height}px;"></div>
