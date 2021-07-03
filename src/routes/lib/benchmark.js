export function benchmark(run, f, g) {

  // Run benchmark
  let time = Date.now();
  let result = run(g);
  let spend = Date.now() - time;

  // Log results
  const signal_length = f.length;
  const record_length = g.length;
  const result_length = record_length - signal_length;

  let text = `
Time spend correlating: ${spend}ms
Signal_length ${signal_length} samples
Record_length ${record_length} samples
Result_length ${result_length} samples
Total computations ${signal_length*result_length}
Operations per second ${(signal_length*result_length)/(spend/1000)}
`;

  return {
    result: result,
    text: text
  }

  // console.log("Time spend correlating: ", spend, "ms" );
  // console.log("signal_length ", signal_length, "samples");
  // console.log("record_length ", record_length, "samples");
  // console.log("result_length ", result_length, "samples");
  // console.log("Total computations (signal_length*result_length) ", signal_length*result_length);
  // console.log("Operations per second ", (signal_length*result_length)/(spend/1000))

}
