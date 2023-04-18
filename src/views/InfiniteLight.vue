<template>
  <main>
    <div class="frame">
      <div class="frame-title-wrap"></div>
      <div class="frame-info">Hint: Press to speed up</div>
    </div>
    <div class="webgl-content">
      <div id="canvas"></div>
      <div class="webgl-content-title-wrap">
        <span class="content-pretitle">API Gateway</span>
        <div class="logo">
          <img src="@/assets/logo.svg" width="350vw" alt="API G/W Admin logo" />
        </div>
        <a class="content-link" href="#">Enter</a>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import App from "@/util/Road";
import { onMounted } from "vue";

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
    fovSpeedUp: 120,
    speedUp: 1,
    carLightsFade: 0.4,

    lightPairsPerRoadWay: 120,

    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,

    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],

    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],

    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.5, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 4],

    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xd7d7d7],
      rightCars: [
        0x21aba5, 0x21aba5, 0x21aba5, 0x21aba5, 0x21aba5, 0x21aba5, 0x21aba5,
        0x21aba5, 0x21aba5, 0x21aba5, 0x21aba5, 0xeffe03d, 0xff994f, 0xff4e63,
      ],
    },
  };

  const myApp = new App(container as HTMLElement, options);
  myApp.loadAssets().then(myApp.init);
});
</script>
