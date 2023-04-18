<template>
  <div class="webgl-content">
    <div id="canvas"></div>
    <div class="webgl-content-title-wrap">
      <span class="content-pretitle">API Gateway</span>
      <div class="webgl-logo">
        <img src="@/assets/logo.svg" :width="350" alt="API G/W Admin logo" />
      </div>
      <!-- <div class="frame-info">Hint: Mouse down to speed up</div> -->
      <button
        class="webgl-content-link"
        @click="router.push({ name: 'dashBoard' })"
      >
        Enter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import App from "@/util/Road";
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
let myApp: App;
onMounted(() => {
  const container = document.getElementById("canvas");

  const options = {
    onSpeedUp: (ev: any) => {},
    onSlowDown: (ev: any) => {},

    length: 400,
    roadWidth: 15,
    islandWidth: 2,
    lanesPerRoad: 3,

    fov: 90,
    fovSpeedUp: 130,
    speedUp: 2,
    carLightsFade: 0.4,

    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,

    // Percentage of the lane's width
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,

    /*** These ones have to be arrays of [min,max].  ***/
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],

    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],

    /****  Anything below can be either a number or an array of [min,max] ****/

    // Length of the lights. Best to be less than total length
    carLightsLength: [400 * 0.03, 400 * 0.2],
    // Radius of the tubes
    carLightsRadius: [0.05, 0.14],
    // Width is percentage of a lane. Numbers from 0 to 1
    carWidthPercentage: [0.5, 0.5],
    // How drunk the driver is.
    // carWidthPercentage's max + carShiftX's max -> Cannot go over 1.
    // Or cars start going into other lanes
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 4],

    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      /***  Only these colors can be an array ***/
      leftCars: [0xd7d7d7],
      rightCars: [
        0x21aba5, 0x21aba5, 0xeffe03d, 0x21aba5, 0x21aba5, 0xff994f, 0x21aba5,
        0x21aba5, 0xff4e63,
      ],
      sticks: 0xdce0ee,
    },
  };

  myApp = new App(container as HTMLElement, options);
  myApp.loadAssets().then(myApp.init);
});

onUnmounted(() => {
  myApp.dispose();
});
</script>

<style>
/* @keyframes loaderAnim {
  to {
    opacity: 1;
    transform: scale3d(0.5, 0.5, 1) rotate3d(0, 0, 1, 180deg);
    border-radius: 50%;
  }
} */

.frame-info {
  color: #e93f3b;
}

.webgl-content {
  background-color: #02172c;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 60px);
  position: fixed;
  justify-content: center;
  align-items: center;
}

.webgl-content-title-wrap {
  position: relative;
  text-align: center;
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.webgl-content-title-wrap button {
  pointer-events: auto;
  text-decoration: none;
}

.content-pretitle {
  font-family: ltc-bodoni-175, serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #3ba2e5;
  font-size: 1.35rem;
}

.webgl-content-link {
  font-family: azo-sans-uber, sans-serif;
  font-size: 1.1rem;
  color: inherit;
  color: #fff !important;
}

#canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}

canvas {
  width: 100%;
  height: 100%;
}

.webgl-logo {
  display: flex;
  align-items: center;
  position: relative;
  padding: 10px 0px;
  pointer-events: none;
}

/* Page Loader */
.js .loading::before,
.js .loading::after {
  content: "";
  position: fixed;
  z-index: 5;
}

.js .loading::before {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
}

.js .loading::after {
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px;
  opacity: 0.4;
  background: #5a5a5a;
  animation: loaderAnim 0.7s linear infinite alternate forwards;
}

@keyframes loaderAnim {
  to {
    opacity: 1;
    transform: scale3d(0.5, 0.5, 1) rotate3d(0, 0, 1, 180deg);
    border-radius: 50%;
  }
}
</style>
