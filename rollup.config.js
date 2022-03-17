import typescript from "@rollup/plugin-typescript";
export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/esm/index.js",
      format: "es",
    },
    {
      file: "dist/cjs/index.js",
      format: "cjs",
    },
  ],
  plugins: [typescript()],
};
