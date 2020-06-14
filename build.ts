// Copyright 2020 skdltmxn. All rights reserved.

import { encode as base64Encode } from "https://deno.land/std@0.57.0/encoding/base64.ts";
import { compress } from "https://deno.land/x/lz4@v0.1.1/mod.ts";
import Terser from "https://cdn.pika.dev/terser@^4.7.0";

// 1. build wasm
async function buildWasm(path: string) {
  const cmd = [
    "wasm-pack",
    "build",
    "--target",
    "web",
    "--release",
    "-d",
    path,
  ];
  const builder = Deno.run({ cmd });
  const status = await builder.status();

  if (!status.success) {
    console.error(`Failed to build wasm: ${status.code}`);
    Deno.exit(1);
  }
}

// 2. compress wasm
async function compressWasm(wasmPath: string) {
  const wasm = await Deno.readFile(`${wasmPath}/deno_hash_bg.wasm`);
  return base64Encode(compress(wasm));
}

// 3. generate script
async function generate(wasm: string, output: string) {
  const initScript = await Deno.readTextFile(`${output}/deno_hash.js`);
  const denoHashScript =
    `import * as lz4 from "https://deno.land/x/lz4@v0.1.1/mod.ts";` +
    `export const source = lz4.decompress(Uint8Array.from(atob("${wasm}"), c => c.charCodeAt(0)));` +
    initScript;

  const minified = Terser.minify(denoHashScript, {
    mangle: { toplevel: true, module: true },
    output: {
      ecma: "2015",
      preamble: "//deno-fmt-ignore-file",
    },
  });

  if (minified.error) {
    console.error(`Failed to write wasm script: ${minified.error}`);
    Deno.exit(1);
  }

  await Deno.writeFile(
    `${output}/deno_hash_wasm.js`,
    new TextEncoder().encode(minified.code)
  );
}

const OUTPUT_DIR = "./out";

await buildWasm(OUTPUT_DIR);
const wasm = await compressWasm(OUTPUT_DIR);
await generate(wasm, OUTPUT_DIR);
