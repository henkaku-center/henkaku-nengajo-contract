import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import builtins from 'builtin-modules'

export default [
  {
    input: ['scripts/defender-autotask/relay_mumbai/index.js'],
    output: [
      {
        dir: 'build/relay_mumbai',
        format: 'cjs',
        exports: 'auto',
      },
    ],
    plugins: [resolve({ preferBuiltins: true }), commonjs(), json({ compact: true })],
    external: [...builtins, 'ethers', 'web3', 'axios', /^defender-relay-client(\/.*)?$/],
  },
  {
    input: ['scripts/defender-autotask/relay_polygon/index.js'],
    output: [
      {
        dir: 'build/relay_polygon',
        format: 'cjs',
        exports: 'auto',
      },
    ],
    plugins: [resolve({ preferBuiltins: true }), commonjs(), json({ compact: true })],
    external: [...builtins, 'ethers', 'web3', 'axios', /^defender-relay-client(\/.*)?$/],
  },
]
