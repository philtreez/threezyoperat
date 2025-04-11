import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Szene, Kamera und Renderer ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Direkt nach dem Erstellen von Kamera und Renderer
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.01;  // Sanftes Ausklingen der Bewegung
controls.rotateSpeed = 45.0;    // Minimaler Rotationsspeed
controls.enableZoom = true;   // Optional: Zoom deaktivieren, falls nicht gewünscht
controls.enablePan = true;    // Optional: Schwenken deaktivieren

// Setze das OrbitControls-Ziel auf den Punkt, den die Kamera anschaut
controls.target.set(1, 0, 0);

// --- Postprocessing Setup: Bloom ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomParams = {
  strength: 1.2,
  threshold: 0.35,
  radius: 0.25
};
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
);
composer.addPass(bloomPass);

// --- Licht ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Globale Variablen & Mixer-Array ---
let rnboDevice;  // wird später erstellt
const mixers = [];  // Für AnimationMixer (Buttons, Animationen, etc.)
const clock = new THREE.Clock();

// --- GLTFLoader ---
const loader = new GLTFLoader();

// --- Toggle-Buttons (b1–b8) laden ---
const toggleButtons = {}; // Enthält alle Toggle-Buttons (sowohl b- als auch p-Typ)
const toggleButtonNames = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"];

toggleButtonNames.forEach((btnName) => {
  loader.load(btnName + '.glb', (gltf) => {
    const model = gltf.scene;
    // Alle Meshes auf Layer 1 setzen und Material (für b‑Buttons) zuweisen:
    model.traverse(child => {
      if (child.isMesh) {
        child.layers.set(1);
        child.material = new THREE.MeshBasicMaterial({
          color: 0x462cab  // Ausgangsfarbe für b‑Buttons
        });
      }
    });
    scene.add(model);
    
    const mixerButton = new THREE.AnimationMixer(model);
    mixers.push(mixerButton);
    
    const action = mixerButton.clipAction(gltf.animations[0], model);
    action.setLoop(THREE.LoopOnce, 0);
    action.clampWhenFinished = true;
    action.paused = true;
    
    toggleButtons[btnName] = {
      model,
      mixer: mixerButton,
      action,
      toggled: false
    };
    console.log("Toggle-Button geladen:", btnName);
  }, undefined, (error) => {
    console.error("Fehler beim Laden von " + btnName + ".glb", error);
  });
});

// --- Toggle-Buttons für p1–p5 laden ---
const pToggleNames = ["p1", "p2", "p3", "p4", "p5"];
pToggleNames.forEach((btnName) => {
  loader.load(btnName + '.glb', (gltf) => {
    const model = gltf.scene;
    // Alle Meshes auf Layer 1 setzen und anderes Material (für p‑Buttons) zuweisen:
    model.traverse(child => {
      if (child.isMesh) {
        child.layers.set(1);
        child.material = new THREE.MeshBasicMaterial({
          color: 0x1e90ff  // Ausgangsfarbe DodgerBlue für p‑Buttons
        });
      }
    });
    scene.add(model);
    
    const mixerButton = new THREE.AnimationMixer(model);
    mixers.push(mixerButton);
    
    const action = mixerButton.clipAction(gltf.animations[0], model);
    action.setLoop(THREE.LoopOnce, 0);
    action.clampWhenFinished = true;
    action.paused = true;
    
    toggleButtons[btnName] = {
      model,
      mixer: mixerButton,
      action,
      toggled: false
    };
    console.log("Toggle-Button geladen:", btnName);
  }, undefined, (error) => {
    console.error("Fehler beim Laden von " + btnName + ".glb", error);
  });
});

// --- bodo_b.glb laden (animiert, läuft direkt ab) ---
loader.load('bodo_b.glb', (gltf) => {
  const bodoA = gltf.scene;
  bodoA.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.1,
        roughness: 0.3,
        side: THREE.DoubleSide,
      });
      const wireGeo = new THREE.WireframeGeometry(child.geometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x301869,
        transparent: true,
        opacity: 1.0
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      // Füge das Wireframe als Kind hinzu:
      child.add(wireframe);
    }
  });
  bodoA.position.set(0, 0, 0);
  scene.add(bodoA);

  const mixerBodoA = new THREE.AnimationMixer(bodoA);
  mixers.push(mixerBodoA);
  
  // Starte alle Animation-Clips:
  gltf.animations.forEach((clip) => {
    const action = mixerBodoA.clipAction(clip, bodoA);
    action.setLoop(THREE.LoopOnce, 0);
    action.clampWhenFinished = true;
    action.play();
  });
  console.log("bodo_b.glb geladen, alle Animationen gestartet.");
}, undefined, (error) => {
  console.error("Fehler beim Laden von bodo_b.glb", error);
});

// --- Statisches bodo.glb laden ---
loader.load('bodo.glb', (gltf) => {
  const bodo = gltf.scene;
  bodo.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshLambertMaterial({
        color: 0x00000,
      });
      const wireGeo = new THREE.WireframeGeometry(child.geometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x9a63ff,
        transparent: true,
        opacity: 0.5
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      child.add(wireframe);
    }
  });
  bodo.position.set(0, 0, 0);
  scene.add(bodo);
  console.log("bodo.glb geladen und Material (Normal + Wireframe) angepasst.");
}, undefined, (error) => {
  console.error("Fehler beim Laden von bodo.glb", error);
});

// --- box.glb laden ---
const boxObjects = {};  // Für Objekte box1 bis box8
let extraObject = null; // Für das zusätzliche Objekt

loader.load('box.glb', (gltf) => {
  const box = gltf.scene;
  scene.add(box);
  box.traverse(child => {
    if (child.isMesh) {
      if (child.name.startsWith("box")) {
        const index = parseInt(child.name.replace("box", ""));
        if (!isNaN(index)) {
          boxObjects[index] = child;
          child.material = new THREE.MeshBasicMaterial({
            color: 0x301869
          });
        }
      } else {
        extraObject = child;
        extraObject.material = new THREE.MeshStandardMaterial({
          color: 0x301869,
          metalness: 0.8,
          roughness: 0.3
        });
      }
    }
  });
  console.log("box.glb geladen.");
}, undefined, (error) => {
  console.error("Fehler beim Laden von box.glb", error);
});

// Global deklarieren
let ghostObject = null;
let ghostFresnelUniforms = null;
let ghostActive = false; // Flag, ob Ghost aktiv ist

loader.load('ghost.glb', (gltf) => {
  ghostObject = gltf.scene;
  
  // Ghost-Objekt initial unsichtbar machen
  ghostObject.visible = true;
  
  // Erstelle Uniforms für den Fresnel-Effekt plus zusätzliche für Animation:
  ghostFresnelUniforms = {
    mFresnelBias: { value: 2.2 },
    mFresnelScale: { value: 6 },
    mFresnelPower: { value: 3.5 },
    uTime: { value: 0.0 },
    uOpacity: { value: 0.8 }
  };

  const fresnelVertexShader = `
    uniform float mFresnelBias;
    uniform float mFresnelScale;
    uniform float mFresnelPower;
    varying float vReflectionFactor;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      vec3 nWorld = normalize( (modelMatrix * vec4(normal, 0.0)).xyz );
      vec3 I = normalize( mvPosition.xyz );
      vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 - dot( nWorld, I ), mFresnelPower );
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fresnelFragmentShader = `
    uniform float uTime;
    uniform float uOpacity;
    varying float vReflectionFactor;
    void main() {
      // Erzeuge einen leichten Flicker, der von der Zeit abhängt:
      float flicker = 0.2 * sin(uTime * 4.0) + 0.9;
      gl_FragColor = vec4( mix( vec3(0.5, 0.1, 0.7), vec3(0.55, 0.2, 0.8), vReflectionFactor ), uOpacity * flicker );
    }
  `;
  
  // Wende den Shader auf alle Meshes in ghostObject an:
  ghostObject.traverse(child => {
    if (child.isMesh) {
      child.layers.set(1);
      child.material = new THREE.ShaderMaterial({
        uniforms: ghostFresnelUniforms,
        vertexShader: fresnelVertexShader,
        fragmentShader: fresnelFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
    }
  });
  
  // Setze die Startposition
  ghostObject.position.y = 1;
  scene.add(ghostObject);
  
  // Erstelle einen AnimationMixer, falls ghost.glb Animationen enthält (optional)
  const ghostMixer = new THREE.AnimationMixer(ghostObject);
  mixers.push(ghostMixer);
  if (gltf.animations.length > 0) {
    const ghostAction = ghostMixer.clipAction(gltf.animations[0]);
    ghostAction.setLoop(THREE.LoopRepeat, Infinity);
    ghostAction.play();
  }
  
  console.log("ghost.glb geladen, Fresnel-Material gesetzt, Animation gestartet.");
}, undefined, (error) => {
  console.error("Fehler beim Laden von ghost.glb", error);
});




// --- Boden (Wireframe-Stil aus Partikeln) ---
// --- Boden (Wireframe-Stil aus Partikeln) ---
const floorWidth = 50;
const floorDepth = 50;
const segmentsX = 50;
const segmentsZ = 50;
const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth, segmentsX, segmentsZ);
// Drehe das Plane, sodass es horizontal liegt:
floorGeometry.rotateX(-Math.PI / 2);

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', floorGeometry.attributes.position.clone());

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.01,
  transparent: true,
  opacity: 0.6,
});

const floorParticles = new THREE.Points(particlesGeometry, particlesMaterial);
// Setze die Basisposition des Bodens: z = -2
floorParticles.position.y = -2;
scene.add(floorParticles);



// --- RNBO Setup ---
async function setupRNBO() {
  const patchExportURL = "/patch.export.json";
  const WAContext = window.AudioContext || window.webkitAudioContext;
  const context = new WAContext();
  const outputNode = context.createGain();
  outputNode.connect(context.destination);
  
  let response, patcher;
  try {
    response = await fetch(patchExportURL);
    patcher = await response.json();
    if (!window.RNBO) {
      await loadRNBOScript(patcher.desc.meta.rnboversion);
    }
  } catch (err) {
    console.error("Fehler beim Laden des Patch-Exports:", err);
    return;
  }
  
  let dependencies = [];
  try {
    const dependenciesResponse = await fetch("/dependencies.json");
    dependencies = await dependenciesResponse.json();
    dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "" + d.file }) : d);
  } catch (e) {}
  
  try {
    rnboDevice = await RNBO.createDevice({ context, patcher });
  } catch (err) {
    console.error("Fehler beim Erstellen des RNBO Devices:", err);
    return;
  }
  
  if (dependencies.length) {
    await rnboDevice.loadDataBufferDependencies(dependencies);
  }
  rnboDevice.node.connect(outputNode);
  document.body.onclick = () => context.resume();
  
  // Outport "box" abonnieren
  attachOutports(rnboDevice);
  attachParameterListeners(rnboDevice);
}

function attachParameterListeners(device) {
  rnboDevice.parameterChangeEvent.subscribe((param) => {
    console.log(`Parameter ${param.name} geändert: ${param.value}`);

    if (param.name === "ghostOn" && ghostFresnelUniforms) {
      // Direkte Zuordnung des Werts (zwischen 0.00 und 1.00) an uOpacity:
      ghostFresnelUniforms.uOpacity.value = param.value;
      console.log("Ghost uOpacity gesetzt auf:", ghostFresnelUniforms.uOpacity.value);
    }
    
    
    // Toggle-Buttons aktualisieren:
    if (toggleButtons.hasOwnProperty(param.name)) {
      const btn = toggleButtons[param.name];
      if (param.value == 1) {
        btn.model.traverse(child => {
          if (child.isMesh) {
            if (param.name.startsWith("p")) {
              child.material.color.set(0x992b6b); // p gedrückt: OrangeRed
            } else {
              child.material.color.set(0x4cc9f0); // b gedrückt: Rot
            }
          }
        });
        btn.toggled = true;
      } else {
        btn.model.traverse(child => {
          if (child.isMesh) {
            if (param.name.startsWith("p")) {
              child.material.color.set(0x4361ee); // p normal: DodgerBlue
            } else {
              child.material.color.set(0x462cab); // b normal: helles Lila
            }
          }
        });
        btn.toggled = false;
      }
    }
    
    // Slider: (Falls Slider verwendet werden)
    if (sliders.hasOwnProperty(param.name)) {
      const sliderData = sliders[param.name];
      let newZ = -param.value;
      if (sliderData.thumb) {
        sliderData.thumb.position.z = newZ;
      }
    }
  });
}

function attachOutports(device) {
  const outports = device.outports;
  if (outports.length < 1) {
    console.warn("Keine Outports vorhanden.");
    return;
  }
  device.messageEvent.subscribe((ev) => {
    if (ev.tag !== "box") return;
    console.log(`${ev.tag}: ${ev.payload}`);
    updateBoxColors(ev.payload);
  });
}

function loadRNBOScript(version) {
  return new Promise((resolve, reject) => {
    if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
      reject(new Error("Patcher mit Debug-Version exportiert!"));
    }
    const el = document.createElement("script");
    el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
    el.onload = resolve;
    el.onerror = function(err) {
      console.error(err);
      reject(new Error("Laden von rnbo.js v" + version + " fehlgeschlagen"));
    };
    document.body.append(el);
  });
}
setupRNBO();

// --- Raycaster für Klicks (Toggle-Buttons) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', onClick, false);

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  raycaster.layers.set(1);  // nur Layer 1 prüfen
  
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    console.log("Getroffenes Objekt:", obj.name);
    for (let btnName in toggleButtons) {
      const btn = toggleButtons[btnName];
      if (btn.model === obj || btn.model.children.includes(obj) || btn.model.getObjectById(obj.id)) {
        toggleButton(btnName);
        break;
      }
    }
  }
}

function toggleButton(btnName) {
  const btn = toggleButtons[btnName];
  if (!btn) return;
  
  btn.toggled = !btn.toggled;
  btn.action.paused = false;
  
  // Unterschiedliche Farbanpassung je nach Typ:
  btn.model.traverse(child => {
    if (child.isMesh) {
      if (btnName.startsWith("p")) {
        if (btn.toggled) {
          child.material.color.set(0x992b6b); // gedrückt: OrangeRed
        } else {
          child.material.color.set(0x4361ee); // normal: DodgerBlue
        }
      } else {
        if (btn.toggled) {
          child.material.color.set(0x4cc9f0); // gedrückt: Rot
        } else {
          child.material.color.set(0x462cab); // normal: helles Lila
        }
      }
    }
  });
  
  console.log("Toggle", btnName, btn.toggled ? "gedrückt" : "hoch");
  
  if (btn.toggled) {
    btn.action.timeScale = 1;
    btn.action.reset();
    btn.action.play();
    if (rnboDevice) {
      const param = rnboDevice.parameters.find(p => p.name === btnName);
      if (param) {
        param.value = 1;
        console.log("RNBO Parameter", btnName, "auf 1 gesetzt");
      }
    }
  } else {
    btn.action.timeScale = -1;
    btn.action.time = btn.action.getClip().duration;
    btn.action.play();
    if (rnboDevice) {
      const param = rnboDevice.parameters.find(p => p.name === btnName);
      if (param) {
        param.value = 0;
        console.log("RNBO Parameter", btnName, "auf 0 gesetzt");
      }
    }
  }
}

// --- Slider laden (s1–s8) ---
const sliderNames = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"];
const sliders = {};

sliderNames.forEach((sliderName) => {
  loader.load(sliderName + '.glb', (gltf) => {
    const model = gltf.scene;
    // Erstelle den erwarteten Thumb-Namen, z. B. aus s1 wird thumb1
    const thumbName = sliderName.replace("s", "thumb");
    
    // Setze Material für jedes Mesh je nach Namen:
    model.traverse(child => {
      if (child.isMesh) {
        child.layers.set(1);
        if (child.name === thumbName) {
          // Material für den Thumb (andere Farbe, z. B. Rot)
          child.material = new THREE.MeshBasicMaterial({
            color: 0x882ee8,
          });
        } else {
          // Material für die Sliderbahn (z. B. Türkis)
          child.material = new THREE.MeshStandardMaterial({
            color: 0x882ee8,
            metalness: 0.5,
            roughness: 0.5
          });
        }
      }
    });
    scene.add(model);
    const thumb = model.getObjectByName(thumbName);
    if (thumb) {
      thumb.position.z = 0; // Ausgangsposition
    }
    sliders[sliderName] = {
      model,
      thumb,
      minZ: -1,
      maxZ: 0
    };
    console.log("Slider geladen:", sliderName);
  }, undefined, (error) => {
    console.error("Fehler beim Laden von " + sliderName + ".glb", error);
  });
});

// Variablen für Slider-Drag
let activeSlider = null;
let sliderDragData = {};

// Pointer-Events für Slider
renderer.domElement.addEventListener('pointerdown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    for (let sliderName in sliders) {
      const sliderData = sliders[sliderName];
      if (sliderData.thumb && (sliderData.thumb === obj || sliderData.thumb.children.includes(obj))) {
        activeSlider = sliderName;
        sliderDragData = {
          startY: event.clientY,
          startZ: sliderData.thumb.position.z
        };
        console.log("Slider drag start:", sliderName);
        break;
      }
    }
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (activeSlider) {
    const sliderData = sliders[activeSlider];
    // Ziehe so, dass ein Ziehen nach oben einen positiven Wert liefert:
    let deltaY = sliderDragData.startY - event.clientY;
    const scale = 1 / 100;
    let newZ = sliderDragData.startZ - deltaY * scale;
    newZ = THREE.MathUtils.clamp(newZ, sliderData.minZ, sliderData.maxZ);
    sliderData.thumb.position.z = newZ;
    let normalized = -newZ;
    if (rnboDevice) {
      const param = rnboDevice.parameters.find(p => p.name === activeSlider);
      if (param) {
        param.value = normalized;
        console.log("RNBO Parameter", activeSlider, "gesetzt auf", normalized);
      }
    }
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  activeSlider = null;
  sliderDragData = {};
});

// --- Variablen für Ghost-Drag ---
let ghostDragging = false;
let ghostDragData = {};

// --- Pointer-Events für ghost (Y-Achsen-Drag) ---
renderer.domElement.addEventListener('pointerdown', (event) => {
  // Berechne Mauskoordinaten
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  // Prüfe, ob ghostObject getroffen wird (ghostObject muss vorher beim Laden von ghost.glb definiert werden)
  if (ghostObject) {
    const intersects = raycaster.intersectObject(ghostObject, true);
    if (intersects.length > 0) {
      ghostDragging = true;
      ghostDragData = {
        startY: event.clientY,
        startGhostY: ghostObject.position.y
      };
      console.log("Ghost drag start");
    }
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (ghostDragging && ghostObject) {
    // Berechne die Differenz in Y: Wenn du nach oben ziehst, soll deltaY positiv werden
    let deltaY = ghostDragData.startY - event.clientY;
    // Ein Skalierungsfaktor: z. B. 100 Pixel = 1 Einheit Bewegung
    const scale = 1 / 100;
    let newY = ghostDragData.startGhostY + deltaY * scale;
    // Begrenze den Bewegungsbereich des Ghost, z. B. zwischen -2 und 2
    newY = THREE.MathUtils.clamp(newY, -20, 20);
    ghostObject.position.y = newY;
    
    // Mappe newY von [-2, 2] auf einen normierten Bereich [0, 1]:
    let normalized = (newY + 2) / 4;
    if (rnboDevice) {
      const param = rnboDevice.parameters.find(p => p.name === "ghost");
      if (param) {
        param.value = normalized;
        console.log("RNBO Parameter ghost gesetzt auf", normalized);
      }
    }
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  ghostDragging = false;
});

// --- Update-Funktion für die Box-Objekte ---
function updateBoxColors(selectedNumber) {
  for (let i = 1; i <= 8; i++) {
    const obj = boxObjects[i];
    if (obj && obj.material) {
      if (i === selectedNumber) {
        obj.material.color.set(0xb899ff);
      } else {
        obj.material.color.set(0x301869);
      }
    }
  }
}

// --- Kamera-Animation (Zoom mit leichten Schwenkeffekten und Ease) ---
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

const startCameraPosition = new THREE.Vector3(0, 15, 25);
const finalCameraPosition = new THREE.Vector3(1, 3, 4);
const transitionTime = 30;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Kamera-Animation (Zoom, Oszillationen etc.) – dein bestehender Code:
  const t = Math.min(elapsed / transitionTime, 1);
  const easedT = easeInOutQuad(t);
  const currentBase = new THREE.Vector3().copy(startCameraPosition).lerp(finalCameraPosition, easedT);

  const offsetX = 1.06 * Math.sin(elapsed * 0.12);
  const offsetY = 0.96 * Math.sin(elapsed * 0.15);
  const offsetZ = 1.1 * Math.sin(elapsed * 0.19);

  camera.position.copy(currentBase).add(new THREE.Vector3(offsetX, offsetY, offsetZ));
    // Wenn Ghost aktiv ist, fahre die Kamera ein Stück zurück
    if (ghostActive) {
      // Berechne die Richtung vom Ziel (hier (1,0,0)) zur Kamera und verschiebe in entgegengesetzter Richtung.
      let target = new THREE.Vector3(1, 0, 0);
      let dir = new THREE.Vector3().subVectors(camera.position, target).normalize();
      camera.position.add(dir.multiplyScalar(5)); // 2 Einheiten weiter weg
    }
  // Setze das LookAt-Ziel passend zu OrbitControls:
  camera.lookAt(controls.target);

  // OrbitControls aktualisieren
  controls.update();
  
  mixers.forEach(m => m.update(delta));
  
  if (ghostFresnelUniforms) {
    ghostFresnelUniforms.uTime.value = elapsed;
  }
  
  // Füge eine subtile Schwebebewegung hinzu (optional):
  if (ghostObject) {
    ghostObject.position.x = 0.7 * Math.sin(elapsed * 0.3);
    ghostObject.position.z = 0.9 * Math.cos(elapsed * 0.3);
  }
  // --- Wellenanimation für den Boden ---
  // Wir verändern die Y-Koordinate jedes Partikels (nach Rotation ist Y die vertikale Achse)
  const positions = floorParticles.geometry.attributes.position.array;
  const frequency = 0.5;  // Frequenz der Welle
  const amplitude = 0.35;  // Amplitude der Welle
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]; // x-Wert des Partikels
    // Berechne eine wellenartige Y-Position, die von x und der verstrichenen Zeit abhängt.
    // Hier ein einfaches Beispiel:
    positions[i + 1] = Math.sin(x * frequency + elapsed) * amplitude;
  }
  floorParticles.geometry.attributes.position.needsUpdate = true;

  composer.render();
}
animate();
