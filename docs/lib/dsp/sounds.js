
function hamming_window(N = 2048, a = 0.5) {
	/** [jervtub 2020-05-08 15:10]
		* Hamming window (wiki)[https://en.wikipedia.org/wiki/Window_function#Hann_and_Hamming_windows]
		* w[n] = a_0 - (1 - a_0) * cos((2*pi*n)/N)
		* With a_0 = 0.5 it becomes a Hann window.
		**/
		const a_0 = a;
		const a_1 = 1 - a_0;
		const w = new Float32Array(N);
		for (let n = - (N / 2); n < N / 2; n++) {
			w[n + (N / 2)] = a_0 + a_1 * Math.cos((2 * Math.PI * n) / N);
		}
		return w
}

function mul(f, g) {
	let signal = new Float32Array(f.length);
	for (let i = 0; i < f.length; i++) {
		signal[i] = f[i] * g[i];
	}
	return signal;
}

let is_log = false;
function llog( str ) { if ( is_log) console.log( str ) }

function white_noise( sample_size ) {
  let data_noise = null;
  if (data_noise) return data_noise;
  // Prepare noise data.
  data_noise = new Float32Array( sample_size );
  for (let i = 0; i < sample_size; i++) {
    data_noise[i] = Math.random() * 2 - 1;
  }
  return data_noise;
}

function spectral_filter( audio, filter, overlap = 8, window_size = 2048 ) {
  let sample_size = audio.length;
	// Zero pad audio to maintain true power of time-domain pulse.
	let data = new Float32Array( audio.length + 2 * window_size );
	data.fill( 0 );
	data.set( audio, window_size );
	// Get frames, with overlap.
	let step = ( window_size / overlap );
	let frames = [];
	for ( let i = 0; i < data.length - window_size; i += step ) {
		frames.push( data.slice( i, i + window_size ) );
	}
  llog( audio );
  llog( data );
  llog( frames );
	// Calculate frequencies.
	let w = hamming_window(2048);
	let ffts = []
	frames.forEach(( frame, i ) => {
		ffts.push ( (new ComplexArray( mul( frame, w ))).FFT() );
	});
  llog( ffts );
	// Apply spectral filter.
	ffts.forEach(( fft, i ) => {
		fft.real = mul( fft.real, filter );
		fft.imag = mul( fft.imag, filter );
	});
	// Convert back to time-domain.
	let results = ffts.map( fft => fft.InvFFT() );
  llog( results );
	let result = new Float32Array( audio.length );
	// Handle overlap, put back together.
	let sample_start, sample_index;
	results.forEach(( res, i ) => {
		// ( Keep zero padding in mind )
		sample_start = step * i - window_size;
		// Iterate over each frame
		for ( let j = 0 ; j < res.length; j ++ ) {
			sample_index = sample_start + j;
			// ( Keep zero padding in mind )
			if ( sample_index + j >= 0 && sample_index + j < audio.length ) {
				result [ sample_index ] += res.real[ j ];
			} } });
	// Normalize
  // TODO: Properly normalize based on overlap and window_size.
  llog( result );
	let max_val = result.reduce ( ( acc, val ) => Math.max( acc, val ) , 0 );
	let normalized = result.map( sample => sample *= ( 1 / max_val ) );
	return normalized;
}

function pink_noise( sample_size = 44100 ) {
	// Generate noise.
  let data_noise = white_noise( sample_size );
	// Generate spectral filter.
	let filter = new Float32Array( 2048 );
	for ( let i = 0; i < filter.length; i++ ) {
		if ( i < 1024 ) filter[ i ] = 1 - ( 2 * i / 1024 );
    else filter[ i ] = 0;
	}
  llog( data_noise );
  llog( filter );
  return spectral_filter( data_noise, filter );
}
