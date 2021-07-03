// svelte.config.js
import adapter_static from '@sveltejs/adapter-static';
import adapter_vercel from '@sveltejs/adapter-vercel';

export default {
	kit: {
		target: '#svelte',
		adapter: adapter_static({
			// default options are shown
			pages: 'docs',
			assets: 'docs/static',
			fallback: null
		})
	}
};

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	kit: {
// 		// hydrate the <div id="svelte"> element in src/app.html
// 		target: '#svelte'
// 	}
// };
//
// export default config;
