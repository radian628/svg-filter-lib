import * as esbuild from "esbuild";

const ctx = await esbuild.context({
  entryPoints: ["src/index.tsx"],
  outdir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
});

await ctx.watch();
