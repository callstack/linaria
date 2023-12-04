// vite.config.js
import wyw from "file:///Users/anber/Sources/wyw-in-js/packages/vite/esm/index.mjs";
import { nodeResolve } from "file:///Users/anber/Sources/linaria/node_modules/.pnpm/@rollup+plugin-node-resolve@15.2.1_rollup@3.11.0/node_modules/@rollup/plugin-node-resolve/dist/es/index.js";
import react from "file:///Users/anber/Sources/linaria/node_modules/.pnpm/@vitejs+plugin-react@2.1.0_vite@3.2.7/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/anber/Sources/linaria/node_modules/.pnpm/vite@3.2.7_@types+node@17.0.39/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig(({ command }) => ({
  plugins: [
    nodeResolve({
      extensions: [".jsx", ".js"]
    }),
    wyw({
      include: ["**/*.{js,jsx}"],
      babelOptions: {
        presets: ["@babel/preset-react"]
      }
    }),
    react({
      jsxRuntime: "classic"
    })
  ],
  build: {
    target: command === "serve" ? "modules" : "es2015"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYW5iZXIvU291cmNlcy9saW5hcmlhL2V4YW1wbGVzL3ZpdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbmJlci9Tb3VyY2VzL2xpbmFyaWEvZXhhbXBsZXMvdml0ZS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYW5iZXIvU291cmNlcy9saW5hcmlhL2V4YW1wbGVzL3ZpdGUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgd3l3IGZyb20gJ0B3eXctaW4tanMvdml0ZSc7XG5pbXBvcnQgeyBub2RlUmVzb2x2ZSB9IGZyb20gJ0Byb2xsdXAvcGx1Z2luLW5vZGUtcmVzb2x2ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiAoe1xuICBwbHVnaW5zOiBbXG4gICAgbm9kZVJlc29sdmUoe1xuICAgICAgZXh0ZW5zaW9uczogWycuanN4JywgJy5qcyddLFxuICAgIH0pLFxuICAgIHd5dyh7XG4gICAgICBpbmNsdWRlOiBbJyoqLyoue2pzLGpzeH0nXSxcbiAgICAgIGJhYmVsT3B0aW9uczoge1xuICAgICAgICBwcmVzZXRzOiBbJ0BiYWJlbC9wcmVzZXQtcmVhY3QnXSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgcmVhY3Qoe1xuICAgICAganN4UnVudGltZTogJ2NsYXNzaWMnLFxuICAgIH0pLFxuICBdLFxuICBidWlsZDoge1xuICAgIHRhcmdldDogY29tbWFuZCA9PT0gJ3NlcnZlJyA/ICdtb2R1bGVzJyA6ICdlczIwMTUnLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVCxPQUFPLFNBQVM7QUFDaFUsU0FBUyxtQkFBbUI7QUFDNUIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBRzdCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxPQUFPO0FBQUEsRUFDNUMsU0FBUztBQUFBLElBQ1AsWUFBWTtBQUFBLE1BQ1YsWUFBWSxDQUFDLFFBQVEsS0FBSztBQUFBLElBQzVCLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxNQUNGLFNBQVMsQ0FBQyxlQUFlO0FBQUEsTUFDekIsY0FBYztBQUFBLFFBQ1osU0FBUyxDQUFDLHFCQUFxQjtBQUFBLE1BQ2pDO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsTUFDSixZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUSxZQUFZLFVBQVUsWUFBWTtBQUFBLEVBQzVDO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
