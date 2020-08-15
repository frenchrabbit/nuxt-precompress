module.exports = {
  sourceType: 'unambiguous',
  presets: [
    // ['@nuxt/babel-preset-app'],
    [
      '@babel/preset-env',
      {
        targets: { node: true },
        // modules: 'commonjs',
        // forceAllTransforms: true,
      },
    ],
  ],
  // presets: ['@nuxt/babel-preset-app'],
}
