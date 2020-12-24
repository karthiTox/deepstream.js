import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";

const extensions = ['.mjs', '.js', '.json', '.node', '.ts'];

const config = {
    input: 'src/index.ts',
    external:['stream', 'path', 'fs', 'events','graceful-fs'],
    output: {
      file: 'dist/deepstream.js',
      format: 'cjs',
      name: 'deepstream',      
    },
    plugins: [
      commonjs(), 
      
      resolve({
        preferBuiltins: true,
        browser: false,
        extensions,
      }),,  
      
      babel({
        extensions,        
        include: ['src/**/*'],
        exclude: ['node_modules/**/*']
      }),
      
      terser(),
    ],
  };
  
  export default config;