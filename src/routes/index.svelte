<style>
  button {
    width: 50px;
    height: 50px;
  }
</style>
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


  // // Benchmarking
  // const signal_length = 1024*2;
  // const record_length = 1024*30;
  // const result_length = record_length - signal_length;
  //
  // let target_signal = pink_noise( signal_length );
  // let audio_stream = pink_noise( record_length );
	// let result = new Float32Array( result_length );
  //
  // // Benchmark cross_correlate algorithm
  // // TODO: Create indefinite stream of gray noise.
  // // TODO: Assume 50 dBA gray background noise. (10^6 P/P_r)
  // // TODO: Assume phone at 60 dBA at a distance of 2 meters?
  // let obj = {
  //   running : false
  // };
  // function run() {
  //   if (obj.running) {
  //     console.log("Generating pink noise...");
  //     audio_stream  = pink_noise( record_length );
  //     // TODO: Introduce signal into recording
  //
  //     const f = target_signal;
  //     const g = audio_stream;
  //
  //     // Cross correlate time
  //     let index = 0;
  //     let time = Date.now();
  //
  //     console.log("Cross correlating samples...")
  //     while (index < record_length) {
  //       // console.log(index);
  //       const tau = index;
  //       for ( let i = 0; i < signal_length; i ++ ) {
  //           result[ tau ] += f[ i ] * g[ ( i + tau ) ];
  //       }
  //       index ++;
  //
  //       // 2021-06-08 15:15:
  //       //  *    Generating pink noise...
  //       //  *    Cross correlating samples...
  //       //  *    Time spend correlating:  4328 ms
  //       //  *    signal_length  2048
  //       //  *    record_length  30720
  //       //  *    result_length  28672
  //       //  *    total computations (signal_length*result_length)  58720256
  //       // => Approximately 12million ops per sec
  //
  //
  //       // 2021-06-26 09:35
  //       //
  //
  //
  //
  //       // setTimeout(() => console.log(index));//Does this take local index at function call?
  //     }
  //
  //   }
  // }
</script>

<!-- TODO: display target -->
<!-- TODO: display source -->
<!-- TODO: display result -->

<!-- {result} -->

{#if !running}
<button on:click={run}>
Run
</button>
{:else}
Running... Please wait...
{/if}
