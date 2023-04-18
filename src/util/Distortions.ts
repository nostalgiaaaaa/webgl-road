import * as THREE from "three";

export const mountainUniforms = {
  // x, y, z
  uFreq: new THREE.Uniform(new THREE.Vector3(3, 6, 10)),
  uAmp: new THREE.Uniform(new THREE.Vector3(30, 30, 20)),
  uPowY: new THREE.Uniform(new THREE.Vector2(20, 2)),
};

const deepUniforms = {
  // x, y
  uFreq: new THREE.Uniform(new THREE.Vector2(4, 8)),
  uAmp: new THREE.Uniform(new THREE.Vector2(10, 20)),
  uPowY: new THREE.Uniform(new THREE.Vector2(20, 2)),
};

let nsin = (val: number) => Math.sin(val) * 0.5 + 0.5;

export const deepDistortion = {
  uniforms: mountainUniforms,
  getDistortion: `

    uniform vec3 uAmp;
    uniform vec3 uFreq;
    uniform vec2 uPowY;

    #define PI 3.14159265358979
    
        float nsin(float val){
          return sin(val) * 0.5+0.5;
        }

        float getDistortionX(float progress){
          return
                  (
                      sin(progress * PI * uFreq.x + mod(uTime, 25.1)) * uAmp.x
                  );
        }
        float getDistortionY(float progress){
            return
                    (
                        pow(abs(progress * uPowY.x),uPowY.y) + sin(progress * PI * uFreq.y + mod(uTime, 25.1)) * uAmp.y
                    );
        }
        
    vec3 getDistortion(float progress){

            float movementProgressFix = 0.02;
            float timeTempo = mod(uTime, 25.1);

            if(timeTempo <= 4.){
              return vec3(
                getDistortionX(progress) - getDistortionX(0.02),
                getDistortionY(progress) - getDistortionY(0.02),
                0
              );
            }
            else if(timeTempo <= 10.){
                return vec3(
                  (getDistortionX(progress) - getDistortionX(0.02)) * (10. - timeTempo) / 6. + 
                  (cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x) * (timeTempo - 4.) / 6.
                  ,
                  (getDistortionY(progress) - getDistortionY(0.02)) * (10. - timeTempo) / 6. +
                  (nsin(progress * PI * uFreq.y + timeTempo ) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + timeTempo) * uAmp.y)  * (timeTempo - 4.) / 6.
                  ,
                  (nsin(progress * PI * uFreq.z + timeTempo) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + timeTempo) * uAmp.z) * (timeTempo - 4.) / 6.
                );
            }
            else if(timeTempo <= 13.){
              return vec3( 
                cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x,
                nsin(progress * PI * uFreq.y + timeTempo ) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + timeTempo) * uAmp.y,
                nsin(progress * PI * uFreq.z + timeTempo) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + timeTempo) * uAmp.z
              );
            }
            else if(timeTempo <= 16.){
              return vec3( 
                (cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x)* (16. - timeTempo) / 3. +
                (- cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x + cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x) * (timeTempo - 13.) / 3.
                ,
                nsin(progress * PI * uFreq.y + timeTempo ) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + timeTempo) * uAmp.y,
                nsin(progress * PI * uFreq.z + timeTempo) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + timeTempo) * uAmp.z
              );
            }
            else if(timeTempo <= 19.){
              return vec3( 
                -cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x + cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x,
                nsin(progress * PI * uFreq.y + timeTempo ) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + timeTempo) * uAmp.y,
                nsin(progress * PI * uFreq.z + timeTempo) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + timeTempo) * uAmp.z
              );
            }
            else{
              return vec3(
                (-cos(progress * PI * uFreq.x + timeTempo ) * uAmp.x + cos(movementProgressFix * PI * uFreq.x + timeTempo ) * uAmp.x) * (25. - timeTempo) / 6. + 
                (getDistortionX(progress) - getDistortionX(0.02)) * (timeTempo - 19.) / 6.
                ,
                (nsin(progress * PI * uFreq.y + timeTempo ) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + timeTempo) * uAmp.y) * (25. - timeTempo) / 6. +
                (getDistortionY(progress) - getDistortionY(0.02)) * (timeTempo - 19.) / 6.
                ,
                (nsin(progress * PI * uFreq.z + timeTempo) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + timeTempo) * uAmp.z) * (25. - timeTempo) / 6.
              );
            }
        }
`,
  getJS: (progress: number, time: number) => {
    let movementProgressFix = 0.02;

    let uFreq = mountainUniforms.uFreq.value;
    let uAmp = mountainUniforms.uAmp.value;
    const uPowY = deepUniforms.uPowY.value;
    const timeTempo = time % 25.1;

    const getX = (p: number) =>
      Math.sin(p * Math.PI * uFreq.x + timeTempo) * uAmp.x;
    const getY = (p: number) =>
      Math.pow(p * uPowY.x, uPowY.y) +
      Math.sin(p * Math.PI * uFreq.y + timeTempo) * uAmp.y;

    let distortion: THREE.Vector3;
    if (timeTempo <= 4) {
      distortion = new THREE.Vector3(
        -getX(progress) + getX(progress + 0.01),
        -getY(progress) + getY(progress + 0.01),
        -5
      );
    } else if (timeTempo <= 10) {
      distortion = new THREE.Vector3(
        ((-getX(progress) + getX(progress + 0.01)) * (10 - timeTempo)) / 6 +
          ((Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x -
            Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
              uAmp.x) *
            (timeTempo - 4)) /
            6,
        ((-getY(progress) + getY(progress + 0.01)) * (10 - timeTempo)) / 6 +
          ((nsin(progress * Math.PI * uFreq.y + timeTempo) * uAmp.y -
            nsin(movementProgressFix * Math.PI * uFreq.y + timeTempo) *
              uAmp.y) *
            (timeTempo - 4)) /
            6,
        (-5 * (10 - timeTempo)) / 6 +
          ((nsin(progress * Math.PI * uFreq.z + timeTempo) * uAmp.z -
            nsin(movementProgressFix * Math.PI * uFreq.z + timeTempo) *
              uAmp.z) *
            (timeTempo - 4)) /
            6
      );
    } else if (timeTempo <= 13) {
      distortion = new THREE.Vector3(
        Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x -
          Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
            uAmp.x,
        nsin(progress * Math.PI * uFreq.y + timeTempo) * uAmp.y -
          nsin(movementProgressFix * Math.PI * uFreq.y + timeTempo) * uAmp.y,
        nsin(progress * Math.PI * uFreq.z + timeTempo) * uAmp.z -
          nsin(movementProgressFix * Math.PI * uFreq.z + timeTempo) * uAmp.z
      );
    } else if (timeTempo <= 16) {
      distortion = new THREE.Vector3(
        ((Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x -
          Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
            uAmp.x) *
          (16 - timeTempo)) /
          3 +
          ((-Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x +
            Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
              uAmp.x) *
            (timeTempo - 13)) /
            3,
        nsin(progress * Math.PI * uFreq.y + timeTempo) * uAmp.y -
          nsin(movementProgressFix * Math.PI * uFreq.y + timeTempo) * uAmp.y,
        nsin(progress * Math.PI * uFreq.z + timeTempo) * uAmp.z -
          nsin(movementProgressFix * Math.PI * uFreq.z + timeTempo) * uAmp.z
      );
    } else if (timeTempo <= 19) {
      distortion = new THREE.Vector3(
        -Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x +
          Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
            uAmp.x,
        nsin(progress * Math.PI * uFreq.y + timeTempo) * uAmp.y -
          nsin(movementProgressFix * Math.PI * uFreq.y + timeTempo) * uAmp.y,
        nsin(progress * Math.PI * uFreq.z + timeTempo) * uAmp.z -
          nsin(movementProgressFix * Math.PI * uFreq.z + timeTempo) * uAmp.z
      );
    } else {
      distortion = new THREE.Vector3(
        ((-Math.cos(progress * Math.PI * uFreq.x + timeTempo) * uAmp.x +
          Math.cos(movementProgressFix * Math.PI * uFreq.x + timeTempo) *
            uAmp.x) *
          (25 - timeTempo)) /
          6 +
          ((-getX(progress) + getX(progress + 0.01)) * (timeTempo - 19)) / 6,

        ((nsin(progress * Math.PI * uFreq.y + timeTempo) * uAmp.y -
          nsin(movementProgressFix * Math.PI * uFreq.y + timeTempo) * uAmp.y) *
          (25 - timeTempo)) /
          6 +
          ((-getY(progress) + getY(progress + 0.01)) * (timeTempo - 19)) / 6,

        ((nsin(progress * Math.PI * uFreq.z + timeTempo) * uAmp.z -
          nsin(movementProgressFix * Math.PI * uFreq.z + timeTempo) * uAmp.z) *
          (25 - timeTempo)) /
          6 +
          (-5 * (timeTempo - 19)) / 6
      );
    }
    let lookAtAmp = new THREE.Vector3(2, 2, 2);
    let lookAtOffset = new THREE.Vector3(0, 0, -5);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  },
};

// export const deepDistortion = {
//   uniforms: deepUniforms,
//   getDistortion: `
//         uniform vec4 uFreq;
//         uniform vec4 uAmp;
//         uniform vec2 uPowY;
//         float nsin(float val){
//         return sin(val) * 0.5+0.5;
//         }

// 				#define PI 3.14159265358979
// float getDistortionX(float progress){
//     return
//             (
//                 sin(progress * PI * uFreq.x + uTime) * uAmp.x

//             );
// }
// float getDistortionY(float progress){
//     return
//             (
//                 pow(abs(progress * uPowY.x),uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y
//             );
// }
//         vec3 getDistortion(float progress){
// return vec3(
//     getDistortionX(progress)-getDistortionX(0.02) ,
//     getDistortionY(progress)- getDistortionY(0.02),
//     0.
// );
//         }
//     `,
//   getJS: (progress: number, time: number) => {
//     const uFreq = deepUniforms.uFreq.value;
//     const uAmp = deepUniforms.uAmp.value;
//     const uPowY = deepUniforms.uPowY.value;

//     const getX = (p: number) => Math.sin(p * Math.PI * uFreq.x + time) * uAmp.x;
//     const getY = (p: number) =>
//       Math.pow(p * uPowY.x, uPowY.y) +
//       Math.sin(p * Math.PI * uFreq.y + time) * uAmp.y;

//     let distortion = new THREE.Vector3(
//       getX(progress) - getX(progress + 0.01),
//       getY(progress) - getY(progress + 0.01),
//       0
//     );
//     let lookAtAmp = new THREE.Vector3(-2, -4, 0);
//     let lookAtOffset = new THREE.Vector3(0, 0, -10);
//     return distortion.multiply(lookAtAmp).add(lookAtOffset);
//   },
// };
