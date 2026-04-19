// Copies non-TypeScript assets (CSS) into dist/. tsc -b only emits .js/.d.ts.
// Kept tiny and dependency-free so the package itself stays light.
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(here, '..', 'src')
const distRoot = join(here, '..', 'dist')

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(path)
    } else if (entry.isFile() && path.endsWith('.css')) {
      yield path
    }
  }
}

for await (const file of walk(srcRoot)) {
  const target = join(distRoot, relative(srcRoot, file))
  await mkdir(dirname(target), { recursive: true })
  await copyFile(file, target)
  console.log(`copied ${relative(srcRoot, file)} -> dist/${relative(distRoot, target)}`)
}
