import vite_ssr from "vite-plugin-ssr/plugin";
import vite_linaria from "@linaria/vite";
import vite_solid from "vite-plugin-solid";

export default (/** @type import('vite').ConfigEnv */ { mode }) => {
	const dev = mode === "development";
	/** @type import('vite').UserConfig */
	const config = {
		plugins: [
			vite_linaria({
				babelOptions: {
					presets: ["solid"],
				},
			}),
			vite_solid({
				dev: dev,
				hot: dev,
				ssr: true,
			}),
			vite_ssr({
				includeAssetsImportedByServer: true,
				prerender: {
					partial: true,
					noExtraDir: true,
				},
			}),
		],
	};
	return config;
};
