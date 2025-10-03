import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
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
  vec4,
  vec2,
  length,
  step,
} from "three/tsl";
import { Fn } from "three/src/nodes/TSL.js";

// Setup scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
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

// Create the custom material once to share between objects

const fragmentShaderFunction = Fn(() => {
  // const angle = float(-Math.PI / 4); // 45 degrees
  // const cosA = cos(angle);
  // const sinA = sin(angle);

  // const rotatedX = positionLocal.x.mul(cosA).add(positionLocal.z.mul(sinA));

  // const finalColor = vec3(rotatedX.add(0.2));

  // return finalColor;

  const correctedPosition = vec3(
    positionLocal.x,
    positionLocal.z,
    positionLocal.y.negate()
  );

  const finalColor = vec3(0);

  const color1 = vec3(1, 0, 0);
  const color2 = vec3(0, 0, 1);

  correctedPosition.assign(length(correctedPosition));
  correctedPosition.assign(step(time, correctedPosition));

  finalColor.assign(mix(color1, color2, correctedPosition));

  return finalColor;
});

const sharedCustomMaterial = new THREE.MeshBasicNodeMaterial();
sharedCustomMaterial.fragmentNode = fragmentShaderFunction();

// Setup DRACO loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

// Setup GLTF loader with DRACO
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Load the GLB model
let loadedModel = null;
gltfLoader.load("/models/Scene.glb", (gltf) => {
  loadedModel = gltf.scene;
  loadedModel.position.set(0, 0, 0);

  loadedModel.traverse((child) => {
    if (child.isMesh) {
      child.material = sharedCustomMaterial;
    }
  });

  scene.add(loadedModel);
});

const axesHelper = new THREE.AxesHelper(50);
// scene.add(axesHelper);

// Camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

camera.position.set(8.119320077462113, 3.0038308097924373, 0.686155944870028);
controls.target.set(
  -1.4269950171849213,
  2.1410254465135656,
  0.07347907348960196
);

controls.update();

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
