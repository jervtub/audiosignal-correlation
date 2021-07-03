// 2021-07-02 jervtub
// GPGPU implementation for correlating two audio signals.
//
// Code structure, functionality, and flow inspired by and taken from the following sources:
// Both sources explain setting up the vertex shader, reading from textures, writing to VBO
// In particular:
// * https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html
//    * Code examples and overall explanation of GPGPU with WebGL
// * http://www.vizitsolutions.com/portfolio/webgl/gpgpu/matrixMultiplication.html
//    * Understanding the requirement of floating-point textures and floating-point VBO
//    * Fragment shader of matrix multiplication
//    * Deriving index from xy-position


let webglUtils;
let m4;

function init_gpu() {
  webglUtils = init_gl();
  m4 = init_m4();

  // Define function (object) variables
  let sampleTexWidth;
  let sourceTexHeight;
  let targetTexHeight;
  let numSourceSamples;
  let numTargetSamples;
  let numCorrelations;
  let numShaderIterations;
  let correlateVS;
  let correlateFS;
  let canvas;
  let gl;
  let program;
  let shaderLocations;
  let framebuffer;
  let clipPositionBuffer;


  let sourceSamplesTex;
  let targetSamplesTex;


  // This stuff is run as initialization
  {


    // Setup the canvas
    canvas = document.createElement('canvas');
    // console.log(canvas);
    canvas.addEventListener("webglcontextlost", (e) => {
      alert("Lost WebGL context. You have too many webgl context running (either in this tab or divided over all tabs). I think the best way to solve this is restart the web-browser completely...")
      throw e;
    });


    // Setup WebGL
    gl = canvas.getContext("webgl", { alpha: false, depth: false, antialias: false });
    // console.log(gl);
    if (!gl) {
      return;
    }
    // check we can use floating point textures
    let ext1 = gl.getExtension('OES_texture_float');
    if (!ext1) {
      alert('Need OES_texture_float');
      return;
    }
    // check we can render to floating point textures
    let ext2 = gl.getExtension('WEBGL_color_buffer_float');
    if (!ext2) {
      alert('Need WEBGL_color_buffer_float');
      return;
    }
    // check we can use textures in a vertex shader
    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
      alert('Can not use textures in vertex shaders');
      return;
    }
    // console.log(gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS))


    // Setup a full canvas clip space quad (and bind it to the gl context)
    clipPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clipPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

  }


  function setup(target, source) {

    // Derive sizes
    let numPixelsTarget = target.length / 4; // We have four values per pixel
    sampleTexWidth  = Math.pow(2, Math.ceil( Math.log2( numPixelsTarget ) / 2 ) );
    sourceTexHeight = source.length / (sampleTexWidth*4);
    targetTexHeight = target.length / (sampleTexWidth*4);

    numSourceSamples= source.length;
    numTargetSamples= target.length;
    numCorrelations = numSourceSamples - numTargetSamples;
    numShaderIterations = numCorrelations / 4; // Iterations in shader


    // Debugging
    // console.log(sampleTexWidth  );
    // console.log(sourceTexHeight );
    // console.log(targetTexHeight );
    // console.log(numSourceSamples);
    // console.log(numTargetSamples);
    // console.log(numCorrelations );
    // console.log(numShaderIterations );


    // Vertex shader
    correlateVS = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;


    // Fragment shader
    correlateFS = `
      precision highp float;
      uniform sampler2D sourceSamplesTex;
      uniform sampler2D targetSamplesTex;

      uniform vec2 sourceTexDimensions;
      uniform vec2 targetTexDimensions;
      uniform vec2 canvasDimensions;
      float fracCoord_to_index() {
        return gl_FragCoord.x - 0.5 + canvasDimensions.x * (gl_FragCoord.y - 0.5);
      }
      vec4 index_to_source(float index) {
        // https://stackoverflow.com/questions/36324295/webgl-access-buffer-from-shader#36326319
        float column =   mod(index,  sourceTexDimensions.x);
        float    row = floor(index / sourceTexDimensions.x);
        vec2 uv = vec2(
          (column + 0.5) / sourceTexDimensions.x,
          (   row + 0.5) / sourceTexDimensions.y
        );
        return texture2D(sourceSamplesTex, uv);
      }
      vec4 index_to_target(float index) {
        // https://stackoverflow.com/questions/36324295/webgl-access-buffer-from-shader#36326319
        float column =   mod(index,  targetTexDimensions.x);
        float    row = floor(index / targetTexDimensions.x);
        vec2 uv = vec2(
          (column + 0.5) / targetTexDimensions.x,
          (   row + 0.5) / targetTexDimensions.y
        );
        return texture2D(targetSamplesTex, uv);
      }
      void main() {

        // We have to compute for four subsequent values since we store 4 samples per pixel
        float index = fracCoord_to_index();
        float value = 0.0;

        vec4 target;
        vec4 source1;
        vec4 source2;

        vec4 r1 = vec4(0.0, 0.0, 0.0, 0.0); // Result of offset 0
        vec4 r2 = vec4(0.0, 0.0, 0.0, 0.0); // etcetera
        vec4 r3 = vec4(0.0, 0.0, 0.0, 0.0);
        vec4 r4 = vec4(0.0, 0.0, 0.0, 0.0);

        source2 = index_to_source(index);
        for (float i = 0.0; i < ${numShaderIterations}.0; i++) {
          target = index_to_target(i);
          source1 = source2.rgba;
          source2 = index_to_source(index+i+1.0);

          r1 += target * source1;
          r2 += vec4(target.rgb * source1.gba, target.a   * source2.r  );
          r3 += vec4(target.rg  * source1.ba , target.ba  * source2.rg );
          r4 += vec4(target.r   * source1.a  , target.gba * source2.rgb);
        }

        gl_FragColor = vec4(
          r1.r + r1.g + r1.b + r1.a,
          r2.r + r2.g + r2.b + r2.a,
          r3.r + r3.g + r3.b + r3.a,
          r4.r + r4.g + r4.b + r4.a
        );
      }
    `;


    // Setup WebGL Program
    program = webglUtils.createProgramFromSources( gl, [correlateVS, correlateFS]);
    shaderLocations = {
      position: gl.getAttribLocation(program, 'position'),
      sourceSamplesTex: gl.getUniformLocation(program, 'sourceSamplesTex'),
      targetSamplesTex: gl.getUniformLocation(program, 'targetSamplesTex'),
      sourceTexDimensions: gl.getUniformLocation(program, 'sourceTexDimensions'),
      targetTexDimensions: gl.getUniformLocation(program, 'targetTexDimensions'),
      canvasDimensions: gl.getUniformLocation(program, 'canvasDimensions'),
    };


    // Render to the new positions
    gl.viewport(0, 0, sampleTexWidth, sourceTexHeight - targetTexHeight);


    // Create correlation texture (VBO)
    let correlationTex   = webglUtils.createTexture(gl,   null, sampleTexWidth, sourceTexHeight - targetTexHeight);


    // Create framebuffer (the correlation texture) and link to gl context.
    framebuffer = webglUtils.createFramebuffer(gl, correlationTex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);


    // Create target textures
    targetSamplesTex = webglUtils.createTexture(gl, target, sampleTexWidth, targetTexHeight);

  }

  function run( source ) {


    // Setup and bind source texture to gl
    sourceSamplesTex = webglUtils.createTexture(gl, source, sampleTexWidth, sourceTexHeight);

    gl.useProgram(program);
    gl.uniform1i(shaderLocations.sourceSamplesTex, 0);  // tell the shader the texture is on texture unit 0
    gl.uniform2f(shaderLocations.sourceTexDimensions, sampleTexWidth, sourceTexHeight);
    gl.uniform1i(shaderLocations.targetSamplesTex, 1);  // tell the shader the texture is on texture unit 1
    gl.uniform2f(shaderLocations.targetTexDimensions, sampleTexWidth, targetTexHeight);
    gl.uniform2f(shaderLocations.canvasDimensions, sampleTexWidth, sourceTexHeight - targetTexHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceSamplesTex);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, targetSamplesTex);


    // Setup our attributes to tell WebGL how to pull
    // the data from the buffer above to the position attribute
    // this buffer just contains a -1 to +1 quad for rendering
    // to every pixel
    gl.bindBuffer(gl.ARRAY_BUFFER, clipPositionBuffer);
    gl.enableVertexAttribArray(shaderLocations.position);
    gl.vertexAttribPointer(
        shaderLocations.position,
        2,         // size (num components)
        gl.FLOAT,  // type of data in buffer
        false,     // normalize
        0,         // stride (0 = auto)
        0,         // offset
    );


    // Framebuffer status
    let framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch (framebufferStatus) {
      case gl.FRAMEBUFFER_COMPLETE:
        // Proper status, dont do anything.
        break;
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        console.error("The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.");
        break;
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        console.error("There is no attachment.");
        break;
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        console.error("Height and width of the attachment are not the same.");
        break;
      case gl.FRAMEBUFFER_UNSUPPORTED:
        console.error("The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.");
        break;
      default:
        console.log("Nothing special with the framebuffer");
    }


    // Compute
    gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw 2 triangles (6 vertices)


    // Print and test results
    let pixels = new Float32Array(numCorrelations);
    gl.readPixels(0, 0, sampleTexWidth, sourceTexHeight - targetTexHeight, gl.RGBA, gl.FLOAT, pixels);


    // Clean up source texture
    gl.deleteTexture(sourceSamplesTex);


    // Return content
    return pixels;
  }


  // Clean up textures etcetera
  function clean() {


    // Unbind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, null);


    // Delete textures
    gl.deleteTexture(targetSamplesTex);


    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // Delete framebuffer
    gl.deleteFramebuffer(framebuffer);
  }


  // Exit canvas and webgl context
  function exit() {
  }

  return {
    setup: setup,
    run: run,
    clean: clean,
    exit: exit
  }
}
