// lib.ts
var addFilterIds = function(filterFormat, id, filters) {
  filters.set(id, filterFormat);
  filterFormat.id = id;
  id++;
  for (const child of filterFormat?.in ?? []) {
    id = addFilterIds(child, id, filters);
  }
  return id;
};
var makeFilter = function(filterFormat) {
  const map = new Map;
  addFilterIds(filterFormat, 1, map);
  let outstr = "";
  for (const v of [...map.values()].reverse().filter((v2) => v2.node)) {
    outstr += `<${v.node} result="${v.id}" ${Object.entries(v).flatMap(([k, v2]) => {
      if (k === "type" || k === "id")
        return [];
      if (k === "in") {
        let out = [];
        if (v2[0]) {
          out.push(`in="${v2[0]._overrideId ?? v2[0].id}"`);
        }
        if (v2[1]) {
          out.push(`in2="${v2[1]._overrideId ?? v2[1].id}"`);
        }
        return out;
      }
      return [`${k}="${v2}"`];
    }).join(" ")}/>`;
  }
  return outstr;
};
function makeCSSFilter(filterFormat) {
  const filter = makeFilter(filterFormat);
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" id="filter1">
  <filter id="f">${filter}</filter></svg>`) + '#f")';
}
function composite(a, b, operator) {
  return {
    node: "feComposite",
    in: [a, b],
    operator
  };
}
function multiComposite(ffs, operator) {
  if (ffs.length === 1)
    return ffs[0];
  return composite(ffs[0], multiComposite(ffs.slice(1), operator), operator);
}
function fractalNoise(freqX, freqY, octaves, seed) {
  return {
    node: "feTurbulence",
    baseFrequency: `${freqX} ${freqY}`,
    type: "fractalNoise",
    numOctaves: octaves,
    seed
  };
}
function colorMatrix(a, r1, r2, r3, r4) {
  return {
    node: "feColorMatrix",
    type: "matrix",
    values: `${r1.join(" ")}\n${r2.join(" ")}\n${r3.join(" ")}\n${r4.join(" ")}`,
    in: [a]
  };
}
function displace(image, displacement, scale, xChannel, yChannel) {
  return {
    node: "feDisplacementMap",
    in: [image, displacement],
    scale,
    xChannelSelector: xChannel,
    yChannelSelector: yChannel
  };
}
function blur(a, stdDeviation) {
  return {
    node: "feGaussianBlur",
    stdDeviation,
    in: [a]
  };
}
var SourceGraphic = { _overrideId: "SourceGraphic" };

// index.ts
var displacementNoise = fractalNoise(0.2, 0.2, 4, 2);
var rawNoise1 = fractalNoise(0.01, 0.01, 4, 1);
var noise1 = displace(rawNoise1, displacementNoise, 4, "R", "G");
var inkSmudgeBlur = blur(SourceGraphic, 1.5);
var splotchMask = colorMatrix(noise1, [0, 0, 0, 0, 1], [0, 0, 0, 0, 1], [0, 0, 0, 0, 1], [0, 0, 0, 255, -120]);
var splotchEdge = composite(colorMatrix(noise1, [0, 0, 0, 1.5, 0], [0, 0, 0, 1.5, 0], [0, 0, 0, 1.5, 0], [0, 0, 0, 0, 1]), splotchMask, "in");
var fadedImage = displace(colorMatrix(blur(SourceGraphic, 0.5), [1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0.3, 0]), rawNoise1, 10, "R", "G");
var inkSmudge = displace(colorMatrix(inkSmudgeBlur, [1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 2, 0]), rawNoise1, 10, "R", "G");
var messedUpInk = composite(composite(inkSmudge, fadedImage, "over"), splotchMask, "in");
var completeFilter = multiComposite([messedUpInk, splotchEdge, SourceGraphic], "over");
console.log(completeFilter);
var outFilter = makeCSSFilter(completeFilter);
document.getElementById("text1").style.filter = outFilter;
