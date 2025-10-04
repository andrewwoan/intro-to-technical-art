import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";
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
  uniform,
  If,
  atan,
} from "three/tsl";
import { Fn } from "three/src/nodes/TSL.js";

// Debugger ---------------------------------------------------------------
// const gui = new GUI();

// Scene ---------------------------------------------------------------
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

// Lighting ---------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 4);
// scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// scene.add(directionalLight);

// Materials ---------------------------------------------------------------

function createCustomMaterial(angle, offset, scale, colorA, colorB) {
  const angleUniform = uniform(angle);
  const offsetUniform = uniform(offset);
  const scaleUniform = uniform(scale);
  const colorAUniform = uniform(vec3(colorA.r, colorA.g, colorA.b));
  const colorBUniform = uniform(vec3(colorB.r, colorB.g, colorB.b));

  const fragmentShaderFunction = Fn(() => {
    const cosA = cos(angleUniform);
    const sinA = sin(angleUniform);

    const rotatedX = positionLocal.x.mul(cosA).add(positionLocal.z.mul(sinA));

    const finalColor = mix(
      colorAUniform,
      colorBUniform,
      rotatedX.add(offsetUniform).mul(scaleUniform)
    );

    return finalColor;
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.fragmentNode = fragmentShaderFunction();

  return material;
}

// Tip and tricks #1: Beware of the hidden coordinate calculations!
// const planeFragmentShaderFunction = Fn(() => {
//   const correctedPosition = vec3(
//     positionLocal.x,
//     positionLocal.z.negate(),
//     positionLocal.y.negate()
//   );

//   correctedPosition.assign(correctedPosition.fract());
//   correctedPosition.subAssign(0.5);
//   correctedPosition.assign(length(correctedPosition));

//   const finalColor = correctedPosition;

//   return finalColor;
// });

// Tips and tricks #2: Try and avoid if statements as a general habit
// const planeFragmentShaderFunction = Fn(() => {
//   const correctedPosition = vec3(
//     positionLocal.x,
//     positionLocal.z.negate(),
//     positionLocal.y.negate()
//   );

//   const finalColor = vec3(correctedPosition).toVar();

//   If(
//     correctedPosition.y.lessThan(0.3).and(correctedPosition.y.greaterThan(0.1)),
//     () => {
//       finalColor.assign(vec3(1, 1, 1));
//     }
//   );

//   return finalColor;
// });

// const planeFragmentShaderFunction = Fn(() => {
//   const correctedPosition = vec3(
//     positionLocal.x,
//     positionLocal.z.negate(),
//     positionLocal.y.negate()
//   );

//   const inRange = step(0.1, correctedPosition.y).mul(
//     step(correctedPosition.y, 0.3)
//   );

//   const finalColor = mix(correctedPosition, vec3(1, 1, 1), inRange);

//   return finalColor;
// });

// Random Placeholder
const planeFragmentShaderFunction = Fn(() => {
  const correctedPosition = vec3(
    positionLocal.x,
    positionLocal.z.negate(),
    positionLocal.y.negate()
  );
  const centeredPos = vec2(correctedPosition.x, correctedPosition.y);

  const angle = atan(centeredPos.y, centeredPos.x);
  const radius = length(centeredPos);

  const spiralFrequency = float(8.0);
  const radiusFrequency = float(10.0);
  const spiral = sin(
    angle
      .mul(spiralFrequency)
      .add(radius.mul(radiusFrequency))
      .sub(time.mul(2.0))
  );

  const blackAndWhiteColor = step(0.0, spiral);

  const finalColor = vec3(blackAndWhiteColor);

  return finalColor;
});

// Utilities ---------------------------------------------------------------

// Helper function to convert hex to RGB object
function hexToRgb(hex) {
  const color = new THREE.Color(hex);
  return { r: color.r, g: color.g, b: color.b };
}

function getMaterialConfig(materialName) {
  const name = materialName.toLowerCase();

  if (name === "rock") {
    return {
      angle: 0,
      offset: 0,
      scale: 0.6,
      colorA: hexToRgb("#171415"),
      colorB: hexToRgb("#4B4B4B"),
    };
  } else if (name === "rocks") {
    return {
      angle: Math.PI / 2,
      offset: 0,
      scale: 1,
      colorA: hexToRgb("#282828"),
      colorB: hexToRgb("#303030"),
    };
  } else if (name === "black_gradient") {
    return {
      angle: 0,
      offset: 0,
      scale: 0.2,
      colorA: { r: 1.0, g: 0.0, b: 0.0 },
      colorB: { r: 0.0, g: 0.0, b: 1.0 },
    };
  } else if (name === "stones") {
    return {
      angle: 0,
      offset: -0.11,
      scale: 0.4,
      colorA: hexToRgb("#171415"),
      colorB: hexToRgb("#4B4B4B"),
    };
  } else {
    return {
      angle: 0,
      offset: 0,
      scale: 1,
      colorA: { r: 1.0, g: 0.0, b: 0.0 },
      colorB: { r: 0.0, g: 0.0, b: 1.0 },
    };
  }
}

// Model Stuff ---------------------------------------------------------------

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let loadedModel = null;
gltfLoader.load("/models/Scene2.glb", (gltf) => {
  loadedModel = gltf.scene;
  loadedModel.position.set(0, 0, 0);

  loadedModel.traverse((child) => {
    if (child.isMesh) {
      const meshName = child.name;
      const materialName = child.material.name;

      if (meshName === "Target_Mesh_Plane") {
        const material = new THREE.MeshBasicNodeMaterial();
        material.fragmentNode = planeFragmentShaderFunction();
        child.material = material;
      } else {
        const name = materialName.toLowerCase();
        if (
          name === "rock" ||
          name === "rocks" ||
          name === "black_gradient" ||
          name === "stones"
        ) {
          const config = getMaterialConfig(materialName);
          child.material = createCustomMaterial(
            config.angle,
            config.offset,
            config.scale,
            config.colorA,
            config.colorB
          );
        }
      }
    }
  });

  scene.add(loadedModel);
});

// Camera ---------------------------------------------------------------
camera.position.set(8.119320077462113, 3.0038308097924373, 0.686155944870028);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(
  -1.4269950171849213,
  2.1410254465135656,
  0.07347907348960196
);
controls.update();

// Animation Loop ---------------------------------------------------------------

function animate() {
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(animate);
