# Audio signal cross-correlation on GPGPU with WebGL

Signal correlation on GPGPU in the browser with the aid of Javascript and WebGL.

In action [here]()

This is a minimal proof of concept, therefore expect
* incomplete/minimal benchmarking that "runs on my machine"
* lack of graceful degradation, error handling, and logging in overall

Requirements for this code to run
* floating-point textures
* floating-point VBO
* WebGL version ?
* probably a bunch of API calls that only modern browsers support

Issues that may occur
* WebGL context might get lost. Probably due to too many active contexts, close other browser tabs. If issue persists, restart browser.
* Texture formats are too large and your GPU does not support it. Decrease target/source signal sizes.
* However more likely, shader compilation fails due to too high iteration count in the for-loop. Decrease target/source signal sizes.

Future work
* Add support for integer textures and integer VBO
* Automatically benchmark for different sizes and draw a graph with the results
* WebAssembly benchmarks

Reaching out
* pull-requests welcome
* mail@jervtub.com

Sources:
* Sveltejs, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte)
* [webgl-fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html)
   * Code examples and overall explanation of GPGPU with WebGL
* [vizitsolutions](http://www.vizitsolutions.com/portfolio/webgl/gpgpu/matrixMultiplication.html)
   * Deriving index from xy-position
   * Fragment shader for matrix multiplication very much alike
   * Hint on using every pixel value

How to build:
```bash
npm run dev
```
