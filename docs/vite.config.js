import analyze from 'rollup-plugin-analyzer'

export default {
  resolve: {
    alias: {
      //three: 'three/src/Three.js'
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      plugins: [analyze()],
    },
  }
}
