<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  let { height = 400, color = 0xff9900 }: { height?: number; color?: number } = $props();

  let container: HTMLDivElement;

  onMount(() => {
    const scene = new THREE.Scene();
    const w = container.clientWidth;
    const camera = new THREE.PerspectiveCamera(50, w / height, 0.1, 1000);
    camera.position.set(3, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geom, mat);
    scene.add(cube);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(3, 5, 4);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const clock = new THREE.Clock();
    let rafId = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const t = clock.getElapsedTime();
      cube.rotation.x = t * 0.5;
      cube.rotation.y = t * 0.7;
      controls.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      const w2 = container.clientWidth;
      camera.aspect = w2 / height;
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
      geom.dispose();
      mat.dispose();
    };
  });
</script>

<div bind:this={container} style="width: 100%; height: {height}px;"></div>
