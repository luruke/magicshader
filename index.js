import { RawShaderMaterial, Color } from 'three';
import * as dat from 'dat.gui';

const magicUniformsToThree = uniforms => {
  const r = {};

  for (const k in uniforms) {
    const uniform = uniforms[k];
    let value = uniforms[k].json.value;

    if (uniform.type === 'bool') {
      value = !!value;
    }

    if (typeof value === 'string') {
      value = new Color(value);
    }

    r[k] = { value };
  }

  return r;
};

const parseShaders = (vertex, fragment) => {
  const vertexUniforms = parseGLSL(vertex);
  const fragmentUniforms = parseGLSL(fragment);

  return {
    ...vertexUniforms,
    ...fragmentUniforms,
  };
};

const parseGLSL = source => {
  const lines = source.match(/uniform (.+?) (.+?);.+\/\/.+ms\((.+?)\)/gm);

  if (!lines) {
    return {};
  }

  const uniforms = {};

  lines.forEach(line => {
    const [, type, name, jsonString] = line.match(/uniform (.+?) (.+?);.+\/\/.+ms\((.+?)\)/);
    let json = {};

    try {
      eval(`json = ${jsonString}`);
    } catch (e) {
      throw new Error(e);
    }

    if (!json.value) {
      json.value = 0;
    }

    uniforms[name] = {
      name,
      type,
      json,
    };
  });

  return uniforms;
};

const gui = new dat.GUI({
  name: 'MagicShader',
});

let spectorGui;
let id = 0;

class MagicShader extends RawShaderMaterial {
  constructor(params) {
    const originalParams = params;
    const magicUniforms = parseShaders(params.vertexShader, params.fragmentShader);

    params.uniforms = {
      ...magicUniformsToThree(magicUniforms),
      ...params.uniforms,
    };

    super(params);

    this.originalParams = originalParams;
    this.params = params;
    this.magicUniforms = magicUniforms;
    this.displayName = this.params.name || `Shader n. ${++id}`;

    this.spector();
    this.bindUI();
  }

  bindUI() {
    if (this.gui) {
      gui.removeFolder(this.gui);
    }

    this.gui = gui.addFolder(this.displayName);

    Object.keys(this.magicUniforms).forEach(key => {
      const magicUniform = this.magicUniforms[key];
      const magicJson = magicUniform.json;
      const uniform = this.uniforms[key];
      const folder = this.gui.addFolder(magicJson.name || `🔮 ${magicUniform.type} - ${key}`);

      if (uniform.value instanceof Color) {
        const add = folder.addColor(magicJson, 'value').onChange(res => {
          uniform.value.set(res);
        });

        add.listen();
      } else if (Array.isArray(magicJson.value)) {
        Object.keys(uniform.value).forEach(index => {
          const add = folder.add(uniform.value, index);

          magicJson.step && add.step(magicJson.step);

          if (magicJson.range && magicJson.range[index] && magicJson.range[index].length === 2) {
            add.min(magicJson.range[index][0]);
            add.max(magicJson.range[index][1]);
          }

          add.listen();
        });
      } else {
        const add = folder.add(uniform, 'value');

        magicJson.step && add.step(magicJson.step);
        magicJson.options && add.options(magicJson.options);

        if (magicJson.range && magicJson.range.length === 2) {
          add.min(magicJson.range[0]);
          add.max(magicJson.range[1]);
        }

        add.listen();
      }
    });
  }

  // Spector.js stuff
  spector() {
    if (!window.spector) {
      return;
    }

    if (!spectorGui) {
      // Just once, for the whole context.
      spectorGui = gui.addFolder('📈 Spector');

      this.spectorFPS = 0;
      setInterval(() => {
        this.spectorFPS = spector.getFps();
      }, 200);

      spectorGui.add(this, 'spectorFPS').name('FPS').listen();
      spectorGui.add(this, 'capture');
    }

    this.checkProgram = this.checkProgram.bind(this);
    this.checkProgramInterval = setInterval(this.checkProgram, 200);
  }

  capture() {
    const instance = document.querySelector('canvas');
    spector.captureNextFrame(instance);
  }

  checkProgram() {
    if (this.program && this.program.program) {
      this.program.program.__SPECTOR_Object_TAG.displayText = this.displayName;
      this.program.vertexShader.__SPECTOR_Object_TAG.displayText = `Vertex - ${this.displayName}`;
      this.program.fragmentShader.__SPECTOR_Object_TAG.displayText = `Fragment - ${this.displayName}`;

      this.program.program.__SPECTOR_rebuildProgram = this.rebuildShader.bind(this);
      clearInterval(this.checkProgramInterval);
    }
  }

  rebuildShader(vertex, fragment, onCompile, onError) {
    this.vertexShader = vertex;
    this.fragmentShader = fragment;

    this.magicUniforms = parseShaders(vertex, fragment);
    this.uniforms = {
      ...this.uniforms,
      ...magicUniformsToThree(this.magicUniforms),
    };

    this.needsUpdate = true;
    this.bindUI();

    onCompile(this.program.program);
    this.checkProgramInterval = setInterval(this.checkProgram, 200);
  }

  clone() {
    return new this.constructor(this.originalParams).copy(this);
  }
}

export { gui };
export default MagicShader;
