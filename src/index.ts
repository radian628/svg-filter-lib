import {
  blur,
  colorMatrix,
  composite,
  displace,
  FF,
  fractalNoise,
  makeCSSFilter,
  multiComposite,
  SourceGraphic,
} from "./lib";

const displacementNoise = fractalNoise(0.2, 0.2, 4, 2);

const rawNoise1 = fractalNoise(0.01, 0.01, 4, 1);

const noise1 = displace(rawNoise1, displacementNoise, 4, "R", "G");

const inkSmudgeBlur: FF = blur(SourceGraphic, 1.5);

const splotchMask = colorMatrix(
  noise1,
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 255, -120]
);

const splotchEdge = composite(
  colorMatrix(
    noise1,
    [0, 0, 0, 1.5, 0],
    [0, 0, 0, 1.5, 0],
    [0, 0, 0, 1.5, 0],
    [0, 0, 0, 0, 1]
  ),
  splotchMask,
  "in"
);

const fadedImage = displace(
  colorMatrix(
    blur(SourceGraphic, 0.5),
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0.3, 0]
  ),
  rawNoise1,
  10,
  "R",
  "G"
);

const inkSmudge = displace(
  colorMatrix(
    inkSmudgeBlur,
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 2, 0]
  ),
  rawNoise1,
  10,
  "R",
  "G"
);

const messedUpInk = composite(
  composite(inkSmudge, fadedImage, "over"),
  splotchMask,
  "in"
);

const completeFilter = multiComposite(
  [messedUpInk, splotchEdge, SourceGraphic],
  "over"
);

console.log(completeFilter);

const outFilter = makeCSSFilter(completeFilter);

document.getElementById("text1")!.style.filter = outFilter;
