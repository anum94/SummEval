import path from 'path';
import checker from 'vite-plugin-checker';
import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// ----------------------------------------------------------------------

const PORT = 3000;

const env = loadEnv('all', process.cwd());

export default defineConfig({
  // base: env.VITE_BASE_PATH,
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
    ],
  },
  preview: {
    port: PORT,
    strictPort: true,
   },
   server: {
    port: PORT, // The port the server will listen on.
    strictPort: true, // Set to true to exit if the port is already in use, instead of automatically trying the next available port.
    host: true, // Specify which IP addresses the server should listen on. Set this to 0.0.0.0 or true to listen to all addresses, including LAN and public addresses.
   },
   build: {
     rollupOptions: {
       external: [], // Add external dependency if necessary
     },
   },
});





/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    mimeTypes: {
      'js': 'application/javascript'
    }
  }
})

import { defineConfig } from "file:///home/ober/University/LABSEBA/summeval/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///home/ober/University/LABSEBA/summeval/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    mimeTypes: {
      "js": "application/javascript"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9vYmVyL1VuaXZlcnNpdHkvTEFCU0VCQS9zdW1tZXZhbC9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvb2Jlci9Vbml2ZXJzaXR5L0xBQlNFQkEvc3VtbWV2YWwvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvb2Jlci9Vbml2ZXJzaXR5L0xBQlNFQkEvc3VtbWV2YWwvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBtaW1lVHlwZXM6IHtcbiAgICAgICdqcyc6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1QsU0FBUyxvQkFBb0I7QUFDNVYsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixXQUFXO0FBQUEsTUFDVCxNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

*/

/*
checker({
  eslint: {
    lintCommand: 'eslint "./src/**//*.{js,jsx,ts,tsx}"',
  },
  overlay: {
    position: 'tl',
    initialIsOpen: false,
  },
}),
*/