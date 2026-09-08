import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("both deployments permit the configured catalog connection and official images", async () => {
  for (const path of ["worker/index.ts", "github/index.html", "github/404.html"]) {
    const content = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.match(content, /connect-src 'self' https:\/\/crqjtgolagrknjkpbsdi\.supabase\.co wss:\/\/crqjtgolagrknjkpbsdi\.supabase\.co[;"]/);
    for (const domain of ["kuwaitgbc.com", "kfas.org.kw", "kisr.edu.kw", "sacgc.org"]) assert.ok(content.includes("https://*." + domain), path + ": " + domain);
    assert.doesNotMatch(content, /(?:img-src|connect-src)[^;]*(?:\shttps:;|\s\*;)/);
    assert.match(content, /object-src 'none'/);
  }
});
