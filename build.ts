// Copyright 2020 skdltmxn. All rights reserved.

import { encode as base64Encode } from "https://deno.land/std@0.57.0/encoding/base64.ts";
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

// 2. encode wasm
async function encodeWasm(wasmPath: string) {
  const wasm = await Deno.readFile(`${wasmPath}/deno_hash_bg.wasm`);
  return base64Encode(wasm);
}

// 3. generate script
async function generate(wasm: string, output: string) {
  const initScript = await Deno.readTextFile(`${output}/deno_hash.js`);
  const denoHashScript =
    `import * as base64 from "https://deno.land/std@0.57.0/encoding/base64.ts";` +
    `export const source = base64.decode("${wasm}");` +
    initScript;

  const minified = Terser.minify(denoHashScript, {
    mangle: { toplevel: true, module: true },
    output: {
      ecma: "2015",
      preamble: "/* eslint-disable */\n//deno-fmt-ignore-file",
    },
  });

  if (minified.error) {
    console.error(`Failed to write wasm script: ${minified.error}`);
    Deno.exit(1);
  }

  await Deno.writeFile(
    `${output}/wasm.js`,
    new TextEncoder().encode(minified.code),
  );
}

const OUTPUT_DIR = "./out";

await buildWasm(OUTPUT_DIR);
const wasm = await encodeWasm(OUTPUT_DIR);
await generate(wasm, OUTPUT_DIR);
