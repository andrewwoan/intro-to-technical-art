import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
// Import TSL nodes
import {
  color,
  float,
  vec3,
  sin,
  cos,
  time,
  positionLocal,
  positionWorld,
  positionGeometry,
  positionWorldDirection,
  positionView,
  normalLocal,
  positionViewDirection,
  mix,
  smoothstep,
} from "three/tsl";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGPURenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 4);
// scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// scene.add(directionalLight);

const createCustomNodeMaterial = () => {
  const p = positionLocal.toVar().y;

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = p;

  return material;
};

// Create the custom material once to share between objects
const sharedCustomMaterial = createCustomNodeMaterial();

// Setup DRACO loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

// Setup GLTF loader with DRACO
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Load the GLB model
let loadedModel = null;
gltfLoader.load("/models/Knight.glb", (gltf) => {
  loadedModel = gltf.scene;
  loadedModel.position.set(1, 0, 0);

  loadedModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Apply the shared custom node material to the mesh
      child.material = sharedCustomMaterial;
    }
  });

  scene.add(loadedModel);
});

const planeGeometry = new THREE.PlaneGeometry(1, 1);
// Use the same custom material instead of MeshLambertMaterial
const plane = new THREE.Mesh(planeGeometry, sharedCustomMaterial);
plane.position.x = -1;
plane.receiveShadow = true;
scene.add(plane);

const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

// Camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

camera.position.set(0, 0, 5);
controls.update();

// Animation loop with requestAnimationFrame
function animate() {
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation loop
renderer.setAnimationLoop(animate);
