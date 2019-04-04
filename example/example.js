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

const geometry = new BoxBufferGeometry(.2, .2, .2);
const material = new MagicShader({
  vertexShader: `
    precision highp float;
    
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform vec3 color; // ms({ value: '#ff0000' })

    void main() {
      gl_FragColor = vec4(color, 1.0);
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