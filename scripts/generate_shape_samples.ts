/**
 * Render SVG samples of built-in shield shapes and shapeBlank params for the README.
 *
 * Usage: npm run docs:shape-samples
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  homePlateDownShield,
  homePlateUpShield,
  hexagonVerticalShield,
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
  bannerHeight: 9,
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
};

function deg(degrees: number): number {
  return (degrees * Math.PI) / 180;
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
    ref: "9",
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
    file: "pentagon-up.svg",
    network: "cat:pent",
    ref: "95",
    def: pentagonUpShield(8, 0, fill, stroke, text, 2, 0, undefined!),
  },
  {
    file: "home-plate-down.svg",
    network: "cat:homeDown",
    ref: "2",
    def: homePlateDownShield(8, fill, stroke, text, 2, 2, undefined!),
  },
  {
    file: "home-plate-up.svg",
    network: "cat:homeUp",
    ref: "2",
    def: homePlateUpShield(8, fill, stroke, text, 2, 2, undefined!),
  },
  {
    file: "hexagon-vertical.svg",
    network: "cat:hexV",
    ref: "11",
    def: hexagonVerticalShield(6, fill, stroke, text, 2, undefined!),
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
    file: "param-radius-8.svg",
    network: "p:rad8",
    ref: "22",
    def: shape(
      "roundedRectangle",
      { fillColor: fill, strokeColor: stroke, radius: 8 },
      { textLayout: roundedRectTextConstraint(8) }
    ),
  },

  // radius1 / radius2 on home-plate (pentagon)
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
        yOffset: 10,
        sideAngle: 0,
        radius1: 0,
        radius2: 4,
      },
      {
        textLayout: roundedRectTextConstraint(4),
        padding: { left: 3, right: 3, top: 3, bottom: 10 },
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
        yOffset: 10,
        sideAngle: 0,
        radius1: 8,
        radius2: 4,
      },
      {
        textLayout: roundedRectTextConstraint(4),
        padding: { left: 3, right: 3, top: 3, bottom: 10 },
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
        yOffset: 10,
        sideAngle: 0,
        radius1: 4,
        radius2: 0,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 3, right: 3, top: 3, bottom: 10 },
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
        yOffset: 10,
        sideAngle: 0,
        radius1: 4,
        radius2: 8,
      },
      {
        textLayout: roundedRectTextConstraint(8),
        padding: { left: 3, right: 3, top: 3, bottom: 10 },
      }
    ),
  },

  // yOffset — escutcheon
  {
    file: "param-yoffset-escutcheon-2.svg",
    network: "p:yEsc2",
    ref: "1",
    def: shape(
      "escutcheon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 2,
        radius: 0,
        outlineWidth: 1,
      },
      { padding: { left: 3, right: 3, top: 3, bottom: 4 } }
    ),
  },
  {
    file: "param-yoffset-escutcheon-14.svg",
    network: "p:yEsc14",
    ref: "1",
    def: shape(
      "escutcheon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 14,
        radius: 0,
        outlineWidth: 1,
      },
      { padding: { left: 3, right: 3, top: 3, bottom: 10 } }
    ),
  },

  // yOffset — vertical hexagon
  {
    file: "param-yoffset-hexv-2.svg",
    network: "p:yHex2",
    ref: "6",
    def: shape(
      "hexagonVertical",
      { fillColor: fill, strokeColor: stroke, yOffset: 2, radius: 2 },
      {
        textLayout: roundedRectTextConstraint(2),
        padding: { left: 3, right: 3, top: 4, bottom: 4 },
      }
    ),
  },
  {
    file: "param-yoffset-hexv-6.svg",
    network: "p:yHex6",
    ref: "6",
    def: shape(
      "hexagonVertical",
      { fillColor: fill, strokeColor: stroke, yOffset: 6, radius: 2 },
      {
        textLayout: roundedRectTextConstraint(2),
        // Leave room for the pointed ends; 2*yOffset must stay under shieldSize.
        padding: { left: 3, right: 3, top: 7, bottom: 7 },
      }
    ),
  },

  // yOffset — pentagon tip
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
      { padding: { left: 3, right: 3, top: 6, bottom: 3 } }
    ),
  },
  {
    file: "param-yoffset-pentagon-14.svg",
    network: "p:yPent14",
    ref: "80",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 14,
        sideAngle: 0,
        radius1: 2,
        radius2: 0,
        pointUp: true,
      },
      { padding: { left: 3, right: 3, top: 12, bottom: 3 } }
    ),
  },

  // sideAngle — trapezoid (radians in params)
  {
    file: "param-sideangle-trap-5.svg",
    network: "p:saTrap5",
    ref: "30",
    def: shape(
      "trapezoid",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(5),
        radius: 0,
        shortSideUp: false,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 6, right: 6, top: 3, bottom: 4 },
      }
    ),
  },
  {
    file: "param-sideangle-trap-15.svg",
    network: "p:saTrap15",
    ref: "30",
    def: shape(
      "trapezoid",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(15),
        radius: 0,
        shortSideUp: false,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 8, right: 8, top: 3, bottom: 4 },
      }
    ),
  },

  // sideAngle — horizontal hexagon
  {
    file: "param-sideangle-hexh-15.svg",
    network: "p:saHex15",
    ref: "10",
    def: shape(
      "hexagonHorizontal",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(15),
        radius: 2,
      },
      {
        textLayout: textConstraint("ellipse"),
        padding: { left: 8, right: 8, top: 3, bottom: 3 },
      }
    ),
  },
  {
    file: "param-sideangle-hexh-40.svg",
    network: "p:saHex40",
    ref: "10",
    def: shape(
      "hexagonHorizontal",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(40),
        radius: 2,
      },
      {
        textLayout: textConstraint("ellipse"),
        padding: { left: 14, right: 14, top: 3, bottom: 3 },
      }
    ),
  },

  // sideAngle — pentagon with slanted sides
  {
    file: "param-sideangle-pentagon-0.svg",
    network: "p:saPent0",
    ref: "70",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 8,
        sideAngle: deg(0),
        radius1: 2,
        radius2: 0,
        pointUp: true,
      },
      { padding: { left: 3, right: 3, top: 8, bottom: 3 } }
    ),
  },
  {
    file: "param-sideangle-pentagon-20.svg",
    network: "p:saPent20",
    ref: "70",
    def: shape(
      "pentagon",
      {
        fillColor: fill,
        strokeColor: stroke,
        yOffset: 8,
        sideAngle: deg(20),
        radius1: 2,
        radius2: 0,
        pointUp: true,
      },
      { padding: { left: 10, right: 10, top: 8, bottom: 3 } }
    ),
  },

  // pointUp — triangle
  {
    file: "param-pointup-triangle-false.svg",
    network: "p:ptTriF",
    ref: "4",
    def: shape(
      "triangle",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        radius: 3,
      },
      {
        textLayout: textConstraint("triangleDown"),
        padding: { left: 2, right: 2, top: 6, bottom: 2 },
      }
    ),
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
        // triangleDown constraint grows from the top tip; for point-up use a
        // rect constraint and pad the pointed end so the ref sits in the base.
        textLayout: textConstraint("rect"),
        padding: { left: 2, right: 2, top: 10, bottom: 2 },
      }
    ),
  },

  // pointUp — fishhead
  {
    file: "param-pointup-fishhead-false.svg",
    network: "p:ptFishF",
    ref: "16",
    def: shape(
      "fishhead",
      {
        fillColor: fill,
        strokeColor: stroke,
        pointUp: false,
        outlineWidth: 1,
      },
      {
        textLayout: textConstraint("ellipse"),
        padding: { left: 2, right: 2, top: 2, bottom: 8 },
      }
    ),
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
        padding: { left: 2, right: 2, top: 8, bottom: 2 },
      }
    ),
  },

  // shortSideUp — trapezoid
  {
    file: "param-shortsideup-false.svg",
    network: "p:ssuF",
    ref: "50",
    def: shape(
      "trapezoid",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(18),
        radius: 0,
        shortSideUp: false,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 10, right: 10, top: 3, bottom: 4 },
      }
    ),
  },
  {
    file: "param-shortsideup-true.svg",
    network: "p:ssuT",
    ref: "50",
    def: shape(
      "trapezoid",
      {
        fillColor: fill,
        strokeColor: stroke,
        sideAngle: deg(18),
        radius: 0,
        shortSideUp: true,
      },
      {
        textLayout: roundedRectTextConstraint(0),
        padding: { left: 10, right: 10, top: 4, bottom: 3 },
      }
    ),
  },

  // banners (multi) — keep labels ≤3 chars so they stay readable at sample size
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

async function main(): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const networks: Record<string, Partial<ShieldDefinition>> = {};
  for (const sample of samples) {
    networks[sample.network] = sample.def;
  }

  // Runtime networks map is flat (network → definition); the published type
  // still nests under `shield`, so cast through unknown like the headless tests.
  const spec = {
    options,
    networks,
  } as unknown as ShieldSpecification;

  const repo = new InMemorySpriteRepository();
  const renderer = new ShieldRenderer(spec, routeParser)
    .graphicsFactory(new HeadlessGraphicsFactory("svg"))
    .renderOnRepository(repo);

  for (const sample of samples) {
    const ctx = renderer.getGraphicForRoute(sample.network, sample.ref, "");
    if (!ctx) {
      throw new Error(`No graphic for ${sample.file} (${sample.network})`);
    }
    const canvas = ctx.canvas as unknown as { toBuffer: () => Buffer };
    const path = join(outDir, sample.file);
    await writeFile(path, canvas.toBuffer());
    console.log("wrote", path, `${ctx.canvas.width}x${ctx.canvas.height}`);
  }

  console.log(`\n${samples.length} samples in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
