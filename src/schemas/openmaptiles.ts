import type { ShieldSchema } from "../shield_schema";
import { registerBuiltinSchema } from "../shield_schema";

/**
 * Built-in schema for OpenMapTiles-style `transportation_name` routes.
 *
 * Expects `route_#_network`, `route_#_ref`, `route_#_name`, and
 * `route_#_color` on each feature (see the README Schema section). Prefer
 * referring to it by id (`"openmaptiles"`) or omitting `schema` so helpers
 * default to it. Override `source` when the style's OpenMapTiles source has
 * another id.
 *
 * @example
 * ```ts
 * addShieldLayer(map, {
 *   sprites: "shields.json",
 * });
 * ```
 */
export const OPENMAPTILES: ShieldSchema = Object.freeze({
  id: "openmaptiles",
  source: "openmaptiles",
  sourceLayer: "transportation_name",
  layerId: "highway-shield",
  routeAttributes: Object.freeze(["network", "ref", "name", "color"]),
  maxConcurrency: 8,
  propertyName: (routeIndex: number, attribute: string) =>
    `route_${routeIndex}_${attribute}`,
  roadClassProperty: "class",
  roadClassOrder: Object.freeze([
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
  ]),
  revealZooms: Object.freeze([8, 10, 11, 12, 14]),
});

registerBuiltinSchema(OPENMAPTILES);
