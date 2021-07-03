
function init_base() {

  let f,g;
  let size;
  let result;

  function setup( target, source ) {
    f = target;
    g = source;
    size = g.length - f.length; // Length of correlation result
    if (size < 1) throw "Source signal not larger than target signal";
  }

  function run( source ) {
    let result = new Float32Array(size); // Initiates to zeros
    for (var tau = 0; tau < result.length; tau++) {
      for (var i = 0; i < f.length; i++) {
        result[ tau ] += f[ i ] * g[ ( i + tau ) ];
      }
    }
    return result;
  }

  function clean() {
    // nothing to do
  }

  return {
    setup: setup,
    run  : run,
    clean: clean
  };

}
