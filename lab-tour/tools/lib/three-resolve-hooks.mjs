// Node module-resolution hooks that mirror the import map in index.html, so the
// tools run the exact three.js files the browser gets (no node_modules needed).
const VENDOR = new URL('../../vendor/three-r160/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') {
    return { url: new URL('three.module.min.js', VENDOR).href, format: 'module', shortCircuit: true };
  }
  if (specifier.startsWith('three/addons/')) {
    const rest = specifier.slice('three/addons/'.length);
    return { url: new URL(`addons/${rest}`, VENDOR).href, format: 'module', shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
