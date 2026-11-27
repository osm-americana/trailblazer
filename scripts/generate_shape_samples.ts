/**
 * Render SVG samples of built-in shield shapes and shapeBlank params for the README.
 *
 * Usage: npm run docs:shape-samples
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createCanvas } from "canvas";

import {
  ShieldRenderer,
  InMemorySpriteRepository,
  circleShield,
  ovalShield,
  roundedRectShield,
  pillShield,
  diamondShield,
  triangleDownShield,
  trapezoidDownShield,
  trapezoidUpShield,
  escutcheonDownShield,
  fishheadDownShield,
  pentagonUpShield,
  hexagonHorizontalShield,
  octagonVerticalShield,
  paBeltShield,
  bransonRouteShield,
  banneredShield,
  textConstraint,
  roundedRectTextConstraint,
  type ShieldDefinition,
  type ShieldSpecification,
  type ShapeBlankParams,
} from "../src/index.js";
import { HeadlessGraphicsFactory } from "../src/headless_graphics.js";

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "media",
  "shapes"
);

const fill = "#ffffff";
const stroke = "#000000";
const text = "#000000";

const options: ShieldSpecification["options"] = {
  // Taller than typical map options (9) so banner labels stay readable at
  // README sample size; production maps usually keep this smaller.
  bannerHeight: 14,
  bannerPadding: 1,
  bannerTextColor: "#000000",
  bannerTextHaloColor: "#ffffff",
  shieldFont: "sans-serif",
  // Keep below maxGenericShieldWidth (34) so variable-width samples can grow
  // past the minimum without being clamped to shieldSize.
  shieldSize: 20,
};

type Sample = {
  file: string;
  network: string;
  ref: string;
  def: Partial<ShieldDefinition>;
  /** SVG for drawn shapes; PNG when colorLighten/Darken needs putImageData. */
  format?: "svg" | "png";
};

/** Vibrant contrast color for banner samples (Pantone 187). */
const bannerRed = "#bf2033";
/** Historic US / Route 66 brown (Pantone 469). */
const historicBrown = "#693f23";
/** Shield blue (Pantone 294) for colorDarken demos. */
const demoBlue = "#003f87";
/** Neutral cream behind samples so README tables stay readable. */
const sampleCream = "hsl(30, 44%, 96%)";

function deg(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Synthetic black/white US-style badge blank for colorLighten demos.
 * Stored as a MapLibre-like StyleImage `{ data: ImageData }`.
 */
function makeUsBadgeBlank(size = 48): { data: ImageData } {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const tipY = size * 0.55;
  const outer = size * 0.06;
  const inner = size * 0.18;

  ctx.beginPath();
  ctx.moveTo(outer, outer);
  ctx.lineTo(size - outer, outer);
  ctx.lineTo(size - outer, tipY);
  ctx.lineTo(size / 2, size - outer);
  ctx.lineTo(outer, tipY);
  ctx.closePath();
  ctx.fillStyle = "#000000";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(inner, inner);
  ctx.lineTo(size - inner, inner);
  ctx.lineTo(size - inner, tipY);
  ctx.lineTo(size / 2, size - inner);
  ctx.lineTo(inner, tipY);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  return { data: ctx.getImageData(0, 0, size, size) };
}

/** Pixels of cream around each sample so shields aren't flush to the edge. */
const creamPad = 5;

/** Composite the rendered shield onto a cream background (readable in GitHub tables). */
function withCreamBackground(
  canvas: {
    width: number;
    height: number;
    toBuffer: () => Buffer;
  },
  format: "svg" | "png"
): Buffer {
  const { width, height } = canvas;
  const outW = width + creamPad * 2;
  const outH = height + creamPad * 2;

  if (format === "png") {
    const out = createCanvas(outW, outH);
    const ctx = out.getContext("2d");
    ctx.fillStyle = sampleCream;
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(canvas as never, creamPad, creamPad);
    return out.toBuffer();
  }

  const svg = canvas.toBuffer().toString("utf8");
  const creamRect = `<rect x="0" y="0" width="${outW}" height="${outH}" style="fill:hsl(30,44%,96%);stroke:none;"/>`;
  // Expand the SVG canvas and shift drawn content so cream shows as a margin.
  const expanded = svg
    .replace(/width="[^"]+"/, `width="${outW}pt"`)
    .replace(/height="[^"]+"/, `height="${outH}pt"`)
    .replace(/viewBox="[^"]+"/, `viewBox="0 0 ${outW} ${outH}"`)
    .replace(
      /(<g\b[^>]*>)/,
      `$1\n${creamRect}\n<g transform="translate(${creamPad},${creamPad})">`
    )
    .replace(/<\/g>\s*<\/svg>\s*$/, "</g>\n</g>\n</svg>\n");
  return Buffer.from(expanded, "utf8");
}

function shape(
  drawFunc: string,
  params: ShapeBlankParams,
  extras: Partial<ShieldDefinition> = {}
): Partial<ShieldDefinition> {
  const { textLayout, padding, textColor, ...rest } = extras;
  return {
    shapeBlank: { drawFunc, params },
    textLayout: textLayout ?? textConstraint("rect"),
    padding: padding ?? {
      left: 3,
      right: 3,
      top: 3,
      bottom: 3,
    },
    textColor: textColor ?? text,
    ...rest,
  } as Partial<ShieldDefinition>;
}

const catalog: Sample[] = [
  {
    file: "circle.svg",
    network: "cat:circle",
    ref: "12",
    def: circleShield(fill, stroke, text),
  },
  {
    file: "oval.svg",
    network: "cat:oval",
    ref: "123",
    def: ovalShield(fill, stroke, text, undefined!),
  },
  {
    file: "rounded-rectangle.svg",
    network: "cat:rr",
    ref: "66",
    def: roundedRectShield(fill, stroke, text, undefined!, 3),
  },
  {
    file: "pill.svg",
    network: "cat:pill",
    ref: "123",
    def: pillShield(fill, stroke, text, undefined!),
  },
  {
    file: "diamond.svg",
    network: "cat:diamond",
    ref: "7",
    def: diamondShield(fill, stroke, text, 2, undefined!),
  },
  {
    file: "triangle-down.svg",
    network: "cat:triDown",
    ref: "3",
    def: triangleDownShield(fill, stroke, text, 3, undefined!),
  },
  {
    file: "trapezoid-down.svg",
    network: "cat:trapDown",
    ref: "45",
    def: trapezoidDownShield(15, fill, stroke, text, 0, undefined!),
  },
  {
    file: "trapezoid-up.svg",
    network: "cat:trapUp",
    ref: "45",
    def: trapezoidUpShield(15, fill, stroke, text, 0, undefined!),
  },
  {
    file: "escutcheon-down.svg",
    network: "cat:esc",
    ref: "8",
    def: escutcheonDownShield(8, fill, stroke, text, 0, undefined!),
  },
  {
    file: "fishhead-down.svg",
    network: "cat:fish",
    ref: "15",
    def: fishheadDownShield(fill, stroke, text, undefined!),
  },
  {
    // Slight sideAngle so the plain pentagon reads apart from home-plate helpers.
    file: "pentagon-up.svg",
    network: "cat:pent",
    ref: "95",
    def: pentagonUpShield(8, 15, fill, stroke, text, 2, 0, undefined!),
  },
  {
    // Milder tip + tight padding so the ref stays large in the catalog table.
    file: "home-plate-down.svg",
    network: "cat:homeDown",
    ref: "2",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        yOffset: 5,
        sideAngle: 0,
        radius1: 2,
        radius2: 2,
      },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 2, right: 2, top: 2, bottom: 3 },
      }
    ),
  },
  {
    file: "home-plate-up.svg",
    network: "cat:homeUp",
    ref: "2",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: true,
        yOffset: 5,
        sideAngle: 0,
        radius1: 2,
        radius2: 2,
      },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 2, right: 2, top: 3, bottom: 2 },
      }
    ),
  },
  {
    file: "hexagon-vertical.svg",
    network: "cat:hexV",
    ref: "11",
    // Helper pads top/bottom with 1+yOffset and crushes the ref; keep padding tight.
    def: shape(
      "hexagonVertical",
      { fillColor: fill, strokeColor: stroke, yOffset: 4, radius: 2 },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 2, right: 2, top: 2, bottom: 2 },
      }
    ),
  },
  {
    file: "hexagon-horizontal.svg",
    network: "cat:hexH",
    ref: "11",
    def: hexagonHorizontalShield(30, fill, stroke, text, 2, undefined!),
  },
  {
    file: "octagon-vertical.svg",
    network: "cat:oct",
    ref: "4",
    def: octagonVerticalShield(6, 20, fill, stroke, text, 2, undefined!),
  },
  {
    file: "pa-belt.svg",
    network: "cat:paBelt",
    ref: "",
    def: paBeltShield("#c00", stroke),
  },
  {
    file: "branson.svg",
    network: "cat:branson",
    ref: "",
    def: bransonRouteShield("#0a0", stroke),
  },
  {
    file: "bannered-pill.svg",
    network: "cat:bannered",
    ref: "40",
    def: banneredShield(
      pillShield(fill, stroke, text, undefined!) as ShieldDefinition,
      ["ALT"],
      stroke
    ),
  },
];

/** Param galleries: several variants that differ by one option. */
const paramSamples: Sample[] = [
  // Colors
  {
    file: "param-colors-default.svg",
    network: "p:colors0",
    ref: "12",
    def: shape("roundedRectangle", {
      fillColor: "#ffffff",
      strokeColor: "#000000",
      radius: 3,
    }),
  },
  {
    file: "param-colors-filled.svg",
    network: "p:colors1",
    ref: "12",
    def: shape(
      "roundedRectangle",
      { fillColor: "#003f87", strokeColor: "#ffd200", radius: 3 },
      { textColor: "#ffffff" }
    ),
  },

  // outlineWidth
  {
    file: "param-outline-1.svg",
    network: "p:outline1",
    ref: "8",
    def: shape("roundedRectangle", {
      fillColor: fill,
      strokeColor: stroke,
      radius: 3,
      outlineWidth: 1,
    }),
  },
  {
    file: "param-outline-4.svg",
    network: "p:outline4",
    ref: "8",
    def: shape("roundedRectangle", {
      fillColor: fill,
      strokeColor: stroke,
      radius: 3,
      outlineWidth: 4,
    }),
  },

  // rectWidth: variable (short vs long ref) vs fixed
  {
    file: "param-rectwidth-var-short.svg",
    network: "p:rwVarS",
    ref: "5",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 3 },
      { textLayout: roundedRectTextConstraint(3) }
    ),
  },
  {
    file: "param-rectwidth-var-long.svg",
    network: "p:rwVarL",
    ref: "1234",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 3 },
      { textLayout: roundedRectTextConstraint(3) }
    ),
  },
  {
    file: "param-rectwidth-fixed-narrow.svg",
    network: "p:rwFixN",
    ref: "88",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 3, rectWidth: 16 },
      { textLayout: roundedRectTextConstraint(3) }
    ),
  },
  {
    file: "param-rectwidth-fixed-wide.svg",
    network: "p:rwFixW",
    ref: "88",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 3, rectWidth: 34 },
      { textLayout: roundedRectTextConstraint(3) }
    ),
  },

  // radius
  {
    file: "param-radius-0.svg",
    network: "p:rad0",
    ref: "22",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 0 },
      { textLayout: roundedRectTextConstraint(0) }
    ),
  },
  {
    file: "param-radius-6.svg",
    network: "p:rad6",
    ref: "22",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 6 },
      { textLayout: roundedRectTextConstraint(6) }
    ),
  },

  // radius1 / radius2 on home-plate (pentagon). Mild tip + tight padding
  // so the ref stays readable while the corner radii stay obvious.
  {
    file: "param-radius1-sharp.svg",
    network: "p:r1sharp",
    ref: "9",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        yOffset: 5,
        sideAngle: 0,
        radius1: 0,
        radius2: 4,
      },
      {
        textLayout: roundedRectTextConstraint(4),
        padding: { left: 2, right: 2, top: 2, bottom: 3 },
      }
    ),
  },
  {
    file: "param-radius1-round.svg",
    network: "p:r1round",
    ref: "9",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        yOffset: 5,
        sideAngle: 0,
        radius1: 8,
        radius2: 4,
      },
      {
        textLayout: roundedRectTextConstraint(4),
        padding: { left: 2, right: 2, top: 2, bottom: 3 },
      }
    ),
  },
  {
    file: "param-radius2-sharp.svg",
    network: "p:r2sharp",
    ref: "9",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        yOffset: 5,
        sideAngle: 0,
        radius1: 2,
        radius2: 0,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 2, right: 2, top: 2, bottom: 3 },
      }
    ),
  },
  {
    file: "param-radius2-round.svg",
    network: "p:r2round",
    ref: "9",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        yOffset: 5,
        sideAngle: 0,
        radius1: 2,
        radius2: 8,
      },
      {
        textLayout: roundedRectTextConstraint(8),
        padding: { left: 2, right: 2, top: 2, bottom: 3 },
      }
    ),
  },

  // yOffset: escutcheon
  {
    file: "param-yoffset-escutcheon-2.svg",
    network: "p:yEsc2",
    ref: "1",
    def: escutcheonDownShield(2, fill, stroke, text, 0, undefined!),
  },
  {
    file: "param-yoffset-escutcheon-14.svg",
    network: "p:yEsc14",
    ref: "1",
    def: escutcheonDownShield(14, fill, stroke, text, 0, undefined!),
  },

  // yOffset: vertical hexagon (minimal padding so the ref stays readable;
  // helpers scale top/bottom with yOffset and crush the text).
  {
    file: "param-yoffset-hexv-2.svg",
    network: "p:yHex2",
    ref: "6",
    def: shape(
      "hexagonVertical",
      { fillColor: fill, strokeColor: stroke, yOffset: 2, radius: 2 },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 2, right: 2, top: 2, bottom: 2 },
      }
    ),
  },
  {
    file: "param-yoffset-hexv-4.svg",
    network: "p:yHex4",
    ref: "6",
    def: shape(
      "hexagonVertical",
      { fillColor: fill, strokeColor: stroke, yOffset: 4, radius: 2 },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 2, right: 2, top: 2, bottom: 2 },
      }
    ),
  },

  // yOffset: pentagon tip (same: keep padding tight so the ref shows)
  {
    file: "param-yoffset-pentagon-4.svg",
    network: "p:yPent4",
    ref: "80",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 4,
        sideAngle: 0,
        radius1: 2,
        radius2: 0,
        pointUp: true,
      },
      {
        textLayout: textConstraint("rect"),
        padding: { left: 2, right: 2, top: 2, bottom: 2 },
      }
    ),
  },
  {
    file: "param-yoffset-pentagon-8.svg",
    network: "p:yPent8",
    ref: "80",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 8,
        sideAngle: 0,
        radius1: 2,
        radius2: 0,
        pointUp: true,
      },
      {
        textLayout: textConstraint("rect"),
        padding: { left: 2, right: 2, top: 3, bottom: 2 },
      }
    ),
  },

  // sideAngle: trapezoid
  {
    file: "param-sideangle-trap-5.svg",
    network: "p:saTrap5",
    ref: "30",
    def: trapezoidDownShield(5, fill, stroke, text, 0, undefined!),
  },
  {
    file: "param-sideangle-trap-15.svg",
    network: "p:saTrap15",
    ref: "30",
    def: trapezoidDownShield(15, fill, stroke, text, 0, undefined!),
  },

  // sideAngle: horizontal hexagon
  {
    file: "param-sideangle-hexh-15.svg",
    network: "p:saHex15",
    ref: "10",
    def: hexagonHorizontalShield(15, fill, stroke, text, 2, undefined!),
  },
  {
    file: "param-sideangle-hexh-40.svg",
    network: "p:saHex40",
    ref: "10",
    def: hexagonHorizontalShield(40, fill, stroke, text, 2, undefined!),
  },

  // sideAngle: pentagon with slanted sides
  {
    file: "param-sideangle-pentagon-0.svg",
    network: "p:saPent0",
    ref: "70",
    def: pentagonUpShield(8, 0, fill, stroke, text, 2, 0, undefined!),
  },
  {
    file: "param-sideangle-pentagon-20.svg",
    network: "p:saPent20",
    ref: "70",
    def: pentagonUpShield(8, 20, fill, stroke, text, 2, 0, undefined!),
  },

  // pointUp: triangle
  {
    file: "param-pointup-triangle-false.svg",
    network: "p:ptTriF",
    ref: "4",
    def: triangleDownShield(fill, stroke, text, 3, undefined!),
  },
  {
    file: "param-pointup-triangle-true.svg",
    network: "p:ptTriT",
    ref: "4",
    def: shape(
      "triangle",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: true,
        radius: 3,
      },
      {
        // No point-up helper; pad the tip so the ref sits in the wider base.
        textLayout: textConstraint("rect"),
        padding: { left: 0, right: 0, top: 5, bottom: 1 },
      }
    ),
  },

  // pointUp: fishhead
  {
    file: "param-pointup-fishhead-false.svg",
    network: "p:ptFishF",
    ref: "16",
    def: fishheadDownShield(fill, stroke, text, undefined!),
  },
  {
    file: "param-pointup-fishhead-true.svg",
    network: "p:ptFishT",
    ref: "16",
    def: shape(
      "fishhead",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: true,
        outlineWidth: 1,
      },
      {
        textLayout: textConstraint("ellipse"),
        // Mirror fishheadDownShield padding about the tip.
        padding: { left: 1, right: 1, top: 5, bottom: 1 },
      }
    ),
  },

  // shortSideUp: trapezoid
  {
    file: "param-shortsideup-false.svg",
    network: "p:ssuF",
    ref: "50",
    def: trapezoidDownShield(18, fill, stroke, text, 0, undefined!),
  },
  {
    file: "param-shortsideup-true.svg",
    network: "p:ssuT",
    ref: "50",
    def: trapezoidUpShield(18, fill, stroke, text, 0, undefined!),
  },

  // banners (multi): keep labels ≤3 chars so they stay readable at sample size
  {
    file: "param-banners-one.svg",
    network: "p:ban1",
    ref: "40",
    def: banneredShield(
      pillShield(fill, stroke, text, undefined!) as ShieldDefinition,
      ["ALT"],
      stroke
    ),
  },
  {
    file: "param-banners-two.svg",
    network: "p:ban2",
    ref: "40",
    def: banneredShield(
      pillShield(fill, stroke, text, undefined!) as ShieldDefinition,
      ["ALT", "TRK"],
      stroke
    ),
  },
  {
    file: "param-banners-color-black.svg",
    network: "p:banBlk",
    ref: "40",
    def: banneredShield(
      pillShield(fill, stroke, text, undefined!) as ShieldDefinition,
      ["ALT"],
      "#000000"
    ),
  },
  {
    file: "param-banners-color-red.svg",
    network: "p:banRed",
    ref: "40",
    def: banneredShield(
      pillShield(fill, stroke, text, undefined!) as ShieldDefinition,
      ["ALT"],
      bannerRed
    ),
  },

  // colorLighten: sprite blanks only (PNG; SVG canvas cannot putImageData).
  // Badge is 48px so the tint is obvious in the README.
  {
    file: "param-colorlighten-plain.png",
    network: "p:clPlain",
    ref: "66",
    format: "png",
    def: {
      spriteBlank: "demo_badge",
      textColor: "#000000",
      padding: { left: 8, right: 8, top: 10, bottom: 12 },
    },
  },
  {
    file: "param-colorlighten-brown.png",
    network: "p:clBrown",
    ref: "66",
    format: "png",
    def: {
      spriteBlank: "demo_badge",
      textColor: historicBrown,
      colorLighten: historicBrown,
      padding: { left: 8, right: 8, top: 10, bottom: 12 },
    },
  },
  {
    file: "param-colordarken-blue.png",
    network: "p:cdBlue",
    ref: "66",
    format: "png",
    def: {
      spriteBlank: "demo_badge",
      textColor: "#ffffff",
      colorDarken: demoBlue,
      padding: { left: 8, right: 8, top: 10, bottom: 12 },
    },
  },
];

const samples = [...catalog, ...paramSamples];

const routeParser = {
  parse: (id: string) => {
    const [, network, ref, name] = id.split("\n");
    return { network, ref: ref ?? "", name: name ?? "" };
  },
  format: (network: string, ref: string, name: string) =>
    `shield\n${network}\n${ref}\n${name}\n`,
};

async function renderGroup(
  group: Sample[],
  format: "svg" | "png"
): Promise<void> {
  if (!group.length) {
    return;
  }

  const networks: Record<string, Partial<ShieldDefinition>> = {};
  for (const sample of group) {
    networks[sample.network] = sample.def;
  }

  // Runtime networks map is flat (network → definition); the published type
  // still nests under `shield`, so cast through unknown like the headless tests.
  const spec = {
    options,
    networks,
  } as unknown as ShieldSpecification;

  const repo = new InMemorySpriteRepository();
  if (format === "png") {
    // StyleImage shape expected by transposeImageData: { data: ImageData }
    repo.sprites["demo_badge"] = makeUsBadgeBlank() as never;
  }

  const renderer = new ShieldRenderer(spec, routeParser)
    .graphicsFactory(
      format === "svg"
        ? new HeadlessGraphicsFactory("svg")
        : new HeadlessGraphicsFactory()
    )
    .renderOnRepository(repo);

  for (const sample of group) {
    const ctx = renderer.getGraphicForRoute(sample.network, sample.ref, "");
    if (!ctx) {
      throw new Error(`No graphic for ${sample.file} (${sample.network})`);
    }
    const canvas = ctx.canvas as unknown as {
      width: number;
      height: number;
      toBuffer: () => Buffer;
    };
    const path = join(outDir, sample.file);
    await writeFile(path, withCreamBackground(canvas, format));
    console.log("wrote", path, `${canvas.width}x${canvas.height}`);
  }
}

async function main(): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const svgSamples = samples.filter((s) => (s.format ?? "svg") === "svg");
  const pngSamples = samples.filter((s) => s.format === "png");

  await renderGroup(svgSamples, "svg");
  await renderGroup(pngSamples, "png");

  console.log(`\n${samples.length} samples in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
