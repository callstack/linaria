const path = require('path');

module.exports = {
  "plugins": [
    [
      "module-resolver",
      {
        "alias": {
          "_": "./src/__fixtures__"
        }
      }
    ]
  ]
}
