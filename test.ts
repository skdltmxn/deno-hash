// Copyright 2020 skdltmxn. All rights reserved.

import { encodeToString } from "https://deno.land/std/encoding/hex.ts";

import init, {
  source,
  create_hash as create_hash_wasm,
  update_hash as update_hash_wasm,
  digest_hash as digest_hash_wasm,
} from "./out/wasm.js";

await init(source);

const hash = create_hash_wasm("sha3-224");
update_hash_wasm(hash, new Uint8Array(0));
const final = digest_hash_wasm(hash);
console.log(encodeToString(final));
