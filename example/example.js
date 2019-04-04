import {
  Scene,
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  BoxBufferGeometry,
  RawShaderMaterial,
} from 'three';

import MagicShader from '../index';

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 1;

const geometry = new BoxBufferGeometry(1, 1, 1);
const material = new MagicShader({
  name: 'Cube Shader!',
  vertexShader: `
    precision highp float;
    
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    uniform vec3 translate; // ms({ value: [0, 0, 0], step: 0.01 })
    uniform float scale; // ms({ value: 0.5, options: { small: 0.5, medium: 1, big: 2 } })
    uniform mat4 aMatrix4; // ms({ value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })

    void main() {
      vec3 pos = position + translate;
      pos *= scale;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    
    uniform vec3 color; // ms({ value: '#ff0000' })
    uniform float brightness; // ms({ value: 0, range: [0, 0.5], step: 0.1 })
    uniform vec2 dummyValue; // ms({ value: [1024, 768], range: [[0, 2000], [0, 1500]] })
    uniform bool visible; // ms({ value: 1, name: 'Visibility' })
    uniform int test; // ms({ value: 0 })

    void main() {
      gl_FragColor = vec4(color + brightness, 1.0);
    }
  `
});

const mesh = new Mesh(geometry, material);
scene.add(mesh);

function animate() {
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();