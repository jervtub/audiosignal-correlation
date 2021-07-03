<style>
  button {
    width: 50px;
    height: 50px;
  }
</style>
<script context="module">
	export const prerender = true;
</script>
<script>
  import { onMount } from "svelte";
  import { init_base } from "./lib/base";
  import { init_gpu } from "./lib/gpu";
  import { benchmark } from "./lib/benchmark";
  import { compare_arrays } from "./lib/compare";
  import { white_noise, pink_noise } from "./lib/dsp/sounds";

  onMount(() => {
    // Moved to run()
  });

  let running = false;
  function run() {
    running = true;
    // Introduce timeout to update UI before hanging
    // Not using async since that influences running speed base-case negatively (as far as I am concerned)
    setTimeout(() => {
      let target_size =  Math.pow(2, 17);//Math.pow(2, 17);
      let source_size =  Math.pow(2, 18);//Math.pow(2, 18);
      let target = white_noise( target_size );
      let source = pink_noise( source_size );

      let base = init_base();
      let gpu  = init_gpu();

      console.log(base);
      console.log(gpu);

      base.setup(target,source);
       gpu.setup(target,source);

      let base_result = benchmark( base.run, target, source);
      let  gpu_result = benchmark(  gpu.run, target, source);

      gpu.clean();

      console.log(base_result.text);
      console.log( gpu_result.text);

      running = false;
      compare_arrays( base_result.result, gpu_result.result );
    }, 10);
  }
</script>

{#if !running}
<button on:click={run}>
Run
</button>
{:else}
Running... Please wait...
{/if}
