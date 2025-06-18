export type FilterFormat = Record<
  string,
  string | number | [FilterFormat] | [FilterFormat, FilterFormat]
> & {
  in?: [FilterFormat] | [FilterFormat, FilterFormat];
};

export type FF = FilterFormat;

export type FFParam = string | number;

function addFilterIds(
  filterFormat: FilterFormat,
  id: number,
  filters: Map<number, FilterFormat>
) {
  filters.set(id, filterFormat);
  filterFormat.id = id;

  id++;

  for (const child of filterFormat?.in ?? []) {
    id = addFilterIds(child, id, filters);
  }

  return id;
}

function makeFilter(filterFormat: FilterFormat) {
  const map = new Map<number, FilterFormat>();

  addFilterIds(filterFormat, 1, map);

  let outstr = "";

  for (const v of [...map.values()].reverse().filter((v) => v.node)) {
    outstr += `<${v.node} result="${v.id}" ${Object.entries(v)
      .flatMap(([k, v]) => {
        if (k === "type" || k === "id") return [];
        if (k === "in") {
          let out: string[] = [];
          if (v[0]) {
            out.push(`in="${v[0]._overrideId ?? v[0].id}"`);
          }
          if (v[1]) {
            out.push(`in2="${v[1]._overrideId ?? v[1].id}"`);
          }
          return out;
        }
        return [`${k}="${v}"`];
      })
      .join(" ")}/>`;
  }

  return outstr;
}

export function makeCSSFilter(filterFormat) {
  const filter = makeFilter(filterFormat);

  return (
    'url("data:image/svg+xml;utf8,' +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" id="filter1">
  <filter id="f">${filter}</filter></svg>`) +
    '#f")'
  );
}

export function composite(
  a: FilterFormat,
  b: FilterFormat,
  operator: "over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic"
): FilterFormat {
  return {
    node: "feComposite",
    in: [a, b],
    operator,
  };
}

export function multiComposite(
  ffs: [FilterFormat, ...FilterFormat[]],
  operator: Parameters<typeof composite>[2]
): FF {
  if (ffs.length === 1) return ffs[0];

  return composite(
    ffs[0],
    multiComposite(ffs.slice(1) as [FilterFormat, ...FilterFormat[]], operator),
    operator
  );
}

export function fractalNoise(
  freqX: FFParam,
  freqY: FFParam,
  octaves: FFParam,
  seed: FFParam
): FF {
  return {
    node: "feTurbulence",
    baseFrequency: `${freqX} ${freqY}`,
    type: "fractalNoise",
    numOctaves: octaves,
    seed,
  };
}

export function blend(
  a: FilterFormat,
  b: FilterFormat,
  mode:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity"
): FF {
  return {
    node: "feBlend",
    in: [a, b],
    mode,
  };
}

export type MatrixRow = [FFParam, FFParam, FFParam, FFParam, FFParam];

export function colorMatrix(
  a: FF,
  r1: MatrixRow,
  r2: MatrixRow,
  r3: MatrixRow,
  r4: MatrixRow
): FF {
  return {
    node: "feColorMatrix",
    type: "matrix",
    values: `${r1.join(" ")}\n${r2.join(" ")}\n${r3.join(" ")}\n${r4.join(
      " "
    )}`,
    in: [a],
  };
}

export function displace(
  image: FF,
  displacement: FF,
  scale: FFParam,
  xChannel: "R" | "G" | "B" | "A",
  yChannel: "R" | "G" | "B" | "A"
): FF {
  return {
    node: "feDisplacementMap",
    in: [image, displacement],
    scale,
    xChannelSelector: xChannel,
    yChannelSelector: yChannel,
  };
}

export function blur(a: FF, stdDeviation: FFParam): FF {
  return {
    node: "feGaussianBlur",
    stdDeviation,
    in: [a],
  };
}

export const SourceGraphic: FF = { _overrideId: "SourceGraphic" };
