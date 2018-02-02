#!/bin/bash

URL="https://callstack-github-bot.herokuapp.com/comment"
LINK="https://$CIRCLE_BUILD_NUM-92112844-gh.circle-artifacts.com/$CIRCLE_NODE_INDEX/coverage/lcov-report/index.html"
TEMPLATE="Hey @{{user.login}}, thank you for your pull request 🤗.\nThe coverage report for this branch can be viewed [here]($LINK)."

read -r -d '' DATA << EOM
{
  "pull_request": "$CIRCLE_PULL_REQUEST",
  "template": "$TEMPLATE",
  "test": {
    "type": "string",
    "data": "The coverage report for this branch can be viewed"
  },
  "update": true
}
EOM

curl \
  -H "Content-Type: application/json" \
  -d "$DATA" \
  -X POST $URL
