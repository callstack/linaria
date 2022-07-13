const path = require('path');

module.exports = {
  "plugins": [
    [
      "module-resolver",
      {
        "alias": {
          "_": path.join(__dirname, "..")
        }
      }
    ]
  ]
}
