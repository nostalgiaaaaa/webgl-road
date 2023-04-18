import type { Vector2 } from "three";
import * as THREE from "three";
import * as POSTPROCESSING from "postprocessing";
import { deepDistortion } from "./Distortions";

class App {
  options: any;
  container: HTMLElement;
  renderer: any;
  composer: any;
  camera: any;
  scene: any;
  fogUniforms: any;
  clock: any;
  assets: any;
  disposed: boolean;
  road: Road;
  leftCarLights: CarLights;
  rightCarLights: CarLights;

  fovTarget: any;
  speedUpTarget: number;
  speedUp: number;
  timeOffset: number;
  renderPass: any;
  bloomPass: any;
  constructor(container: HTMLElement, options: any = {}) {
    this.options = options;

    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
    });
    this.renderer.setSize(container.offsetWidth, container.offsetHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.composer = new POSTPROCESSING.EffectComposer(this.renderer);
    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      options.fov,
      container.offsetWidth / container.offsetHeight,
      0.1,
      10000
    );
    this.camera.position.z = -5;
    this.camera.position.y = 8;
    this.camera.position.x = 0;
    this.scene = new THREE.Scene();
    const assetPath = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/";

    const envMap = new THREE.CubeTextureLoader()
      .setPath(`${assetPath}skybox1_`)
      .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);

    this.scene.background = envMap;

    let fog = new THREE.Fog(
      options.colors.background,
      options.length * 0.2,
      options.length * 500
    );
    this.scene.fog = fog;
    this.fogUniforms = {
      fogColor: { type: "c", value: fog.color },
      fogNear: { type: "f", value: fog.near },
      fogFar: { type: "f", value: fog.far },
    };
    this.clock = new THREE.Clock();
    this.assets = {};
    this.disposed = false;

    this.road = new Road(this, options);
    this.leftCarLights = new CarLights(
      this,
      options,
      options.colors.leftCars,
      options.movingAwaySpeed,
      new THREE.Vector2(0, 1 - options.carLightsFade)
    );
    this.rightCarLights = new CarLights(
      this,
      options,
      options.colors.rightCars,
      options.movingCloserSpeed,
      new THREE.Vector2(1, 0 + options.carLightsFade)
    );

    this.fovTarget = options.fov;

    this.speedUpTarget = 0;
    this.speedUp = 0;
    this.timeOffset = 0;

    this.tick = this.tick.bind(this);
    this.init = this.init.bind(this);
    this.setSize = this.setSize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }
  initPasses() {
    this.renderPass = new POSTPROCESSING.RenderPass(this.scene, this.camera);
    this.bloomPass = new POSTPROCESSING.EffectPass(
      this.camera,
      new POSTPROCESSING.BloomEffect({
        luminanceThreshold: 0.2,
        luminanceSmoothing: 0,
        resolutionScale: 1,
      })
    );
    const smaaPass = new POSTPROCESSING.EffectPass(
      this.camera,
      new POSTPROCESSING.SMAAEffect()
    );
    this.renderPass.renderToScreen = false;
    this.bloomPass.renderToScreen = false;
    smaaPass.renderToScreen = true;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(smaaPass);
  }
  loadAssets() {
    const assets = this.assets;
    return new Promise((resolve, reject) => {
      const manager = new THREE.LoadingManager(resolve as () => void);

      const searchImage = new Image();
      const areaImage = new Image();
      assets.smaa = {};
      searchImage.addEventListener("load", function () {
        assets.smaa.search = this;
        manager.itemEnd("smaa-search");
      });

      areaImage.addEventListener("load", function () {
        assets.smaa.area = this;
        manager.itemEnd("smaa-area");
      });
      manager.itemStart("smaa-search");
      manager.itemStart("smaa-area");

      searchImage.src = POSTPROCESSING.SMAAEffect.searchImageDataURL;
      areaImage.src = POSTPROCESSING.SMAAEffect.areaImageDataURL;
    });
  }
  init() {
    this.initPasses();

    const options = this.options;
    this.road.init();
    this.leftCarLights.init();
    this.leftCarLights.mesh.position.setX(
      -options.roadWidth / 2 - options.islandWidth / 2
    );
    this.rightCarLights.init();
    this.rightCarLights.mesh.position.setX(
      options.roadWidth / 2 + options.islandWidth / 2
    );

    this.container.addEventListener("mousedown", this.onMouseDown);
    this.container.addEventListener("mouseup", this.onMouseUp);
    this.container.addEventListener("mouseout", this.onMouseUp);
    this.tick();
  }
  onMouseDown(ev: any) {
    if (this.options.onSpeedUp) this.options.onSpeedUp(ev);
    this.fovTarget = this.options.fovSpeedUp;
    this.speedUpTarget = this.options.speedUp;
  }
  onMouseUp(ev: any) {
    if (this.options.onSlowDown) this.options.onSlowDown(ev);
    this.fovTarget = this.options.fov;
    this.speedUpTarget = 0;
  }
  update(delta: number) {
    let lerpPercentage = Math.exp(-(-60 * Math.log2(1 - 0.1)) * delta);
    this.speedUp += lerp(
      this.speedUp,
      this.speedUpTarget,
      lerpPercentage,
      0.00001
    );
    this.timeOffset += this.speedUp * delta;

    let time = this.clock.elapsedTime + this.timeOffset;

    this.rightCarLights.update(time);
    this.leftCarLights.update(time);
    this.road.update(time);

    let updateCamera = false;
    let fovChange = lerp(this.camera.fov, this.fovTarget, lerpPercentage);
    if (fovChange !== 0) {
      this.camera.fov += fovChange * delta * 6;
      updateCamera = true;
    }

    const distortion = deepDistortion.getJS(0.025, time);
    this.camera.lookAt(
      new THREE.Vector3(
        this.camera.position.x + distortion.x,
        this.camera.position.y + distortion.y,
        this.camera.position.z + distortion.z
      )
    );
    updateCamera = true;

    if (updateCamera) {
      this.camera.updateProjectionMatrix();
    }
  }
  render(delta: any) {
    this.composer.render(delta);
  }
  dispose() {
    this.disposed = true;
  }
  setSize(width: any, height: any, updateStyles: any) {
    this.composer.setSize(width, height, updateStyles);
  }
  tick() {
    if (this.disposed || !this) return;
    if (resizeRendererToDisplaySize(this.renderer, this.setSize)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    const delta = this.clock.getDelta();
    this.render(delta);
    this.update(delta);
    requestAnimationFrame(this.tick);
  }
}

export const random = (base: number | number[]) => {
  if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
  return Math.random() * base;
};
export const pickRandom = (arr: string | any[]) => {
  if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
  return arr;
};
export function lerp(
  current: number,
  target: number,
  speed = 0.1,
  limit = 0.001
) {
  let change = (target - current) * speed;
  if (Math.abs(change) < limit) {
    change = target - current;
  }
  return change;
}
export class CarLights {
  webgl: any;
  options: {};
  colors: any;
  speed: any;
  fade: Vector2;
  mesh: any;
  constructor(webgl: any, options: {}, colors: any, speed: any, fade: Vector2) {
    this.webgl = webgl;
    this.options = options;
    this.colors = colors;
    this.speed = speed;
    this.fade = fade;
  }
  init() {
    const options: any = this.options;

    let curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    );

    let geometry = new THREE.TubeGeometry(curve, 40, 1, 8, false);

    let instanced = new THREE.InstancedBufferGeometry().copy(geometry);
    instanced.instanceCount = options.lightPairsPerRoadWay;

    let laneWidth = options.roadWidth / options.lanesPerRoad;

    let aOffset = [];
    let aMetrics = [];
    let aColor = [];
    let colors = this.colors;
    if (Array.isArray(colors)) {
      colors = colors.map((c) => new THREE.Color(c));
    } else {
      colors = new THREE.Color(colors);
    }

    for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
      let radius = random(options.carLightsRadius);
      let length = random(options.carLightsLength);
      let speed = random(this.speed);

      let carLane = i % 3;
      let laneX = carLane * laneWidth - options.roadWidth / 2 + laneWidth / 2;

      let carWidth = random(options.carWidthPercentage) * laneWidth;
      // Drunk Driving
      let carShiftX = random(options.carShiftX) * laneWidth;
      // Both lights share same shiftX and lane;
      laneX += carShiftX;

      let offsetY = random(options.carFloorSeparation) + radius * 1.3;

      let offsetZ = -random(options.length);

      aOffset.push(laneX);
      aOffset.push(offsetY);
      aOffset.push(offsetZ);

      aMetrics.push(radius);
      aMetrics.push(length);
      aMetrics.push(speed);

      let color = pickRandom(colors);
      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);
    }

    instanced.setAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false)
    );
    instanced.setAttribute(
      "aMetrics",
      new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3, false)
    );
    instanced.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
    );

    let material = new THREE.ShaderMaterial({
      fragmentShader: carLightsFragment,
      vertexShader: carLightsVertex,
      transparent: true,
      uniforms: Object.assign(
        {
          uTime: new THREE.Uniform(0),
          uTravelLength: new THREE.Uniform(options.length),
          uFade: new THREE.Uniform(this.fade),
        },
        this.webgl.fogUniforms,
        deepDistortion.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <getDistortion_vertex>",
        deepDistortion.getDistortion
      );
    };
    let mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.webgl.scene.add(mesh);
    this.mesh = mesh;
  }

  update(time: any) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

export const carLightsFragment = `

  #define USE_FOG;
  ${THREE.ShaderChunk["fog_pars_fragment"]}
  varying vec3 vColor;
  varying vec2 vUv; 
  uniform vec2 uFade;
  void main() {
  vec3 color = vec3(vColor);
  float fadeStart = 0.4;
  float maxFade = 0.;
  float alpha = 1.;
  
  alpha = smoothstep(uFade.x, uFade.y, vUv.x);
  gl_FragColor = vec4(color,alpha);
  if (gl_FragColor.a < 0.0001) discard;
  ${THREE.ShaderChunk["fog_fragment"]}
  }
`;

export const carLightsVertex = `
  #define USE_FOG;
  ${THREE.ShaderChunk["fog_pars_vertex"]}
  attribute vec3 aOffset;
  attribute vec3 aMetrics;
  attribute vec3 aColor;

  

  uniform float uTravelLength;
  uniform float uTime;
  uniform float uSpeed;

  varying vec2 vUv; 
  varying vec3 vColor; 
  #include <getDistortion_vertex>

  void main() {
    vec3 transformed = position.xyz;
    float radius = aMetrics.r;
    float myLength = aMetrics.g;
    float speed = aMetrics.b;

    transformed.xy *= radius ;
    transformed.z *= myLength;
  
    // Add my length to make sure it loops after the lights hits the end
    transformed.z += myLength-mod( uTime *speed + aOffset.z, uTravelLength);
    transformed.xy += aOffset.xy;


    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);

    vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vColor = aColor;
    ${THREE.ShaderChunk["fog_vertex"]}
  }`;

export class Road {
  webgl: any;
  options: any;
  uTime: any;
  leftRoadWay: any;
  rightRoadWay: any;
  island: any;
  constructor(webgl: any, options: {}) {
    this.webgl = webgl;
    this.options = options;

    this.uTime = new THREE.Uniform(0);
  }
  createIsland() {
    const options = this.options;
    let segments = 100;
  }

  createPlane(side: number, width: any, isRoad: boolean) {
    const options = this.options;
    let segments = 100;
    const geometry = new THREE.PlaneGeometry(
      isRoad ? options.roadWidth : options.islandWidth,
      options.length,
      20,
      segments
    );
    let uniforms = {
      uTravelLength: new THREE.Uniform(options.length),
      uColor: new THREE.Uniform(
        new THREE.Color(
          isRoad ? options.colors.roadColor : options.colors.islandColor
        )
      ),
      uTime: this.uTime,
    };
    if (isRoad) {
      uniforms = Object.assign(uniforms, {
        uLanes: new THREE.Uniform(options.lanesPerRoad),
        uBrokenLinesColor: new THREE.Uniform(
          new THREE.Color(options.colors.brokenLines)
        ),
        uShoulderLinesColor: new THREE.Uniform(
          new THREE.Color(options.colors.shoulderLines)
        ),
        uShoulderLinesWidthPercentage: new THREE.Uniform(
          options.shoulderLinesWidthPercentage
        ),
        uBrokenLinesLengthPercentage: new THREE.Uniform(
          options.brokenLinesLengthPercentage
        ),
        uBrokenLinesWidthPercentage: new THREE.Uniform(
          options.brokenLinesWidthPercentage
        ),
      });
    }
    const material = new THREE.ShaderMaterial({
      fragmentShader: isRoad ? roadFragment : islandFragment,
      vertexShader: roadVertex,
      side: THREE.DoubleSide,
      uniforms: Object.assign(
        uniforms,
        this.webgl.fogUniforms,
        deepDistortion.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <getDistortion_vertex>",
        deepDistortion.getDistortion
      );
    };
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;

    mesh.position.z = -options.length / 2;
    mesh.position.x +=
      (this.options.islandWidth / 2 + options.roadWidth / 2) * side;
    this.webgl.scene.add(mesh);

    return mesh;
  }
  init() {
    this.leftRoadWay = this.createPlane(-1, this.options.roadWidth, true);
    this.rightRoadWay = this.createPlane(1, this.options.roadWidth, true);
    this.island = this.createPlane(0, this.options.islandWidth, false);
  }
  update(time: any) {
    this.uTime.value = time;
  }
}

export const roadBaseFragment = `
    #define USE_FOG;
    varying vec2 vUv; 
    uniform vec3 uColor;
    uniform float uTime;
    #include <roadMarkings_vars>
    ${THREE.ShaderChunk["fog_pars_fragment"]}
    void main() {
        vec2 uv = vUv;
        vec3 color = vec3(uColor);
        
        #include <roadMarkings_fragment>

        gl_FragColor = vec4(color,1.);
        ${THREE.ShaderChunk["fog_fragment"]}
    }
`;
export const islandFragment = roadBaseFragment
  .replace("#include <roadMarkings_fragment>", "")
  .replace("#include <roadMarkings_vars>", "");
export const roadMarkings_vars = `
    uniform float uLanes;
    uniform vec3 uBrokenLinesColor;
    uniform vec3 uShoulderLinesColor;
    uniform float uShoulderLinesWidthPercentage;
    uniform float uBrokenLinesWidthPercentage;
    uniform float uBrokenLinesLengthPercentage;
    highp float random(vec2 co)
    {
        highp float a = 12.9898;
        highp float b = 78.233;
        highp float c = 43758.5453;
        highp float dt= dot(co.xy ,vec2(a,b));
        highp float sn= mod(dt,3.14);
        return fract(sin(sn) * c);
    }
`;
export const roadMarkings_fragment = `

        uv.y = mod(uv.y + uTime * 0.1,1.);
        float brokenLineWidth = 1. / uLanes * uBrokenLinesWidthPercentage;
        // How much % of the lane's space is empty
        float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;

        // Horizontal * vertical offset
        float brokenLines = step(1.-brokenLineWidth * uLanes,fract(uv.x * uLanes)) * step(laneEmptySpace, fract(uv.y * 100.)) ;
        // Remove right-hand lines on the right-most lane
        brokenLines *= step(uv.x * uLanes,uLanes-1.);
        color = mix(color, uBrokenLinesColor, brokenLines);


        float shoulderLinesWidth = 1. / uLanes * uShoulderLinesWidthPercentage;
        float shoulderLines = step(1.-shoulderLinesWidth, uv.x) + step(uv.x, shoulderLinesWidth);
        color = mix(color, uBrokenLinesColor, shoulderLines);

        vec2 noiseFreq = vec2(4., 7000.);
        float roadNoise = random( floor(uv * noiseFreq)/noiseFreq ) * 0.02 - 0.01; 
        color += roadNoise;
`;
export const roadFragment = roadBaseFragment
  .replace("#include <roadMarkings_fragment>", roadMarkings_fragment)
  .replace("#include <roadMarkings_vars>", roadMarkings_vars);

export const roadVertex = `
#define USE_FOG;
uniform float uTime;
${THREE.ShaderChunk["fog_pars_vertex"]}

uniform float uTravelLength;

varying vec2 vUv; 
  #include <getDistortion_vertex>
void main() {
  vec3 transformed = position.xyz;

    vec3 distortion  = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
    transformed.x += distortion.x;
    transformed.z += distortion.y;
  transformed.y += -1.*distortion.z;  
  
  vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;

  ${THREE.ShaderChunk["fog_vertex"]}
}`;

export function resizeRendererToDisplaySize(
  renderer: { domElement: any },
  setSize: {
    (width: any, height: any, updateStyles: any): void;
    (arg0: any, arg1: any, arg2: boolean): void;
  }
) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    setSize(width, height, false);
  }
  return needResize;
}

export default App;
