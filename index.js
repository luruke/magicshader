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

let id = 0;

class MagicShader extends RawShaderMaterial {
  constructor(params) {
    const magicUniforms = parseShaders(params.vertexShader, params.fragmentShader);

    params.uniforms = {
      ...magicUniformsToThree(magicUniforms),
      ...params.uniforms,
    };

    super(params);

    this.params = params;
    this.magicUniforms = magicUniforms;

    this.bindUI();
  }

  bindUI() {
    this.gui = gui.addFolder(this.params.name || `Shader n. ${++id}`);

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
}

export { gui };
export default MagicShader;
