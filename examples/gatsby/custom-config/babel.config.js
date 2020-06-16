module.exports = {
  presets: [
    "babel-preset-gatsby",
    [
      "linaria/babel",
      {
        evaluate: true,
        displayName: process.env.NODE_ENV !== "production",
      },
    ],
  ],
}
