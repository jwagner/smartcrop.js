module.exports = {
  env: {
    browser: true,
    node: true
  },
  extends: 'eslint:recommended',
  globals: {
    Promise: false,
    define: false,
    Uint8ClampedArray: false
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always']
  },
  overrides: [
    {
      files: ['test/*.js', 'examples/*.js'],
      rules: { 'no-console': 'off' },
      env: {
        browser: true,
        node: true,
        mocha: true
      },
      globals: {
        smartcrop: false,
        Benchmark: false,
        $: false,
        chai: false,
        debugDraw: false,
        Uint8Array: false,
        _: false,
        cv: false,
        tracking: false,
        faceapi: false
      }
    }
  ]
};
