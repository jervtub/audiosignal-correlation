// copied from https://github.com/dntj/jsfft
class BaseComplexArray {
  constructor(other, arrayType = Float32Array) {
    if (other instanceof ComplexArray) {
      // Copy constuctor.
      this.ArrayType = other.ArrayType;
      this.real = new this.ArrayType(other.real);
      this.imag = new this.ArrayType(other.imag);
    } else {
      this.ArrayType = arrayType;
      // other can be either an array or a number.
      this.real = new this.ArrayType(other);
      this.imag = new this.ArrayType(this.real.length);
    }

    this.length = this.real.length;
  }

  toString() {
    const components = [];

    this.forEach((value, i) => {
      components.push(
        `(${value.real.toFixed(2)}, ${value.imag.toFixed(2)})`
      );
    });

    return `[${components.join(', ')}]`;
  }

  forEach(iterator) {
    const n = this.length;
    // For gc efficiency, re-use a single object in the iterator.
    const value = Object.seal(Object.defineProperties({}, {
      real: {writable: true}, imag: {writable: true},
    }));

    for (let i = 0; i < n; i++) {
      value.real = this.real[i];
      value.imag = this.imag[i];
      iterator(value, i, n);
    }
  }

  // In-place mapper.
  map(mapper) {
    this.forEach((value, i, n) => {
      mapper(value, i, n);
      this.real[i] = value.real;
      this.imag[i] = value.imag;
    });

    return this;
  }

  conjugate() {
    return new ComplexArray(this).map((value) => {
      value.imag *= -1;
    });
  }

  magnitude() {
    const mags = new this.ArrayType(this.length);

    this.forEach((value, i) => {
      mags[i] = Math.sqrt(value.real*value.real + value.imag*value.imag);
    })

    return mags;
  }
}

// Math constants and functions we need.
const PI = Math.PI;
const SQRT1_2 = Math.SQRT1_2;

function FFT(input) {
  return ensureComplexArray(input).FFT();
};

function InvFFT(input) {
  return ensureComplexArray(input).InvFFT();
};

function frequencyMap(input, filterer) {
  return ensureComplexArray(input).frequencyMap(filterer);
};

class ComplexArray extends BaseComplexArray {
  FFT() {
    return fft(this, false);
  }

  InvFFT() {
    return fft(this, true);
  }

  // Applies a frequency-space filter to input, and returns the real-space
  // filtered input.
  // filterer accepts freq, i, n and modifies freq.real and freq.imag.
  frequencyMap(filterer) {
    return this.FFT().map(filterer).InvFFT();
  }
}

function ensureComplexArray(input) {
  return input instanceof ComplexArray && input || new ComplexArray(input);
}

function fft(input, inverse) {
  const n = input.length;

  if (n & (n - 1)) { // if NOT a power of 2
    return FFT_Recursive(input, inverse);
  } else {
    return FFT_2_Iterative(input, inverse);
  }
}

function FFT_Recursive(input, inverse) {
  const n = input.length;

  if (n === 1) {
    return input;
  }

  const output = new ComplexArray(n, input.ArrayType);

  // Use the lowest odd factor, so we are able to use FFT_2_Iterative in the
  // recursive transforms optimally.
  const p = LowestOddFactor(n);
  const m = n / p;
  const normalisation = 1 / Math.sqrt(p);
  let recursive_result = new ComplexArray(m, input.ArrayType);

  // Loops go like O(n Σ p_i), where p_i are the prime factors of n.
  // for a power of a prime, p, this reduces to O(n p log_p n)
  for(let j = 0; j < p; j++) {
    for(let i = 0; i < m; i++) {
      recursive_result.real[i] = input.real[i * p + j];
      recursive_result.imag[i] = input.imag[i * p + j];
    }
    // Don't go deeper unless necessary to save allocs.
    if (m > 1) {
      recursive_result = fft(recursive_result, inverse);
    }

    const del_f_r = Math.cos(2*PI*j/n);
    const del_f_i = (inverse ? -1 : 1) * Math.sin(2*PI*j/n);
    let f_r = 1;
    let f_i = 0;

    for(let i = 0; i < n; i++) {
      const _real = recursive_result.real[i % m];
      const _imag = recursive_result.imag[i % m];

      output.real[i] += f_r * _real - f_i * _imag;
      output.imag[i] += f_r * _imag + f_i * _real;

      [f_r, f_i] = [
        f_r * del_f_r - f_i * del_f_i,
        f_r * del_f_i + f_i * del_f_r,
      ];
    }
  }

  // Copy back to input to match FFT_2_Iterative in-placeness
  // TODO: faster way of making this in-place?
  for(let i = 0; i < n; i++) {
    input.real[i] = normalisation * output.real[i];
    input.imag[i] = normalisation * output.imag[i];
  }

  return input;
}

// This FFT function is called if input length equals a power of 2
function FFT_2_Iterative(input, inverse) {

  const input_length = input.length;
  const output = BitReverseComplexArray(input);
  const output_real = output.real;
  const output_imag = output.imag;

  // Loops go like O(n log n):
  //   width ~ log n; i,j ~ n
  let width = 1;
  while (width < input_length) { // Iterate bottom-up

    const delta_f_real = Math.cos(PI/width);
    const delta_f_imag = (inverse ? -1 : 1) * Math.sin(PI/width);
    for (let i = 0; i < input_length/(2*width); i++) { // Pick two bins

      let f_real = 1;
      let f_imag = 0;
      for (let j = 0; j < width; j++) { // Apply butterfly to the bins

        const left_index = 2*i*width + j; // Left bin index
        const right_index = left_index + width; // Right bin index

        // Temporare variables
        const left_real = output_real[left_index]; // Both even or both odd
        const left_imag = output_imag[left_index]; // Both even or both odd
        const right_real = f_real * output_real[right_index] - f_imag * output_imag[right_index];
        const right_imag = f_imag * output_real[right_index] + f_real * output_imag[right_index];

        // In-place
        output_real[left_index] = SQRT1_2 * (left_real + right_real);
        output_imag[left_index] = SQRT1_2 * (left_imag + right_imag);
        output_real[right_index] = SQRT1_2 * (left_real - right_real);
        output_imag[right_index] = SQRT1_2 * (left_imag - right_imag);

        // ???
        [f_real, f_imag] = [
          f_real * delta_f_real - f_imag * delta_f_imag,
          f_real * delta_f_imag + f_imag * delta_f_real,
        ];
      }
    }
    width <<= 1; // Bit shift one to the left (Math.pow(2) in this case)
  }

  return output;
}

// index == b4 b3 b2 b1 b0 => n == 2^5, bitreversed_index == b0 b1 b2 b3 b4
// BitReverseIndex(x, n) == y <=> BitReverseIndex(y, n) == x
function BitReverseIndex(index, n) {
  let bitreversed_index = 0;

  while (n > 1) {

    // 1. Shift bitreversed to the left.
    // rev_index =    b0 b1
    //                   <-
    // rev_index = b0 b1 b2
    bitreversed_index <<= 1;

    // 2. Write index 0 or 1 to bitrev index.
    // index     = b4 b3 b2
    //             write |
    // rev_index = b4 b3 b2
    bitreversed_index += index & 1;

    // 3. Shift index to the right
    // index     = b4 b3 b2
    //                   ->
    // index     =    b4 b3
    index >>= 1;

    // 4. Shift n to the right
    // n = n / 2;
    n >>= 1;
  }
  return bitreversed_index;
}

function BitReverseComplexArray(array) {
  const n = array.length;
  const flips = new Set();

  for(let i = 0; i < n; i++) {
    const r_i = BitReverseIndex(i, n);

    // Don't flip twice, that would undo the first flip.
    if (flips.has(i)) continue;

    // Replace both real and imaginary parts of the complex numbers.
    // This encapsulation ensures right-hand values are temporary cached.
    // And therefore we don't have to use temporare variables.
    [array.real[i], array.real[r_i]] = [array.real[r_i], array.real[i]];
    [array.imag[i], array.imag[r_i]] = [array.imag[r_i], array.imag[i]];

    // Add the rev_index we flipped with.
    flips.add(r_i);
  }

  return array;
}

function LowestOddFactor(n) {
  const sqrt_n = Math.sqrt(n);
  let factor = 3;

  while(factor <= sqrt_n) {
    if (n % factor === 0) return factor;
    factor += 2;
  }
  return n;
}
