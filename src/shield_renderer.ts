import type {
  Map as MapLibre,
  MissingStyleImageResolver,
  StyleImage,
  StyleImageMetadata,
} from "maplibre-gl";
import type {
  Bounds,
  DebugOptions,
  GraphicsFactory,
  RouteDefinition,
  RouteParser,
  ShapeBlankParams,
  ShieldDefinition,
  ShieldDefinitions,
  ShieldOptions,
  ShieldSpecification,
  SpriteRepository,
  StringPredicate,
} from "./types";
import {
  storeNoShield,
  missingIconLoader,
  generateShieldCtx,
} from "./shield.js";
import { DOMGraphicsFactory } from "./document_graphics";

export class ShieldRenderingContext {
  shieldDef: ShieldDefinitions;
  options: ShieldOptions;
  debugOptions?: DebugOptions;
  gfxFactory: GraphicsFactory;
  spriteRepo: SpriteRepository;
  private _emptySpriteCache: CanvasRenderingContext2D;

  public emptySprite(): CanvasRenderingContext2D {
    if (!this._emptySpriteCache) {
      this._emptySpriteCache = this.gfxFactory.createGraphics({
        width: 1,
        height: 1,
      });
    }
    return this._emptySpriteCache;
  }
  public px(pixels: number): number {
    return pixels * this.gfxFactory.pixelRatio();
  }
  public shieldSize(): number {
    return this.px(this.options.shieldSize);
  }
}

export type ShapeDrawFunction = (
  r: ShieldRenderingContext,
  ctx: CanvasRenderingContext2D,
  params: ShapeBlankParams,
  ref?: string
) => number;

class MaplibreGLSpriteRepository implements SpriteRepository {
  map: MapLibre;
  constructor(map: MapLibre) {
    this.map = map;
  }
  getSprite(spriteID: string): StyleImage {
    return this.map.style.getImage(spriteID);
  }
  putSprite(
    spriteID: string,
    image: ImageData,
    options: Partial<StyleImageMetadata>,
    update: boolean
  ): void {
    if (update && this.map.listImages().includes(spriteID)) {
      this.map.removeImage(spriteID);
      this.map.addImage(spriteID, image);
    } else {
      this.map.addImage(spriteID, image, options);
    }
  }
}

/**
 * Construction-time configuration for a shield renderer.
 *
 * Pass filters, graphics, and callbacks here instead of chaining setters.
 * Attach the renderer to a map or repository once with
 * {@link AbstractShieldRenderer.attachToMap} or
 * {@link AbstractShieldRenderer.attachToRepository}.
 */
export interface ShieldRendererOptions {
  /** Parses missing-image ids into network/ref/name. */
  routeParser: RouteParser;
  /** Which unhandled image ids this renderer claims. Defaults to all. */
  filterImageID?: StringPredicate;
  /** Which route networks to draw. Defaults to all. */
  filterNetwork?: StringPredicate;
  /** Debugging overrides applied before the first render. */
  debugOptions?: DebugOptions;
  /** Drawing surface factory. Defaults to a DOM canvas factory. */
  graphicsFactory?: GraphicsFactory;
  /** Fires when network definitions are available (immediately or after fetch). */
  onShieldDefLoad?: (shields: ShieldDefinitions) => void;
}

/** Base class for shield renderers. */
export class AbstractShieldRenderer {
  private _shieldPredicate: StringPredicate = () => true;
  private _networkPredicate: StringPredicate = () => true;
  private _routeParser: RouteParser;
  private _fontSpec: string;
  private _map: MapLibre;
  private _attached = false;
  private _fontsLoaded: boolean = false;
  /** Cache images that are loaded before fonts so they can be re-rendered later */
  private _preFontImageCache: Map<string, RouteDefinition> = new Map();

  /** @hidden */
  private _renderContext: ShieldRenderingContext;
  private _shieldDefCallbacks: Array<(shields: ShieldDefinitions) => void> = [];

  /** Create a shield renderer from an options pack. */
  constructor(options: ShieldRendererOptions) {
    this._routeParser = options.routeParser;
    this._renderContext = new ShieldRenderingContext();
    this._renderContext.gfxFactory =
      options.graphicsFactory ?? new DOMGraphicsFactory();
    if (options.filterImageID) {
      this._shieldPredicate = options.filterImageID;
    }
    if (options.filterNetwork) {
      this._networkPredicate = options.filterNetwork;
    }
    if (options.debugOptions) {
      this._renderContext.debugOptions = options.debugOptions;
    }
    if (options.onShieldDefLoad) {
      this._shieldDefCallbacks.push(options.onShieldDefLoad);
    }
  }

  /** Specify which shields to draw and with what graphics */
  protected setShields(shieldSpec: ShieldSpecification) {
    this._renderContext.options = shieldSpec.options;

    // Unpack any banner maps and compose them as separate network entries in-memory
    for (const [key, shieldDef] of Object.entries(shieldSpec.networks)) {
      if (!shieldDef) {
        continue; // Skip if shieldDef is null or undefined
      }

      // Check to see if it has a bannerMap
      if (shieldDef.bannerMap) {
        // If it does, loop through each entry in the bannerMap
        for (const [bannerKey, banners] of Object.entries(
          shieldDef.bannerMap
        )) {
          // Make a copy of the ShieldDefinition and attach the banners
          const banneredShieldDef: ShieldDefinition = {
            ...shieldDef,
            banners: banners,
          };
          // Insert this modified ShieldDefinition into the global network list
          shieldSpec.networks[bannerKey] = banneredShieldDef;
        }
      }
    }

    this._renderContext.shieldDef = shieldSpec.networks;
    this._fontSpec = "1em " + shieldSpec.options.shieldFont;
    console.log("ShieldJSON loaded");
    if (this._map) {
      this.reloadShieldsOnFontLoad();
    }
    this._shieldDefCallbacks.forEach((callback) =>
      callback(shieldSpec.networks)
    );
  }

  private onFontsLoaded() {
    this._fontsLoaded = true;
    if (this._preFontImageCache.size == 0) {
      return;
    }
    console.log("Re-processing shields with loaded fonts");

    // Loop through each previously-loaded shield and re-render it
    for (let [id, routeDef] of this._preFontImageCache.entries()) {
      missingIconLoader(this._renderContext, routeDef, id, true);
    }

    this._preFontImageCache.clear();
    this._map.redraw();
  }

  /** Get the shield definitions */
  public getShieldDefinitions(): ShieldDefinitions {
    return this._renderContext.shieldDef;
  }

  /**
   * Attach this renderer to a MapLibre map.
   *
   * May be called only once. A second call throws: the renderer stores a
   * backpointer to the map and its sprite repository, and swapping maps would
   * leave those mismatched.
   */
  public attachToMap(map: MapLibre): void {
    if (this._attached) {
      throw new Error(
        "Shield renderer is already attached; create a new renderer for another map or repository"
      );
    }
    this._attached = true;
    this._map = map;
    if (this._fontSpec) {
      this.reloadShieldsOnFontLoad();
    }
    this._renderContext.spriteRepo = new MaplibreGLSpriteRepository(map);
    // MapLibre GL JS v6+ resolves missing images via this callback; the
    // styleimagemissing event is observation-only and cannot satisfy requests.
    map.setMissingStyleImageResolver(this.getMissingStyleImageResolver());
  }

  private reloadShieldsOnFontLoad(): void {
    if (!this._fontsLoaded && !document.fonts.check(this._fontSpec)) {
      document.fonts.load(this._fontSpec).then(() => this.onFontsLoaded());
    } else {
      this._fontsLoaded = true;
    }
  }

  /**
   * Attach this renderer to a sprite repository (for headless or tests).
   *
   * May be called only once, and not after {@link attachToMap}.
   */
  public attachToRepository(repo: SpriteRepository): void {
    if (this._attached) {
      throw new Error(
        "Shield renderer is already attached; create a new renderer for another map or repository"
      );
    }
    this._attached = true;
    this._renderContext.spriteRepo = repo;
  }

  /**
   * Get the callback for MapLibre's missing-style-image resolver.
   *
   * Pass this to `map.setMissingStyleImageResolver()`, or use
   * {@link AbstractShieldRenderer.attachToMap} which installs it
   * automatically. Image IDs that fail the configured `filterImageID` are left
   * unresolved so other resolvers can handle them when composed by the
   * application.
   *
   * @see https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MissingStyleImageResolver/
   */
  public getMissingStyleImageResolver(): MissingStyleImageResolver {
    return (id: string) => {
      try {
        if (!this._shieldPredicate(id)) {
          return;
        }
        let routeDef: RouteDefinition = this._routeParser.parse(id);
        if (!this._networkPredicate(routeDef.network)) {
          storeNoShield(this._renderContext, id);
          return;
        }
        if (routeDef) {
          if (!this._fontsLoaded && routeDef.ref) {
            this._preFontImageCache.set(id, routeDef);
          }
          missingIconLoader(this._renderContext, routeDef, id, false);
        }
      } catch (err) {
        console.error(`Exception while loading image ‘${id}’:\n`, err);
      }
    };
  }

  /** Get the graphic for a specified route */
  public getGraphicForRoute(network: string, ref: string, name: string) {
    return generateShieldCtx(this._renderContext, {
      network,
      ref,
      name,
    });
  }

  /** Get a blank route shield sprite in the default size */
  public emptySprite(): CanvasRenderingContext2D {
    return this._renderContext.emptySprite();
  }

  /** Get a blank route shield graphics context in a specified size */
  public createGraphics(bounds: Bounds): CanvasRenderingContext2D {
    return this._renderContext.gfxFactory.createGraphics(bounds);
  }

  /** Get the current pixel ration (1x/2x) */
  public pixelRatio(): number {
    return this._renderContext.px(1);
  }
}

/**
 * A shield renderer configured from a JSON specification.
 *
 * @example
 *
 * const shieldRenderer = new ShieldRenderer(shields, {
 *   routeParser,
 *   filterImageID: shieldPredicate,
 *   filterNetwork: networkPredicate,
 * });
 * shieldRenderer.attachToMap(map);
 */
export class ShieldRenderer extends AbstractShieldRenderer {
  constructor(shieldSpec: ShieldSpecification, options: ShieldRendererOptions) {
    super(options);
    this.setShields(shieldSpec);
  }
}

/**
 * A shield renderer configured from a URL containing a JSON specification.
 *
 * @example
 *
 * const shieldRenderer = new URLShieldRenderer("shields.json", {
 *   routeParser,
 *   filterImageID: shieldPredicate,
 *   filterNetwork: networkPredicate,
 * });
 * shieldRenderer.attachToMap(map);
 **/
export class URLShieldRenderer extends AbstractShieldRenderer {
  constructor(
    /** URL containing the JSON shield definition */
    shieldsURL: string | URL,
    options: ShieldRendererOptions
  ) {
    super(options);
    this.setShieldURL(shieldsURL);
  }

  /** Set the URL containing the shield specification */
  private async setShieldURL(shieldsURL: string | URL) {
    await fetch(shieldsURL)
      .then((res) => res.json())
      .then((json) => super.setShields(json))
      .catch((err) => console.error(err));
  }
}

/** @hidden Used for testing */
export class InMemorySpriteRepository implements SpriteRepository {
  sprites = {};
  public getSprite(spriteID: string): StyleImage {
    return this.sprites[spriteID];
  }
  public hasSprite(spriteID: string): boolean {
    return spriteID in this.sprites;
  }
  public putSprite(spriteID: string, image: ImageData): void {
    this.sprites[spriteID] = image;
  }
}

const localRepo = new InMemorySpriteRepository();
