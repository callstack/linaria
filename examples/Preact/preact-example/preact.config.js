export default config => {
  const newBabelLoader = {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    enforce: "pre", //Don't delete this
    resolve: { mainFields: ["module", "jsnext:main", "browser", "main"] }, //Don't delete this
    use: [
      {
        loader: "babel-loader",
        options: {
          plugins: [] 
        }
      },
      { loader: "linaria/loader" }
    ]
  };

  config.module.rules[0] = newBabelLoader; //override your babel-loader rule
};
