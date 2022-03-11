# Audio signal cross-correlation on GPGPU with WebGL

*Time-domain audio signal cross-correlation on GPGPU in the browser with the aid of Javascript and WebGL.*

| ❗ This website can freeze and crash your computer if the GPU hangs indefinitely |
|------------------------------------------------------------------------|

| ❗ This is pre-alpha code, it is a proof of concept that "works on my device" |
|--------------------------------------------------------------------------------|

#### Warnings

This is a minimal proof of concept, therefore expect
* incomplete/minimal benchmarking that "runs on my machine"
* lack of graceful degradation, error handling, and logging in overall

#### Demo 
Test website can be found at [https://jervtub.github.io/audiosignal-correlation](https://jervtub.github.io/audiosignal-correlation).

#### Requirements
* GPU supporting floating-point textures
* GPU supporting floating-point VBO
* WebGL version ?
* probably a bunch of API calls that only modern browsers support

#### Issues that may (will) occur

| Issue | Cause | Solution|
| ---- | ---- | ---- |
| WebGL context gets lost | Too many active WebGL contexts | Close other browser tabs, or restart web browser |
| Texture formats are too large and your GPU does not support it |  | Decrease target/source signal sizes |
| Shader compilation fails due to too high iteration count in the for-loop | | Decrease target/source signal sizes | 

#### Credits
* Sveltejs, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte)
* [webgl-fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html)
   * Code examples and overall explanation of GPGPU with WebGL
* [vizitsolutions](http://www.vizitsolutions.com/portfolio/webgl/gpgpu/matrixMultiplication.html)
   * Deriving index from xy-position
   * Fragment shader for matrix multiplication very much alike
   * Hint on using every pixel value
