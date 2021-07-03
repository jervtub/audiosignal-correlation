function compare_arrays(a,b) {
  console.log(a);
  console.log(b);
  if (a.length !== b.length) {
    throw `Not same length, ${a.length} and ${b.length}`;
  }
  for(let i = 0; i < a.length; i++) {
    if( Math.abs( a[i] - b[i]) > 0.01 ) { // Much to say, but errors accumulate, larger error implies greater deviation in results, this is acceptable
      throw `Not same context at index ${i}`;
    }
  }
  return true;
}
