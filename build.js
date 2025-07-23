import { build } from 'esbuild';
import { readFileSync } from 'fs';

// Read package.json to get dependencies
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const externalDependencies = Object.keys(packageJson.dependencies || {});

async function bundle() {
  try {
    console.log('Building cf-tunnel-buddy...');
    
    await build({
      entryPoints: ['src/interactive.js'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      outfile: 'dist/cf-tunnel-buddy.cjs',
      minify: true,
      sourcemap: false,
      // Bundle all dependencies into single file
      external: [], // Empty array means bundle everything
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      logLevel: 'info',
      metafile: true
    });
    
    console.log('✓ Build completed successfully!');
    console.log('Output: dist/cf-tunnel-buddy.cjs');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

bundle();