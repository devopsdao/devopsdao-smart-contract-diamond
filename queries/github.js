import * as Witnet from "witnet-requests"


new Witnet.Script([Witnet.TYPES.STRING])
    .parseJSONArray()
    .filter(
      new Witnet.Script([Witnet.TYPES.MAP])
        // from all elements in the array,
        // select the ones which "title" field
        // match wildcard #1
        .getString("title")
        .match({ "\\1\\": true }, false)
    )
    .filter(
      // from all elements in the array,
      // select the ones which "merged_at" field
      // string length is greater than zero
      new Witnet.Script([Witnet.TYPES.MAP]).getString("merged_at").length().greaterThan(0)
    )
    .getMap(0)
    .getString("state");