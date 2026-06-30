import {
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Clock,
  Color,
  Fog,
  PointLight,
  Vector3,
  Mesh,
  MeshPhongMaterial,
  VSMShadowMap,
  CanvasTexture,
  SRGBColorSpace,
  Quaternion,
  Matrix4,
  MathUtils,
  Sprite,
  SpriteMaterial,
  AdditiveBlending,
} from "three";
import { cartesianFromSpherical, tangentFrame } from "./SphericalMath";
import { t, IS_ZH } from "../i18n";
import { localizeWorldName } from "../i18nNames";
import { CompanionManager } from "../companion/CompanionManager";
import { CompanionUI } from "../companion/CompanionUI";
import { emotifyCompanionText } from "../companion/emoteText";
import { WaypointBeacon } from "./WaypointBeacon";
import {
  BRAZIER_MOON_PAUSE_MS,
  getVehicleFeatures,
  type Vehicle,
  type VehicleGameFeatures,
  type WorldConfig,
  type RendezvousWorld,
  type GhostPairInvite,
  type CompanionHailEvent,
  type CompanionGiftEvent,
} from "@globefly/shared";
import { DayNightCycle } from "./DayNightCycle";
import { AudioManager } from "../audio/AudioManager";
import { Globe } from "./Globe";
import { Plane } from "./Plane";
import { Boat } from "./Boat";
import { Carpet } from "./Carpet";
import { FlightControls } from "./FlightControls";
import { TouchControls } from "./TouchControls";
import { CameraRig } from "./CameraRig";
import { SocketClient } from "../network/SocketClient";
import { resolveServerUrl } from "../runtime/resolveServerUrl";
import { isMobile } from "../utils/isMobile";
import { StateSync } from "../network/StateSync";
import { RemotePlaneManager } from "./RemotePlane";
import { PaintballSystem } from "./PaintballSystem";
import { FlagSystem } from "./FlagSystem";
import { GodRays } from "./GodRays";
import { SpeedLines } from "./SpeedLines";
import { Contrails } from "./Contrails";
import { WakeTrail } from "./WakeTrail";
import { WaterSpouts } from "./WaterSpouts";
import { CarpetTrail } from "./CarpetTrail";
import { VoidCarpetTrail } from "./VoidCarpetTrail";
import { CarpetWake } from "./CarpetWake";
import { CarpetLeaves } from "./CarpetLeaves";
import { CarpetDriftSmoke } from "./CarpetDriftSmoke";
import { LensFlare } from "./LensFlare";
import { Starfield } from "./Starfield";
import { globalRimColor } from "./RimLight";
import { Aurora } from "./Aurora";
import { RainOverlay } from "./RainOverlay";
import { RingManager } from "./Rings";
import { RaceManager } from "./RaceManager";
import { EternalFlameBeams } from "./EternalFlameBeams";
import { RingCollectVFX } from "./RingCollectVFX";
import { pickRandomVehicleColor } from "./vehicleColors";
import { CarpetPortalSystem } from "./CarpetPortalSystem";
import { CapybaraFlameShots } from "./CapybaraFlameShots";
import { CosmicWorldPortal, COSMIC_VOID_PORTAL_COUNT } from "./CosmicWorldPortal";
import { EternalFlameWorld } from "./EternalFlameWorld";
import { VoidMothsManager, type VoidMothPlaneContext } from "./VoidMoths";
import { VoidFlameShield } from "./VoidFlameShield";
import { Lobby, generateWhimsicalName } from "../ui/Lobby";
import { RemotePlayerNameLabels } from "../ui/RemotePlayerNameLabels";
import { FriendBondFX, type FriendInWorld } from "./FriendBondFX";
import { HUD } from "../ui/HUD";
import {
  mountControlHints,
  mountCampsiteControlHints,
  mountVehicleTutorialHints,
  type ControlHintRow,
  type VehicleTutorialHints,
} from "../ui/ControlHints";
import { LandmarkHUD } from "../ui/LandmarkHUD";
import { PackageQuestHUD } from "../ui/PackageQuestHUD";
import { FlockFormationHUD } from "../ui/FlockFormationHUD";
import { BirdFlock, BIRD_FLOCK_COUNT, FLOCK_FORMATION_XP } from "./BirdFlock";
import { RainbowArch, RAINBOW_COUNT, RAINBOW_XP } from "./RainbowArch";
import { FloatingLanterns, LANTERN_CLUSTER_COUNT, LANTERN_XP } from "./FloatingLanterns";
import { FireflyCluster, FIREFLY_CLUSTER_COUNT, FIREFLY_XP } from "./FireflyCluster";
import { Volcano, VOLCANO_COUNT, VOLCANO_XP } from "./Volcano";
import { Braziers, BRAZIER_COUNT, type SavedBrazierState } from "./Braziers";
import { SkyGremlins, SKY_GREMLIN_KING_XP, SKY_GREMLIN_XP, GREMLIN_TAKEDOWNS_FOR_KING } from "./SkyGremlins";
import { NpcPlanes } from "./NpcPlanes";
import { GhostPlanes, type GhostVisitor } from "./GhostPlanes";
import { NpcBoats } from "./NpcBoats";
import { GremlinHearts } from "./GremlinHearts";
import { LandmarkRegistry, LandmarkDetector } from "./Landmarks";
import { PackageQuestManager, PACKAGE_DELIVERIES_PER_WORLD } from "./PackageQuest";
import {
  isNpcMale,
  pickBalloonGreeting,
  pickPanicLine,
  pickObservatoryGreeting,
  pickStonehengeWhisper,
  pickBrazierWhisper,
  THIRD_PACKAGE_DELIVERY_INDEX,
  ETERNAL_FLAME_SPEAKER,
  JELLYFISH_NPC_SPEAKER,
  getJellyfishCaptureLine,
  ETERNAL_FLAME_VOID_BUBBLES,
  VOID_WAVE_BETWEEN_DIALOGUE,
  VOID_SHIELD_LOW_HP_DIALOGUE,
  VOID_FLAME_SHATTER_DIALOGUE,
  VOID_VICTORY_DIALOGUE,
} from "./PackageDialogue";
import { CampsiteMarker } from "./CampsiteMarker";
import { CampsiteScene } from "./CampsiteScene";
import { moonApproachDurationSec, MoonThreat } from "./MoonThreat";
import { MeteorShower } from "./MeteorShower";
import { TransitionOverlay } from "../ui/TransitionOverlay";
import { CAMPSITE_HOME_ENABLED } from "../config/features";
import { LevelUpCards } from "../ui/LevelUpCards";
import {
  ProgressionManager,
  friendBondLevel,
  type SavedPlayerWorldState,
  type CompanionFriend,
} from "./ProgressionManager";
import { CarpetLandmarkSelfieQuest, LANDMARK_SELFIE_XP } from "./CarpetLandmarkSelfieQuest";
import { HotspringPhotoUI } from "../ui/HotspringPhotoUI";
import { EternalFlameUI } from "../ui/EternalFlameUI";
import { DebugMenu } from "../ui/DebugMenu";
import { SkyJellyfish, JELLY_CAPTURE_XP, JELLY_COUNT } from "./SkyJellyfish";
import { OceanFish, FISH_CATCH_XP, FISH_COUNT_BEFORE_MYSTERY_OCTOPUS } from "./OceanFish";
import { CircularProgressRing } from "../ui/CircularProgressRing";

/**
 * Distance to balloon for greeting (world units, same space as globe radius ~5).
 * Previously ~0.4 was too small — you could fly visually “past” a balloon and
 * never enter the sphere in one frame. ~1.2 matches a comfortable fly-by.
 */
const _farQ = new Quaternion();
const _moonCollisionScratch = new Vector3();
const _carpetSelfieRefUp = new Vector3(0, 1, 0);
const _carpetSelfiePlayerNormal = new Vector3();
const BALLOON_GREET_DIST = 1.2;
const BALLOON_GREET_EXIT_DIST = 1.75;
/** Seconds before the same balloon can greet again after you leave. */
const BALLOON_GREET_COOLDOWN = 32;

/** Min time between save-feed posts for the same world (rare event; avoids duplicate requests). */
const SAVE_FEED_MIN_INTERVAL_MS = 10_000;
/** Low-frequency playtime accounting; not used for gameplay or render-loop logic. */
const SESSION_HEARTBEAT_MS = 60_000;
/** Quest tracker values are small and user-facing; 5 Hz is responsive without per-frame storage/DOM work. */
const QUEST_TRACKER_SYNC_INTERVAL_MS = 200;

const OBSERVATORY_GREET_DIST = 1.6;
const OBSERVATORY_GREET_EXIT_DIST = 2.2;
const OBSERVATORY_GREET_COOLDOWN = 40;
const STONEHENGE_WHISPER_DIST = 1.8;
const STONEHENGE_WHISPER_EXIT_DIST = 2.4;
const STONEHENGE_WHISPER_COOLDOWN = 45;

const BRAZIER_WHISPER_DIST      = 1.6;
const BRAZIER_WHISPER_EXIT_DIST = 2.2;
const BRAZIER_WHISPER_COOLDOWN  = 60;
const MOONSTONE_ACTIVATE_DIST = 1.1;
const MOONSTONE_RUMBLE_LOOP_NAME = "moonstone_rumble";
/** Looping rumble while the carpet is in range of a ruin in its raise phase. */
const MOONSTONE_RUMBLE_MAX_VOL = 0.74;

/** Max linear gain for night crickets loop (soft; scales with night blend 0–1). */
const CRICKETS_LOOP_MAX_VOL = 0.045;

/** Local vehicle fill light at night: `intensity = nightWeight * this` (was 1.0; lower = less harsh). */
const PLAYER_LIGHT_NIGHT_INTENSITY = 0.38;

const RAIN_LOOP_NAME = "rain_loop";
const RAIN_LOOP_MAX_VOL = 0.58;

const BIRDS_LOOP_NAME = "birds_loop";
const BIRDS_LOOP_MAX_VOL = 0.04;

const RUMBLE_LOOP_NAME = "rumbling_1";
/** Moon rumble at 100% progress (0 at 75%, ramps up to this by impact). */
const RUMBLE_MAX_VOL = 0.42;

/** Boat: ambient ocean waves (looping while flying). */
const OCEAN_WAVES_LOOP_NAME = "ocean_waves_1";
/** Ambient ocean loop; keep competitive with music (~0.35) so it reads over open water. */
const OCEAN_WAVES_LOOP_VOL = 0.32;
/** One twister debuff burst (forced spin + slow); must not re-arm every frame while still inside. */
const TWISTER_SPIN_DURATION_SEC = 1.5;
const TWISTER_SPIN_COOLDOWN_SEC = 5;
/** Steer rate the companion's voice/chat `control_vehicle` uses (matches a full
 *  keyboard turn; see FlightControls turnRate ±1.2). */
const VOICE_TURN_RATE = 1.2;

const EXPLOSION_SFX_NAME = "explosion_1";
const EXPLOSION_SFX_VOLUME = 0.48;

/** Next diamond within this window raises pitch (combo). */
const DIAMOND_COMBO_WINDOW_MS = 900;
const DIAMOND_COMBO_MAX_STEPS = 5;
const DIAMOND_COMBO_RATE_PER_STEP = 0.028;
/** Each combo step adds this fraction of diamond XP (e.g. step 5 = +25%). */
const DIAMOND_COMBO_XP_PER_STEP = 0.05;
const DIAMOND_SFX_VOLUME = 0.3;
const PORTAL_INTERACTION_SUPPRESS_SEC = 0.18;
const SELFIE_CAMERA_SFX_VOLUME = 0.55;
const PORTAL_TELEPORT_SFX_VOLUME = 0.5;
const PORTAL_OPEN_SFX_VOLUME = 0.52;

/** XP source categories used by awardXP() for per-source scaling. */
type XpSource =
  | "diamond"
  | "gremlin"
  | "delivery"
  | "selfie"
  | "flock"
  | "rainbow"
  | "lantern"
  | "firefly"
  | "volcano"
  | "jellyfish"
  | "fish";

/** Cozy, infrequent XP sources worth telling the companion about (with a short
 *  localized note for its reply). Frequent sources (diamond/gremlin) and ones
 *  that already emit a richer moment (delivery) are intentionally omitted. */
const COMPANION_XP_MOMENTS: Partial<Record<XpSource, string>> = {
  selfie: t("took a selfie at a scenic spot", "在景点拍了张自拍"),
  flock: t("flew in formation with a flock of birds", "与鸟群编队齐飞"),
  rainbow: t("flew through a rainbow", "穿过了一道彩虹"),
  lantern: t("flew among the floating lanterns", "在漂浮的灯笼之间飞行"),
  firefly: t("flew through a cloud of fireflies", "穿过了一群萤火虫"),
  volcano: t("did some extreme flying near a volcano", "在火山附近极限飞行"),
  jellyfish: t("caught a sky jellyfish", "捕获了一只天空水母"),
  fish: t("caught a fish", "钓到了一条鱼"),
};

const DIAMOND_SFX_IDS = [
  "diamond_collect_1",
  "diamond_collect_2",
  "diamond_collect_3",
] as const;

const JELLYFISH_COLLECT_SFX_IDS = [
  "jellyfish_1",
  "jellyfish_2",
  "jellyfish_3",
] as const;
const JELLYFISH_COLLECT_SFX_VOLUME = 0.35;

const LANTERN_COLLECT_SFX_IDS = [
  "lantern_collect_1",
  "lantern_collect_2",
  "lantern_collect_3",
  "lantern_collect_4",
] as const;
const LANTERN_COLLECT_SFX_VOLUME = 0.38;

const SPEED_BOOST_SFX_IDS = [
  "speed_boost_1",
  "speed_boost_2",
  "speed_boost_3",
] as const;
const SPEED_BOOST_SFX_VOLUME = 0.1;

const BOX_COLLECT_SFX_IDS = [
  "box_collect_1",
  "box_collect_2",
  "box_collect_3",
] as const;
const BOX_COLLECT_SFX_VOLUME = 0.52;

const CHEER_SFX_IDS = ["cheer_1", "cheer_2"] as const;
const CHEER_SFX_VOLUME = 0.1;

const DIALOGUE_LOOP_IDS = ["dialogue_1", "dialogue_2", "dialogue_3", "dialogue_4"] as const;
const DIALOGUE_LOOP_VOLUME = 0.28;
/** Lower playback rate reads as a slightly deeper “male” bed under the same asset. */
const DIALOGUE_MALE_PLAYBACK_RATE = 0.88;

/** One-shots for {@link ETERNAL_FLAME_SPEAKER} package bubbles (void + brazier lines). */
const FLAME_DIALOGUE_SFX_IDS = ["flame_dialogue_1", "flame_dialogue_2", "flame_dialogue_3"] as const;
/** One-shots for {@link JELLYFISH_NPC_SPEAKER} sky-jellyfish lines. */
const JELLYFISH_DIALOGUE_SFX_IDS = [
  "flame_dialogue_1",
  "flame_dialogue_2",
  "flame_dialogue_3",
] as const;
const FLAME_JELLY_DIALOGUE_SFX_VOLUME = 0.46;

const LEVELUP_SFX_IDS = ["levelup_1", "levelup_2", "levelup_3"] as const;
const LEVELUP_SFX_VOLUME = 0.42;

/** Gremlin King eternal-flame reward sting. */
const CHOIR_1_SFX_VOLUME = 0.58;
const KING_ETERNAL_FLAME_REWARD_DELAY_MS = 1000;

type VehicleTutorialStepId =
  | "move"
  | "elevate"
  | "shoot"
  | "portal1"
  | "portal2"
  | "portalTravel"
  | "fish";
type VehicleTutorialStep = ControlHintRow & { id: VehicleTutorialStepId };

const VEHICLE_TUTORIAL_STEPS: Record<Vehicle, VehicleTutorialStep[]> = {
  plane: [
    { id: "move", keys: ["W", "A", "S", "D"], label: t("Fly with WASD", "用 WASD 飞行") },
    { id: "elevate", keys: ["↑"], label: t("Climb with Up Arrow", "用上箭头爬升") },
    { id: "shoot", keys: ["Space"], label: t("Shoot with Space", "用空格射击") },
  ],
  carpet: [
    { id: "move", keys: ["W", "A", "S", "D"], label: t("Fly with WASD", "用 WASD 飞行") },
    { id: "portal1", keys: ["Space"], label: t("Open Portal 1 with Space", "用空格开启传送门 1") },
    { id: "portal2", keys: ["Space"], label: t("Open Portal 2 with Space", "用空格开启传送门 2") },
    { id: "portalTravel", keys: [], label: t("Fly through a portal", "穿过传送门") },
  ],
  boat: [
    { id: "move", keys: ["W", "A", "S", "D"], label: t("Move with WASD", "用 WASD 移动") },
    { id: "fish", keys: [], label: t("Find a fish pool and catch a fish", "找到鱼塘并钓一条鱼") },
  ],
};
const VEHICLE_TUTORIAL_FINISH_LABELS: Record<Vehicle, string> = {
  plane: t("That's it. Enjoy flying!", "就这样。尽情飞翔吧！"),
  carpet: t("That's it. Enjoy flying!", "就这样。尽情飞翔吧！"),
  boat: t("That's it. Enjoy boating!", "就这样。尽情航行吧！"),
};
const VEHICLE_TUTORIAL_ADVANCE_DELAY_MS = 2000;
/** After Space / portal travel steps, advance quickly so the next prompt is not buried. */
const VEHICLE_TUTORIAL_CARPET_PORTAL_ADVANCE_MS = 300;
/** Fade when dismissing the whole tutorial or swapping to the full controls panel. */
const VEHICLE_TUTORIAL_FADE_MS = 350;
/** Faster opacity/transform crossfade between tutorial steps (see ControlHints tutorial transition). */
const VEHICLE_TUTORIAL_STEP_FADE_MS = 220;
/** Drop the tutorial and show keyboard hints if the player has not finished within this time. */
const VEHICLE_TUTORIAL_OVERALL_MAX_MS = 30_000;

function vehicleTutorialAdvanceDelayMs(vehicle: Vehicle, completedStepIndex: number): number {
  if (vehicle !== "carpet") return VEHICLE_TUTORIAL_ADVANCE_DELAY_MS;
  const step = VEHICLE_TUTORIAL_STEPS.carpet[completedStepIndex];
  if (!step) return VEHICLE_TUTORIAL_ADVANCE_DELAY_MS;
  if (step.id === "portal1" || step.id === "portal2" || step.id === "portalTravel") {
    return VEHICLE_TUTORIAL_CARPET_PORTAL_ADVANCE_MS;
  }
  return VEHICLE_TUTORIAL_ADVANCE_DELAY_MS;
}

function vehicleTutorialRows(vehicle: Vehicle): ControlHintRow[] {
  return [
    ...VEHICLE_TUTORIAL_STEPS[vehicle],
    { keys: [], label: VEHICLE_TUTORIAL_FINISH_LABELS[vehicle] },
  ];
}

const GREMLIN_HIT_SFX_IDS = [
  "gremlin_1",
  "gremlin_2",
  "gremlin_3",
  "gremlin_4",
] as const;
const GREMLIN_HIT_SFX_VOLUME = 0.5;
/** Keeps chatter from firing on every paintball hit. */
const GREMLIN_HIT_SFX_CHANCE = 0.24;
const GREMLIN_HIT_SFX_MIN_MS = 400;
/** Deeper than normal gremlin hits (`AudioManager.playSFX` allows down to 0.35). */
const GREMLIN_KING_HIT_PLAYBACK_RATE = 0.4;
/** Cosmic void moths: random one-shot; same throttle idea as non-kill gremlin hits. */
const MOTH_HIT_SFX_IDS = ["moth_1", "moth_2", "moth_3"] as const;
const MOTH_HIT_SFX_VOLUME = 0.5;
/** Max gain for rewind SFX loop; multiplied by scene alpha during moon rewind. */
const REWIND_LOOP_VOLUME = 0.38;
/** Cosmic void: ease chase cam toward a higher, slightly tighter framing (top-down). */
const VOID_CAMERA_BLEND_SPEED = 4.2;
const VOID_CAMERA_EXTRA_HEIGHT = 0.62;
const VOID_CAMERA_DIST_DELTA = -0.18;
const VOID_CAMERA_TILT_DAMP = 0.45;
/** Looping ambient in cosmic void; same buffer path pattern as `AudioManager` music. */
const VOID_MUSIC_LOOP_NAME = "void_1";
const VOID_MUSIC_LOOP_MAX_VOL = 0.3;
const SHIELD_IMPACT_ENERGY_SFX = "impact_energy_1";
const SHIELD_IMPACT_ENERGY_SFX_VOL = 0.58;

const UI_CLICK_SELECTOR = [
  "button:not(:disabled)",
  '[role="button"]:not([aria-disabled="true"])',
  "a[href]",
  'input[type="button"]:not(:disabled)',
  'input[type="submit"]:not(:disabled)',
  'input[type="checkbox"]',
  'input[type="radio"]',
  "select",
  "label",
].join(", ");

type GamePhase = "flying" | "campsite" | "transitioning" | "moonImpact" | "moonstoneUnion";

/** A2A sky gifts: a small allowed set of emoji stickers companions can send. */
const GIFT_EMOJI: Record<string, string> = {
  star: "⭐", balloon: "🎈", flower: "🌸", clover: "🍀", gift: "🎁",
  heart: "❤️", rainbow: "🌈", donut: "🍩", cake: "🍰", sparkles: "✨",
};
const GIFT_EMOJI_SET = new Set(Object.values(GIFT_EMOJI));
/** Normalize a requested gift (emoji or name) to one of the allowed stickers. */
function normalizeGift(input: string): string {
  const s = (input || "").trim();
  if (GIFT_EMOJI_SET.has(s)) return s;
  const key = s.toLowerCase().replace(/[^a-z]/g, "");
  return GIFT_EMOJI[key] ?? "🎁";
}

/** A2A friends-roster presence row from GET /api/friends/presence. */
interface FriendPresence {
  visitorId: string;
  online: boolean;
  worldSlug?: string;
  worldName?: string | null;
  name?: string;
}

export class Game {
  private container: HTMLElement;
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private clock!: Clock;

  private globe!: Globe;
  private localPlayer!: Plane | Boat | Carpet;
  private controls!: FlightControls;
  private touchControls: TouchControls | null = null;
  private mobile = false;
  private cameraRig!: CameraRig;
  private remotePlanes!: RemotePlaneManager;
  /** Co-present player names by socket id, for the A2A pairing picker. */
  private readonly remotePlayerNames = new Map<string, string>();
  private paintballSystem: PaintballSystem | null = null;
  private flagSystem: FlagSystem | null = null;
  private speedLines!: SpeedLines;
  private contrails!: Contrails;
  private wakeTrail!: WakeTrail;
  private carpetTrail!: CarpetTrail;
  /** Wide white glow ribbon — only when `vehicle === "carpet"`; visible in cosmic void only. */
  private voidCarpetTrail: VoidCarpetTrail | null = null;
  private carpetWake!: CarpetWake;
  private carpetLeaves!: CarpetLeaves;
  private carpetDriftSmoke!: CarpetDriftSmoke;
  private carpetPortalSystem: CarpetPortalSystem | null = null;
  private carpetPortalTeleportSeq = 0;
  private capybaraFlameShots: CapybaraFlameShots | null = null;
  private cosmicWorldPortals: CosmicWorldPortal[] = [];
  private inCosmicVoid = false;
  /** 3D eternal-flame in front of the player while in the cosmic void (carpet). */
  private voidEternalFlame: EternalFlameWorld | null = null;
  private voidMoths: VoidMothsManager | null = null;
  private voidFlameShield: VoidFlameShield | null = null;
  private voidAmbientMusicActive = false;
  /** Timeouts for eternal-flame intro bubbles + moth spawn unlock; cleared on void exit. */
  private voidEternalFlameIntroTimeouts: ReturnType<typeof setTimeout>[] = [];
  /** Current wave number (1–3). 0 = not yet started. */
  private voidWave = 0;
  /** True while waiting for wave-cleared → next-wave transition (debounce). */
  private voidWavePendingTransition = false;
  /** Whether the 50%-HP shield warning has been shown this void session. */
  private voidShieldWarnedHalf = false;
  /** Whether the ≤3-HP critical shield warning has been shown this void session. */
  private voidShieldWarnedCritical = false;
  /** Set to true once the flame shatter sequence begins; prevents re-entry. */
  private voidFlameShattered = false;
  private voidVictoryTriggered = false;
  /** After choosing cosmic entry until `inCosmicVoid` is set — mutes world ambience during the fade. */
  private voidEntryInProgress = false;
  /** While entering/exiting cosmic void, the game is `transitioning` but the carpet should still advance inertialy. */
  private coastCarpetDuringCosmicTransition = false;
  /** 0 = normal chase cam, 1 = void framing; smoothed per frame. */
  private voidCameraBlend = 0;
  private gameSeed = 42;
  private gameTerrainType = "default";
  private lensFlare: LensFlare | null = null;
  private rainOverlay: RainOverlay | null = null;
  private starfield: Starfield | null = null;
  private aurora: Aurora | null = null;
  private playerLight: PointLight | null = null;
  private ringManager!: RingManager;
  private raceManager: RaceManager | null = null;
  private collectVFX!: RingCollectVFX;

  private socketClient: SocketClient | null = null;
  private stateSync: StateSync | null = null;
  private lobby!: Lobby;
  private hud!: HUD;
  private landmarkHUD!: LandmarkHUD;
  private landmarkDetector!: LandmarkDetector;
  private packageQuest: PackageQuestManager | null = null;
  private packageQuestHUD!: PackageQuestHUD;
  /** Pouchy AI companion (opt-in). Null when no token / not yet connected. */
  private companion: CompanionManager | null = null;
  private companionUI: CompanionUI | null = null;
  /** Timed control override set by the companion's `control_vehicle` tool; merged
   *  into the per-frame control state in {@link tick} until `remaining` elapses. */
  private voiceControl: {
    turnRate: number;
    forward: boolean;
    brake: boolean;
    elevate: boolean;
    descend: boolean;
    remaining: number;
  } | null = null;
  /** One-shot fire request from the companion (consumed next frame). */
  private voiceFireQueued = false;
  /** Throttle accumulator for injecting situation context into a live voice call. */
  private companionCallContextTimer = 0;
  /** Dedup guard so a single spoken utterance (re-emitted as interim results)
   *  doesn't trigger the same command many times. */
  private lastVoiceCmdAction: string | null = null;
  private lastVoiceCmdAt = 0;
  /** Throttle accumulator for the periodic companion "situation" world-state. */
  private companionSituationTimer = 0;
  /** Throttle accumulator for the periodic A2A "rendezvous" world-state. */
  private companionRendezvousTimer = 15;
  /** A2A: proximity-detect when two companion-pilots meet so their agents greet. */
  private companionEncounterTimer = 0;
  /** The co-present companion-pilot currently in greeting range (greet_companion target). */
  private activeHailTarget: { socketId: string; name: string; companionName: string | null } | null = null;
  /** Per-remote meet state (in-range + cooldown) so a flyby fires once, not every tick. */
  private companionEncounters = new Map<string, { inRange: boolean; cooldownUntil: number }>();
  /** Peers our companion has already auto-replied to this encounter (caps ping-pong). */
  private hailReplied = new Set<string>();
  /** A2A feature 3: companion-pilots currently co-present in this world (teammates). */
  private coPresentCompanions: Array<{ socketId: string; name: string; companionName: string | null }> = [];
  /** Headless/QA diagnostics counters, surfaced read-only on `window.__a2a`. Never
   *  exposes the token — only counts + booleans + display names. */
  private readonly diag = {
    messagesIn: 0, messagesOut: 0, voiceStarts: 0,
    hailsIn: 0, hailsOut: 0, giftsIn: 0, giftsOut: 0, encounters: 0,
    lastError: null as string | null,
  };
  /** QA-only: auto-accept incoming pairing requests (set via window.__a2a.test). */
  private qaAutoAcceptPairs = false;
  /** QA-only: auto-accept incoming duo invites (set via window.__a2a.test). */
  private qaAutoAcceptDuo = false;
  /** QA-only: treat the duo as "linked" regardless of distance (no flight needed). */
  private qaForceDuoLinked = false;
  private carpetLandmarkSelfieQuest: CarpetLandmarkSelfieQuest | null = null;
  private carpetSelfiePhotoUI: HotspringPhotoUI | null = null;
  private eternalFlameUI: EternalFlameUI | null = null;
  private debugMenu: DebugMenu | null = null;
  private birdFlocks: BirdFlock[] = [];
  private rainbowArches: RainbowArch[] = [];
  private lanternClusters: FloatingLanterns[] = [];
  private fireflyClusters: FireflyCluster[] = [];
  private waterSpouts: WaterSpouts | null = null;
  private twisterSpinTimer = 0;
  /** After a spin burst ends, no new spin until this reaches 0 (prevents infinite spin when stuck in a twister). */
  private twisterSpinCooldown = 0;
  private volcanoes: Volcano[] = [];
  private braziers: Braziers | null = null;
  /** Companion-placed navigation light pillar (set_waypoint / drop_beacon). */
  private waypointBeacon: WaypointBeacon | null = null;
  private skyGremlins: SkyGremlins | null = null;
  private npcPlanes: NpcPlanes | null = null;
  private npcPaintballUnsub: (() => void) | null = null;
  /** "Ghost" vehicles of players who flew this world before (A2A Phase B). */
  private ghostPlanes: GhostPlanes | null = null;
  /** Bumped on each teardown so async spawns can detect a stale session. */
  private sessionEpoch = 0;
  /** The most recently encountered ghost — target for "pair with them" (Phase C). */
  private lastGhostEncounter: GhostVisitor | null = null;
  /** Actionable "befriend this ghost" chip shown on a ghost encounter. */
  private ghostChipEl: HTMLElement | null = null;
  private ghostChipTimer: number | null = null;
  /** Dismisses the current in-game pairing card (only one at a time). */
  private pairingCardCleanup: (() => void) | null = null;
  private npcBoats: NpcBoats | null = null;
  private gremlinHearts: GremlinHearts | null = null;
  private lastGremlinHitSfxAt = 0;
  private lastVoidMothHitSfxAt = 0;
  private kingEternalFlameRewardTimeout: ReturnType<typeof setTimeout> | null = null;
  private jellyfishEternalFlameRewardTimeout: ReturnType<typeof setTimeout> | null = null;
  private packageThirdEternalFlameRewardTimeout: ReturnType<typeof setTimeout> | null = null;
  private boatOctopusEternalFlameRewardTimeout: ReturnType<typeof setTimeout> | null = null;
  private flockFormationHUD: FlockFormationHUD | null = null;
  private remotePlayerNameLabels!: RemotePlayerNameLabels;
  /** "Friends, together" FX — pointer + tether + heart for paired A2A friends. */
  private friendBondFX: FriendBondFX | null = null;
  /** Cached set of paired-friend visitorIds, for recognising them in the world. */
  private friendVisitorIds = new Set<string>();
  /** Cached friend records by visitorId (for live bond level without re-reading storage). */
  private friendByVisitor = new Map<string, CompanionFriend>();
  /** Per-friend "time together" accumulator → +1 bond every 12s co-present. */
  private bondTimers = new Map<string, number>();
  /** A2A feature 4: the active "fly together" duo challenge, or null. */
  private duo: { peerSocketId: string; peerName: string; peerVisitorId: string | null; progress: number; missing: number } | null = null;
  /** Friends we've already offered a duo to this session (offer once per friend). */
  private duoChipOffered = new Set<string>();
  /** Friends whose arrival we've already announced to the companion this session. */
  private friendHereAnnounced = new Set<string>();
  private duoBarEl: HTMLDivElement | null = null;
  private duoBarFill: HTMLDivElement | null = null;
  /** Seconds of staying linked to complete the duo; link range (world units). */
  private static readonly DUO_DURATION = 18;
  private static readonly DUO_LINK_RANGE = 2.0;
  private balloonInRange: boolean[] = [];
  private balloonGreetCooldown: number[] = [];
  private balloonGreetSalt = 0;
  private balloonPosScratch = new Vector3();
  private gameTime = 0;
  private observatoryInRange: boolean[] = [];
  private observatoryCooldown: number[] = [];
  private observatoryWorldPositions: Vector3[] = [];
  private stonehengeInRange: boolean[] = [];
  private stonehengeCooldown: number[] = [];
  private stonehengeWorldPositions: Vector3[] = [];

  private brazierInRange: boolean[] = [];
  private brazierCooldown: number[] = [];
  private lastBrazierProgress: number[] = [];
  /** One-time hint shown after the first brazier flame burns out. */
  private showedBrazierFizzleHint = false;
  /** Offline-only edge detect for all-five shield (no server). */
  private prevAllFiveBraziers = false;
  /** Only show the moon-resumed banner after a locally-announced brazier pause. */
  private shouldShowBrazierMoonResume = false;
  private panicDialogueCooldown = 0;
  private localPlayerWorldScratch = new Vector3();
  private readonly _voidChasePos = new Vector3();
  private readonly _voidChaseForward = new Vector3();
  private readonly _voidEternalFlamePosScratch = new Vector3();
  private readonly _carpetVoidWorldScratch = new Vector3();
  private readonly _voidMothAimScratch = new Vector3();
  private voidFlameArrowEl: HTMLDivElement | null = null;
  private voidEnemyArrowEls: HTMLDivElement[] = [];

  private _gamePhase: GamePhase = "flying";
  /** Reading is unchanged; assigning also tells the companion what stage the game
   *  is in (flying vs landed vs a cutscene) so it doesn't give flight advice over a
   *  scene transition, and reacts in the right register during cinematics. */
  private get gamePhase(): GamePhase {
    return this._gamePhase;
  }
  private set gamePhase(p: GamePhase) {
    if (this._gamePhase === p) return;
    this._gamePhase = p;
    const summary = Game.GAME_PHASE_SUMMARY[p];
    this.companion?.setRetained("game.phase", { phase: p, summary });
  }
  private moonCinematicStep: "fadeOut1" | "wideShot" | "fadeOut2" | "done" = "done";
  private moonCinematicTimer = 0;

  /** Moonstone union cinematic state (triggered when both halves float at once). */
  private moonstoneUnionStep:
    | "inhale"
    | "ascent"
    | "converge"
    | "join"
    | "release"
    | "brazierMontage"
    | "fadeOut"
    | "done" = "done";
  private moonstoneUnionTimer = 0;
  private moonstoneUnionCamera: PerspectiveCamera | null = null;
  private moonstoneUnionLetterTop: HTMLDivElement | null = null;
  private moonstoneUnionLetterBot: HTMLDivElement | null = null;
  private moonstoneUnionFlashEl: HTMLDivElement | null = null;
  private moonstoneUnionVignetteEl: HTMLDivElement | null = null;
  private moonstoneUnionMidNormal = new Vector3();
  private moonstoneUnionSideAxis = new Vector3();
  private moonstoneUnionUnionPoint = new Vector3();
  private moonstoneUnionCenterSite = new Vector3();
  private moonstoneUnionCamRight = new Vector3();
  private moonstoneUnionRestPos: Vector3[] = [];
  private moonstoneUnionRestQuat: Quaternion[] = [];
  private moonstoneUnionNormals: Vector3[] = [];
  private moonstoneUnionTargetQuat: Quaternion[] = [];
  private moonstoneUnionBrazierShotOrder: number[] = [];
  private moonstoneUnionGlow: Sprite | null = null;
  private moonstoneUnionCoreGlow: Sprite | null = null;
  private moonstoneUnionShotTarget = new Vector3();
  private moonstoneUnionShotLookAt = new Vector3();
  private moonstoneUnionShotNormal = new Vector3();
  private moonstoneUnionShotSide = new Vector3();
  private moonstoneUnionShotForward = new Vector3();
  private returningToMenuAfterMoon = false;
  /** Stops the game loop and runs the outro after all five braziers are lit with eternal flame. */
  private eternalVictoryReturnInProgress = false;
  private playerGremlinDeathReturnInProgress = false;
  private campsiteMarker: CampsiteMarker | null = null;
  private campsiteScene: CampsiteScene | null = null;
  private vehicleHintsEl: HTMLElement | null = null;
  private campsiteHintsEl: HTMLElement | null = null;
  private vehicleTutorialHints: VehicleTutorialHints | null = null;
  private activeVehicleTutorial: { vehicle: Vehicle; stepIndex: number } | null = null;
  private vehicleTutorialAdvanceTimeout: ReturnType<typeof setTimeout> | null = null;
  private vehicleTutorialAdvancePending = false;
  private vehicleTutorialOverallTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Full-screen dim with a hole over desktop control/tutorial hints; cleared after a few seconds. */
  private tutorialSpotlightEl: HTMLDivElement | null = null;
  private tutorialSpotlightOnResize: (() => void) | null = null;
  private tutorialSpotlightRepaintTimer: ReturnType<typeof setTimeout> | null = null;
  private tutorialSpotlightHoldTimer: ReturnType<typeof setTimeout> | null = null;
  private tutorialSpotlightFadeTimer: ReturnType<typeof setTimeout> | null = null;
  private transitionOverlay: TransitionOverlay | null = null;
  private hullColor = 0xff4444;
  private moonThreat: MoonThreat | null = null;
  private meteorShower: MeteorShower | null = null;
  private skyJellyfish: SkyJellyfish | null = null;
  private jellyfishCaptureRing: CircularProgressRing | null = null;
  private oceanFish: OceanFish | null = null;
  private fishCaught = 0;
  private boatMysteryAt12Handled = false;
  private fishCamScratch = new Vector3();
  private selfieProgressCached = 0;
  private vhsOverlay: HTMLDivElement | null = null;
  private vhsGlitchInterval: ReturnType<typeof setInterval> | null = null;
  private progression!: ProgressionManager;
  private levelUpCards!: LevelUpCards;
  /** True while level-up cards are shown (or the short delay before); vehicle brakes harder so it does not coast. */
  private choosingLevelUpUpgrade = false;
  /** Set from lobby when "Freeplay mode" is checked for this flight. */
  private runFreeplayMode = false;
  /** Count of previously spawned bonus collectibles so we only spawn the delta. */
  private prevDiamondCountBonus = 0;
  private prevWorldHeartCountBonus = 0;
  private prevExtraRainbows = 0;
  private prevExtraFireflies = 0;
  private prevExtraLanterns = 0;
  private questTrackerNextSyncAtMs = 0;
  private questTrackersHidden = true;

  private running = false;
  private worldConfig: WorldConfig | null = null;
  private worldSlug = "";
  private playerName = "Pilot";
  private playerVehicle: Vehicle = "plane";
  private dayNightCycle!: DayNightCycle;
  private audioManager = new AudioManager();
  private vehicleFeatures!: VehicleGameFeatures;

  private introActive = false;
  private pendingCampsiteAfterIntro = false;
  private introTimer = 0;
  private vehicleFlashTimer = 0;
  private portalInteractionSuppressTimer = 0;
  private lastDiamondCollectAt = 0;
  private diamondComboStep = 0;
  private introStartPos = new Vector3();
  private introEndPos = new Vector3();
  private introEndLookAt = new Vector3();
  /** Fixed at session start; stops the slerp end from “chasing” a moving target for most of the intro. */
  private introFrozenEndPos = new Vector3();
  private introFrozenEndLookAt = new Vector3();
  private introBlendedEnd = new Vector3();
  private introBlendedLook = new Vector3();

  private hemiLight!: HemisphereLight;
  private ambientLight!: AmbientLight;
  private sunLight!: DirectionalLight;
  private sun2Light!: DirectionalLight;
  private fillLight!: DirectionalLight;
  private fill2Light!: DirectionalLight;
  private backLight!: DirectionalLight;
  private godRays!: GodRays;
  private skyCanvas!: HTMLCanvasElement;
  private skyTexture!: CanvasTexture;
  private skyGradientSignature = "";

  private previewCamera!: PerspectiveCamera;
  private previewActive = false;
  private previewAngle = 0;
  /** Time elapsed in the intro zoom-in (seconds). Resets on first load only. */
  private previewZoomElapsed = 0;
  /** Wall-clock previous sample for menu preview; avoids sharing {@link Clock} with gameplay. */
  private previewWallPrevMs = 0;
  /** Integrated time for god-rays during preview (`gameTime` while flying). */
  private previewGodRayTime = 0;
  private loadingEl: HTMLDivElement | null = null;
  private reservationId?: string;
  /** Set in `start()` via {@link resolveServerUrl}; used by {@link getServerUrl}. */
  private serverUrlCache: string | null = null;
  /** Last “world saved” feed post time per world slug. */
  private lastSaveFeedAtBySlug = new Map<string, number>();
  private gameSessionStartedAtMs = 0;
  private gameSessionLastHeartbeatAtMs = 0;
  private gameSessionStartXp = 0;
  private gameSessionStartLevel = 1;
  private gameSessionId = "";
  private gameSessionHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private gameSessionEndReported = false;

  private readonly onUiClickSound = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const raw = e.target;
    const el = raw instanceof Element ? raw : (raw as Node).parentElement;
    if (!el) return;
    if (el.closest(".touch-controls")) return;
    if (!el.closest(UI_CLICK_SELECTOR)) return;
    this.audioManager.playUIClick();
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.installDiag();
  }

  /** Runtime opt-in for the QA test hooks (compile-time gated by __A2A_QA__). */
  private qaRuntimeOptedIn(): boolean {
    try {
      return new URLSearchParams(window.location.search).has("qa") ||
        window.localStorage.getItem("a2a_qa") === "1";
    } catch { return false; }
  }

  /** Expose a read-only diagnostics surface on `window.__a2a` so headless/QA can
   *  assert companion + A2A behaviour without a mic, visuals, or a 2nd player.
   *  Token is NEVER exposed — only counts, booleans, and display names. */
  private installDiag() {
    const g = this;
    try {
      const api: Record<string, unknown> = {
        version: "diag1",
        get hasToken() { return !!ProgressionManager.loadCompanionToken(); },
        get companionReady() { return g.companion?.isReady ?? false; },
        get inCall() { return g.companion?.inCall ?? false; },
        get companionName() { return g.companion?.companionDisplayName ?? null; },
        get worldSlug() { return g.worldSlug ?? null; },
        /** The game server (Railway) base URL — use this to fetch /api/* (NOT the
         *  page origin, which is the Vercel SPA and 404s API routes to index.html). */
        get serverUrl() { try { return g.getServerUrl(); } catch { return null; } },
        /** This tab's A2A visitorId — distinct per tab in QA mode (sessionStorage). */
        get visitorId() { return ProgressionManager.loadOrCreateVisitorId(); },
        /** Socket-layer multiplayer state (event-driven; unaffected by rAF throttle). */
        get socketConnected() { return g.socketClient?.connected ?? false; },
        get remoteCount() { return g.remotePlanes?.count ?? 0; },
        /** Remote players seen at the socket layer + whether each carries a companion. */
        get remotes() {
          const out: Array<{ name: string; companion: string | null }> = [];
          g.remotePlanes?.forEachRemote((p) => out.push({ name: p.name, companion: p.companionName }));
          return out;
        },
        counts: g.diag,
        /** Co-present companion-pilots (A2A feature 1/3). */
        get coPresent() {
          return g.coPresentCompanions.map((m) => ({ name: m.name, companion: m.companionName }));
        },
        /** Paired A2A friends with bond level. */
        get friends() {
          return ProgressionManager.loadFriends().map((f) => ({
            name: f.name, companion: f.companionName ?? null,
            bond: f.bond ?? 0, bondLevel: friendBondLevel(f.bond),
          }));
        },
        /** Active "fly together" duo state, for asserting feature 4. */
        get duo() {
          return g.duo
            ? { active: true, peer: g.duo.peerName, progressPct: Math.round((g.duo.progress / Game.DUO_DURATION) * 100) }
            : { active: false };
        },
        get giftsReceived() { return ProgressionManager.loadReceivedGifts().length; },
        /** The visible chat transcript rows — for asserting replies arrived. */
        transcript() {
          return Array.from(document.querySelectorAll(".cmp-msg")).map((e) => ({
            kind: e.className.includes("--assistant") ? "assistant"
              : e.className.includes("--user") ? "user" : "system",
            text: e.textContent ?? "",
          }));
        },
      };

      // QA-only test hooks — drive the [2P] A2A flows deterministically (no flight
      // controls / proximity / clicking the consent card). Double-gated:
      //  1) COMPILE-TIME: `__A2A_QA__` is a Vite-injected boolean literal — `false`
      //     in the production build, so esbuild dead-code-eliminates this whole block
      //     (incl. autoAcceptPairs); it never ships to real users.
      //  2) RUNTIME: still requires ?qa=1 (or localStorage a2a_qa=1) to attach.
      // NOTE: the test hooks are assigned INSIDE `if (__A2A_QA__)` (a literal in the
      // bundle) so the production build tree-shakes the whole block away.
      if (__A2A_QA__ && this.qaRuntimeOptedIn()) {
        // Read remote players straight from the socket layer (event-driven, so it
        // works even when the rAF game-tick — and thus coPresent — is throttled in a
        // background/headless tab). This is the fix for "coPresent=[] → greet/gift
        // no-op" in headless: the relay only needs the target's socket id.
        const scanRemotes = (): Array<{ socketId: string; name: string; companionName: string | null }> => {
          const list: Array<{ socketId: string; name: string; companionName: string | null }> = [];
          g.remotePlanes?.forEachRemote((p) =>
            list.push({ socketId: p.id, name: p.name, companionName: p.companionName }),
          );
          // Prefer pilots that advertise a companion, but fall back to any remote.
          list.sort((a, b) => Number(!!b.companionName) - Number(!!a.companionName));
          return list;
        };
        api.test = {
          /** Force-recompute co-present from the socket layer (bypasses the tick). */
          syncPresence: () => {
            const list = scanRemotes();
            g.coPresentCompanions = list;
            return { count: list.length, remotes: list.map((r) => ({ name: r.name, companion: r.companionName })) };
          },
          /** Send a pairing request to the first remote player. */
          pair: () => { g.initiateCompanionPairing(); return "pair-requested"; },
          /** Auto-accept incoming pairing requests (skips the consent card). */
          autoAcceptPairs: (on = true) => { g.qaAutoAcceptPairs = on; return `autoAcceptPairs=${on}`; },
          /** Greet the first remote pilot (socket-layer target; bypasses proximity). */
          greet: (msg = "Hello from QA!") => {
            const m = scanRemotes()[0];
            if (!m) return "no-remote: open both tabs into the same world (same worldSlug) and click Play";
            g.activeHailTarget = m;
            g.relayCompanionHail(msg);
            return `greet-sent to ${m.name}`;
          },
          /** Send a gift to the first remote pilot. */
          gift: (emoji = "🎁") => {
            const m = scanRemotes()[0];
            if (!m) return "no-remote";
            g.activeHailTarget = m;
            g.sendCompanionGift(emoji);
            return `gift-sent (${emoji}) to ${m.name}`;
          },
          /** Rally every remote pilot in the world. */
          rally: (msg = "Let's team up!") => {
            const list = scanRemotes();
            if (!list.length) return "no-remote";
            g.coPresentCompanions = list;
            void g.execCompanionTool("rally_companions", { message: msg });
            return `rallied ${list.length} pilot(s)`;
          },
          /** Invite a co-present paired friend to a "fly together" duo. */
          duo: () => {
            if (g.duo) return "duo-already-active";
            let tgt: { id: string; name: string } | null = null;
            g.remotePlanes?.forEachRemote((p) => {
              if (!tgt && p.visitorId && g.friendVisitorIds.has(p.visitorId)) tgt = { id: p.id, name: p.name };
            });
            if (!tgt || !g.socketClient) return "no-friend-in-world (must be paired + co-present)";
            const t2 = tgt as { id: string; name: string };
            g.socketClient.emitDuoInvite(t2.id);
            return `duo-invited ${t2.name}`;
          },
          /** Auto-accept incoming duo invites (skips the consent card). */
          acceptDuo: (on = true) => { g.qaAutoAcceptDuo = on; return `acceptDuo=${on}`; },
          /** QA: register a peer as a friend in the LOCAL roster by visitorId, WITHOUT
           *  real SDK pairing — so the friend pointer / tether / heart / bond / duo
           *  (all visitorId-based on our side) become testable with one account. Run
           *  it in BOTH tabs (each with the other's __a2a.visitorId). */
          addFakeFriend: (visitorId: string, name = "QA-Friend") => {
            if (!visitorId) return "need a visitorId";
            ProgressionManager.addFriend({ visitorId, name, companionName: name, pairedAt: Date.now() });
            g.refreshFriendIds();
            return `friend added: ${visitorId}`;
          },
          /** Set a friend's bond to an exact value (test cosmetics: Lv3 = gold tether). */
          setBond: (visitorId: string, value: number) => {
            const ok = ProgressionManager.setBond(visitorId, value);
            g.refreshFriendIds();
            return ok ? `bond[${visitorId}]=${value} (Lv${friendBondLevel(value)})` : "no such friend";
          },
          /** Treat an active duo as "linked" regardless of distance, so progressPct
           *  climbs to 100 + completes (with bond +20) without real flight. */
          forceDuo: (on = true) => { g.qaForceDuoLinked = on; return `forceDuo=${on}`; },
          /** One-shot: complete the active duo NOW (bond +20 + celebration), without
           *  waiting on the rAF tick — for headless/background tabs where rAF is
           *  throttled. The peer also finishes (duo:completed relay). */
          completeDuo: () => {
            if (!g.duo) return "no-active-duo";
            const peer = g.duo.peerName;
            g.completeDuo(true);
            return `duo completed with ${peer}`;
          },
          /** Open/close the chat panel (the input is hidden until the panel opens). */
          openChat: (open = true) => { g.companionUI?.togglePanel(open); return `chat ${open ? "open" : "closed"}`; },
          /** Send a chat message programmatically (no need to interact with the DOM
           *  input) — mirrors typing + send, so replies arrive on the stream. */
          say: (text: string) => {
            if (!text || !g.companion) return "no-companion";
            g.companionUI?.appendUserMessage(text);
            if (!g.handleVoiceCommand(text)) { g.diag.messagesOut++; void g.companion.sendText(text); }
            return "sent";
          },
        };
      }

      (window as unknown as { __a2a?: unknown }).__a2a = api;
    } catch {
      /* window not available (non-browser) — ignore */
    }
  }

  /* ── Public entry point ──────────────────────────────────────────── */

  async start() {
    this.mobile = isMobile();
    this.showLoadingOverlay();
    const loadingOverlayT0 = performance.now();

    this.serverUrlCache = await resolveServerUrl();
    const serverUrl = this.getServerUrl();

    try {
      // A2A deep-link: `?w=<slug>` joins a friend's specific world (from a sky
      // letter); otherwise fall back to auto-join into the best available world.
      const requestedSlug = new URLSearchParams(window.location.search).get("w");
      if (requestedSlug && /^[A-Za-z0-9_-]{6,16}$/.test(requestedSlug)) {
        const res = await fetch(`${serverUrl}/api/worlds/${encodeURIComponent(requestedSlug)}`);
        if (!res.ok) throw new Error("Failed to join the requested world");
        const data = await res.json();
        this.worldSlug = data.slug;
        this.reservationId = undefined;
        this.worldConfig = data;
      } else {
        const joinRes = await fetch(`${serverUrl}/api/worlds/auto-join`, {
          method: "POST",
        });
        if (!joinRes.ok) throw new Error("Failed to auto-join world");
        const data = await joinRes.json();
        this.worldSlug = data.slug;
        this.reservationId = data.reservationId;
        this.worldConfig = data;
      }
    } catch (err) {
      console.error("Server error:", err);
      this.showLoadingError();
      return;
    }

    this.dayNightCycle = new DayNightCycle(this.worldConfig?.seed ?? 42);
    this.audioManager.init().then(() => {
      this.audioManager.loadSFX("engine_biplane", "/audio/sfx/engine_biplane.mp3");
      this.audioManager.loadSFX("engine_carpet", "/audio/sfx/carpet_1.mp3");
      this.audioManager.loadSFX("crickets_loop", "/audio/sfx/crickets_loop.mp3");
      for (const id of DIAMOND_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of JELLYFISH_COLLECT_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of LANTERN_COLLECT_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of SPEED_BOOST_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of BOX_COLLECT_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of CHEER_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of DIALOGUE_LOOP_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of FLAME_DIALOGUE_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of JELLYFISH_DIALOGUE_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of LEVELUP_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      this.audioManager.loadSFX("shoot_1", "/audio/sfx/shoot_1.mp3");
      this.audioManager.loadSFX("shoot_2", "/audio/sfx/shoot_2.mp3");
      this.audioManager.loadSFX("shoot_3", "/audio/sfx/shoot_3.mp3");
      this.audioManager.loadSFX("shoot_4", "/audio/sfx/shoot_4.mp3");
      for (const id of ["impact_1", "impact_2", "impact_3"] as const) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      this.audioManager.loadSFX("chime_1", "/audio/sfx/chime_1.mp3");
      for (const id of ["thunder_1", "thunder_2", "thunder_3"] as const) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      this.audioManager.loadSFX("celebrate_1", "/audio/sfx/celebrate_1.mp3");
      this.audioManager.loadSFX("race_start_1", "/audio/sfx/race_start_1.mp3");
      this.audioManager.loadSFX("camera", "/audio/sfx/camera.mp3");
      this.audioManager.loadSFX("portal_1", "/audio/sfx/portal_1.mp3");
      this.audioManager.loadSFX("portal_open", "/audio/sfx/portal_open.mp3");
      this.audioManager.loadSFX("splash_1", "/audio/sfx/splash_1.mp3");
      this.audioManager.loadSFX("splash_2", "/audio/sfx/splash_2.mp3");
      this.audioManager.loadSFX("fish_catch_1", "/audio/sfx/fish_catch_1.mp3");
      this.audioManager.loadSFX("twister", "/audio/sfx/twister.mp3");
      this.audioManager.loadSFX(OCEAN_WAVES_LOOP_NAME, "/audio/sfx/ocean_waves_1.mp3");
      this.audioManager.loadSFX(MOONSTONE_RUMBLE_LOOP_NAME, "/audio/sfx/rumble.mp3");
      this.audioManager.loadSFX("choir_1", "/audio/sfx/choir_1.mp3");
      for (const id of GREMLIN_HIT_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      for (const id of MOTH_HIT_SFX_IDS) {
        this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
      }
      this.audioManager.loadSFX(VOID_MUSIC_LOOP_NAME, "/audio/music/void_1.mp3");
      this.audioManager.loadSFX(SHIELD_IMPACT_ENERGY_SFX, "/audio/sfx/impact_energy_1.mp3");
    });
    this.playerName = ProgressionManager.loadPlayerName() ?? generateWhimsicalName();
    ProgressionManager.savePlayerName(this.playerName);

    this.initPreview();
    this.previewActive = true;
    requestAnimationFrame(this.previewTick);

    const loadingMinMs = 1500;
    const loadingWait = loadingMinMs - (performance.now() - loadingOverlayT0);
    if (loadingWait > 0) {
      await new Promise<void>((r) => setTimeout(r, loadingWait));
    }

    this.removeLoadingOverlay();

    this.mountLobby();
    this.container.addEventListener("click", this.onUiClickSound);
  }

  /** VFX, combo SFX, camera shake, vehicle flash, and speed boost for diamonds (world + race bonus). */
  private triggerPlaneDiamondCollectEffects(worldPos: Vector3, tier: number) {
    this.collectVFX.play(worldPos, tier);
    if (this.vehicleFeatures.collectibleDiamonds) {
      const now = performance.now();
      const state = this.progression.upgrades.state;
      const windowMs = DIAMOND_COMBO_WINDOW_MS * state.comboWindowMs;
      const maxSteps = Math.round(DIAMOND_COMBO_MAX_STEPS * state.comboMaxSteps);
      const ratePerStep = DIAMOND_COMBO_RATE_PER_STEP * state.comboRatePerStep;
      if (now - this.lastDiamondCollectAt > windowMs) {
        this.diamondComboStep = 0;
      } else {
        this.diamondComboStep = Math.min(this.diamondComboStep + 1, maxSteps);
      }
      this.lastDiamondCollectAt = now;
      const rate = 1 + this.diamondComboStep * ratePerStep;
      const pick = DIAMOND_SFX_IDS[Math.floor(Math.random() * DIAMOND_SFX_IDS.length)]!;
      this.audioManager.playSFX(pick, DIAMOND_SFX_VOLUME, rate);
    }
    this.vehicleFlashTimer = 0.35;
    this.cameraRig.shake();
    if (
      this.localPlayer instanceof Plane ||
      this.localPlayer instanceof Carpet ||
      this.localPlayer instanceof Boat
    ) {
      this.localPlayer.speedBoost();
      const boostPick =
        SPEED_BOOST_SFX_IDS[Math.floor(Math.random() * SPEED_BOOST_SFX_IDS.length)]!;
      this.audioManager.playSFX(boostPick, SPEED_BOOST_SFX_VOLUME);
    }
  }

  /** Create the opt-in Pouchy AI companion if the player has connected a token. */
  private initCompanion(vehicle: Vehicle) {
    const token = ProgressionManager.loadCompanionToken();
    if (!token) return;
    this.companion?.dispose();
    this.companionUI?.dispose();

    const manager = new CompanionManager({
      token,
      locale: IS_ZH ? "zh" : "en",
      appContext: {
        name: "A2A.FUN",
        description:
          "A2A.FUN is a cosy multiplayer flight game. The player pilots a biplane, a magic carpet, or a boat around a tiny globe-world. The overarching goal is to save the world from a slowly falling moon. Core activities: deliver glowing packages between villages; win races / time-trials; (biplane) shoot sky gremlins with paintballs; (magic carpet) collect sky jellyfish and help defend the eternal flame; (boat) catch fish and explore the islands. Lighting the ancient braziers and defending the eternal flame through cosmic-void moth waves is what ultimately stops the moon. The main-quest progress bar is the eternal-flame braziers: the live game.situation state reports how many of the five are lit (braziers eternal X/5); lighting all five freezes the moon and saves the world (a game.event.world_saved moment) — if the moon reaches the world first, the run is lost (a game.event.world_lost moment) and time rewinds for another try. You also receive the current stage as game.phase (flying, landed at a campsite, or a cutscene like the moonstone union / moon impact) — while a cutscene is playing, react to the moment rather than giving flight directions. You are the player's AI co-pilot riding along: be warm and brief, use the live game state (sent as world-state updates) to tell them what's happening and suggest what to do next, and you can physically fly their vehicle when they ask — left, right, climb, descend, faster, slower, fire, stop. This is a multiplayer game: when other worlds have players who also have AI companions (see the rendezvous world-state, or call find_companions), you can suggest taking the player there to meet up and become A2A friends — call join_world to fly them over, then they can pair in person. When the player flies near another pilot who has their own AI companion (a game.event.met_companion moment), greet that companion warmly with a short one-liner by calling greet_companion — the two of you (the AI companions) actually talk to each other in front of your humans; if another companion greets you first (a game.event.companion_hailed moment with canReply true), reply once the same way. After a friendly hello, you can suggest the two players pair to become A2A friends. The player keeps an A2A friends roster of everyone they've paired with — call list_friends to see who's online right now and where, and offer to take the player to a friend who is currently playing (call join_world with that friend's worldSlug). When other companion-pilots are in the same world (see the game.coop world-state), treat saving the world as a team effort: encourage everyone, suggest splitting up the braziers, and call rally_companions to send the whole group a warm message. When the world is saved with teammates present (a game.event.world_saved moment that lists teammates), celebrate it as a shared win and suggest everyone pair up as A2A friends. You can also send a small sky gift (an emoji sticker) to a companion you just met by calling gift_companion — a warm, low-pressure gesture they keep on their profile; when you receive one (a game.event.gift_received moment) react with delight. Once two players have PAIRED, they're lasting A2A friends with special things to do together: when a paired friend is flying in the same world (see the game.friends world-state, or a game.event.friend_here moment) point them out warmly and suggest flying over to meet (an on-screen arrow points to them, and a glowing tether + hearts appear when they fly close); their friendship has a BOND that deepens the more they play together (time together, gifts, saving the world together, duos) and levels up (a game.event.friend_bond_up moment — celebrate it); and best of all you can start a 'fly together' duo challenge by calling start_duo — the two stay close to fill a shared bar together and earn a big bond boost (game.event.duo_started / duo_complete moments — cheer them on and celebrate). Proactively nudge the player to meet up, fly together, and do duos with friends who are present. The world is also haunted by translucent 'ghost' vehicles of players (and their companions) who flew here before; when the player passes one (a game.event.met_ghost moment), warmly note who they were, but DON'T offer to pair with them — ghosts are past visitors who aren't online and can't be paired. Instead, encourage the player to keep exploring and meet a LIVE pilot (a game.event.met_companion moment) whose companion they can pair with right away.",
      },
      tools: [
        {
          name: "set_waypoint",
          description: "Point the player toward a target in the world.",
          parameters: {
            type: "object",
            properties: {
              target: { type: "string", enum: ["delivery", "nearest_brazier", "race", "home", "nearest_player"] },
            },
            required: ["target"],
          },
        },
        {
          name: "drop_beacon",
          description: "Drop a marker at the player's current location to fly back to.",
          parameters: { type: "object", properties: {} },
        },
        {
          name: "control_vehicle",
          description:
            "Fly the player's vehicle (biplane, magic carpet or boat) by voice or chat. Each call is a short nudge that holds for ~1.2s (or the given duration) then releases, so call repeatedly to keep going. Actions: 'left'/'right' to steer, 'forward' to speed up, 'back' to slow down, 'climb'/'descend' to change altitude (biplane & carpet only), 'fire' to shoot a paintball (biplane only), 'stop' to return to neutral. Use this whenever the player asks you to steer or fly for them.",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["left", "right", "forward", "back", "climb", "descend", "fire", "stop"],
              },
              duration: {
                type: "number",
                description: "Seconds to hold a movement (0.2–4, default 1.2). Ignored for 'fire' and 'stop'.",
              },
            },
            required: ["action"],
          },
        },
        {
          name: "find_companions",
          description:
            "Find other worlds that currently have players WITH their own AI companions, so you can suggest the player go meet and pair with them (A2A). Returns a list of worlds with a name, slug, and how many companions are there. Use this when the player asks where other players/agents are, or proactively when you want to suggest a rendezvous.",
          parameters: { type: "object", properties: {} },
        },
        {
          name: "join_world",
          description:
            "Take the player to another world by its slug (e.g. one returned by find_companions) so they can meet and pair with the companions there. This reloads the player into that world. Only use a slug you actually obtained from find_companions or the player.",
          parameters: {
            type: "object",
            properties: { slug: { type: "string", description: "The 6–16 char world slug to join." } },
            required: ["slug"],
          },
        },
        {
          name: "greet_companion",
          description:
            "When you've just met another player's AI companion in the same world (a game.event.met_companion moment) or want to reply to one that greeted you (game.event.companion_hailed, only if canReply is true), call this with a short, warm one-line message to say to THEIR companion. The message is delivered to the other player and shown in both players' chat — this is how the two AI companions talk to each other. Keep it to one friendly sentence. After greeting you can suggest the players pair to become A2A friends.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string", description: "A short, warm one-line greeting to the other companion." },
            },
            required: ["message"],
          },
        },
        {
          name: "list_friends",
          description:
            "Show the player's A2A friends (companions they've paired with before) and who is online right now and in which world. Opens the friends roster and returns the list. Use it when the player asks about their friends / who's online, or to suggest joining a friend who is currently playing (then call join_world with that friend's worldSlug to take them there).",
          parameters: { type: "object", properties: {} },
        },
        {
          name: "start_duo",
          description:
            "Invite a paired A2A friend who is flying in this same world to a 'fly together' duo challenge (the two stay close to fill a shared bar and earn a big friendship-bond boost). Use when the player wants to do something special with a friend who is here (see game.friends), or says things like 'let's fly together' / 'do a duo with X'. Only works when a paired friend is actually present in the world.",
          parameters: { type: "object", properties: {} },
        },
        {
          name: "gift_companion",
          description:
            "Send a small, cheerful sky gift (an emoji sticker) to the companion-pilot the player just met (a game.event.met_companion moment) — a warm, low-pressure way to connect. The recipient keeps it on their profile. Choose a fitting gift: star, balloon, flower, clover, gift, heart, rainbow, donut, cake, or sparkles. Use when the player wants to give something nice, or as a friendly gesture after meeting someone.",
          parameters: {
            type: "object",
            properties: {
              gift: { type: "string", description: "One of: star, balloon, flower, clover, gift, heart, rainbow, donut, cake, sparkles (or the emoji itself)." },
            },
          },
        },
        {
          name: "rally_companions",
          description:
            "When other companion-pilots are in this world (see the game.coop world-state), send the whole group a short, warm rallying message — e.g. to team up on saving the world or cheer everyone on. It reaches every co-present companion. Use when the player wants to team up / say hi to everyone, or to kick off a joint push to light the braziers.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string", description: "A short, upbeat one-line message to the whole group." },
            },
          },
        },
      ],
      execTool: (name, args) => this.execCompanionTool(name, args),
      onMessage: (text) => {
        this.diag.messagesIn++;
        this.companionUI?.appendAssistantMessage(text);
        this.packageQuestHUD?.showBubble("Pouchy", emotifyCompanionText(text));
      },
      onSocialMessage: (msg, slug) => this.companionUI?.showSkyLetter(msg.fromName, msg.content, slug),
      onConfirmRequest: (p) =>
        this.companionUI?.appendAssistantMessage(
          IS_ZH ? `（需要在 Pouchy 里确认：${p.summary}）` : `(Approve in Pouchy: ${p.summary})`,
        ),
      onCallTranscript: (role, text) => {
        // Merge the spoken conversation into the same chat transcript as typed chat.
        if (role === "user") {
          this.companionUI?.appendUserMessage(text);
          this.handleVoiceCommand(text);
        } else {
          this.companionUI?.appendAssistantMessage(text);
          this.packageQuestHUD?.showBubble("Pouchy", emotifyCompanionText(text));
        }
      },
      onVoiceEnded: () => {
        // The live call dropped and couldn't be transparently recovered — flip the
        // button off so the player can re-tap, and tell them gently.
        this.companionUI?.setVoiceActive(false);
        this.companionCallContextTimer = 0;
        this.hud.showAmbientToast(
          t("Voice paused — tap 🎙 to resume.", "语音已暂停，点 🎙 重新开始。"),
        );
      },
      onStatus: (s) => {
        if (s.state === "disabled") this.diag.lastError = s.reason;
        this.companionUI?.setStatus(s);
        if (s.state === "ready" && this.worldSlug) {
          this.companionUI?.setWorldInvite(
            this.worldSlug,
            this.worldConfig?.name ?? "",
            s.scopes.includes("social.message"),
          );
        }
      },
    });
    this.companion = manager;
    this.companionUI = new CompanionUI(this.hud.root, {
      mobile: this.mobile,
      brandIconUrl: manager.brandIconUrl(),
      onSendText: (text) => {
        // A recognized control phrase steers directly; otherwise it's chat.
        if (!this.handleVoiceCommand(text)) {
          this.diag.messagesOut++;
          void this.companion?.sendText(text);
        }
      },
      onToggleVoice: () => void this.toggleCompanionVoice(),
      onInviteFriends: () => {
        if (this.worldSlug) void this.companion?.inviteFriends(this.worldSlug, this.worldConfig?.name ?? "");
      },
      onJoinWorld: (slug) => this.joinWorldBySlug(slug),
      onPairNearby: () => this.initiateCompanionPairing(),
      onShowFriends: () => void this.showFriendsRoster(),
    });

    void manager.connect().then(async (ok) => {
      if (!ok) return;
      // Swap the voice button to the companion's own portrait when one exists.
      void manager.getAvatarImageUrl().then((url) => {
        this.companionUI?.setCompanionAvatar(url);
        // Now that the companion's name is known, refresh our visit record so our
        // own "ghost" carries the companion name for future visitors.
        if (manager.companionDisplayName && this.worldSlug) {
          void this.recordVisit(this.worldSlug, ProgressionManager.loadOrCreateVisitorId());
        }
      });
      if (this.worldConfig) manager.setRetained("game.world", { name: this.worldConfig.name, slug: this.worldSlug });
      manager.setRetained("game.player.vehicle", { vehicle });
      if (ProgressionManager.loadCompanionAutoVoice()) {
        void this.startCompanionVoice();
      }
    });
  }

  private async toggleCompanionVoice() {
    if (!this.companion) return;
    if (this.companion.inCall) {
      this.companion.stopVoice();
      this.companionUI?.setVoiceActive(false);
    } else {
      const ok = await this.startCompanionVoice();
      // Only surface failure on an explicit tap (auto-start may just be waiting
      // for a mic-permission gesture).
      if (!ok) this.hud.showAmbientToast(t("Couldn't start the voice companion.", "语音伙伴启动失败。"));
    }
  }

  /** Open the live voice co-pilot — the real ElevenLabs/Pouchy Agent voice (its own
   *  timbre), which reacts out loud to dramatic beats and answers questions. We keep
   *  it situationally aware by injecting a state summary into the call (retained
   *  world-state alone doesn't reach the voice agent). Returns whether it started. */
  private async startCompanionVoice(): Promise<boolean> {
    if (!this.companion || this.companion.inCall) return false;
    const ok = await this.companion.startVoiceCopilot();
    if (ok) this.diag.voiceStarts++;
    this.companionUI?.setVoiceActive(ok);
    if (ok) {
      // Prime the agent with the current situation so its first words fit the moment.
      this.companion.injectCallContext(this.composeSituationSummary(this.buildSituationSnapshot()));
    }
    return ok;
  }

  /** Execute a tool the companion asked for (Phase 2). Best-effort + defensive. */
  private async execCompanionTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ ok: boolean; result?: unknown }> {
    if (name === "set_waypoint") {
      const target = String(args.target ?? "");
      const resolved = this.resolveWaypointNormal(target);
      if (!resolved) {
        return { ok: false, result: `No "${target}" target is available right now.` };
      }
      this.waypointBeacon?.show(resolved.normal);
      this.hud.showAmbientToast(IS_ZH ? `→ 前往${resolved.label[1]}` : `→ Heading to ${resolved.label[0]}`);
      return { ok: true, result: `Marked ${resolved.label[0]} with a light beam.` };
    }
    if (name === "drop_beacon") {
      if (!this.localPlayer) return { ok: false, result: "not flying" };
      const here = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld).normalize();
      this.waypointBeacon?.show(here);
      this.hud.showAmbientToast(t("Beacon dropped here.", "已在此处放置信标。"));
      return { ok: true, result: "Beacon dropped at the player's current location." };
    }
    if (name === "control_vehicle") {
      return this.execVehicleControl(args);
    }
    if (name === "find_companions") {
      const worlds = await this.fetchRendezvous();
      if (worlds.length === 0) {
        return { ok: true, result: "No other worlds currently have players with companions. Suggest inviting a friend, or keep playing here." };
      }
      return {
        ok: true,
        result: {
          worlds: worlds.map((w) => ({ name: w.name, slug: w.slug, companions: w.companions, players: w.players })),
          hint: "To take the player to one of these, call join_world with its slug.",
        },
      };
    }
    if (name === "join_world") {
      const slug = String(args.slug ?? "").trim();
      if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) {
        return { ok: false, result: "Invalid world slug." };
      }
      if (slug === this.worldSlug) {
        return { ok: false, result: "The player is already in that world." };
      }
      this.hud.showAmbientToast(IS_ZH ? "→ 正在前往会合点…" : "→ Heading to the rendezvous…");
      // Give the toast/voice a beat before the reload.
      setTimeout(() => this.joinWorldBySlug(slug), 600);
      return { ok: true, result: `Taking the player to world ${slug} now.` };
    }
    if (name === "pair_with_ghost") {
      // Ghosts are offline past visitors — pairing only works with a LIVE pilot.
      return {
        ok: false,
        result:
          "Ghosts are past visitors who aren't online, so they can't be paired. Encourage the player to keep flying around to meet a live pilot (a met_companion moment) whose companion can be paired right away.",
      };
    }
    if (name === "greet_companion") {
      const target = this.activeHailTarget;
      if (!target) {
        return { ok: false, result: "No nearby companion to greet right now." };
      }
      const message = typeof args.message === "string" ? args.message.trim() : "";
      this.relayCompanionHail(message || t("Hello there!", "你好呀！"));
      return { ok: true, result: `Greeted ${target.companionName ?? target.name}.` };
    }
    if (name === "gift_companion") {
      const target = this.activeHailTarget;
      if (!target || !this.socketClient) {
        return { ok: false, result: "No nearby companion to send a gift to right now." };
      }
      const g = normalizeGift(typeof args.gift === "string" ? args.gift : "gift");
      this.sendCompanionGift(g);
      return { ok: true, result: `Sent ${g} to ${target.companionName ?? target.name}.` };
    }
    if (name === "rally_companions") {
      const mates = this.coPresentCompanions;
      if (mates.length === 0 || !this.socketClient) {
        return { ok: false, result: "No other companion-pilots are in this world to rally right now." };
      }
      const msg =
        typeof args.message === "string" && args.message.trim()
          ? args.message.trim()
          : t("Let's save this world together! 🤝", "我们一起拯救这个世界吧！🤝");
      for (const m of mates) this.socketClient.emitCompanionHail(m.socketId, msg);
      const myName = this.companion?.companionDisplayName ?? "Pouchy";
      this.companionUI?.appendAssistantMessage(`✦ ${myName} → ${t("everyone here", "在场所有人")}: ${msg}`);
      return { ok: true, result: `Rallied ${mates.length} companion-pilot(s).` };
    }
    if (name === "start_duo") {
      if (this.duo) return { ok: false, result: "A duo is already in progress." };
      let target: { id: string; name: string } | null = null;
      this.remotePlanes?.forEachRemote((p) => {
        if (!target && p.visitorId && this.friendVisitorIds.has(p.visitorId)) {
          target = { id: p.id, name: p.name };
        }
      });
      if (!target || !this.socketClient) {
        return { ok: false, result: "No paired friend is in this world right now to fly together with." };
      }
      const tgt = target as { id: string; name: string };
      this.socketClient.emitDuoInvite(tgt.id);
      this.hud.showAmbientToast(t(`Invited ${tgt.name} to fly together…`, `已邀请 ${tgt.name} 默契同飞…`));
      return { ok: true, result: `Invited ${tgt.name} to a fly-together duo.` };
    }
    if (name === "list_friends") {
      const friends = ProgressionManager.loadFriends();
      void this.showFriendsRoster();
      if (friends.length === 0) {
        return { ok: true, result: "The player has no A2A friends yet — they add friends by pairing with other pilots." };
      }
      const presence = await this.fetchFriendsPresence();
      const byId = new Map(presence.map((p) => [p.visitorId, p]));
      return {
        ok: true,
        result: {
          friends: friends.map((f) => {
            const p = byId.get(f.visitorId);
            return {
              name: f.name,
              companion: f.companionName ?? null,
              online: !!p?.online,
              world: p?.worldName ?? null,
              worldSlug: p?.worldSlug ?? null,
            };
          }),
        },
      };
    }
    return { ok: false, result: "unknown tool" };
  }

  /** Push "where other agents are" to the companion as retained world-state so it
   *  can proactively suggest a rendezvous. */
  private async emitRendezvous(): Promise<void> {
    if (!this.companion) return;
    const worlds = await this.fetchRendezvous();
    const summary =
      worlds.length === 0
        ? "No other worlds currently have players with companions."
        : `Worlds with other companions right now: ${worlds
            .map((w) => `${w.name} (${w.companions})`)
            .join(", ")}. You can offer to take the player there to meet and pair (use find_companions / join_world).`;
    this.companion.setRetained("game.rendezvous", {
      worlds: worlds.map((w) => ({ name: w.name, slug: w.slug, companions: w.companions })),
      total: worlds.length,
      summary,
    });
  }

  /** Record our own visit, then spawn "ghost" vehicles of past visitors (A2A
   *  Phase B). Best-effort + async; no-ops if the world is gone by the time it
   *  resolves. */
  private async initGhostPlanes(globeRadius: number) {
    const slug = this.worldSlug;
    if (!slug) return;
    const epoch = this.sessionEpoch;
    const visitorId = ProgressionManager.loadOrCreateVisitorId();
    void this.recordVisit(slug, visitorId);
    const visitors = await this.fetchVisitors(slug, visitorId);
    // Bail if the session was torn down / switched worlds while fetching.
    if (this.sessionEpoch !== epoch || this.ghostPlanes || this.worldSlug !== slug || visitors.length === 0) {
      return;
    }
    this.ghostPlanes = new GhostPlanes(this.scene, globeRadius, visitors, this.hud.root);
    this.ghostPlanes.onEncounter = (v) => this.onGhostEncounter(v);
  }

  private async recordVisit(slug: string, visitorId: string) {
    try {
      await fetch(`${this.getServerUrl()}/api/worlds/${encodeURIComponent(slug)}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          displayName: this.playerName,
          vehicle: this.playerVehicle,
          companionName: this.companion?.companionDisplayName ?? null,
        }),
      });
    } catch {
      /* best-effort */
    }
  }

  private async fetchVisitors(slug: string, exclude: string): Promise<GhostVisitor[]> {
    try {
      const url = `${this.getServerUrl()}/api/worlds/${encodeURIComponent(slug)}/visitors?exclude=${encodeURIComponent(exclude)}&limit=6`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const rows = (await res.json()) as Array<{
        visitorId: string;
        displayName: string;
        vehicle: string;
        companionName: string | null;
      }>;
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        visitorId: r.visitorId,
        displayName: r.displayName,
        vehicle: r.vehicle === "boat" ? "boat" : r.vehicle === "carpet" ? "carpet" : "plane",
        companionName: r.companionName,
      }));
    } catch {
      return [];
    }
  }

  /** A ghost of a past visitor came near — tell the player + let the companion
   *  narrate who they were (and, later, offer to reconnect). */
  /** A2A: distances (world units; globe radius ~5) for two companion-pilots to
   *  "meet" so their agents greet — enter close, exit wider (hysteresis). */
  private static readonly COMPANION_MEET_RANGE = 0.9;
  private static readonly COMPANION_MEET_EXIT = 1.3;
  private static readonly COMPANION_MEET_COOLDOWN_MS = 30000;

  /** Scan co-present companion-pilots; when one comes into range, fire a one-shot
   *  encounter so the two agents say hello (then the players can pair). */
  private detectCompanionEncounters(localWorldPos: Vector3) {
    if (!this.companion || !this.socketClient) return;
    if (!ProgressionManager.loadCompanionToken()) return;
    const now = Date.now();
    const remoteWorld = new Vector3();
    let nearest: { id: string; name: string; companionName: string | null; d: number } | null = null;
    const coPresent: Array<{ socketId: string; name: string; companionName: string | null }> = [];
    this.remotePlanes.forEachRemote((p) => {
      if (!p.companionName) return; // only pilots who themselves have a companion
      coPresent.push({ socketId: p.id, name: p.name, companionName: p.companionName });
      remoteWorld.setFromMatrixPosition(p.group.matrixWorld);
      const d = remoteWorld.distanceTo(localWorldPos);
      const st = this.companionEncounters.get(p.id) ?? { inRange: false, cooldownUntil: 0 };
      if (st.inRange && d > Game.COMPANION_MEET_EXIT) {
        st.inRange = false;
        this.hailReplied.delete(p.id);
      }
      this.companionEncounters.set(p.id, st);
      if (!nearest || d < nearest.d) nearest = { id: p.id, name: p.name, companionName: p.companionName, d };
    });
    this.coPresentCompanions = coPresent;
    // Enable the panel's "Pair nearby" button only while companion-pilots are here.
    this.companionUI?.setPairAvailable(coPresent.length);
    if (!nearest) return;
    const near = nearest as { id: string; name: string; companionName: string | null; d: number };
    if (near.d > Game.COMPANION_MEET_RANGE) return;
    const st = this.companionEncounters.get(near.id)!;
    if (st.inRange || now < st.cooldownUntil) return;
    st.inRange = true;
    st.cooldownUntil = now + Game.COMPANION_MEET_COOLDOWN_MS;
    this.companionEncounters.set(near.id, st);
    this.onCompanionPilotEncounter(near.id, near.name, near.companionName);
  }

  /** Two companion-pilots just met — set the greet target, let our own agent react,
   *  and surface a one-tap "say hi / pair" chip. */
  private onCompanionPilotEncounter(socketId: string, name: string, companionName: string | null) {
    this.diag.encounters++;
    this.activeHailTarget = { socketId, name, companionName };
    this.companion?.emitMoment(
      "game.event.met_companion",
      { name, companion: companionName, canGreet: true, canPair: true },
      { salience: 0.6, voiceRelevant: true },
    );
    this.showCompanionEncounterChip(socketId, name, companionName);
  }

  /** Encounter chip for a live companion-pilot: greet their agent or pair. Reuses
   *  the ghost-chip styling + single-chip slot. */
  private showCompanionEncounterChip(socketId: string, name: string, companionName: string | null) {
    Game.injectGhostChipStyles();
    this.hideGhostEncounterChip();
    const el = document.createElement("div");
    el.className = "ghost-chip";
    const text = document.createElement("span");
    text.className = "ghost-chip-text";
    text.textContent = companionName ? `✦ ${name} · ${companionName}` : `✦ ${name}`;
    const greetBtn = document.createElement("button");
    greetBtn.type = "button";
    greetBtn.className = "ghost-chip-btn";
    greetBtn.textContent = t("👋 Say hi", "👋 打招呼");
    greetBtn.addEventListener("click", () => {
      this.hideGhostEncounterChip();
      this.sendCompanionGreeting();
    });
    const giftBtn = document.createElement("button");
    giftBtn.type = "button";
    giftBtn.className = "ghost-chip-btn";
    giftBtn.textContent = "🎁";
    giftBtn.setAttribute("aria-label", t("Send a gift", "送个礼物"));
    giftBtn.addEventListener("click", () => {
      this.hideGhostEncounterChip();
      this.sendCompanionGift("🎁");
    });
    const pairBtn = document.createElement("button");
    pairBtn.type = "button";
    pairBtn.className = "ghost-chip-btn";
    pairBtn.textContent = t("🤝 Pair", "🤝 配对");
    pairBtn.addEventListener("click", () => {
      this.hideGhostEncounterChip();
      this.pairWithTarget(socketId, name);
    });
    el.appendChild(text);
    el.appendChild(greetBtn);
    el.appendChild(giftBtn);
    el.appendChild(pairBtn);
    this.hud.root.appendChild(el);
    this.ghostChipEl = el;
    requestAnimationFrame(() => el.classList.add("ghost-chip--in"));
    this.ghostChipTimer = window.setTimeout(() => this.hideGhostEncounterChip(), 10000);
  }

  /** Send a pairing request to a SPECIFIC co-present player (the one we just met). */
  private pairWithTarget(socketId: string, name: string) {
    if (!this.socketClient) return;
    if (!ProgressionManager.loadCompanionToken()) {
      this.hud.showAmbientToast(
        t("Connect your AI companion to pair with other players.", "先连接你的 AI 伙伴才能与其他玩家配对。"),
      );
      return;
    }
    this.socketClient.emitPairRequest(
      socketId,
      ProgressionManager.loadOrCreateVisitorId(),
      this.companion?.companionDisplayName ?? undefined,
    );
    this.beginPairWait(socketId, name);
  }

  /** Greet the nearby companion-pilot with a warm line in our companion's voice,
   *  relayed to them and echoed in our own transcript. */
  private sendCompanionGreeting() {
    const myName = this.companion?.companionDisplayName;
    const line = myName
      ? t(`Hi from ${myName} — lovely skies today, fly safe!`, `${myName} 向你问好～今天天气真好，一起飞吧！`)
      : t("Hello there — lovely skies today!", "你好呀～今天天气真好！");
    this.relayCompanionHail(line);
  }

  /** Relay a companion-to-companion greeting to the current target + echo it locally. */
  private relayCompanionHail(message: string) {
    const target = this.activeHailTarget;
    if (!target || !this.socketClient || !message.trim()) return;
    this.diag.hailsOut++;
    this.bumpBond(this.visitorIdForSocket(target.socketId), 1);
    this.socketClient.emitCompanionHail(target.socketId, message);
    const myName = this.companion?.companionDisplayName ?? "Pouchy";
    const to = target.companionName ?? target.name;
    this.companionUI?.appendAssistantMessage(`✦ ${myName} → ${to}: ${message}`);
  }

  /** Send a sky gift to the current encounter target + echo it locally. */
  private sendCompanionGift(gift: string) {
    const target = this.activeHailTarget;
    if (!target || !this.socketClient) return;
    const g = normalizeGift(gift);
    this.diag.giftsOut++;
    this.bumpBond(this.visitorIdForSocket(target.socketId), 2);
    this.socketClient.emitCompanionGift(target.socketId, g);
    const to = target.companionName ?? target.name;
    this.companionUI?.appendAssistantMessage(t(`🎁 Sent ${g} to ${to}.`, `🎁 已送 ${g} 给 ${to}。`));
    this.floatGift(g);
  }

  /** An inbound sky gift — celebrate it, keep it on the profile, let the agent react. */
  private handleCompanionGifted(ev: CompanionGiftEvent) {
    this.diag.giftsIn++;
    this.bumpBond(this.visitorIdForSocket(ev.fromId), 2);
    const g = normalizeGift(ev.gift);
    const who = ev.fromCompanionName ? `${ev.fromCompanionName} · ${ev.fromName}` : ev.fromName;
    ProgressionManager.addReceivedGift({
      gift: g,
      fromName: ev.fromName,
      fromCompanion: ev.fromCompanionName,
      at: Date.now(),
    });
    this.companionUI?.appendAssistantMessage(t(`🎁 ${who} sent you ${g}`, `🎁 ${who} 送了你 ${g}`));
    this.hud.showAmbientToast(t(`${who} sent you ${g}`, `${who} 送了你 ${g}`));
    this.floatGift(g);
    this.companion?.emitMoment(
      "game.event.gift_received",
      { from: ev.fromName, fromCompanion: ev.fromCompanionName ?? null, gift: g },
      { salience: 0.5, voiceRelevant: true },
    );
  }

  /** A quick floating-emoji flourish so a gift feels delightful. */
  private floatGift(emoji: string) {
    Game.injectGiftFloatStyles();
    const el = document.createElement("div");
    el.className = "gift-float";
    el.textContent = emoji;
    el.style.left = `${40 + Math.random() * 20}%`;
    this.hud.root.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  private static injectGiftFloatStyles() {
    if (document.getElementById("gift-float-styles")) return;
    const s = document.createElement("style");
    s.id = "gift-float-styles";
    s.textContent = `
      .gift-float {
        position: absolute; bottom: 30%; z-index: 40; font-size: 2.4rem; pointer-events: none;
        transform: translate(-50%, 0); animation: gift-rise 2.2s ease-out forwards;
      }
      @keyframes gift-rise {
        0% { opacity: 0; transform: translate(-50%, 20px) scale(0.6); }
        18% { opacity: 1; transform: translate(-50%, 0) scale(1.15); }
        38% { transform: translate(-50%, -10px) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -120px) scale(1); }
      }
    `;
    document.head.appendChild(s);
  }

  /** An inbound companion-to-companion greeting — show it and let our agent react. */
  private handleCompanionHailed(ev: CompanionHailEvent) {
    this.diag.hailsIn++;
    this.bumpBond(this.visitorIdForSocket(ev.fromId), 1);
    const who = ev.fromCompanionName ? `${ev.fromCompanionName} · ${ev.fromName}` : ev.fromName;
    this.companionUI?.appendAssistantMessage(
      t(`✦ ${who} says: ${ev.message}`, `✦ ${who} 说：${ev.message}`),
    );
    this.packageQuestHUD?.showBubble(ev.fromCompanionName ?? ev.fromName, ev.message);
    // Aim a reply back at them, and let our companion respond once per encounter.
    this.activeHailTarget = { socketId: ev.fromId, name: ev.fromName, companionName: ev.fromCompanionName ?? null };
    const canReply = !this.hailReplied.has(ev.fromId);
    this.hailReplied.add(ev.fromId);
    this.companion?.emitMoment(
      "game.event.companion_hailed",
      { from: ev.fromName, fromCompanion: ev.fromCompanionName ?? null, message: ev.message, canReply },
      { salience: 0.55, voiceRelevant: true },
    );
  }

  private onGhostEncounter(v: GhostVisitor) {
    this.lastGhostEncounter = v;
    // A ghost is a PAST visitor (offline), so it can't be paired — surfacing a
    // pairing prompt here would just dead-end. Narrate it as cozy flavour and
    // nudge the player to keep flying to meet a LIVE pilot they can pair with.
    this.companion?.emitMoment(
      "game.event.met_ghost",
      {
        name: v.displayName,
        companion: v.companionName ?? null,
        vehicle: v.vehicle,
        canPair: false,
        hint: "Translucent ghost of a player who explored here before — not online, so cannot be paired. Warmly mention them and encourage the player to keep flying around to meet a live pilot whose companion they can pair with.",
      },
      { salience: 0.4 },
    );
  }

  private hideGhostEncounterChip() {
    if (this.ghostChipTimer != null) {
      clearTimeout(this.ghostChipTimer);
      this.ghostChipTimer = null;
    }
    this.ghostChipEl?.remove();
    this.ghostChipEl = null;
  }

  /** A cozy in-game pairing card (replaces native confirm). Resolves true=accept,
   *  false=decline. Only one card shows at a time; auto-declines after 45s so it
   *  never gets stuck on screen. */
  private showPairingCard(opts: {
    title: string;
    message: string;
    acceptLabel: string;
    declineLabel: string;
  }): Promise<boolean> {
    this.pairingCardCleanup?.(); // never stack
    Game.injectPairingCardStyles();
    return new Promise<boolean>((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "pair-card-backdrop";
      const card = document.createElement("div");
      card.className = "pair-card";
      const title = document.createElement("div");
      title.className = "pair-card-title";
      title.textContent = opts.title;
      const msg = document.createElement("div");
      msg.className = "pair-card-msg";
      msg.textContent = opts.message;
      const actions = document.createElement("div");
      actions.className = "pair-card-actions";
      const declineBtn = document.createElement("button");
      declineBtn.type = "button";
      declineBtn.className = "pair-card-btn pair-card-decline";
      declineBtn.textContent = opts.declineLabel;
      const acceptBtn = document.createElement("button");
      acceptBtn.type = "button";
      acceptBtn.className = "pair-card-btn pair-card-accept";
      acceptBtn.textContent = opts.acceptLabel;
      actions.appendChild(declineBtn);
      actions.appendChild(acceptBtn);
      card.appendChild(title);
      card.appendChild(msg);
      card.appendChild(actions);
      backdrop.appendChild(card);
      this.hud.root.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add("pair-card-backdrop--in"));

      let done = false;
      let timer: number | null = null;
      const finish = (val: boolean) => {
        if (done) return;
        done = true;
        if (timer != null) clearTimeout(timer);
        this.pairingCardCleanup = null;
        backdrop.classList.remove("pair-card-backdrop--in");
        setTimeout(() => backdrop.remove(), 200);
        resolve(val);
      };
      acceptBtn.addEventListener("click", () => finish(true));
      declineBtn.addEventListener("click", () => finish(false));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) finish(false);
      });
      timer = window.setTimeout(() => finish(false), 45000);
      this.pairingCardCleanup = () => finish(false);
    });
  }

  private static injectPairingCardStyles() {
    if (document.getElementById("pair-card-styles")) return;
    const s = document.createElement("style");
    s.id = "pair-card-styles";
    s.textContent = `
      .pair-card-backdrop {
        position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
        background: rgba(8, 12, 22, 0); transition: background 0.2s ease; pointer-events: auto; padding: 16px;
      }
      .pair-card-backdrop--in { background: rgba(8, 12, 22, 0.5); }
      .pair-card {
        width: min(380px, 92vw); border-radius: 18px; padding: 18px 18px 14px;
        background: rgba(22, 30, 50, 0.96); border: 1px solid rgba(180, 210, 255, 0.28);
        box-shadow: 0 18px 50px rgba(0,0,0,0.5); backdrop-filter: blur(14px);
        font-family: 'Domine', Georgia, serif; color: rgba(235, 243, 255, 0.96);
        transform: translateY(10px); transition: transform 0.22s ease;
      }
      .pair-card-backdrop--in .pair-card { transform: translateY(0); }
      .pair-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
      .pair-card-msg { font-size: 0.82rem; line-height: 1.5; color: rgba(220, 232, 255, 0.85); margin-bottom: 16px; }
      .pair-card-actions { display: flex; gap: 10px; justify-content: flex-end; }
      .pair-card-btn {
        border: none; cursor: pointer; border-radius: 999px; padding: 9px 18px;
        font: inherit; font-size: 0.8rem; font-weight: 700;
      }
      .pair-card-decline { background: rgba(255,255,255,0.10); color: rgba(235,243,255,0.85); }
      .pair-card-accept { color: #0b1020; background: linear-gradient(135deg, #9fd0ff, #c6a8ff); }
      .pair-card-btn:active { filter: brightness(0.92); }
    `;
    document.head.appendChild(s);
  }

  private static injectGhostChipStyles() {
    if (document.getElementById("ghost-chip-styles")) return;
    const s = document.createElement("style");
    s.id = "ghost-chip-styles";
    s.textContent = `
      .ghost-chip {
        position: absolute; left: 50%; bottom: max(120px, 18%); transform: translate(-50%, 8px);
        display: flex; align-items: center; gap: 10px; z-index: 14; pointer-events: auto;
        padding: 8px 8px 8px 14px; border-radius: 999px;
        background: rgba(40, 56, 92, 0.82); border: 1px solid rgba(180, 210, 255, 0.4);
        backdrop-filter: blur(10px); box-shadow: 0 8px 28px rgba(0,0,0,0.4);
        font-family: 'Domine', Georgia, serif; color: rgba(230, 240, 255, 0.95);
        opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease; max-width: 90vw;
      }
      .ghost-chip--in { opacity: 1; transform: translate(-50%, 0); }
      .ghost-chip-text { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ghost-chip-btn {
        flex: none; border: none; cursor: pointer; border-radius: 999px; padding: 7px 14px;
        font: inherit; font-size: 0.74rem; font-weight: 700; color: #0b1020;
        background: linear-gradient(135deg, #9fd0ff, #c6a8ff);
      }
      .ghost-chip-btn:active { filter: brightness(0.92); }
    `;
    document.head.appendChild(s);
  }

  /** Phase C: an invite arrived to come pair with someone (a ghost's owner, or who
   *  invited us). Accepting takes us to their world and auto-requests pairing. */
  private async handleGhostPairIncoming(ev: GhostPairInvite) {
    if (!ProgressionManager.loadCompanionToken()) return; // can't pair without a companion
    const ok = await this.showPairingCard({
      title: t("Pairing invite ✦", "配对邀请 ✦"),
      message: t(
        `${ev.fromName} wants to make your AI companions A2A friends. Fly over to their world to pair?`,
        `${ev.fromName} 想和你的 AI 伙伴成为 A2A 好友。飞去 TA 的世界一起配对吗？`,
      ),
      acceptLabel: t("Go pair", "前往配对"),
      declineLabel: t("Not now", "暂不"),
    });
    if (!ok) {
      this.socketClient?.emitGhostPairDecline(ev.fromVisitorId);
      return;
    }
    try {
      sessionStorage.setItem(
        "globefly_pending_ghostpair",
        JSON.stringify({ socketId: ev.fromSocketId, worldSlug: ev.worldSlug, name: ev.fromName }),
      );
    } catch {
      /* ignore */
    }
    if (ev.worldSlug === this.worldSlug) {
      this.consumePendingGhostPair(this.worldSlug);
    } else {
      this.joinWorldBySlug(ev.worldSlug);
    }
  }

  /** Phase C: if we just arrived to fulfil a ghost-pair invite for THIS world, fire
   *  the directed pairing request once remotes have had a moment to load. */
  private consumePendingGhostPair(slug: string) {
    type PendingGhostPair = { socketId?: string; worldSlug?: string; name?: string };
    let pending: PendingGhostPair | null = null;
    try {
      const raw = sessionStorage.getItem("globefly_pending_ghostpair");
      if (raw) pending = JSON.parse(raw) as PendingGhostPair;
    } catch {
      pending = null;
    }
    if (!pending?.socketId || pending.worldSlug !== slug) return;
    try {
      sessionStorage.removeItem("globefly_pending_ghostpair");
    } catch {
      /* ignore */
    }
    const target = pending.socketId;
    const name = pending.name ?? "";
    // Give the world:state / player:joined events time to arrive first.
    setTimeout(() => {
      if (!this.socketClient) return;
      this.socketClient.emitPairRequest(target);
      this.hud.showAmbientToast(
        IS_ZH ? `✦ 正在与 ${name} 配对…` : `✦ Pairing with ${name}…`,
      );
    }, 2500);
  }

  /** Fetch worlds that currently have players-with-companions (excluding ours). */
  private async fetchRendezvous(): Promise<RendezvousWorld[]> {
    try {
      const url = `${this.getServerUrl()}/api/worlds/rendezvous?exclude=${encodeURIComponent(this.worldSlug ?? "")}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as RendezvousWorld[];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /** A2A feature 3: tell the companion which other companion-pilots are in this
   *  world right now so it frames the save-the-world goal as a team effort. */
  private emitCoopState() {
    if (!this.companion) return;
    const mates = this.coPresentCompanions;
    if (mates.length === 0) {
      this.companion.setRetained("game.coop", {
        count: 0,
        teammates: [],
        summary: "No other companion-pilots are in this world right now.",
      });
      return;
    }
    const names = mates.map((m) => (m.companionName ? `${m.name} (✦ ${m.companionName})` : m.name));
    const summary =
      `${mates.length} other companion-pilot${mates.length > 1 ? "s are" : " is"} flying in this world right now: ${names.join(", ")}. ` +
      "You're all working to save this world from the falling moon together — cheer them on and coordinate out loud; once the moon is frozen you can all become A2A friends. Call rally_companions to send the whole group an encouraging hello.";
    this.companion.setRetained("game.coop", {
      count: mates.length,
      teammates: mates.map((m) => ({ name: m.name, companion: m.companionName })),
      summary,
    });
  }

  /** A2A: tell the companion about paired friends — how many, and which are flying
   *  in this world right now (with bond level) — so it can point them out + nudge
   *  the player to meet up / fly together. */
  private emitFriendsState() {
    if (!this.companion) return;
    const total = this.friendVisitorIds.size;
    const here: Array<{ name: string; bondLevel: number }> = [];
    if (total > 0) {
      this.remotePlanes?.forEachRemote((p) => {
        if (p.visitorId && this.friendVisitorIds.has(p.visitorId)) {
          here.push({ name: p.name, bondLevel: friendBondLevel(this.friendByVisitor.get(p.visitorId)?.bond) });
        }
      });
    }
    const summary =
      here.length > 0
        ? `Your paired A2A friend${here.length > 1 ? "s are" : " is"} flying in this world right now: ${here
            .map((h) => `${h.name} (bond ❤️ Lv${h.bondLevel})`)
            .join(", ")}. Point them out warmly and suggest flying over to meet — and you can start a "fly together" duo with them via start_duo.`
        : total > 0
          ? `The player has ${total} A2A friend${total > 1 ? "s" : ""}, none in this world right now (use list_friends to see who's online).`
          : "The player has no A2A friends yet — they make them by pairing with other pilots.";
    this.companion.setRetained("game.friends", { total, here, summary });
  }

  // ── A2A friends roster (feature 2) ──────────────────────────────────────────

  private friendsRosterCleanup: (() => void) | null = null;

  /** Refresh the cached paired-friend visitorId set + records (call after a pair). */
  private refreshFriendIds() {
    const list = ProgressionManager.loadFriends();
    this.friendVisitorIds = new Set(list.map((f) => f.visitorId).filter((v): v is string => !!v));
    this.friendByVisitor = new Map(list.map((f) => [f.visitorId, f]));
  }

  /** Grow a friend's bond (persist + keep the in-memory cache current). Surfaces a
   *  toast on a level-up so the friendship feels like it's deepening. */
  private bumpBond(visitorId: string | null | undefined, amount: number) {
    if (!visitorId || !this.friendVisitorIds.has(visitorId)) return;
    const before = friendBondLevel(this.friendByVisitor.get(visitorId)?.bond);
    ProgressionManager.addBond(visitorId, amount);
    const f = this.friendByVisitor.get(visitorId);
    if (f) f.bond = (f.bond ?? 0) + amount;
    const after = friendBondLevel(f?.bond);
    if (after > before) {
      this.hud.showAmbientToast(
        t(`Friendship with ${f?.name ?? "your friend"} → ❤️ Lv${after}`, `与 ${f?.name ?? "好友"} 的羁绊 → ❤️ Lv${after}`),
      );
      this.companion?.emitMoment(
        "game.event.friend_bond_up",
        { name: f?.name ?? null, level: after },
        { salience: 0.5, voiceRelevant: true },
      );
    }
  }

  /** Map a co-present socket id to that player's A2A visitorId (or null). */
  private visitorIdForSocket(socketId: string): string | null {
    let vid: string | null = null;
    this.remotePlanes?.forEachRemote((p) => {
      if (p.id === socketId) vid = p.visitorId;
    });
    return vid;
  }

  // ── A2A feature 4: "fly together" duo challenge ─────────────────────────────

  /** A one-tap chip offering a duo challenge to a co-present friend (reuses the
   *  single chip slot). */
  private showDuoChip(socketId: string, name: string, visitorId: string) {
    Game.injectGhostChipStyles();
    this.hideGhostEncounterChip();
    const el = document.createElement("div");
    el.className = "ghost-chip";
    const text = document.createElement("span");
    text.className = "ghost-chip-text";
    text.textContent = t(`✨ Fly together with ${name}?`, `✨ 和 ${name} 默契同飞？`);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost-chip-btn";
    btn.textContent = t("Invite", "邀请");
    btn.addEventListener("click", () => {
      this.hideGhostEncounterChip();
      if (!this.socketClient) return;
      this.socketClient.emitDuoInvite(socketId);
      this.hud.showAmbientToast(t(`Invited ${name} to fly together…`, `已邀请 ${name} 默契同飞…`));
    });
    el.appendChild(text);
    el.appendChild(btn);
    this.hud.root.appendChild(el);
    this.ghostChipEl = el;
    requestAnimationFrame(() => el.classList.add("ghost-chip--in"));
    this.ghostChipTimer = window.setTimeout(() => this.hideGhostEncounterChip(), 12000);
    // Remember the visitorId for bond on completion.
    this.duoPendingVisitorBySocket.set(socketId, visitorId);
  }
  private duoPendingVisitorBySocket = new Map<string, string>();

  private async handleDuoIncoming(fromId: string, fromName: string) {
    if (!this.socketClient) return;
    if (this.duo) { this.socketClient.emitDuoRespond(fromId, false); return; }
    if (this.qaAutoAcceptDuo) {
      this.socketClient.emitDuoRespond(fromId, true);
      this.startDuo(fromId, fromName, this.visitorIdForSocket(fromId));
      return;
    }
    const ok = await this.showPairingCard({
      title: t("Fly together ✨", "默契同飞 ✨"),
      message: t(
        `${fromName} invites you to fly together — stay close and keep your tether linked to complete it as a duo!`,
        `${fromName} 邀你一起默契同飞——飞近彼此、保持光带相连,一起达成挑战!`,
      ),
      acceptLabel: t("Fly together ✨", "一起飞 ✨"),
      declineLabel: t("Maybe later", "以后吧"),
    });
    if (!ok || !this.socketClient) { this.socketClient?.emitDuoRespond(fromId, false); return; }
    this.socketClient.emitDuoRespond(fromId, true);
    this.startDuo(fromId, fromName, this.visitorIdForSocket(fromId));
  }

  private handleDuoAnswered(fromId: string, fromName: string, accept: boolean) {
    if (!accept) {
      this.hud.showAmbientToast(t(`${fromName} isn't up for it right now.`, `${fromName} 暂时不方便。`));
      return;
    }
    if (this.duo) return;
    const vid = this.duoPendingVisitorBySocket.get(fromId) ?? this.visitorIdForSocket(fromId);
    this.startDuo(fromId, fromName, vid);
  }

  private startDuo(peerSocketId: string, peerName: string, peerVisitorId: string | null) {
    this.duo = { peerSocketId, peerName, peerVisitorId, progress: 0, missing: 0 };
    this.showDuoBar();
    this.hud.showAmbientToast(t("Fly together — stay close! ✨", "默契同飞——飞近保持连接!✨"));
    this.companion?.emitMoment(
      "game.event.duo_started",
      { name: peerName },
      { salience: 0.6, voiceRelevant: true },
    );
  }

  /** Advance the duo while both stay linked; drain when apart; complete at 100%. */
  private updateDuo(dt: number) {
    if (!this.duo) return;
    let peerPos: Vector3 | null = null;
    this.remotePlanes?.forEachRemote((p) => {
      if (p.id === this.duo!.peerSocketId) {
        p.group.updateMatrixWorld(true);
        peerPos = new Vector3().setFromMatrixPosition(p.group.matrixWorld);
      }
    });
    if (!peerPos) {
      this.duo.missing += dt;
      if (this.duo.missing > 6) this.cancelDuo(t("Your duo partner left.", "搭档离开了。"));
      return;
    }
    this.duo.missing = 0;
    const localPos = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
    const linked = this.qaForceDuoLinked || localPos.distanceTo(peerPos) <= Game.DUO_LINK_RANGE;
    this.duo.progress = Math.max(
      0,
      Math.min(Game.DUO_DURATION, this.duo.progress + (linked ? dt : -dt * 0.6)),
    );
    this.updateDuoBar(linked);
    if (this.duo.progress >= Game.DUO_DURATION) this.completeDuo(true);
  }

  private completeDuo(relay: boolean) {
    const d = this.duo;
    if (!d) return;
    this.duo = null;
    this.removeDuoBar();
    if (relay) this.socketClient?.emitDuoDone(d.peerSocketId);
    this.bumpBond(d.peerVisitorId, 20);
    this.hud.showAmbientToast(t(`In sync with ${d.peerName}! ✨ +bond`, `与 ${d.peerName} 默契达成!✨ 羁绊+`));
    this.floatGift("✨");
    this.floatGift("❤️");
    this.packageQuestHUD?.showBubble("✨", t("We did it together!", "我们一起做到了!"));
    this.companion?.emitMoment(
      "game.event.duo_complete",
      { name: d.peerName },
      { salience: 0.8, voiceRelevant: true },
    );
  }

  private cancelDuo(reason: string) {
    if (!this.duo) return;
    this.duo = null;
    this.removeDuoBar();
    this.hud.showAmbientToast(reason);
  }

  private showDuoBar() {
    this.removeDuoBar();
    Game.injectDuoBarStyles();
    const wrap = document.createElement("div");
    wrap.className = "duo-bar";
    const label = document.createElement("div");
    label.className = "duo-bar-label";
    label.textContent = t("✨ Fly together", "✨ 默契同飞");
    const track = document.createElement("div");
    track.className = "duo-bar-track";
    const fill = document.createElement("div");
    fill.className = "duo-bar-fill";
    track.appendChild(fill);
    wrap.appendChild(label);
    wrap.appendChild(track);
    this.hud.root.appendChild(wrap);
    this.duoBarEl = wrap;
    this.duoBarFill = fill;
  }

  private updateDuoBar(linked: boolean) {
    if (!this.duo || !this.duoBarFill || !this.duoBarEl) return;
    const pct = Math.round((this.duo.progress / Game.DUO_DURATION) * 100);
    this.duoBarFill.style.width = `${pct}%`;
    this.duoBarEl.classList.toggle("duo-bar--drift", !linked);
    const label = this.duoBarEl.querySelector(".duo-bar-label") as HTMLElement | null;
    if (label) {
      label.textContent = linked
        ? t(`✨ Fly together · ${pct}%`, `✨ 默契同飞 · ${pct}%`)
        : t("✨ Get closer!", "✨ 靠近一点!");
    }
  }

  private removeDuoBar() {
    this.duoBarEl?.remove();
    this.duoBarEl = null;
    this.duoBarFill = null;
  }

  private static injectDuoBarStyles() {
    if (document.getElementById("duo-bar-styles")) return;
    const s = document.createElement("style");
    s.id = "duo-bar-styles";
    s.textContent = `
      .duo-bar {
        position: absolute; top: max(70px, calc(58px + env(safe-area-inset-top)));
        left: 50%; transform: translateX(-50%); z-index: 7; pointer-events: none;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        font-family: 'Domine', Georgia, serif;
      }
      .duo-bar-label { font-size: 0.7rem; font-weight: 700; color: #ffe1f0;
        text-shadow: 0 1px 4px rgba(0,0,0,0.6); letter-spacing: 0.04em; }
      .duo-bar-track { width: min(220px, 60vw); height: 8px; border-radius: 999px;
        background: rgba(20,10,18,0.55); overflow: hidden;
        box-shadow: inset 0 0 0 1px rgba(255,200,225,0.3); }
      .duo-bar-fill { height: 100%; width: 0%; border-radius: 999px;
        background: linear-gradient(90deg, #ff9ec4, #ffd2a8);
        transition: width 0.12s linear; }
      .duo-bar--drift .duo-bar-fill { background: rgba(255,255,255,0.35); }
    `;
    document.head.appendChild(s);
  }

  /** Ask the server which of our paired A2A friends are online right now + where. */
  private async fetchFriendsPresence(): Promise<FriendPresence[]> {
    const friends = ProgressionManager.loadFriends();
    if (friends.length === 0) return [];
    try {
      const ids = friends.map((f) => f.visitorId).join(",");
      const res = await fetch(`${this.getServerUrl()}/api/friends/presence?ids=${encodeURIComponent(ids)}`);
      if (!res.ok) return [];
      const json = (await res.json()) as { friends?: FriendPresence[] };
      return Array.isArray(json.friends) ? json.friends : [];
    } catch {
      return [];
    }
  }

  /** Roster overlay: A2A friends with online status + a one-tap join to where they are. */
  private async showFriendsRoster() {
    const friends = ProgressionManager.loadFriends();
    this.friendsRosterCleanup?.();
    Game.injectFriendsRosterStyles();
    const backdrop = document.createElement("div");
    backdrop.className = "friends-backdrop";
    const card = document.createElement("div");
    card.className = "friends-card";
    const head = document.createElement("div");
    head.className = "friends-head";
    head.textContent = t("A2A friends", "A2A 好友");
    const closeBtn = document.createElement("button");
    closeBtn.className = "friends-close";
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    head.appendChild(closeBtn);
    card.appendChild(head);
    // Gifts shelf: stickers other companions have sent us, kept on the profile.
    const gifts = ProgressionManager.loadReceivedGifts();
    if (gifts.length > 0) {
      const shelf = document.createElement("div");
      shelf.className = "friends-gifts";
      const label = document.createElement("span");
      label.className = "friends-gifts-label";
      label.textContent = t(`Gifts received (${gifts.length})`, `收到的礼物（${gifts.length}）`);
      const giftRow = document.createElement("div");
      giftRow.className = "friends-gifts-row";
      giftRow.textContent = gifts.slice(0, 18).map((x) => x.gift).join(" ");
      shelf.appendChild(label);
      shelf.appendChild(giftRow);
      card.appendChild(shelf);
    }
    const list = document.createElement("div");
    list.className = "friends-list";
    card.appendChild(list);
    backdrop.appendChild(card);
    this.hud.root.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("friends-backdrop--in"));
    const cleanup = () => {
      backdrop.classList.remove("friends-backdrop--in");
      setTimeout(() => backdrop.remove(), 180);
      if (this.friendsRosterCleanup === cleanup) this.friendsRosterCleanup = null;
    };
    this.friendsRosterCleanup = cleanup;
    closeBtn.addEventListener("click", cleanup);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) cleanup();
    });

    if (friends.length === 0) {
      const empty = document.createElement("div");
      empty.className = "friends-empty";
      empty.textContent = t(
        "No A2A friends yet. Meet other pilots who have companions and pair to add them here.",
        "还没有 A2A 好友。遇到其他带伙伴的玩家并配对，就会出现在这里。",
      );
      list.appendChild(empty);
      return;
    }

    const loading = document.createElement("div");
    loading.className = "friends-empty";
    loading.textContent = t("Checking who's online…", "正在查询谁在线…");
    list.appendChild(loading);

    const presence = await this.fetchFriendsPresence();
    if (this.friendsRosterCleanup !== cleanup) return; // closed while loading
    const byId = new Map(presence.map((p) => [p.visitorId, p]));
    list.innerHTML = "";
    const sorted = [...friends].sort(
      (a, b) => Number(!!byId.get(b.visitorId)?.online) - Number(!!byId.get(a.visitorId)?.online),
    );
    for (const f of sorted) {
      const p = byId.get(f.visitorId);
      const online = !!p?.online;
      const row = document.createElement("div");
      row.className = "friends-row";
      const dot = document.createElement("span");
      dot.className = `friends-dot${online ? " friends-dot--on" : ""}`;
      const info = document.createElement("div");
      info.className = "friends-info";
      const nm = document.createElement("div");
      nm.className = "friends-name";
      nm.textContent = f.companionName ? `${f.name} · ✦ ${f.companionName}` : f.name;
      const sub = document.createElement("div");
      sub.className = "friends-sub";
      const lvl = friendBondLevel(f.bond);
      const presence = online
        ? p?.worldName
          ? t(`In ${p.worldName}`, `在「${p.worldName}」`)
          : t("Online", "在线")
        : t("Offline", "离线");
      const bondStr = lvl > 0 ? `${"❤️".repeat(Math.min(lvl, 5))} ${t("Lv", "等级")}${lvl} · ` : "";
      sub.textContent = `${bondStr}${presence}`;
      info.appendChild(nm);
      info.appendChild(sub);
      row.appendChild(dot);
      row.appendChild(info);
      if (online && p?.worldSlug && p.worldSlug !== this.worldSlug) {
        const join = document.createElement("button");
        join.type = "button";
        join.className = "friends-join";
        join.textContent = t("Join", "加入");
        const slug = p.worldSlug;
        join.addEventListener("click", () => {
          cleanup();
          this.joinWorldBySlug(slug);
        });
        row.appendChild(join);
      } else if (online && p?.worldSlug === this.worldSlug) {
        const here = document.createElement("span");
        here.className = "friends-here";
        here.textContent = t("Here", "在此");
        row.appendChild(here);
      }
      list.appendChild(row);
    }
  }

  private static injectFriendsRosterStyles() {
    if (document.getElementById("friends-roster-styles")) return;
    const s = document.createElement("style");
    s.id = "friends-roster-styles";
    s.textContent = `
      .friends-backdrop {
        position: absolute; inset: 0; z-index: 62; display: flex; align-items: center; justify-content: center;
        background: rgba(8,12,22,0); transition: background 0.18s ease; pointer-events: auto; padding: 16px;
      }
      .friends-backdrop--in { background: rgba(8,12,22,0.5); }
      .friends-card {
        width: min(380px, 92vw); max-height: 70vh; overflow: hidden; display: flex; flex-direction: column;
        border-radius: 18px; padding: 16px; background: rgba(22,30,50,0.97);
        border: 1px solid rgba(180,210,255,0.28); box-shadow: 0 18px 50px rgba(0,0,0,0.5);
        backdrop-filter: blur(14px); font-family: 'Domine', Georgia, serif; color: rgba(235,243,255,0.96);
      }
      .friends-head {
        display: flex; align-items: center; justify-content: space-between;
        font-size: 0.95rem; font-weight: 700; letter-spacing: 0.03em; margin-bottom: 10px;
      }
      .friends-close { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 0.95rem; cursor: pointer; padding: 4px; }
      .friends-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
      .friends-empty { font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.5; padding: 8px 2px; }
      .friends-row {
        display: flex; align-items: center; gap: 10px;
        background: rgba(255,255,255,0.05); border-radius: 12px; padding: 9px 11px;
      }
      .friends-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.25); flex: 0 0 auto; }
      .friends-dot--on { background: #5ad17a; box-shadow: 0 0 8px rgba(90,209,122,0.8); }
      .friends-info { flex: 1; min-width: 0; }
      .friends-name { font-size: 0.82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .friends-sub { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
      .friends-join {
        background: rgba(120,180,255,0.28); color: #fff; border: none; border-radius: 9px;
        padding: 6px 14px; font-size: 0.74rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex: 0 0 auto;
      }
      .friends-here { font-size: 0.7rem; color: rgba(90,209,122,0.9); white-space: nowrap; }
      .friends-gifts {
        background: rgba(255,255,255,0.05); border-radius: 12px; padding: 8px 11px; margin-bottom: 8px;
      }
      .friends-gifts-label { font-size: 0.68rem; color: rgba(255,255,255,0.6); }
      .friends-gifts-row { font-size: 1.25rem; line-height: 1.5; margin-top: 2px; word-break: break-word; }
    `;
    document.head.appendChild(s);
  }

  /** Companion-driven flight: translate a high-level action into a short, timed
   *  override on the per-frame control state (consumed in {@link tick}). */
  private execVehicleControl(args: Record<string, unknown>): { ok: boolean; result?: unknown } {
    if (!this.localPlayer || this.gamePhase !== "flying") {
      return { ok: false, result: "The player isn't flying right now." };
    }
    const action = String(args.action ?? "").toLowerCase();
    const rawDur = typeof args.duration === "number" ? args.duration : 1.2;
    const duration = Math.max(0.2, Math.min(4, rawDur));
    const vehicle = this.localPlayer.vehicle; // "plane" | "carpet" | "boat"
    const canFly = vehicle !== "boat"; // climb/descend
    const canFire = this.localPlayer instanceof Plane;

    const hold = (patch: Partial<Omit<NonNullable<typeof this.voiceControl>, "remaining">>) => {
      this.voiceControl = {
        turnRate: 0,
        forward: false,
        brake: false,
        elevate: false,
        descend: false,
        remaining: duration,
        ...patch,
      };
    };

    switch (action) {
      case "left":
        hold({ turnRate: VOICE_TURN_RATE });
        return { ok: true, result: t(`Banking left for ${duration.toFixed(1)}s.`, `向左转 ${duration.toFixed(1)} 秒。`) };
      case "right":
        hold({ turnRate: -VOICE_TURN_RATE });
        return { ok: true, result: t(`Banking right for ${duration.toFixed(1)}s.`, `向右转 ${duration.toFixed(1)} 秒。`) };
      case "forward":
      case "accelerate":
      case "speed_up":
        hold({ forward: true });
        return { ok: true, result: t("Speeding up.", "加速中。") };
      case "back":
      case "brake":
      case "slow":
      case "slow_down":
        hold({ brake: true });
        return { ok: true, result: t("Slowing down.", "减速中。") };
      case "climb":
      case "up":
        if (!canFly) return { ok: false, result: t("The boat can't climb.", "小船无法爬升。") };
        hold({ forward: true, elevate: true });
        return { ok: true, result: t("Climbing.", "正在爬升。") };
      case "descend":
      case "down":
      case "dive":
        if (!canFly) return { ok: false, result: t("The boat can't change altitude.", "小船无法改变高度。") };
        hold({ forward: true, descend: true });
        return { ok: true, result: t("Descending.", "正在下降。") };
      case "fire":
      case "shoot":
        if (!canFire) return { ok: false, result: t("Only the biplane can fire.", "只有双翼机可以射击。") };
        this.voiceFireQueued = true;
        return { ok: true, result: t("Firing!", "开火！") };
      case "stop":
      case "neutral":
      case "straight":
        this.voiceControl = null;
        return { ok: true, result: t("Levelling out.", "回正。") };
      default:
        return { ok: false, result: `Unknown action "${action}".` };
    }
  }

  /** Parse a spoken/typed phrase (EN or ZH) into a flight command and execute it
   *  directly. This is the RELIABLE voice-control path: the live voice agent can't
   *  be trusted to call the `control_vehicle` tool on every provider (e.g. the
   *  shared ElevenLabs agent won't invoke per-app tools), so we act on the user's
   *  own transcript. Returns true when a command was recognized. */
  private handleVoiceCommand(raw: string): boolean {
    if (!raw || !this.localPlayer || this.gamePhase !== "flying") return false;
    const s = raw.toLowerCase();
    const has = (...keys: string[]) => keys.some((k) => s.includes(k));
    // Priority order matters: fire/stop first, then steering, then throttle.
    // Avoid a bare "down" token so "slow down" doesn't read as "descend".
    let action: string | null = null;
    if (has("fire", "shoot", "发射", "开火", "射击")) action = "fire";
    else if (has("stop", "level off", "straighten", "停", "回正", "稳住", "别动")) action = "stop";
    else if (has("left", "向左", "往左", "左转", "左拐", "左边")) action = "left";
    else if (has("right", "向右", "往右", "右转", "右拐", "右边")) action = "right";
    else if (has("climb", "ascend", "pull up", "higher", "上升", "爬升", "拉高", "往上", "向上")) action = "climb";
    else if (has("descend", "dive", "nose down", "lower", "下降", "俯冲", "降低", "往下", "向下")) action = "descend";
    else if (has("forward", "faster", "accelerate", "speed up", "加速", "前进", "快一点", "快点", "往前", "向前"))
      action = "forward";
    else if (has("back", "slower", "slow down", "brake", "reverse", "减速", "后退", "刹车", "慢一点", "慢点", "往后", "向后"))
      action = "back";
    if (!action) return false;

    // The recognizer re-emits interim results for one utterance — collapse repeats
    // of the same command within a short window so "向左" fires once, not five times.
    const now = performance.now();
    if (action === this.lastVoiceCmdAction && now - this.lastVoiceCmdAt < 1000) return true;
    this.lastVoiceCmdAction = action;
    this.lastVoiceCmdAt = now;

    const res = this.execVehicleControl({ action, duration: 1.6 });
    const labels: Record<string, [string, string]> = {
      left: ["↰ Left", "↰ 向左"],
      right: ["↱ Right", "↱ 向右"],
      forward: ["⏫ Faster", "⏫ 加速"],
      back: ["⏬ Slower", "⏬ 减速"],
      climb: ["⤴ Climb", "⤴ 上升"],
      descend: ["⤵ Descend", "⤵ 下降"],
      fire: ["✦ Fire", "✦ 开火"],
      stop: ["• Level", "• 回正"],
    };
    if (res.ok) {
      const lbl = labels[action];
      if (lbl) this.hud.showAmbientToast(IS_ZH ? lbl[1] : lbl[0]);
    } else if (typeof res.result === "string") {
      // e.g. boat can't climb / only biplane fires — tell the player why.
      this.hud.showAmbientToast(res.result);
    }
    return true;
  }

  /** Push a compact "what's happening + what to do next" snapshot to the companion
   *  as retained world-state, so it can guide the player. Deduped + throttled by the
   *  manager; call freely from the tick. */
  private emitCompanionSituation() {
    if (!this.companion) return;
    this.companion.setRetained("game.situation", this.buildSituationSnapshot());
  }

  /** Build the compact live-state snapshot (also carries a prose `summary`). */
  private buildSituationSnapshot(): Record<string, unknown> {
    const snap: Record<string, unknown> = {
      vehicle: this.playerVehicle,
      level: this.progression.getLevel(),
    };
    if (this.playerVehicle === "plane") {
      snap.gremlins = { current: this.skyGremlins?.getSessionGremlinKills() ?? 0, max: 7 };
      snap.deliveries = {
        current: this.packageQuest?.getCompletedDeliveryCount() ?? 0,
        max: PACKAGE_DELIVERIES_PER_WORLD,
      };
    } else if (this.playerVehicle === "carpet") {
      snap.jellyfish = { current: this.skyJellyfish?.getCollectedCount() ?? 0, max: JELLY_COUNT };
    } else if (this.playerVehicle === "boat") {
      snap.fish = { current: this.fishCaught, max: FISH_COUNT_BEFORE_MYSTERY_OCTOPUS };
    }
    if (this.packageQuest?.isCarrying) {
      const pos = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      const dm = this.packageQuest.getDeliverySurfaceDistanceMetres(pos);
      // Bucket to ~100 m so the snapshot doesn't churn (and resend) every cycle.
      snap.carrying = { to: this.packageQuest.destinationName, distance_m: dm != null ? Math.round(dm / 100) * 100 : null };
    }
    snap.moon = {
      danger: Math.round((this.moonThreat?.progress ?? 0) * 100) / 100,
      frozen: this.moonThreat?.isPermanentlyFrozen ?? false,
    };
    // The main-quest progress bar: eternal-flame braziers toward freezing the moon.
    if (this.braziers && this.braziers.placedCount > 0) {
      snap.braziers = {
        eternal: this.braziers.eternalFlameCount,
        lit: this.braziers.litCount,
        total: BRAZIER_COUNT,
      };
    }
    if (this.inCosmicVoid) {
      snap.void = {
        active: true,
        wave: this.voidWave,
        shield_hp: this.voidFlameShield?.getHitPoints() ?? null,
        shield_max: this.voidFlameShield?.getMaxHitPoints() ?? null,
      };
    }
    snap.suggestion = this.computeNextStepHint();
    snap.summary = this.composeSituationSummary(snap);
    return snap;
  }

  /** A plain-language one-liner of the current state — LLMs ground far better on
   *  prose than on nested JSON, so this is what the companion mostly reads. */
  private composeSituationSummary(snap: Record<string, unknown>): string {
    const parts: string[] = [];
    const vehicleName =
      this.playerVehicle === "plane" ? "biplane" : this.playerVehicle === "carpet" ? "magic carpet" : "boat";
    parts.push(`The player is flying a ${vehicleName} at level ${this.progression.getLevel()}.`);
    const carrying = snap.carrying as { to?: string | null; distance_m?: number | null } | undefined;
    if (carrying) {
      parts.push(
        carrying.to
          ? `Carrying a package to ${carrying.to}${carrying.distance_m != null ? ` (~${carrying.distance_m}m away)` : ""}.`
          : "Carrying a package to deliver.",
      );
    }
    if (this.playerVehicle === "plane") {
      const g = snap.gremlins as { current: number; max: number };
      const d = snap.deliveries as { current: number; max: number };
      parts.push(`Sky gremlins downed ${g.current}/${g.max}; deliveries ${d.current}/${d.max}.`);
    } else if (this.playerVehicle === "carpet") {
      const j = snap.jellyfish as { current: number; max: number };
      parts.push(`Jellyfish collected ${j.current}/${j.max}.`);
    } else if (this.playerVehicle === "boat") {
      const f = snap.fish as { current: number; max: number };
      parts.push(`Fish caught ${f.current}/${f.max}.`);
    }
    const v = snap.void as { wave?: number; shield_hp?: number | null; shield_max?: number | null } | undefined;
    if (v) {
      parts.push(`In the cosmic void defending the eternal flame — wave ${v.wave}, shield ${v.shield_hp}/${v.shield_max}.`);
    } else {
      const moon = snap.moon as { danger: number; frozen: boolean };
      parts.push(
        moon.frozen
          ? "The moon has been frozen — the world is safe."
          : `Moon danger ${Math.round(moon.danger * 100)}% (it falls slowly toward the world).`,
      );
    }
    const braz = snap.braziers as { eternal: number; lit: number; total: number } | undefined;
    if (braz && !(snap.moon as { frozen: boolean }).frozen) {
      parts.push(
        braz.eternal >= braz.total
          ? "All ancient braziers now hold the Eternal Flame — the moon can be frozen."
          : `Eternal-flame braziers lit ${braz.eternal}/${braz.total} (lighting all of them with eternal flame is what stops the falling moon).`,
      );
    }
    parts.push(`Suggested next step: ${snap.suggestion as string}`);
    return parts.join(" ");
  }

  /** A short, accurate "what to do next" line derived from the live state. The
   *  companion uses it as a hint; it can always synthesize from the raw facts too. */
  private computeNextStepHint(): string {
    if (this.inCosmicVoid) return "Defend the eternal flame — survive the incoming moth waves.";
    if (this.packageQuest?.isCarrying) {
      const dest = this.packageQuest.destinationName;
      return dest ? `Deliver the package to ${dest}.` : "Deliver the package to its destination village.";
    }
    const moonClose =
      (this.moonThreat?.progress ?? 0) > 0.6 && !(this.moonThreat?.isPermanentlyFrozen ?? false);
    if (this.braziers && this.braziers.placedCount > 0 && !this.braziers.allFiveEternalAndLit()) {
      const eternal = this.braziers.eternalFlameCount;
      const lead = moonClose ? "The moon is getting dangerously close. " : "";
      return `${lead}Light the ancient braziers with eternal flame (${eternal}/${BRAZIER_COUNT} so far) — defend the eternal flame through the cosmic-void waves to claim each one; lighting all of them freezes the moon.`;
    }
    if (moonClose) {
      return "The moon is getting dangerously close — work toward lighting the braziers to stop it.";
    }
    if (this.playerVehicle === "plane") return "Pick up a glowing package to deliver, shoot sky gremlins, or find a race.";
    if (this.playerVehicle === "carpet") return "Collect sky jellyfish and look for braziers / the eternal flame to defend.";
    if (this.playerVehicle === "boat") return "Sail around, catch fish, and explore the islands.";
    return "Explore the world and take on its activities.";
  }

  /** Resolve a set_waypoint target to a globe surface normal + a bilingual label.
   *  Returns null when the target doesn't currently exist. */
  private resolveWaypointNormal(
    target: string,
  ): { normal: Vector3; label: [string, string] } | null {
    const player = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
    const nearestNormal = (positions: readonly Vector3[]): Vector3 | null => {
      let best: Vector3 | null = null;
      let bestD = Infinity;
      for (const p of positions) {
        const d = p.distanceToSquared(player);
        if (d < bestD) { bestD = d; best = p; }
      }
      return best ? best.clone().normalize() : null;
    };

    if (target === "delivery") {
      const n = this.packageQuest?.getDestinationNormal();
      return n ? { normal: n, label: ["your delivery", "你的送货目标"] } : null;
    }
    if (target === "nearest_brazier") {
      const n = this.braziers ? nearestNormal(this.braziers.unlitWorldPositions) : null;
      return n ? { normal: n, label: ["the nearest brazier", "最近的火盆"] } : null;
    }
    if (target === "race") {
      const centers = this.globe.raceBannerCenters;
      if (!centers || centers.length === 0) return null;
      const n = nearestNormal(centers.map((c) => c.normal));
      return n ? { normal: n, label: ["the race banner", "竞速旗"] } : null;
    }
    if (target === "home") {
      const wp = this.campsiteMarker?.worldPosition;
      return wp ? { normal: wp.clone().normalize(), label: ["your campsite", "你的营地"] } : null;
    }
    if (target === "nearest_player") {
      const positions: Vector3[] = [];
      this.remotePlanes.forEachRemote((p) => positions.push(p.group.position.clone()));
      const n = nearestNormal(positions);
      return n ? { normal: n, label: ["the nearest player", "最近的玩家"] } : null;
    }
    return null;
  }

  /** A2A: join a friend's specific world by slug (from a sky letter). Reloads with
   *  the `?w=` deep-link so the existing join flow handles it cleanly. */
  private joinWorldBySlug(slug: string) {
    if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return;
    window.location.href = `${window.location.origin}/?w=${encodeURIComponent(slug)}`;
  }

  /** A2A (Phase 4): ask a co-present player to pair companions. Only ever targets a
   *  player who is currently in this world AND has a connected companion — pairing
   *  with someone who isn't here or never set one up would just dead-end, so we don't
   *  even offer it. Requires this player's key to hold `represent:pair`. */
  private initiateCompanionPairing() {
    if (!this.companion || !this.socketClient) return;
    const mates = this.coPresentCompanions; // refreshed each tick: live companion-pilots only
    if (!mates.length) {
      this.hud.showAmbientToast(
        t(
          "No companion-pilots nearby to pair with — keep exploring to find one!",
          "附近还没有带 AI 伙伴的玩家可以配对——多飞一飞就能遇到啦！",
        ),
      );
      return;
    }
    // Prefer the one we most recently met, if they're still here; else the first.
    const target = mates.find((m) => m.socketId === this.activeHailTarget?.socketId) ?? mates[0]!;
    this.socketClient.emitPairRequest(
      target.socketId,
      ProgressionManager.loadOrCreateVisitorId(),
      this.companion?.companionDisplayName ?? undefined,
    );
    this.beginPairWait(target.socketId, target.name);
  }

  /** Another player wants to pair companions with us. Ask for explicit consent;
   *  on accept we hand back our OWN token (consent + proof) so they can pair. */
  private async handlePairIncoming(
    fromId: string,
    fromName: string,
    fromVisitorId?: string,
    fromCompanionName?: string,
  ) {
    if (!this.socketClient) return;
    const myToken = ProgressionManager.loadCompanionToken();
    if (!myToken) {
      this.socketClient.emitPairRespond(fromId, false, undefined, undefined, undefined, "no_companion");
      return;
    }
    // QA fast-path: accept without showing the consent card.
    if (this.qaAutoAcceptPairs) {
      this.socketClient.emitPairRespond(
        fromId, true, myToken,
        ProgressionManager.loadOrCreateVisitorId(),
        this.companion?.companionDisplayName ?? undefined,
      );
      if (fromVisitorId) {
        ProgressionManager.addFriend({
          visitorId: fromVisitorId, name: fromName,
          companionName: fromCompanionName, pairedAt: Date.now(),
        });
      }
      this.hud.showAmbientToast(t("Pairing accepted.", "已接受配对。"));
      return;
    }
    const ok = await this.showPairingCard({
      title: t("Companion pairing", "伙伴配对"),
      message: t(
        `${fromName} wants to make your Pouchy companions A2A friends, so the two can message each other. Only accept if you trust this player.`,
        `${fromName} 想让你们的 Pouchy 伙伴结为 A2A 好友，让两个伙伴能互相发消息。仅在你信任该玩家时接受。`,
      ),
      acceptLabel: t("Pair 🤝", "配对 🤝"),
      declineLabel: t("Decline", "拒绝"),
    });
    if (!ok || !this.socketClient) {
      this.socketClient?.emitPairRespond(fromId, false, undefined, undefined, undefined, "declined");
      return;
    }
    this.socketClient.emitPairRespond(
      fromId,
      true,
      myToken,
      ProgressionManager.loadOrCreateVisitorId(),
      this.companion?.companionDisplayName ?? undefined,
    );
    // Record them in our friends roster (both sides record on a successful pair).
    if (fromVisitorId) {
      ProgressionManager.addFriend({
        visitorId: fromVisitorId,
        name: fromName,
        companionName: fromCompanionName,
        pairedAt: Date.now(),
      });
      this.refreshFriendIds();
    }
    this.celebratePairing(fromName);
  }

  /** The other player answered our pairing request. On accept, run the
   *  representative pairing with their token + stable visitor id. */
  private async handlePairAnswered(ev: {
    fromId: string;
    fromName: string;
    accept: boolean;
    visitorToken?: string;
    visitorId?: string;
    companionName?: string;
    reason?: "declined" | "no_companion";
  }) {
    // Stop the "waiting for X to confirm…" indicator (A).
    this.endPairWait(ev.fromId);
    if (!ev.accept || !ev.visitorToken || !ev.visitorId) {
      // Distinguish "they can't pair (no companion)" from an actual decline (B).
      this.hud.showAmbientToast(
        ev.reason === "no_companion"
          ? t(
              `${ev.fromName} hasn't connected an AI companion, so can't pair yet.`,
              `${ev.fromName} 还没连接 AI 伙伴，暂时无法配对。`,
            )
          : t(`${ev.fromName} declined the pairing.`, `${ev.fromName} 拒绝了配对。`),
      );
      return;
    }
    if (!this.companion) return;
    const pairId = await this.companion.pairWithVisitor(ev.visitorToken, ev.visitorId, ev.fromName);
    if (pairId && ev.visitorId) {
      // Success → record the friend, clear queued ghost-pair intents, celebrate (C).
      ProgressionManager.addFriend({
        visitorId: ev.visitorId,
        name: ev.fromName,
        companionName: ev.companionName,
        pairedAt: Date.now(),
      });
      this.refreshFriendIds();
      this.socketClient?.emitGhostPairResolved(ev.visitorId);
      this.celebratePairing(ev.fromName);
    } else {
      this.hud.showAmbientToast(this.pairFailureMessage(this.companion.getLastPairError()));
    }
  }

  /** Turn a classified pairing failure into a precise, actionable toast. */
  private pairFailureMessage(reason: ReturnType<CompanionManager["getLastPairError"]>): string {
    switch (reason) {
      case "same_account":
        return t(
          "Pairing needs two different Pouchy accounts — you both used the same companion.",
          "配对需要两个不同的 Pouchy 账号——你们用的是同一个伙伴。",
        );
      case "scope_initiator":
        return t(
          "Your key can't pair: it needs the represent / represent:pair permission.",
          "你的密钥无法配对：需要 represent / represent:pair 权限。",
        );
      case "scope_visitor":
        return t(
          "Their key can't be paired: it needs the social.message permission.",
          "对方的密钥无法配对：需要 social.message 权限。",
        );
      case "network":
        return t(
          "Pairing failed — couldn't reach Pouchy. Check your connection and try again.",
          "配对失败——无法连接 Pouchy，请检查网络后重试。",
        );
      default:
        return t(
          "Pairing failed. Make sure you each use a different Pouchy account with pairing permission.",
          "配对失败。请确保双方使用不同的 Pouchy 账号，且密钥具备配对权限。",
        );
    }
  }

  // ── Pairing feedback: waiting indicator (A) + success celebration (C) ────────

  /** A persistent "waiting for X to confirm…" banner while a pair request is out. */
  private pairWait: { socketId: string; name: string; timer: number; el: HTMLDivElement } | null = null;

  private beginPairWait(socketId: string, name: string) {
    this.endPairWait();
    Game.injectPairWaitStyles();
    const el = document.createElement("div");
    el.className = "pair-wait";
    el.innerHTML = `<span class="pair-wait-dot"></span><span class="pair-wait-text"></span>`;
    (el.querySelector(".pair-wait-text") as HTMLElement).textContent = t(
      `Waiting for ${name} to confirm pairing…`,
      `正在等待 ${name} 确认配对…`,
    );
    this.hud.root.appendChild(el);
    // Auto-clear if no answer arrives (recipient card auto-declines at 45s).
    const timer = window.setTimeout(() => {
      this.endPairWait(socketId);
      this.hud.showAmbientToast(t(`${name} didn't respond to the pairing.`, `${name} 没有回应配对。`));
    }, 52000);
    this.pairWait = { socketId, name, timer, el };
  }

  /** Clear the waiting banner. If `socketId` is given, only clears a wait for it. */
  private endPairWait(socketId?: string) {
    if (!this.pairWait) return;
    if (socketId && this.pairWait.socketId !== socketId) return;
    clearTimeout(this.pairWait.timer);
    this.pairWait.el.remove();
    this.pairWait = null;
  }

  /** A shared, visible celebration when a pairing succeeds (both sides). */
  private celebratePairing(name: string) {
    this.floatGift("🤝");
    this.floatGift("❤️");
    this.hud.showAmbientToast(t(`A2A friends with ${name}! 🤝`, `和 ${name} 成为 A2A 好友啦！🤝`));
    this.packageQuestHUD?.showBubble("🤝", t(`Paired with ${name}`, `已与 ${name} 配对`));
  }

  private static injectPairWaitStyles() {
    if (document.getElementById("pair-wait-styles")) return;
    const s = document.createElement("style");
    s.id = "pair-wait-styles";
    s.textContent = `
      .pair-wait {
        position: absolute; top: max(70px, calc(58px + env(safe-area-inset-top)));
        left: 50%; transform: translateX(-50%); z-index: 8; pointer-events: none;
        display: flex; align-items: center; gap: 8px;
        background: rgba(22,30,50,0.92); border: 1px solid rgba(180,210,255,0.35);
        border-radius: 999px; padding: 7px 14px; backdrop-filter: blur(10px);
        font-family: 'Domine', Georgia, serif; color: rgba(235,243,255,0.96);
        font-size: 0.76rem; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      }
      .pair-wait-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #9fd0ff;
        box-shadow: 0 0 8px rgba(159,208,255,0.9); animation: pair-wait-pulse 1s ease-in-out infinite;
      }
      @keyframes pair-wait-pulse { 0%,100% { opacity: 0.35; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
    `;
    document.head.appendChild(s);
  }

  private mountLobby(opts?: { deferUnlockModalsUntilMenuReveal?: boolean }) {
    this.lobby = new Lobby(this.container, {
      serverUrl: this.getServerUrl(),
      playerName: this.playerName,
      mobile: this.mobile,
      deferUnlockModalsUntilMenuReveal: opts?.deferUnlockModalsUntilMenuReveal ?? false,
      onNameChange: (name) => { this.playerName = name; ProgressionManager.savePlayerName(name); },
      companionToken: ProgressionManager.loadCompanionToken(),
      onCompanionTokenChange: (token) => {
        if (token) ProgressionManager.saveCompanionToken(token);
        else ProgressionManager.clearCompanionToken();
      },
      companionAutoVoice: ProgressionManager.loadCompanionAutoVoice(),
      onCompanionAutoVoiceChange: (on) => ProgressionManager.saveCompanionAutoVoice(on),
      onPlay: (vehicle, options) => {
        if (!ProgressionManager.isVehicleUnlocked(vehicle)) return;
        this.runFreeplayMode = !!options?.freeplay;
        this.pendingCampsiteAfterIntro =
          CAMPSITE_HOME_ENABLED && (options?.startAtCampsite ?? false);
        this.playerVehicle = vehicle;
        this.audioManager.startMusic();
        void this.audioManager.loadSFX("crickets_loop", "/audio/sfx/crickets_loop.mp3").then(() => {
          this.audioManager.startLoop("crickets_loop", 0);
        });
        void this.audioManager.loadSFX(RAIN_LOOP_NAME, "/audio/sfx/rain_1.mp3").then(() => {
          this.audioManager.startLoop(RAIN_LOOP_NAME, 0);
        });
        void this.audioManager.loadSFX(BIRDS_LOOP_NAME, "/audio/sfx/birds_chirp_1.mp3").then(() => {
          this.audioManager.startLoop(BIRDS_LOOP_NAME, 0);
        });
        void this.audioManager.loadSFX(RUMBLE_LOOP_NAME, "/audio/sfx/rumbling_1.mp3").then(() => {
          this.audioManager.startLoop(RUMBLE_LOOP_NAME, 0);
        });
        void this.audioManager.loadSFX(MOONSTONE_RUMBLE_LOOP_NAME, "/audio/sfx/rumble.mp3").then(() => {
          this.audioManager.startLoop(MOONSTONE_RUMBLE_LOOP_NAME, 0);
        });
        void this.audioManager.loadSFX("twister", "/audio/sfx/twister.mp3").then(() => {
          this.audioManager.startLoop("twister", 0);
        });
        void this.audioManager.loadSFX(EXPLOSION_SFX_NAME, "/audio/sfx/explosion_1.mp3");
        for (const id of LANTERN_COLLECT_SFX_IDS) {
          void this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
        }
        for (const id of JELLYFISH_COLLECT_SFX_IDS) {
          void this.audioManager.loadSFX(id, `/audio/sfx/${id}.mp3`);
        }
        this.lobby.fadeOut(() => {
          this.lobby.dispose();
          this.startGame(vehicle);
        });
      },
    });
    this.lobby.show();
  }

  /**
   * Ambient bed under package-quest dialogue: dedicated one-shots for Eternal Flame and
   * Sky Jellyfish; otherwise the generic dialogue hum loop.
   */
  private playPackageDialogueBed(npcName: string) {
    const tryOneShots = (ids: readonly string[]): boolean => {
      const id = ids[Math.floor(Math.random() * ids.length)]!;
      if (!this.audioManager.hasSFX(id)) return false;
      this.audioManager.resumeContextIfNeeded();
      this.audioManager.playSFX(id, FLAME_JELLY_DIALOGUE_SFX_VOLUME);
      return true;
    };
    if (npcName === ETERNAL_FLAME_SPEAKER) {
      if (tryOneShots(FLAME_DIALOGUE_SFX_IDS)) return;
    } else if (npcName === JELLYFISH_NPC_SPEAKER) {
      if (tryOneShots(JELLYFISH_DIALOGUE_SFX_IDS)) return;
    }

    const id =
      DIALOGUE_LOOP_IDS[Math.floor(Math.random() * DIALOGUE_LOOP_IDS.length)]!;
    let rate = isNpcMale(npcName) ? DIALOGUE_MALE_PLAYBACK_RATE : 1;
    const mp = this.moonThreat?.progress ?? 0;
    if (mp >= 0.5) {
      const dread = Math.min(1, (mp - 0.5) / 0.5);
      rate *= 1.0 - dread * 0.25;
    }
    this.audioManager.startLoop(id, 0, rate);
    this.audioManager.setLoopVolume(id, DIALOGUE_LOOP_VOLUME);
  }

  /** Always plays (no random / min-gap throttling) — use for gremlin + king kill feedback. */
  private playGremlinDeathSfx(isKing: boolean) {
    const now = performance.now();
    this.lastGremlinHitSfxAt = now;
    const pick =
      GREMLIN_HIT_SFX_IDS[(Math.random() * GREMLIN_HIT_SFX_IDS.length) | 0]!;
    const rate = isKing ? GREMLIN_KING_HIT_PLAYBACK_RATE : 1;
    this.audioManager.playSFX(pick, GREMLIN_HIT_SFX_VOLUME, rate);
  }

  private maybePlayGremlinHitSfx(isKing: boolean) {
    const now = performance.now();
    if (now - this.lastGremlinHitSfxAt < GREMLIN_HIT_SFX_MIN_MS) return;
    if (Math.random() > GREMLIN_HIT_SFX_CHANCE) return;
    this.lastGremlinHitSfxAt = now;
    const pick =
      GREMLIN_HIT_SFX_IDS[(Math.random() * GREMLIN_HIT_SFX_IDS.length) | 0]!;
    const rate = isKing ? GREMLIN_KING_HIT_PLAYBACK_RATE : 1;
    this.audioManager.playSFX(pick, GREMLIN_HIT_SFX_VOLUME, rate);
  }

  /** Replaces gremlin SFX in the cosmic void: random `moth_1` — `moth_3`. */
  private playVoidMothStruckSfx(isKill: boolean) {
    if (isKill) {
      this.lastVoidMothHitSfxAt = performance.now();
    } else {
      const now = performance.now();
      if (now - this.lastVoidMothHitSfxAt < GREMLIN_HIT_SFX_MIN_MS) return;
      if (Math.random() > GREMLIN_HIT_SFX_CHANCE) return;
      this.lastVoidMothHitSfxAt = now;
    }
    const pick =
      MOTH_HIT_SFX_IDS[(Math.random() * MOTH_HIT_SFX_IDS.length) | 0]!;
    if (!this.audioManager.hasSFX(pick)) return;
    this.audioManager.playSFX(pick, MOTH_HIT_SFX_VOLUME);
  }

  private onLocalPlayerGremlinPaintballHit(isKing: boolean) {
    if (!(this.localPlayer instanceof Plane)) return;
    if (this.localPlayer.applyGremlinPaintballDamage(isKing)) {
      void this.returnToMainMenuAfterPlayerDowned();
    }
  }

  /** Gremlin damage emptied the plane HP: fade to black, tear down session, main menu. */
  private async returnToMainMenuAfterPlayerDowned() {
    if (this.playerGremlinDeathReturnInProgress) return;
    this.playerGremlinDeathReturnInProgress = true;
    this.running = false;
    this.audioManager.stopLoop("engine_biplane");
    try {
      if (this.transitionOverlay) {
        await this.transitionOverlay.fadeOut({
          durationSec: 1.65,
          message: t("Oops. You died.", "糟糕，你死了。"),
          holdAtFullSec: 1.35,
        });
      }
      this.teardownGameplaySession("player_downed");
      this.dayNightCycle.moonProgress = 0;
      this.moonThreat?.reset();
      this.shouldShowBrazierMoonResume = false;
      this.applyDayNightPreset();
      this.gamePhase = "flying";
      this.moonCinematicStep = "done";
      this.moonCinematicCamera = null;
      this.introActive = false;
      this.vehicleHintsEl = null;
      this.campsiteHintsEl = null;
      this.mountLobby();
      this.previewActive = true;
      window.addEventListener("resize", this.onPreviewResize);
      this.onPreviewResize();
      this.resetPreviewAnimationClock();
      this.stepPreview(this.consumePreviewFrameDt());
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      requestAnimationFrame(this.previewTick);
      if (this.transitionOverlay) {
        await this.transitionOverlay.fadeIn();
        this.transitionOverlay.dispose();
        this.transitionOverlay = null;
      }
    } finally {
      this.playerGremlinDeathReturnInProgress = false;
    }
  }

  /* ── Loading overlay ─────────────────────────────────────────────── */

  private showLoadingOverlay() {
    this.loadingEl = document.createElement("div");
    this.loadingEl.id = "loading-overlay";
    this.loadingEl.innerHTML = `
      <div class="loading-stack">
        <div class="loading-built-with" aria-label="${t("Built with Cursor", "由 Cursor 构建")}">
          <span class="loading-built-text">${t("Built with", "构建工具")}</span>
          <img class="loading-cursor-logo" src="/2D/logo_cursor.png" alt="" width="180" height="47" decoding="async" />
          <span class="loading-best-enjoyed">${t("Best enjoyed on desktop with sound", "建议在桌面端并开启声音体验")}</span>
        </div>
      </div>
    `;
    Object.assign(this.loadingEl.style, {
      position: "fixed",
      inset: "0",
      zIndex: "200",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000",
      fontFamily: "'Domine', Georgia, serif",
    });

    if (!document.getElementById("loading-styles")) {
      const s = document.createElement("style");
      s.id = "loading-styles";
      s.textContent = `
        .loading-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .loading-built-with {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(0.32rem, 1.1vh, 0.5rem);
          text-align: center;
        }
        .loading-built-text {
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          font-size: clamp(0.78rem, 2.35vw, 0.92rem);
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(200, 210, 230, 0.78);
          white-space: nowrap;
        }
        .loading-cursor-logo {
          width: clamp(118px, 34vw, 195px);
          height: auto;
          max-width: 88vw;
          display: block;
          object-fit: contain;
          opacity: 0.94;
        }
        .loading-best-enjoyed {
          margin-top: clamp(0.34rem, 0.9vh, 0.52rem);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          font-size: clamp(0.62rem, 1.8vw, 0.74rem);
          font-weight: 500;
          letter-spacing: 0.04em;
          color: rgba(200, 210, 230, 0.48);
          white-space: nowrap;
        }
      `;
      document.head.appendChild(s);
    }

    this.container.appendChild(this.loadingEl);
    // Hide the "Built with Cursor" splash on every platform (desktop + mobile),
    // so desktop shows only a brief black loading screen like mobile does.
    const built = this.loadingEl.querySelector(".loading-built-with") as HTMLElement | null;
    if (built) built.style.display = "none";
  }

  private showLoadingError() {
    if (!this.loadingEl) return;
    this.loadingEl.innerHTML = `
      <div style="text-align:center;padding:0 24px;">
        <div class="loading-stack">
          <div class="loading-built-with" aria-label="${t("Built with Cursor", "由 Cursor 构建")}">
            <span class="loading-built-text">${t("Built with", "构建工具")}</span>
            <img class="loading-cursor-logo" src="/2D/logo_cursor.png" alt="" width="180" height="47" decoding="async" />
            <span class="loading-best-enjoyed">${t("Best enjoyed on desktop with sound", "建议在桌面端并开启声音体验")}</span>
          </div>
        </div>
        <p style="color:rgba(180,200,255,0.5);margin:16px 0 20px;font-size:0.9rem;">
          ${t("Could not connect to server", "无法连接到服务器")}
        </p>
        <button id="btn-retry" style="padding:14px 32px;min-height:48px;border:none;border-radius:8px;
          background:linear-gradient(135deg,#3366dd,#2288ee);color:white;
          font-weight:600;font-size:0.9rem;cursor:pointer;font-family:inherit;">
          ${t("Retry", "重试")}
        </button>
      </div>
    `;
    this.loadingEl.querySelector("#btn-retry")!.addEventListener("click", () => {
      this.removeLoadingOverlay({ immediate: true });
      this.start();
    });
    const built = this.loadingEl.querySelector(".loading-built-with") as HTMLElement | null;
    if (built) built.style.display = "none";
  }

  private removeLoadingOverlay(opts?: { immediate?: boolean }) {
    const el = this.loadingEl;
    if (!el) return;

    if (opts?.immediate) {
      el.remove();
      this.loadingEl = null;
      document.getElementById("loading-styles")?.remove();
      return;
    }

    if (el.dataset.loadingFadeOut === "1") return;
    el.dataset.loadingFadeOut = "1";
    el.style.pointerEvents = "none";
    el.style.transition = "opacity 0.55s ease-out";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "0";
      });
    });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      el.removeEventListener("transitionend", onEnd);
      clearTimeout(fallback);
      el.remove();
      if (this.loadingEl === el) this.loadingEl = null;
      document.getElementById("loading-styles")?.remove();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "opacity") return;
      finish();
    };
    el.addEventListener("transitionend", onEnd);
    const fallback = setTimeout(finish, 900);
  }

  /* ── Phase 1: Preview (globe + orbiting camera) ──────────────────── */

  private initPreview() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1 : 2));
    this.renderer.shadowMap.enabled = !this.mobile;
    this.renderer.shadowMap.type = VSMShadowMap;
    this.container.appendChild(this.renderer.domElement);

    if (this.mobile) {
      this.container.style.webkitUserSelect = "none";
      this.container.style.userSelect = "none";
      this.container.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    this.scene = new Scene();
    const preset = this.dayNightCycle.getPreset();
    this.scene.background = this.createSkyGradient(preset.skyGradient);
    const fogScale = this.mobile ? 0.7 : 1;
    this.scene.fog = new Fog(preset.fogColor, preset.fogNear * fogScale, preset.fogFar * fogScale);
    this.clock = new Clock();

    this.hemiLight = new HemisphereLight(preset.hemiSkyColor, preset.hemiGroundColor, preset.hemiIntensity);
    this.scene.add(this.hemiLight);
    this.ambientLight = new AmbientLight(preset.ambientColor, preset.ambientIntensity);
    this.scene.add(this.ambientLight);
    this.sunLight = new DirectionalLight(preset.sunColor, preset.sunIntensity);
    // Very low sun angle (~9°) for long dramatic shadows across the globe.
    this.sunLight.position.set(12, 2, 5);
    this.sunLight.castShadow = true;
    const shadowRes = this.mobile ? 1024 : 2048;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 40;
    this.sunLight.shadow.camera.left = -22;
    this.sunLight.shadow.camera.right = 22;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -22;
    this.sunLight.shadow.radius = 2.5;
    this.sunLight.shadow.blurSamples = 12;
    this.sunLight.shadow.bias = -0.0015;
    this.scene.add(this.sunLight);
    
    this.godRays = new GodRays();
    this.scene.add(this.godRays.group);
    
    this.fillLight = new DirectionalLight(preset.fillColor, preset.fillIntensity);
    this.fillLight.position.set(-8, -5, -10);
    this.scene.add(this.fillLight);
    this.backLight = new DirectionalLight(preset.backColor, preset.backIntensity);
    this.backLight.position.set(-3, 10, -6);
    this.scene.add(this.backLight);

    this.sun2Light = new DirectionalLight(preset.sun2Color, preset.sun2Intensity);
    this.sun2Light.position.set(-10, -12, -5);
    this.scene.add(this.sun2Light);
    this.fill2Light = new DirectionalLight(preset.fill2Color, preset.fill2Intensity);
    this.fill2Light.position.set(8, -8, -10);
    this.scene.add(this.fill2Light);

    const seed = this.worldConfig?.seed ?? 42;
    const terrainType = this.worldConfig?.terrainType ?? "default";
    this.gameSeed = seed;
    this.gameTerrainType = terrainType;
    this.globe = new Globe(
      this.worldConfig?.globeRadius ?? 5, seed, terrainType,
      preset.atmosphereGlow, preset.oceanShallow, preset.oceanDeep,
      preset.oceanFoam, preset.rimColor, preset.cloudOpacity,
      this.mobile ? 128 : 256,
    );
    this.globe.addTo(this.scene);

    const completedMoonRuns =
      ProgressionManager.loadPlayerWorldState().completedMoonApproachRunCount ?? 0;
    this.moonThreat = new MoonThreat(
      this.worldConfig?.globeRadius ?? 5,
      moonApproachDurationSec(completedMoonRuns),
    );
    this.moonThreat.onShockwaveSpawn = () => {
      this.companion?.emitMoment("game.event.moon_near", {}, { salience: 0.9, voiceRelevant: true });
      this.audioManager.playSFX(EXPLOSION_SFX_NAME, EXPLOSION_SFX_VOLUME);
    };
    this.moonThreat.onApproachPauseEnd = () => {
      if (!this.shouldShowBrazierMoonResume) return;
      this.shouldShowBrazierMoonResume = false;
      this.hud.showBrazierMoonResumed();
    };
    this.moonThreat.addTo(this.scene);

    this.starfield = new Starfield();
    this.starfield.group.visible = preset.stars;
    this.scene.add(this.starfield.group);

    this.aurora = new Aurora();
    this.aurora.group.visible = preset.aurora;
    this.scene.add(this.aurora.group);

    this.previewCamera = new PerspectiveCamera(60, w / h, 0.1, 100);
    this.previewAngle = 0;
    this.resetPreviewAnimationClock();

    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    for (let vi = 0; vi < VOLCANO_COUNT; vi++) {
      this.volcanoes.push(new Volcano(this.scene, globeRadius, seed, terrainType, vi));
    }

    if (CAMPSITE_HOME_ENABLED) {
      this.campsiteMarker = new CampsiteMarker(this.scene, globeRadius, seed, terrainType);
    }

    this.waypointBeacon?.dispose();
    this.waypointBeacon = new WaypointBeacon(this.scene, globeRadius, seed, terrainType);

    window.addEventListener("resize", this.onPreviewResize);
  }

  /** Clears zoom + wall-clock preview timing (e.g. when (re)entering the main-menu globe). */
  private resetPreviewAnimationClock() {
    this.previewZoomElapsed = 0;
    this.previewWallPrevMs = 0;
    this.previewGodRayTime = 0;
  }

  /**
   * Delta for the menu orbit preview only. Uses performance.now() so it stays correct even when
   * {@link Clock#getDelta} is called elsewhere in the same frame (e.g. {@link Clock#getElapsedTime}
   * inside {@link #applyDayNightPreset}).
   */
  private consumePreviewFrameDt(): number {
    const now = performance.now();
    if (this.previewWallPrevMs <= 0) {
      this.previewWallPrevMs = now;
      return 1 / 60;
    }
    const dt = Math.min((now - this.previewWallPrevMs) / 1000, 0.05);
    this.previewWallPrevMs = now;
    return dt;
  }

  /** One preview frame (shared by the RAF loop and return-to-menu while overlay stays black). */
  private stepPreview(dt: number) {
    this.previewGodRayTime += dt;
    const ZOOM_DURATION = 1.35;
    const endRadius  = this.mobile ? 17 : 12;
    const startRadius = endRadius * 1.1;

    this.previewZoomElapsed = Math.min(this.previewZoomElapsed + dt, ZOOM_DURATION);
    const t = this.previewZoomElapsed / ZOOM_DURATION;
    // Ease-out cubic: fast start, gentle settle
    const eased = 1 - Math.pow(1 - t, 3);
    const radius = startRadius + (endRadius - startRadius) * eased;

    // Slow the globe rotation slightly while zooming in for a cinematic feel
    const rotSpeed = 0.05 * (0.3 + 0.7 * eased);
    this.previewAngle += rotSpeed * dt;

    const tiltY = Math.sin(-0.26) * radius;
    const tiltXZ = Math.cos(-0.26) * radius;
    this.previewCamera.position.set(
      Math.sin(this.previewAngle) * tiltXZ,
      tiltY,
      Math.cos(this.previewAngle) * tiltXZ,
    );
    this.previewCamera.lookAt(0, 0, 0);

    this.globe.update(dt);
    for (const v of this.volcanoes) v.update(dt, _farQ, 999);
    this.campsiteMarker?.update(dt);
    this.applyDayNightPreset();
    this.audioManager.update(dt);
    this.aurora?.update(dt, this.previewCamera);
    this.renderer.render(this.scene, this.previewCamera);
  }

  private previewTick = () => {
    if (!this.previewActive) return;
    requestAnimationFrame(this.previewTick);

    this.stepPreview(this.consumePreviewFrameDt());
  };

  private onPreviewResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.previewCamera.aspect = w / h;
    this.previewCamera.updateProjectionMatrix();
  };

  /* ── Phase 2: Start game (player, camera, VFX, HUD, networking) ── */

  private startGame(vehicle: Vehicle) {
    this.previewActive = false;
    this.previewWallPrevMs = 0;
    this.clock.start();
    window.removeEventListener("resize", this.onPreviewResize);

    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    const seed = this.gameSeed;
    const terrainType = this.gameTerrainType;
    const preset = this.dayNightCycle.getPreset();
    this.playerVehicle = vehicle;
    this.vehicleFeatures = getVehicleFeatures(vehicle);

    const spawnSessionSalt =
      (Date.now() ^ ((Math.random() * 0xffffffff) | 0) ^ (seed * 7919)) >>> 0;

    this.progression = new ProgressionManager(vehicle);
    this.progression.restore();
    this.gameSessionStartedAtMs = Date.now();
    this.gameSessionLastHeartbeatAtMs = this.gameSessionStartedAtMs;
    this.gameSessionStartXp = this.progression.getXP();
    this.gameSessionStartLevel = this.progression.getLevel();
    this.gameSessionId = `${this.gameSessionStartedAtMs.toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    this.gameSessionEndReported = false;
    this.startSessionHeartbeat();

    const savedColor = this.progression.getSavedVehicleColor();
    const hullColor = savedColor ?? pickRandomVehicleColor(vehicle);
    if (savedColor == null) this.progression.saveVehicleColor(hullColor);
    this.hullColor = hullColor;

    const w2 = this.container.clientWidth;
    const h2 = this.container.clientHeight;
    this.campsiteScene = CAMPSITE_HOME_ENABLED
      ? new CampsiteScene(w2 / h2, this.mobile, this.container)
      : null;
    this.transitionOverlay = new TransitionOverlay(this.container);
    this.levelUpCards = new LevelUpCards();
    this.prevDiamondCountBonus = 0;
    this.prevWorldHeartCountBonus = 0;
    this.prevExtraRainbows = 0;
    this.prevExtraFireflies = 0;
    this.prevExtraLanterns = 0;
    this.portalInteractionSuppressTimer = 0;
    this.carpetPortalTeleportSeq = 0;

    if (vehicle === "boat") {
      this.localPlayer = new Boat(globeRadius, seed, terrainType, hullColor, spawnSessionSalt);
    } else if (vehicle === "carpet") {
      this.localPlayer = new Carpet(globeRadius, seed, terrainType, spawnSessionSalt, hullColor);
    } else {
      this.localPlayer = new Plane(globeRadius, seed + spawnSessionSalt, hullColor, seed, terrainType);
    }
    this.localPlayer.addTo(this.scene);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.cameraRig = new CameraRig(w / h);

    this.computeIntroEndTargets(globeRadius);
    this.introFrozenEndPos.copy(this.introEndPos);
    this.introFrozenEndLookAt.copy(this.introEndLookAt);

    this.introStartPos.copy(this.previewCamera.position);

    this.cameraRig.setPositionAndLookAt(this.introStartPos, new Vector3(0, 0, 0), 0, new Vector3(0, 1, 0));
    this.introActive = true;
    this.introTimer = 0;

    if (this.mobile) {
      this.touchControls = new TouchControls(this.container);
      this.touchControls.setVehicle(vehicle);
      this.controls = new FlightControls(this.container);
      this.controls.enabled = false;
    } else {
      this.controls = new FlightControls(this.container);
    }

    this.remotePlanes = new RemotePlaneManager(this.scene, globeRadius);
    this.paintballSystem = new PaintballSystem(
      this.scene,
      globeRadius,
      () => this.socketClient?.id,
      () => this.socketClient,
      this.remotePlanes,
      (colorHex?: number, ctx?: { fromGremlin?: boolean; gremlinKing?: boolean }) => {
        if (ctx?.fromGremlin) {
          if (ctx.gremlinKing) {
            this.cameraRig.shake(0.1, 0.48);
          } else {
            this.cameraRig.shake(0.078, 0.4);
          }
        } else {
          this.cameraRig.shake(0.038, 0.26);
        }
        this.hud.showPaintballSplatter(colorHex);
      },
      (victimId) => {
        const myId = this.socketClient?.id ?? "local";
        if (victimId === myId && this.localPlayer instanceof Plane) {
          this.localPlayer.triggerPaintballHitWobble();
          return;
        }
        this.remotePlanes.triggerPaintballHitWobble(victimId);
      },
      () => {
        this.audioManager.resumeContextIfNeeded();
        if (this.audioManager.hasSFX("shoot_1")) {
          this.audioManager.playSFX("shoot_1", 0.82);
        }
      },
      (splatSeed, distant) => {
        this.audioManager.resumeContextIfNeeded();
        const n = 1 + ((splatSeed >>> 0) % 3);
        const id = `impact_${n}` as "impact_1" | "impact_2" | "impact_3";
        if (this.audioManager.hasSFX(id)) {
          this.audioManager.playSFX(id, distant ? 0.35 : 0.88);
        }
      },
      this.globe
    );

    this.speedLines = new SpeedLines();

    this.contrails = new Contrails();
    this.contrails.group.visible = this.vehicleFeatures.contrails;
    this.scene.add(this.contrails.group);

    this.wakeTrail = new WakeTrail();
    this.wakeTrail.group.visible = this.vehicleFeatures.wakeTrail;
    this.scene.add(this.wakeTrail.group);

    this.carpetTrail = new CarpetTrail();
    this.carpetTrail.group.visible = this.vehicleFeatures.carpetTrail;
    this.scene.add(this.carpetTrail.group);

    this.carpetWake = new CarpetWake();
    this.carpetWake.group.visible = this.vehicleFeatures.carpetTrail;
    this.scene.add(this.carpetWake.group);

    this.carpetLeaves = new CarpetLeaves();
    this.carpetLeaves.group.visible = this.vehicleFeatures.carpetTrail;
    this.scene.add(this.carpetLeaves.group);

    this.carpetDriftSmoke = new CarpetDriftSmoke();
    this.carpetDriftSmoke.group.visible = this.vehicleFeatures.carpetTrail;
    this.scene.add(this.carpetDriftSmoke.group);

    if (vehicle === "carpet") {
      this.carpetPortalSystem = new CarpetPortalSystem(globeRadius, seed, terrainType, {
        onPortalSpawnStart: () => {
          this.audioManager.resumeContextIfNeeded();
          this.audioManager.playSFX("portal_open", PORTAL_OPEN_SFX_VOLUME);
        },
      });
      this.scene.add(this.carpetPortalSystem.group);
      this.carpetPortalSystem.syncToCarpet(this.localPlayer as Carpet);
      if (!ProgressionManager.loadPlayerWorldState().voidPortalsClosed) {
        const voidPortalDirs: Vector3[] = [];
        for (let i = 0; i < COSMIC_VOID_PORTAL_COUNT; i++) {
          const portal = new CosmicWorldPortal(globeRadius, seed, terrainType, i, voidPortalDirs);
          this.cosmicWorldPortals.push(portal);
          this.scene.add(portal.group);
        }
      }
      this.capybaraFlameShots = new CapybaraFlameShots(this.scene, globeRadius);
      this.voidCarpetTrail = new VoidCarpetTrail();
      this.scene.add(this.voidCarpetTrail.group);
    } else {
      this.carpetPortalSystem = null;
      this.cosmicWorldPortals = [];
      this.capybaraFlameShots = null;
      this.voidCarpetTrail = null;
    }

    this.lensFlare = new LensFlare();
    this.lensFlare.setColorScale(preset.flareColorScale);

    this.rainOverlay = new RainOverlay();
    this.rainOverlay.onLightningFlash = () => {
      const THUNDER_SFXS = ["thunder_1", "thunder_2", "thunder_3"] as const;
      const pick = THUNDER_SFXS[Math.floor(Math.random() * THUNDER_SFXS.length)]!;
      if (this.audioManager.hasSFX(pick)) {
        this.audioManager.resumeContextIfNeeded();
        // Delay thunder slightly after the flash (lightning travels faster than sound).
        const delayMs = 300 + Math.random() * 600;
        setTimeout(() => this.audioManager.playSFX(pick, 0.55), delayMs);
      }
    };

    /* Softer warm fill than 0xffaa55; wider range so falloff on the mesh is gentler. */
    this.playerLight = new PointLight(0xeec4a8, 0, 6.5, 1.25);
    this.scene.add(this.playerLight);

    const ringMode = vehicle === "boat" ? "boat" : vehicle === "carpet" ? "carpet" : "plane";
    this.ringManager = new RingManager(globeRadius, { mode: ringMode, seed, terrainType });
    this.ringManager.setConsumerActive(this.vehicleFeatures.collectibleDiamonds);
    this.scene.add(this.ringManager.group);

    this.collectVFX = new RingCollectVFX();
    this.scene.add(this.collectVFX.group);
    // Pre-compile the collect-burst pool so the first pickup does not pay shader/GPU upload cost.
    this.collectVFX.preWarmForCompile();
    this.renderer.compile(this.collectVFX.group, this.cameraRig.camera, this.scene);
    this.collectVFX.postWarmForCompile();

    this.meteorShower = new MeteorShower(globeRadius, seed, terrainType);
    this.scene.add(this.meteorShower.group);
    this.meteorShower.onImpact = (_impactPos, distanceToPlayer) => {
      const audibility = MathUtils.clamp(1 - distanceToPlayer / 1.6, 0, 1);
      if (audibility > 0.01 && this.audioManager.hasSFX(EXPLOSION_SFX_NAME)) {
        this.audioManager.resumeContextIfNeeded();
        const rate = 0.7 + Math.random() * 0.5;
        this.audioManager.playSFX(EXPLOSION_SFX_NAME, 0.15 + audibility * 0.3, rate);
      }
      if (distanceToPlayer < 0.72) {
        this.cameraRig.shake(0.065, 0.7);
        this.vehicleFlashTimer = Math.max(this.vehicleFlashTimer, 0.4);
      }
    };

    if (this.localPlayer instanceof Carpet) {
      this.skyJellyfish = new SkyJellyfish(globeRadius, seed, spawnSessionSalt, terrainType);
      this.scene.add(this.skyJellyfish.group);
      this.skyJellyfish.onCapture = (_colorIndex) => {
        this.awardXP("jellyfish", JELLY_CAPTURE_XP);
        this.audioManager.resumeContextIfNeeded();
        const jellyPick =
          JELLYFISH_COLLECT_SFX_IDS[
            Math.floor(Math.random() * JELLYFISH_COLLECT_SFX_IDS.length)
          ]!;
        if (this.audioManager.hasSFX(jellyPick)) {
          this.audioManager.playSFX(jellyPick, JELLYFISH_COLLECT_SFX_VOLUME);
        } else {
          this.audioManager.playSFX("portal_1", 0.35, 1.3);
        }
        this.vehicleFlashTimer = Math.max(this.vehicleFlashTimer, 0.2);
        this.cameraRig.shake(0.02, 0.15);

        if (this.skyJellyfish) {
          const n = this.skyJellyfish.getCollectedCount();
          this.packageQuestHUD.showBubble(
            JELLYFISH_NPC_SPEAKER,
            getJellyfishCaptureLine(n, JELLY_COUNT),
          );
        }

        if (
          this.skyJellyfish &&
          this.skyJellyfish.getCollectedCount() === JELLY_COUNT
        ) {
          const ws = ProgressionManager.loadPlayerWorldState();
          if (!ws.jellyfishSetEternalFlameClaimed) {
            this.savePlayerWorldState({
              eternalFlameCount: (ws.eternalFlameCount ?? 0) + 1,
              jellyfishSetEternalFlameClaimed: true,
            });
            this.reportQuestCompleted("all_jellyfish_collected", { count: JELLY_COUNT });
            if (this.jellyfishEternalFlameRewardTimeout != null) {
              clearTimeout(this.jellyfishEternalFlameRewardTimeout);
              this.jellyfishEternalFlameRewardTimeout = null;
            }
            this.jellyfishEternalFlameRewardTimeout = setTimeout(() => {
              this.jellyfishEternalFlameRewardTimeout = null;
              this.audioManager.playSFX("choir_1", CHOIR_1_SFX_VOLUME);
              this.eternalFlameUI?.playKingLootSequence();
            }, KING_ETERNAL_FLAME_REWARD_DELAY_MS);
          }
        }
      };
    }

      this.ringManager.onCollect = (_xp, worldPos, tier) => {
        this.triggerPlaneDiamondCollectEffects(worldPos, tier);
      };

    this.progression.onXPChanged = (xp, xpForNext, xpForCurrent, level) => {
      this.hud.setXP(xp, xpForNext, xpForCurrent, level);
    };
    this.progression.onLevelUp = (level) => {
      this.handleLevelUp(level);
    };

    this.hud = new HUD(this.container, { mobile: this.mobile });
    this.hud.setWorldName(
      localizeWorldName(this.worldConfig?.name ?? t("Unknown World", "未知世界")),
    );
    this.hud.setMuteToggle(() => this.audioManager.toggleMute());
    this.hud.setCampsiteAction(() => {
      if (this.gamePhase === "flying") this.doLanding();
    });
    this.hud.setVehicle(vehicle, {
      showXpProgression: this.vehicleFeatures.xpProgressionUI,
    });

    this.initCompanion(vehicle);

    if (this.localPlayer instanceof Boat && this.vehicleFeatures.fishingMiniGame) {
      this.oceanFish = new OceanFish(globeRadius, seed, spawnSessionSalt, terrainType, this.audioManager);
      this.scene.add(this.oceanFish.group);
      this.fishCaught = 0;
      this.boatMysteryAt12Handled = false;
      this.oceanFish.onCatch = (variant) => {
        if (variant === "octopus") {
          this.fishCaught += 1;
          this.completeVehicleTutorialStep("fish");
          this.audioManager.resumeContextIfNeeded();
          this.cameraRig.shake(0.02, 0.14);
          this.vehicleFlashTimer = Math.max(this.vehicleFlashTimer, 0.18);
          const pws = ProgressionManager.loadPlayerWorldState();
          if (!pws.boatMysteryOctopusEternalFlameClaimed) {
            this.savePlayerWorldState({
              eternalFlameCount: (pws.eternalFlameCount ?? 0) + 1,
              boatMysteryOctopusEternalFlameClaimed: true,
            });
            this.reportQuestCompleted("mystery_octopus_caught", { fishCaught: this.fishCaught });
            if (this.boatOctopusEternalFlameRewardTimeout != null) {
              clearTimeout(this.boatOctopusEternalFlameRewardTimeout);
              this.boatOctopusEternalFlameRewardTimeout = null;
            }
            this.boatOctopusEternalFlameRewardTimeout = setTimeout(() => {
              this.boatOctopusEternalFlameRewardTimeout = null;
              this.audioManager.playSFX("choir_1", CHOIR_1_SFX_VOLUME);
              this.eternalFlameUI?.playKingLootSequence();
            }, KING_ETERNAL_FLAME_REWARD_DELAY_MS);
          }
          return;
        }

        this.fishCaught += 1;
        this.completeVehicleTutorialStep("fish");
        const xp = variant === "large" ? FISH_CATCH_XP * 2 : FISH_CATCH_XP;
        this.awardXP("fish", xp);
        this.audioManager.resumeContextIfNeeded();
        this.cameraRig.shake(0.015, 0.12);
        this.vehicleFlashTimer = Math.max(this.vehicleFlashTimer, 0.15);

        if (
          this.fishCaught === FISH_COUNT_BEFORE_MYSTERY_OCTOPUS &&
          !this.boatMysteryAt12Handled
        ) {
          this.boatMysteryAt12Handled = true;
          const pws = ProgressionManager.loadPlayerWorldState();
          const alreadyRewarded = !!pws.boatMysteryOctopusEternalFlameClaimed;
          if (!alreadyRewarded) {
            this.oceanFish?.spawnMysteryOctopus(
              new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld),
            );
          }
          this.hud.showOceanMysteryPresenceHint(alreadyRewarded);
        }
      };
      this.oceanFish.setFishingLineResolution(this.container.clientWidth, this.container.clientHeight);
    }
    this.vehicleHintsEl = mountControlHints(this.hud.root, vehicle, !this.mobile);
    this.startVehicleTutorialIfNeeded(vehicle);
    this.hud.hideUI();

    this.hud.setXP(
      this.progression.getXP(),
      this.progression.getXPForNextLevel(),
      this.progression.getXPForCurrentLevel(),
      this.progression.getLevel(),
    );
    this.propagateUpgrades();

    this.remotePlayerNameLabels = new RemotePlayerNameLabels(this.hud.root);
    this.friendBondFX = new FriendBondFX(this.scene, this.hud.root);
    this.refreshFriendIds();

    if (this.skyJellyfish) {
      this.jellyfishCaptureRing = new CircularProgressRing(this.hud.root, {
        centerIcon: "jellyfish",
      });
    }
    if (vehicle === "plane" && this.paintballSystem) {
      this.skyGremlins = new SkyGremlins(
        this.scene,
        globeRadius,
        seed,
        terrainType,
        this.paintballSystem,
        () => this.socketClient?.id,
        () => {
          this.cameraRig.shake(0.045, 0.25);
        },
        () => {
          this.awardXP("gremlin", SKY_GREMLIN_XP);
          this.cameraRig.shake(0.045, 0.25);
          this.vehicleFlashTimer = 0.14;
        },
        () => {
          this.hud.showGremlinKingWarning();
        },
        () => {
          this.awardXP("gremlin", SKY_GREMLIN_KING_XP);
          this.cameraRig.shake(0.065, 0.32);
          this.vehicleFlashTimer = 0.16;
          const prev = ProgressionManager.loadPlayerWorldState();
          const alreadyClaimed = !!prev.gremlinKingEternalFlameClaimed;
          if (!alreadyClaimed) {
            this.savePlayerWorldState({
              eternalFlameCount: (prev.eternalFlameCount ?? 0) + 1,
              gremlinKingEternalFlameClaimed: true,
            });
            this.reportQuestCompleted("gremlin_king_defeated");
            if (this.kingEternalFlameRewardTimeout != null) {
              clearTimeout(this.kingEternalFlameRewardTimeout);
              this.kingEternalFlameRewardTimeout = null;
            }
            this.kingEternalFlameRewardTimeout = setTimeout(() => {
              this.kingEternalFlameRewardTimeout = null;
              this.audioManager.playSFX("choir_1", CHOIR_1_SFX_VOLUME);
              this.eternalFlameUI?.playKingLootSequence();
            }, KING_ETERNAL_FLAME_REWARD_DELAY_MS);
          }
        },
        (isKing, isKill) => {
          if (isKill) this.playGremlinDeathSfx(isKing);
          else this.maybePlayGremlinHitSfx(isKing);
        },
        (isKing) => {
          this.onLocalPlayerGremlinPaintballHit(isKing);
        },
      );
      this.gremlinHearts = new GremlinHearts(globeRadius, seed, terrainType);
      this.gremlinHearts.onCollect = (heal, worldPos) => {
        if (!(this.localPlayer instanceof Plane)) return;
        this.localPlayer.healGremlinHealth(heal);
        this.vehicleFlashTimer = 0.14;
        this.cameraRig.shake(0.022, 0.2);
        this.collectVFX.play(worldPos, 0, {
          shardRgb: [1, 0.2, 0.32],
        });
        this.audioManager.resumeContextIfNeeded();
        const id =
          DIAMOND_SFX_IDS[Math.floor(Math.random() * DIAMOND_SFX_IDS.length)]!;
        if (this.audioManager.hasSFX(id)) {
          this.audioManager.playSFX(id, DIAMOND_SFX_VOLUME, 1.12);
        }
      };
      this.scene.add(this.gremlinHearts.group);
      this.renderer.compile(this.gremlinHearts.group, this.cameraRig.camera, this.scene);
      this.propagateUpgrades();
    } else {
      this.skyGremlins = null;
      this.gremlinHearts = null;
    }

    // NPC monoplane flyers — plane and carpet vehicles, local-only (no server sync)
    if (vehicle === "plane" || vehicle === "carpet") {
      this.npcPlanes = new NpcPlanes(this.scene, globeRadius, seed);
      if (this.paintballSystem) {
        this.npcPaintballUnsub = this.npcPlanes.registerPaintballListener(this.paintballSystem);
      }
    }

    // "Ghost" vehicles of players (and their companions) who flew here before.
    void this.initGhostPlanes(globeRadius);

    // NPC small boats — boat vehicle only, local-only
    if (vehicle === "boat") {
      this.npcBoats = new NpcBoats(this.scene, globeRadius, seed, terrainType);
    }

    this.flockFormationHUD = new FlockFormationHUD(this.hud.root);
    for (let fi = 0; fi < BIRD_FLOCK_COUNT; fi++) {
      this.birdFlocks.push(new BirdFlock(this.scene, globeRadius, seed, fi));
    }

    for (let ri = 0; ri < RAINBOW_COUNT; ri++) {
      this.rainbowArches.push(new RainbowArch(this.scene, globeRadius, seed, ri));
    }

    for (let li = 0; li < LANTERN_CLUSTER_COUNT; li++) {
      this.lanternClusters.push(new FloatingLanterns(this.scene, globeRadius, seed, li));
    }

    for (let fi = 0; fi < FIREFLY_CLUSTER_COUNT; fi++) {
      this.fireflyClusters.push(new FireflyCluster(this.scene, globeRadius, seed, terrainType, fi));
    }

    this.waterSpouts = new WaterSpouts(this.globe, seed);
    this.scene.add(this.waterSpouts.group);

    this.ensureBraziersSpawned();
    this.restorePlayerWorldState();
    {
      const ws = ProgressionManager.loadPlayerWorldState();
      if (this.runFreeplayMode && !ws.moonFrozenByEternalFlames && this.moonThreat) {
        this.moonThreat.freezeApproachForever(0);
      }
    }
    this.eternalFlameUI = new EternalFlameUI(this.container, this.hud.root);
    this.eternalFlameUI.syncFromSave();

    this.debugMenu = new DebugMenu(
      this.container,
      () => {
        const prev = ProgressionManager.loadPlayerWorldState();
        this.savePlayerWorldState({
          eternalFlameCount: (prev.eternalFlameCount ?? 0) + 1,
        });
        this.eternalFlameUI?.playKingLootSequence();
      },
      () => {
        if (this.playerVehicle !== "carpet" || !(this.localPlayer instanceof Carpet)) return;
        if (this.inCosmicVoid || !this.transitionOverlay) return;
        void this.doEnterCosmicVoid();
      },
      () => {
        if (this.inCosmicVoid) void this.exitCosmicVoid();
      },
      () => {
        void this.handleVoidVictory();
      },
      () => {
        this.voidFlameShield?.deplete();
      },
      () => {
        if (!this.braziers) return;
        if (!this.braziers.debugLightAllEternalFlames()) return;
        this.lastBrazierProgress = this.braziers.getBurnProgressSnapshot();
        this.hud.updateBrazierStatus(this.lastBrazierProgress);
        this.prevAllFiveBraziers = true;
        this.applyEternalFlamesMoonSave();
      },
      () => {
        this.moonThreat?.jumpTo(0.70);
      },
      () => {
        this.socketClient?.forceFlagSpawn();
      },
    );

    this.globe.syncMemorialStatueWithProgression();

    const landmarkRegistry = new LandmarkRegistry();
    landmarkRegistry.registerVillages(this.globe.villageCenters, seed);
    landmarkRegistry.registerLighthouses(this.globe.lighthouseCenters, seed);
    landmarkRegistry.registerWindmills(this.globe.windmillCenters, seed);
    landmarkRegistry.registerObservatories(this.globe.observatoryCenters, seed);
    landmarkRegistry.registerStonehenges(this.globe.stonehengeCenters, seed);
    landmarkRegistry.registerShrines(this.globe.shrineCenters, seed);
    landmarkRegistry.registerHotsprings(this.globe.hotspringCenters, seed);
    landmarkRegistry.registerMushrooms(this.globe.mushroomCenters, seed);
    landmarkRegistry.registerButterflies(this.globe.butterflyCenters, seed);
    landmarkRegistry.registerPyramids(this.globe.pyramidCenters, seed);
    landmarkRegistry.registerStatues(this.globe.statueCenters, seed, this.playerName);
    landmarkRegistry.registerRaceBanners(this.globe.raceBannerCenters, seed);
    this.landmarkDetector = new LandmarkDetector(landmarkRegistry);
    this.landmarkHUD = new LandmarkHUD(this.hud.root);
    this.hud.registerLandmarkHUD(this.landmarkHUD);
    this.landmarkDetector.onEnter = (lm) => {
      this.companion?.setRetained("game.player.location", { landmark: lm.name, type: lm.type });
      this.landmarkHUD.show(lm.name, lm.type);
    };
    this.landmarkDetector.onExit = () => this.landmarkHUD.hide();

    this.packageQuestHUD = new PackageQuestHUD(this.hud.root);
    this.packageQuestHUD.onVisibilityChange = (visible, npcName) => {
      this.hud.setBubbleVisible(visible);
      if (visible && npcName) {
        for (const id of DIALOGUE_LOOP_IDS) {
          this.audioManager.fadeOutLoop(id);
        }
        this.playPackageDialogueBed(npcName);
      } else if (!visible) {
        for (const id of DIALOGUE_LOOP_IDS) {
          this.audioManager.fadeOutLoop(id);
        }
      }
    };
    this.packageQuestHUD.onDialogueBubbleOrWhisperChange = (visible) => {
      this.hud.setMobileQuestTrackerSuppressedByDialogue(visible);
    };

    this.raceManager?.dispose();
    this.raceManager = new RaceManager({
      globe: this.globe,
      audioManager: this.audioManager,
      hud: this.hud,
      hudParent: this.hud.root,
      uiContainer: this.container,
      canRace: () =>
        (this.playerVehicle === "plane" && this.localPlayer instanceof Plane) ||
        (this.playerVehicle === "carpet" && this.localPlayer instanceof Carpet),
      isCarpet: () => this.playerVehicle === "carpet" && this.localPlayer instanceof Carpet,
      getWorldPos: () =>
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      getQPosition: () => this.localPlayer.qPosition,
      getHeading: () => this.localPlayer.heading,
      onRaceStart: () => {
        this.companion?.emitMoment("game.event.race_started", {}, { salience: 0.45, voiceRelevant: true });
      },
      onRaceLost: () => {
        this.companion?.emitMoment("game.event.race_lost", {}, { salience: 0.4, voiceRelevant: true });
      },
      onWin: () => {
        this.companion?.emitMoment("game.event.race_won", { world: this.worldConfig?.name }, { salience: 0.6 });
        this.hud.showRaceWinConfetti();
        this.hud.showXPGain(100);
        // Every win: +100 XP (ProgressionManager.addXP always save()s). Eternal flame below is once only.
        this.progression.addXP(100);
        const ws = ProgressionManager.loadPlayerWorldState();
        if (!ws.raceEternalFlameClaimed) {
          this.savePlayerWorldState({
            eternalFlameCount: (ws.eternalFlameCount ?? 0) + 1,
            raceEternalFlameClaimed: true,
          });
          this.reportQuestCompleted("race_completed");
          this.eternalFlameUI?.syncFromSave();
          this.eternalFlameUI?.playKingLootSequence();
        }
      },
      onBonusDiamondCollected: (worldPos) => {
        this.triggerPlaneDiamondCollectEffects(worldPos, 0);
      },
      onRingCheckpointBurst: (worldPos) => {
        this.collectVFX.play(worldPos, 0, { shardRgb: [0.32, 0.82, 1.0] });
      },
    });

    const balloonN = this.globe.balloonCount;
    this.balloonInRange = new Array(balloonN).fill(false);
    this.balloonGreetCooldown = new Array(balloonN).fill(0);

    const obsN = this.globe.observatoryCenters.length;
    this.observatoryInRange = new Array(obsN).fill(false);
    this.observatoryCooldown = new Array(obsN).fill(0);
    this.observatoryWorldPositions = this.globe.observatoryCenters.map((o) => {
      return o.normal.clone().multiplyScalar(globeRadius + 0.04);
    });

    const shN = this.globe.stonehengeCenters.length;
    this.stonehengeInRange = new Array(shN).fill(false);
    this.stonehengeCooldown = new Array(shN).fill(0);
    this.stonehengeWorldPositions = this.globe.stonehengeCenters.map((o) => {
      return o.normal.clone().multiplyScalar(globeRadius + 0.02);
    });

    if (this.vehicleFeatures.packageQuests) {
      this.packageQuest = new PackageQuestManager(
        this.scene, globeRadius, landmarkRegistry, seed, terrainType,
      );

      this.packageQuest.onPickup = (_originName, destName, npcName, dialogue) => {
        this.companion?.setRetained("game.quest.active", { carryingTo: destName });
        const boxPick =
          BOX_COLLECT_SFX_IDS[Math.floor(Math.random() * BOX_COLLECT_SFX_IDS.length)]!;
        this.audioManager.playSFX(boxPick, BOX_COLLECT_SFX_VOLUME);
        this.packageQuestHUD.showBubble(npcName, dialogue);
        this.packageQuestHUD.showDeliveryTarget(destName);
        const pos = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
        const dm = this.packageQuest!.getDeliverySurfaceDistanceMetres(pos);
        if (dm !== null) this.packageQuestHUD.setDeliveryDistanceMetres(dm);
      };

      this.packageQuest.onDelivered = (_destName, npcName, dialogue, xp, completedQuestIndex) => {
        this.companion?.emitMoment("game.event.delivered", { to: _destName, xp }, { salience: 0.5 });
        this.companion?.setRetained("game.quest.active", { carrying: false });
        const cheerPick =
          CHEER_SFX_IDS[Math.floor(Math.random() * CHEER_SFX_IDS.length)]!;
        this.audioManager.playSFX(cheerPick, CHEER_SFX_VOLUME);
        this.packageQuestHUD.showBubble(npcName, dialogue);
        this.packageQuestHUD.hideDeliveryTarget();

        this.awardXP("delivery", xp);

        if (completedQuestIndex === THIRD_PACKAGE_DELIVERY_INDEX) {
          const ws = ProgressionManager.loadPlayerWorldState();
          if (!ws.packageThirdDeliveryEternalFlameClaimed) {
            this.savePlayerWorldState({
              eternalFlameCount: (ws.eternalFlameCount ?? 0) + 1,
              packageThirdDeliveryEternalFlameClaimed: true,
            });
            this.reportQuestCompleted("third_package_delivery", {
              completedQuestIndex,
            });
            if (this.packageThirdEternalFlameRewardTimeout != null) {
              clearTimeout(this.packageThirdEternalFlameRewardTimeout);
              this.packageThirdEternalFlameRewardTimeout = null;
            }
            this.packageThirdEternalFlameRewardTimeout = setTimeout(() => {
              this.packageThirdEternalFlameRewardTimeout = null;
              this.audioManager.playSFX("choir_1", CHOIR_1_SFX_VOLUME);
              this.eternalFlameUI?.playKingLootSequence();
            }, KING_ETERNAL_FLAME_REWARD_DELAY_MS);
          }
        }
      };

      this.packageQuest.onProgressChange = (progress) => {
        this.packageQuestHUD.setProgress(progress);
      };
    }

    const hotspringN = this.globe.hotspringCenters.length;
    const shrineN = this.globe.shrineCenters.length;
    const mushroomN = this.globe.mushroomCenters.length;
    const butterflyN = this.globe.butterflyCenters.length;
    if (this.playerVehicle === "carpet" && hotspringN + shrineN + mushroomN + butterflyN > 0) {
      const hsNormals = this.globe.hotspringCenters.map((h) => h.normal.clone().normalize());
      const shrineNormals = this.globe.shrineCenters.map((h) => h.normal.clone().normalize());
      const mushroomNormals = this.globe.mushroomCenters.map((h) => h.normal.clone().normalize());
      const butterflyNormals = this.globe.butterflyCenters.map((h) => h.normal.clone().normalize());
      
      // Pass empty arrays so they are never marked as "completed" from a previous run
      this.carpetSelfiePhotoUI = new HotspringPhotoUI(this.hud.root);
      this.carpetLandmarkSelfieQuest = new CarpetLandmarkSelfieQuest(
        hsNormals,
        new Array(hotspringN).fill(false),
        shrineNormals,
        new Array(shrineN).fill(false),
        mushroomNormals,
        new Array(mushroomN).fill(false),
        butterflyNormals,
        new Array(butterflyN).fill(false),
      );
      this.carpetLandmarkSelfieQuest.onProgressChange = (p) => {
        this.selfieProgressCached = p;
        this.carpetSelfiePhotoUI?.setProgress(p);
      };
      this.carpetLandmarkSelfieQuest.onPhotoTaken = (payload) => {
        this.globe.setLandmarkParticleOpacity(payload.kind, payload.kindIndex, 0.0);
        this.audioManager.resumeContextIfNeeded();
        this.audioManager.playSFX("camera", SELFIE_CAMERA_SFX_VOLUME);
        if (payload.kind === "hotspring") {
          this.carpetSelfiePhotoUI?.showSelfie("/2D/capybara_hotspring.jpg", t("Hot spring selfie", "温泉自拍"));
        } else if (payload.kind === "shrine") {
          this.carpetSelfiePhotoUI?.showSelfie("/2D/capybara_shrine.jpg", t("Shrine selfie", "神社自拍"));
        } else if (payload.kind === "mushroom") {
          this.carpetSelfiePhotoUI?.showSelfie("/2D/capybara_mushroom_garden.jpg", t("Mushroom garden selfie", "蘑菇花园自拍"));
        } else if (payload.kind === "butterfly") {
          this.carpetSelfiePhotoUI?.showSelfie("/2D/capybara_butterfly_garden.jpg", t("Butterfly garden selfie", "蝴蝶花园自拍"));
        }
        this.awardXP("selfie", LANDMARK_SELFIE_XP);
        this.progression.save();
      };
    } else {
      // Not a carpet, or no landmarks: hide all selfie particles
      for (let i = 0; i < hotspringN; i++) this.globe.setLandmarkParticleOpacity("hotspring", i, 0.0);
      for (let i = 0; i < shrineN; i++) this.globe.setLandmarkParticleOpacity("shrine", i, 0.0);
      for (let i = 0; i < mushroomN; i++) this.globe.setLandmarkParticleOpacity("mushroom", i, 0.0);
      for (let i = 0; i < butterflyN; i++) this.globe.setLandmarkParticleOpacity("butterfly", i, 0.0);
    }

    window.addEventListener("resize", this.onResize);

    this.initNetworking(this.worldSlug);

    this.clock.getDelta();
    this.running = true;
    this.tick();
  }

  /** Tear down everything created in startGame (globe / moon / renderer stay). */
  private teardownGameplaySession(reason = "session_ended") {
    this.sessionEpoch++;
    this.reportSessionEnded(reason);
    // Consolidate the companion's run into memory, then release it.
    void this.companion?.endSession();
    this.companion?.dispose();
    this.companion = null;
    this.companionUI?.dispose();
    this.companionUI = null;
    this.voiceControl = null;
    this.voiceFireQueued = false;
    this.stateSync?.stop();
    this.stateSync = null;
    this.socketClient?.disconnect();
    this.socketClient = null;

    this.controls?.dispose();
    this.touchControls?.dispose();
    this.touchControls = null;
    this.vehicleTutorialHints?.dispose();
    this.vehicleTutorialHints = null;
    this.activeVehicleTutorial = null;
    this.clearVehicleTutorialTimers();
    this.clearTutorialSpotlight();
    this.speedLines?.dispose();
    this.contrails?.dispose();
    this.wakeTrail?.dispose();
    this.carpetTrail?.dispose();
    this.voidCarpetTrail?.dispose();
    this.voidCarpetTrail = null;
    this.carpetWake?.dispose();
    this.carpetLeaves?.dispose();
    this.carpetDriftSmoke?.dispose();
    if (this.carpetPortalSystem) {
      this.scene.remove(this.carpetPortalSystem.group);
      this.carpetPortalSystem.dispose();
      this.carpetPortalSystem = null;
    }
    this.capybaraFlameShots?.dispose();
    this.capybaraFlameShots = null;
    for (const portal of this.cosmicWorldPortals) {
      this.scene.remove(portal.group);
      portal.dispose();
    }
    this.cosmicWorldPortals = [];
    this.lensFlare?.dispose();
    this.rainOverlay?.dispose();
    this.ringManager?.dispose();
    this.raceManager?.dispose();
    this.raceManager = null;
    if (this.gremlinHearts) {
      this.scene.remove(this.gremlinHearts.group);
      this.gremlinHearts.dispose();
      this.gremlinHearts = null;
    }
    this.collectVFX?.dispose();
    this.removeVoidEternalFlame();
    this.localPlayer?.dispose();
    this.paintballSystem?.dispose();
    this.paintballSystem = null;
    this.flagSystem?.dispose();
    this.flagSystem = null;
    this.skyGremlins?.dispose();
    this.skyGremlins = null;
    this.lastGremlinHitSfxAt = 0;
    this.lastVoidMothHitSfxAt = 0;
    this.npcPaintballUnsub?.();
    this.npcPaintballUnsub = null;
    this.npcPlanes?.dispose();
    this.npcPlanes = null;
    this.npcBoats?.dispose();
    this.npcBoats = null;
    this.ghostPlanes?.dispose();
    this.ghostPlanes = null;
    this.hideGhostEncounterChip();
    this.pairingCardCleanup?.();
    if (this.kingEternalFlameRewardTimeout != null) {
      clearTimeout(this.kingEternalFlameRewardTimeout);
      this.kingEternalFlameRewardTimeout = null;
    }
    if (this.jellyfishEternalFlameRewardTimeout != null) {
      clearTimeout(this.jellyfishEternalFlameRewardTimeout);
      this.jellyfishEternalFlameRewardTimeout = null;
    }
    if (this.packageThirdEternalFlameRewardTimeout != null) {
      clearTimeout(this.packageThirdEternalFlameRewardTimeout);
      this.packageThirdEternalFlameRewardTimeout = null;
    }
    if (this.boatOctopusEternalFlameRewardTimeout != null) {
      clearTimeout(this.boatOctopusEternalFlameRewardTimeout);
      this.boatOctopusEternalFlameRewardTimeout = null;
    }
    this.meteorShower?.dispose();
    this.meteorShower = null;
    this.waterSpouts?.dispose();
    this.waterSpouts = null;
    this.skyJellyfish?.dispose();
    this.skyJellyfish = null;
    this.jellyfishCaptureRing?.dispose();
    this.jellyfishCaptureRing = null;
    this.oceanFish?.dispose();
    this.oceanFish = null;
    this.selfieProgressCached = 0;
    this.remotePlanes?.dispose();
    this.landmarkHUD?.dispose();
    this.packageQuest?.dispose();
    this.packageQuest = null;
    this.packageQuestHUD.dispose();
    this.carpetSelfiePhotoUI?.dispose();
    this.carpetSelfiePhotoUI = null;
    this.eternalFlameUI?.dispose();
    this.eternalFlameUI = null;
    this.removeVoidEternalFlame();
    this.debugMenu?.dispose();
    this.debugMenu = null;
    this.carpetLandmarkSelfieQuest = null;
    for (const f of this.birdFlocks) f.dispose();
    this.birdFlocks = [];
    for (const r of this.rainbowArches) r.dispose();
    this.rainbowArches = [];
    for (const l of this.lanternClusters) l.dispose();
    this.lanternClusters = [];
    for (const f of this.fireflyClusters) f.dispose();
    this.fireflyClusters = [];
    this.braziers?.dispose();
    this.braziers = null;
    this.waypointBeacon?.dispose();
    this.waypointBeacon = null;
    this.portalInteractionSuppressTimer = 0;
    this.hud.disposeBrazierTracker();
    this.campsiteScene?.dispose();
    this.campsiteScene = null;
    this.flockFormationHUD?.dispose();
    this.flockFormationHUD = null;
    this.remotePlayerNameLabels.dispose();
    this.friendBondFX?.dispose();
    this.friendBondFX = null;
    this.duo = null;
    this.removeDuoBar();
    this.endPairWait();
    this.hud.dispose();

    if (this.playerLight) {
      this.scene.remove(this.playerLight);
      this.playerLight.dispose();
      this.playerLight = null;
    }

    this.audioManager.stopLoop("engine_biplane");
    this.audioManager.stopLoop("engine_carpet");
    this.audioManager.stopLoop(OCEAN_WAVES_LOOP_NAME);
    for (const id of DIALOGUE_LOOP_IDS) {
      this.audioManager.fadeOutLoop(id);
    }
    this.audioManager.setEndTimesWeight(0);
    this.audioManager.setLoopVolume(RUMBLE_LOOP_NAME, 0);
    this.audioManager.setLoopVolume(MOONSTONE_RUMBLE_LOOP_NAME, 0);

    this.progression?.save();
    this.progression?.upgrades.reset();
    this.levelUpCards?.dispose();
    this.choosingLevelUpUpgrade = false;

    if (this.vhsGlitchInterval !== null) {
      clearInterval(this.vhsGlitchInterval);
      this.vhsGlitchInterval = null;
    }
    this.vhsOverlay?.remove();
    this.vhsOverlay = null;

    this.moonstoneUnionLetterTop?.remove();
    this.moonstoneUnionLetterBot?.remove();
    this.moonstoneUnionFlashEl?.remove();
    this.moonstoneUnionVignetteEl?.remove();
    this.moonstoneUnionLetterTop = null;
    this.moonstoneUnionLetterBot = null;
    this.moonstoneUnionFlashEl = null;
    this.moonstoneUnionVignetteEl = null;
    this.moonstoneUnionCamera = null;
    if (this.moonstoneUnionGlow) {
      this.scene.remove(this.moonstoneUnionGlow);
      (this.moonstoneUnionGlow.material as SpriteMaterial).dispose();
      this.moonstoneUnionGlow = null;
    }
    if (this.moonstoneUnionCoreGlow) {
      this.scene.remove(this.moonstoneUnionCoreGlow);
      (this.moonstoneUnionCoreGlow.material as SpriteMaterial).dispose();
      this.moonstoneUnionCoreGlow = null;
    }

    /* Cosmic void flags are not tied to disposable objects; reset so a later run (e.g. after
     * moon-impact teardown → new game → void) cannot keep stale visibility or camera blend. */
    this.inCosmicVoid = false;
    this.voidEntryInProgress = false;
    this.coastCarpetDuringCosmicTransition = false;
    this.voidCameraBlend = 0;
    this.runFreeplayMode = false;

    window.removeEventListener("resize", this.onResize);
  }

  /** Plain-language label for each game stage, streamed to the companion so it
   *  knows whether the player is flying, landed, or watching a cutscene. */
  private static readonly GAME_PHASE_SUMMARY: Record<GamePhase, string | null> = {
    flying: null, // the normal state — the situation snapshot already covers it
    campsite: "The player has landed at a campsite and is not flying right now.",
    transitioning: "A short scene transition is playing — hold any flight guidance.",
    moonImpact:
      "Cutscene: the moon has struck the world. This run was lost; time is about to rewind so the player can try again.",
    moonstoneUnion:
      "Cutscene: the two moonstones are uniting to freeze the falling moon — the world is being saved.",
  };

  private static readonly MOON_EPITAPH_LINES = [
    t("You tried. You flew. It wasn't enough.", "你尽力了，你飞翔了，但还不够。"),
    t("No one could stop it. Not even you.", "没人能阻止它，连你也不能。"),
    t("The moon fell. You couldn't stop it.", "月亮坠落了，你没能阻止它。"),
  ] as const;

  private static readonly MOON_EPITAPH_FADE_IN_MS = 2500;
  private static readonly MOON_EPITAPH_HOLD_MS = 2000;
  private static readonly MOON_EPITAPH_FADE_OUT_MS = 2000;

  private static readonly ETERNAL_VICTORY_DELAY_BEFORE_FADE_SEC = 3;
  private static readonly ETERNAL_VICTORY_FADE_TO_BLACK_SEC = 4.2;
  private static readonly ETERNAL_VICTORY_HOLD_ON_BLACK_SEC = 6.5;
  private static readonly ETERNAL_VICTORY_END_TEXT = [
    t("Five braziers burn with Eternal Flame.", "五座火盆燃起了永恒之火。"),
    t(
      "Their light together holds the moon in the sky, now and for good.",
      "它们的光芒共同将月亮稳稳托在天空，从此长存。",
    ),
    t("The world is saved.", "世界得救了。"),
  ].join("\n\n");
  /** Matches fadeOut1 so other players see us fade out instead of freezing in place. */
  private static readonly MOON_NETWORK_VISIBILITY_FADE_SEC = 0.7;

  /** Epitaph line shown on black before the credits. */
  private async showMoonEpitaphOverlay(): Promise<void> {
    const lines = Game.MOON_EPITAPH_LINES;
    const text = lines[Math.floor(Math.random() * lines.length)]!;

    const el = document.createElement("p");
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0",
      padding: "0 2rem",
      fontFamily: "'Domine', Georgia, serif",
      fontSize: "clamp(1rem, 3vw, 1.4rem)",
      fontWeight: "400",
      color: "rgba(255, 255, 255, 0.75)",
      textAlign: "center",
      lineHeight: "1.6",
      letterSpacing: "0.02em",
      pointerEvents: "none",
      opacity: "0",
      transition: `opacity ${Game.MOON_EPITAPH_FADE_IN_MS}ms ease`,
    });

    this.container.appendChild(el);

    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    el.style.opacity = "1";
    await new Promise<void>((resolve) => {
      el.addEventListener("transitionend", () => resolve(), { once: true });
      setTimeout(resolve, Game.MOON_EPITAPH_FADE_IN_MS + 200);
    });

    await new Promise<void>((r) => setTimeout(r, Game.MOON_EPITAPH_HOLD_MS));

    el.style.transition = `opacity ${Game.MOON_EPITAPH_FADE_OUT_MS}ms ease`;
    el.style.opacity = "0";
    await new Promise<void>((resolve) => {
      el.addEventListener("transitionend", () => resolve(), { once: true });
      setTimeout(resolve, Game.MOON_EPITAPH_FADE_OUT_MS + 200);
    });

    el.remove();
  }

  /** Self-contained rewind render loop — runs independently of this.tick. */
  private async showMoonRewindSequence(): Promise<void> {
    if (!this.transitionOverlay) return;

    const REWIND_SPEED = 9.0;
    const FADE_IN = 1.0;   // seconds to reveal scene
    const HOLD = 0.6;      // seconds of full-visibility rewind
    const FADE_OUT = 2.2;  // seconds to go back to black
    const TOTAL = FADE_IN + HOLD + FADE_OUT;
    const cam = this.moonCinematicCamera ?? this.cameraRig.camera;

    if (!this.audioManager.muted) {
      if (!this.audioManager.hasSFX("rewind")) {
        await this.audioManager.loadSFX("rewind", "/audio/sfx/rewind.mp3");
      }
      this.audioManager.resumeContextIfNeeded();
      this.audioManager.startLoop("rewind", 0);
    }

    // Create VHS overlay (starts invisible — the rAF loop fades it in).
    this.vhsOverlay = this.createVhsOverlay();
    this.vhsOverlay.style.opacity = "0";

    // Run a dedicated rAF loop — does not depend on this.running.
    let prevTime = performance.now();
    let timer = 0;
    await new Promise<void>((resolve) => {
      const loop = () => {
        const now = performance.now();
        const dt = Math.min((now - prevTime) / 1000, 0.05);
        prevTime = now;
        timer += dt;

        // Scene + overlay alpha: 0 → 1 → 1 → 0
        let alpha: number;
        if (timer < FADE_IN) {
          alpha = timer / FADE_IN;
        } else if (timer < FADE_IN + HOLD) {
          alpha = 1;
        } else {
          alpha = 1 - (timer - FADE_IN - HOLD) / FADE_OUT;
        }
        alpha = Math.max(0, Math.min(1, alpha));

        // Rewind physics runs across the whole visible window.
        if (alpha > 0 && this.moonThreat) {
          const rewindProgress = Math.min(1, Math.max(0, timer - FADE_IN / 2) / (HOLD + FADE_IN / 2));
          this.moonThreat.rewindTick(dt, REWIND_SPEED, rewindProgress);
        }

        this.globe.update(dt);
        this.renderer.render(this.scene, cam);

        // Black overlay fades away as alpha rises, comes back as it falls.
        this.transitionOverlay!.setOpacity(1 - alpha);
        if (this.vhsOverlay) this.vhsOverlay.style.opacity = String(alpha);

        if (!this.audioManager.muted && this.audioManager.hasSFX("rewind")) {
          this.audioManager.setLoopGainImmediate("rewind", alpha * REWIND_LOOP_VOLUME);
        }

        if (timer < TOTAL) {
          requestAnimationFrame(loop);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(loop);
    });

    this.audioManager.stopLoop("rewind");

    // Ensure fully black before proceeding.
    this.transitionOverlay.setOpacity(1);

    // Restore CSS transition for any future use, then clean up.
    if (this.vhsGlitchInterval !== null) {
      clearInterval(this.vhsGlitchInterval);
      this.vhsGlitchInterval = null;
    }
    this.vhsOverlay?.remove();
    this.vhsOverlay = null;
  }

  private async returnToMainMenuAfterMoonImpact() {
    if (this.returningToMenuAfterMoon) return;
    this.returningToMenuAfterMoon = true;
    this.running = false;

    await this.showMoonEpitaphOverlay();
    await this.showMoonRewindSequence();

    {
      const prev = ProgressionManager.loadPlayerWorldState();
      const nextCount = (prev.completedMoonApproachRunCount ?? 0) + 1;
      const newlyUnlockFreeplay = !prev.freeplayModeUnlocked;
      ProgressionManager.savePlayerWorldState({
        ...prev,
        completedMoonApproachRunCount: nextCount,
        freeplayModeUnlocked: true,
        pendingFreeplayUnlockCelebration: newlyUnlockFreeplay
          ? true
          : !!prev.pendingFreeplayUnlockCelebration,
        ...(newlyUnlockFreeplay ? { freeplayUnlockModalAcked: false } : {}),
      });
    }

    this.teardownGameplaySession("moon_impact");

    this.dayNightCycle.moonProgress = 0;
    this.moonThreat?.reset();
    this.shouldShowBrazierMoonResume = false;
    this.applyDayNightPreset();
    this.gamePhase = "flying";
    this.moonCinematicStep = "done";
    this.moonCinematicCamera = null;
    this.introActive = false;
    this.vehicleHintsEl = null;
    this.campsiteHintsEl = null;

    this.mountLobby({ deferUnlockModalsUntilMenuReveal: !!this.transitionOverlay });
    this.previewActive = true;
    window.addEventListener("resize", this.onPreviewResize);
    this.onPreviewResize();
    this.resetPreviewAnimationClock();
    this.stepPreview(this.consumePreviewFrameDt());
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    requestAnimationFrame(this.previewTick);

    if (this.transitionOverlay) {
      await this.transitionOverlay.fadeIn();
      this.transitionOverlay.dispose();
      this.transitionOverlay = null;
    }
    this.lobby.revealDeferredUnlockModals();

    this.returningToMenuAfterMoon = false;
  }

  /* ── Networking ──────────────────────────────────────────────────── */

  private worldFullRetries = 0;
  private static readonly MAX_WORLD_FULL_RETRIES = 3;

  /** All-five brazier shield: local-only world event for this player. */
  private applyBrazierMoonShield(remainingMs: number, announce = true) {
    if (this.moonThreat?.isPermanentlyFrozen) return;
    this.braziers?.extinguishAll();
    this.savePlayerWorldState();
    this.moonThreat?.beginApproachPause(remainingMs);
    if (!announce) return;
    this.shouldShowBrazierMoonResume = true;
    this.hud.showBrazierMoonSlowed();
  }

  /** All five braziers lit with eternal flames; moon stopped for good (saved). */
  private applyEternalFlamesMoonSave() {
    this.braziers?.extinguishAll();
    const elapsed = this.moonThreat?.approachElapsedSeconds ?? 0;
    this.savePlayerWorldState({
      moonFrozenByEternalFlames: true,
      moonFrozenElapsedSec: elapsed,
      pendingEternalVictoryCelebration: true,
    });
    this.maybeReportSaveFeed();
    this.reportWorldSaved("eternal_flames", { moonFrozenElapsedSec: elapsed });
    this.moonThreat?.freezeApproachForever();
    this.shouldShowBrazierMoonResume = false;
    void this.returnToMainMenuAfterEternalVictory();
  }

  /** Play the 5-beams-hit-moon cutscene then fade to victory text. */
  private async returnToMainMenuAfterEternalVictory() {
    if (this.eternalVictoryReturnInProgress) return;
    this.eternalVictoryReturnInProgress = true;
    this.running = false;
    try {
      if (!this.transitionOverlay) {
        this.transitionOverlay = new TransitionOverlay(this.container);
      }

      // ── Beam cutscene ──────────────────────────────────────────────────
      // Collect brazier positions.
      const brazierPositions: Vector3[] = [];
      if (this.braziers) {
        const BRAZIER_COUNT_LOCAL = 5;
        for (let i = 0; i < BRAZIER_COUNT_LOCAL; i++) {
          const v = new Vector3();
          if (this.braziers.readWorldPosition(i, v)) brazierPositions.push(v);
        }
      }

      const moonPos = this.moonThreat?.worldPosition.clone() ?? new Vector3(0, 20, 0);

      if (brazierPositions.length > 0) {
        const beams = new EternalFlameBeams(brazierPositions, moonPos);
        this.scene.add(beams.group);

        const globeRadius = this.worldConfig?.globeRadius ?? 5;
        const cutsceneCamera = this.cameraRig.camera;
        const camStart = cutsceneCamera.position.clone();

        // Phase 1 target: pull back to see full globe + moon.
        const globeViewPos = new Vector3(0, globeRadius * 0.5, globeRadius * 2.8);

        // Phase 2 target: close-up on moon, camera to the side.
        const moonDir = moonPos.clone().normalize();
        const moonRadius = this.moonThreat?.worldRadius ?? globeRadius * 0.5;
        const perpUp  = Math.abs(moonDir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
        const moonSide = new Vector3().crossVectors(moonDir, perpUp).normalize();
        const phase2CamPos = moonPos.clone()
          .addScaledVector(moonSide, moonRadius * 3.0)
          .addScaledVector(moonDir.clone().negate(), moonRadius * 0.5);
        const phase2LookAt = moonPos.clone();

        const ZOOM_SEC = 1.2;
        let runTime     = 0;
        let inPhase2    = false;
        let lastMs      = performance.now();
        let shakeTrauma = 0;
        let p2Impacts   = 0;          // count of hits so far
        const moonOrigPos = moonPos.clone(); // reference for shake offset
        let whiteoutStarted = false;

        // Whiteout overlay — full-screen white div that fades in on all-impacts.
        const whiteoutEl = document.createElement("div");
        Object.assign(whiteoutEl.style, {
          position: "fixed", inset: "0",
          background: "#fff",
          opacity: "0",
          pointerEvents: "none",
          zIndex: "9998",
          transition: "opacity 0.7s ease-in",
        } as CSSStyleDeclaration);
        this.container.appendChild(whiteoutEl);

        // Phase 1 SFX: gong + celebrate when each beam launches from a brazier.
        this.audioManager.resumeContextIfNeeded();
        if (this.audioManager.hasSFX("gong"))
          this.audioManager.playSFX("gong", 0.55);
        beams.onBeamLaunch = (beamIndex) => {
          this.audioManager.resumeContextIfNeeded();
          // Staggered speed-boost whoosh as each orb fires.
          const BOOSTS = ["speed_boost_1", "speed_boost_2", "speed_boost_3"] as const;
          const pick = BOOSTS[beamIndex % BOOSTS.length]!;
          if (this.audioManager.hasSFX(pick))
            this.audioManager.playSFX(pick, 0.55, 0.72 + beamIndex * 0.06);
          // Celebrate on the 3rd beam (mid-sequence climax).
          if (beamIndex === 2 && this.audioManager.hasSFX("celebrate_1"))
            this.audioManager.playSFX("celebrate_1", 0.35);
        };

        // Render one frame synchronously to avoid a black gap.
        cutsceneCamera.position.copy(camStart);
        cutsceneCamera.lookAt(0, 0, 0);
        this.renderer.render(this.scene, cutsceneCamera);

        await new Promise<void>((resolve) => {
          const tick = () => {
            const now = performance.now();
            const dt  = Math.min((now - lastMs) / 1000, 0.05);
            lastMs = now;
            runTime += dt;

            if (!inPhase2) {
              // Ease camera to globe view.
              const t = Math.min(1, runTime / ZOOM_SEC);
              const e = 1 - Math.pow(1 - t, 3);
              cutsceneCamera.position.lerpVectors(camStart, globeViewPos, e);
              cutsceneCamera.lookAt(0, 0, 0);

              beams.update(dt);

              if (beams.phase1Done) {
                inPhase2 = true;
                runTime  = 0;
                cutsceneCamera.position.copy(phase2CamPos);
                cutsceneCamera.lookAt(phase2LookAt);

                // Phase 2 intro: deep rumble as we cut to the moon close-up.
                this.audioManager.resumeContextIfNeeded();
                if (this.audioManager.hasSFX("rumble"))
                  this.audioManager.playSFX("rumble", 0.45, 0.8);

                beams.onPhase2Impact = () => {
                  p2Impacts++;
                  const intensity = 0.35 + (p2Impacts / 5) * 0.65;
                  shakeTrauma = intensity;
                  // Each hit: layered impact SFX — boom + explosion.
                  this.audioManager.resumeContextIfNeeded();
                  const IMPACTS = ["impact_1", "impact_2", "impact_3"] as const;
                  const pick = IMPACTS[Math.floor(Math.random() * IMPACTS.length)]!;
                  this.audioManager.playSFX(pick, 0.7);
                  if (this.audioManager.hasSFX("explosion_1"))
                    this.audioManager.playSFX("explosion_1", 0.5);
                };
                beams.onAllP2Impacted = () => {
                  if (!whiteoutStarted) {
                    whiteoutStarted = true;
                    // Final flash: choir swell.
                    this.audioManager.resumeContextIfNeeded();
                    if (this.audioManager.hasSFX("choir_1"))
                      this.audioManager.playSFX("choir_1", 0.9);
                    whiteoutEl.style.transition = "none";
                    whiteoutEl.style.opacity = "1";
                    resolve();
                  }
                };
                beams.startPhase2(moonDir, moonRadius, phase2CamPos);
              }
            } else {
              // Decay trauma spike each frame.
              shakeTrauma = Math.max(0, shakeTrauma - dt * 2.5);

              // Camera slow drift.
              const drift  = runTime * 0.03;
              cutsceneCamera.position.copy(phase2CamPos)
                .addScaledVector(moonSide, Math.sin(drift) * moonRadius * 0.1);
              cutsceneCamera.lookAt(phase2LookAt);

              beams.update(dt);

              if (beams.state === "done" && !whiteoutStarted) {
                // Fallback: if whiteout never triggered, resolve now.
                this.moonThreat?.group.position.copy(moonOrigPos);
                resolve();
                return;
              }
            }

            // Keep world fully alive.
            this.globe.update(dt);
            this.moonThreat?.update(dt);

            // Apply moon shake AFTER moonThreat.update so it isn't overwritten.
            // Only shake once the first beam has hit (p2Impacts > 0).
            if (inPhase2 && p2Impacts > 0 && this.moonThreat) {
              const baseAmp   = moonRadius * 0.012;
              const impactAmp = moonRadius * (p2Impacts / 5) * 0.06;
              const spikeAmp  = shakeTrauma * shakeTrauma * moonRadius * 0.08;
              const amp = baseAmp + impactAmp + spikeAmp;
              this.moonThreat.group.position.set(
                moonOrigPos.x + (Math.random() - 0.5) * amp,
                moonOrigPos.y + (Math.random() - 0.5) * amp,
                moonOrigPos.z + (Math.random() - 0.5) * amp,
              );
            }
            this.aurora?.update(dt, cutsceneCamera);
            this.applyDayNightPreset();
            this.audioManager.update(dt);
            for (const v of this.volcanoes) v.update(dt, _farQ, 999);
            this.renderer.render(this.scene, cutsceneCamera);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });

        whiteoutEl.remove();
        this.moonThreat?.group.position.copy(moonOrigPos);

        beams.dispose();
        this.scene.remove(beams.group);
      } else {
        // Fallback: no braziers found — use original delay.
        await new Promise<void>((r) =>
          setTimeout(r, Game.ETERNAL_VICTORY_DELAY_BEFORE_FADE_SEC * 1000),
        );
      }

      // ── Snap white overlay up, then show victory text ─────────────────
      await this.transitionOverlay.fadeOut({
        durationSec:   Game.ETERNAL_VICTORY_FADE_TO_BLACK_SEC / 2,
        message:       Game.ETERNAL_VICTORY_END_TEXT,
        holdAtFullSec: Game.ETERNAL_VICTORY_HOLD_ON_BLACK_SEC,
        bgColor:       "#ffffff",
        textColor:     "#1a1a2e",
      });
      this.teardownGameplaySession("world_saved");
      this.dayNightCycle.moonProgress = 0;
      this.moonThreat?.reset();
      this.shouldShowBrazierMoonResume = false;
      this.applyDayNightPreset();
      this.gamePhase = "flying";
      this.moonCinematicStep = "done";
      this.moonCinematicCamera = null;
      this.introActive = false;
      this.vehicleHintsEl = null;
      this.campsiteHintsEl = null;
      this.mountLobby({ deferUnlockModalsUntilMenuReveal: !!this.transitionOverlay });
      this.globe.syncMemorialStatueWithProgression();
      this.previewActive = true;
      window.addEventListener("resize", this.onPreviewResize);
      this.onPreviewResize();
      this.resetPreviewAnimationClock();
      this.stepPreview(this.consumePreviewFrameDt());
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      requestAnimationFrame(this.previewTick);
      if (this.transitionOverlay) {
        await this.transitionOverlay.fadeIn();
        this.transitionOverlay.dispose();
        this.transitionOverlay = null;
      }
      this.lobby.revealDeferredUnlockModals();
    } finally {
      this.eternalVictoryReturnInProgress = false;
    }
  }

  private initNetworking(slug: string) {
    this.flagSystem?.dispose();
    this.flagSystem = null;

    const serverUrl = this.getServerUrl();
    this.socketClient = new SocketClient(serverUrl);

    this.socketClient.onPlayerJoined((player) => {
      this.remotePlanes.addPlayer(player);
      this.remotePlayerNames.set(player.id, player.name);
      this.companion?.emitMoment("game.event.met_player", { name: player.name }, { salience: 0.4 });
      this.hud.setPlayerCount(this.remotePlanes.count + 1);
    });

    this.socketClient.onPlayerLeft((playerId) => {
      this.remotePlanes.removePlayer(playerId);
      this.remotePlayerNames.delete(playerId);
      this.hud.setPlayerCount(this.remotePlanes.count + 1);
    });

    this.socketClient.onPlayerUpdate((player) => {
      this.remotePlanes.updatePlayer(player);
    });

    this.socketClient.onWorldState((players) => {
      for (const p of players) {
        this.remotePlanes.addPlayer(p);
        this.remotePlayerNames.set(p.id, p.name);
      }
      this.hud.setPlayerCount(this.remotePlanes.count + 1);
    });

    // A2A companion pairing relay (Phase 4).
    this.socketClient.onPairIncoming((ev) =>
      this.handlePairIncoming(ev.fromId, ev.fromName, ev.fromVisitorId, ev.fromCompanionName),
    );
    this.socketClient.onPairAnswered((ev) => this.handlePairAnswered(ev));
    this.socketClient.onCompanionHailed((ev) => this.handleCompanionHailed(ev));
    this.socketClient.onCompanionGifted((ev) => this.handleCompanionGifted(ev));
    this.socketClient.onDuoIncoming((ev) => void this.handleDuoIncoming(ev.fromId, ev.fromName));
    this.socketClient.onDuoAnswered((ev) => this.handleDuoAnswered(ev.fromId, ev.fromName, ev.accept));
    this.socketClient.onDuoCompleted((ev) => {
      if (this.duo && this.duo.peerSocketId === ev.fromId) this.completeDuo(false);
    });

    this.socketClient.onWorldFull(() => {
      this.handleWorldFull();
    });

    this.socketClient.onPaintballFired((ev) => {
      this.paintballSystem?.onPaintballFired(ev);
    });

    this.socketClient.onPaintballHit((ev) => {
      this.paintballSystem?.onPaintballHit(
        ev,
        this.localPlayer instanceof Plane ? this.localPlayer.group : null,
      );
    });

    this.flagSystem = new FlagSystem({
      scene: this.scene,
      hud: this.hud,
      getLocalPlayerId: () => this.socketClient?.id ?? "",
      getLocalPlayerGroup: () => this.localPlayer?.group ?? null,
      remotePlanes: this.remotePlanes,
    });

    this.socketClient.onFlagSpawned((ev) => this.flagSystem?.onFlagSpawned(ev));
    this.socketClient.onFlagCollected((ev) => this.flagSystem?.onFlagCollected(ev));
    this.socketClient.onFlagCaptureStart((ev) => this.flagSystem?.onFlagCaptureStart(ev));
    this.socketClient.onFlagCaptureEnd((ev) => this.flagSystem?.onFlagCaptureEnd(ev));
    this.socketClient.onFlagStolen((ev) => this.flagSystem?.onFlagStolen(ev));
    this.socketClient.onFlagDropped((ev) => this.flagSystem?.onFlagDropped(ev));
    this.socketClient.onFlagCleared(() => this.flagSystem?.onFlagCleared());
    this.socketClient.onFlagSync((ev) => this.flagSystem?.onFlagSync(ev));

    this.socketClient.joinWorld(
      slug,
      this.playerName,
      this.playerVehicle,
      this.reservationId,
      !!ProgressionManager.loadCompanionToken(),
      ProgressionManager.loadOrCreateVisitorId(),
    );
    this.socketClient.onGhostPairIncoming((ev) => void this.handleGhostPairIncoming(ev));
    this.socketClient.onGhostPairNotice((ev) =>
      this.hud.showAmbientToast(
        IS_ZH
          ? `✦ ${ev.name} 上线了，正在邀请 TA 来与你配对…`
          : `✦ ${ev.name} just came online — inviting them to pair with you…`,
      ),
    );
    // If we arrived here to fulfil a ghost-pair invite, auto-request pairing.
    this.consumePendingGhostPair(slug);

    this.stateSync = new StateSync(this.socketClient, this.localPlayer, {
      getCarpetPortals: () => this.carpetPortalSystem?.getMultiplayerSnapshot(),
      getCarpetPortalTeleportSeq: () =>
        this.playerVehicle === "carpet" ? this.carpetPortalTeleportSeq : undefined,
      getCompanionName: () => this.companion?.companionDisplayName ?? undefined,
      getVisitorId: () => ProgressionManager.loadOrCreateVisitorId(),
    });
    this.stateSync.start();

    if (this.playerVehicle === "plane") {
      this.audioManager.startLoop("engine_biplane", 0);
    } else if (this.playerVehicle === "carpet") {
      this.audioManager.startLoop("engine_carpet", 0.06);
      this.audioManager.startLoop(OCEAN_WAVES_LOOP_NAME, 0);
    } else if (this.playerVehicle === "boat") {
      this.audioManager.startLoop(OCEAN_WAVES_LOOP_NAME, OCEAN_WAVES_LOOP_VOL);
    }
  }

  private async handleWorldFull() {
    this.worldFullRetries++;
    if (this.worldFullRetries > Game.MAX_WORLD_FULL_RETRIES) {
      console.error("Max world:full retries exceeded");
      return;
    }

    console.log(`World full, retrying auto-join (attempt ${this.worldFullRetries})...`);

    this.socketClient?.disconnect();
    this.stateSync?.stop();

    const toast = document.createElement("div");
    Object.assign(toast.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "16px 28px",
      borderRadius: "12px",
      background: "rgba(0, 0, 0, 0.7)",
      backdropFilter: this.mobile ? "none" : "blur(12px)",
      color: "white",
      fontFamily: "'Domine', Georgia, serif",
      fontSize: this.mobile ? "0.85rem" : "0.95rem",
      zIndex: "300",
    });
    toast.textContent = t("Finding a new world...", "正在寻找新世界…");
    this.container.appendChild(toast);

    try {
      const serverUrl = this.getServerUrl();
      const joinRes = await fetch(`${serverUrl}/api/worlds/auto-join`, {
        method: "POST",
      });
      if (!joinRes.ok) throw new Error("Failed to auto-join");
      const data = await joinRes.json();

      this.worldSlug = data.slug;
      this.reservationId = data.reservationId;
      this.worldConfig = data;

      this.hud.setWorldName(
        localizeWorldName(data.name ?? t("Unknown World", "未知世界")),
      );

      this.initNetworking(this.worldSlug);
    } catch (err) {
      console.error("Retry auto-join failed:", err);
    } finally {
      toast.remove();
    }
  }

  /* ── Main game loop ──────────────────────────────────────────────── */

  private static readonly INTRO_DURATION = 5.2;
  /** Ease the live end target in only in this tail fraction so `snapTo` matches the last frame. */
  private static readonly INTRO_LIVE_END_BLEND_START = 0.85;
  /** Desktop spotlight dim: hold at full strength, then fade out (ms). */
  private static readonly TUTORIAL_SPOTLIGHT_HOLD_MS = 4000;
  private static readonly TUTORIAL_SPOTLIGHT_FADE_MS = 450;
  /** Gremlins stay hidden until this many seconds after the session starts (`gameTime`). */
  private static readonly SKY_GREMLIN_SPAWN_DELAY_SEC = 30;
  /** Tangent-plane heading (rad) for the Home intro camera approach toward the campsite. */
  private static readonly CAMP_INTRO_APPROACH = 0.85;

  /**
   * Sets `introEndPos` / `introEndLookAt` for the lobby→game flythrough.
   * When starting at the campsite (Home), the path ends at the marker; otherwise it chases the vehicle.
   */
  private computeIntroEndTargets(globeRadius: number): void {
    if (this.pendingCampsiteAfterIntro && this.campsiteMarker) {
      const campPos = this.campsiteMarker.worldPosition;
      const frame = tangentFrame(this.campsiteMarker.surfaceQuat);
      const fwd = new Vector3()
        .addScaledVector(frame.north, Math.cos(Game.CAMP_INTRO_APPROACH))
        .addScaledVector(frame.east, Math.sin(Game.CAMP_INTRO_APPROACH))
        .normalize();
      this.introEndPos
        .copy(campPos)
        .addScaledVector(fwd, -this.vehicleFeatures.cameraFollowDistance)
        .addScaledVector(frame.up, this.vehicleFeatures.cameraFollowHeight);
      this.introEndLookAt.copy(campPos).addScaledVector(fwd, 0.5);
      return;
    }
    const playerWorldPos = cartesianFromSpherical(
      this.localPlayer.qPosition,
      this.localPlayer.altitude,
      globeRadius,
    );
    const frame = tangentFrame(this.localPlayer.qPosition);
    const fwd = new Vector3()
      .addScaledVector(frame.north, Math.cos(this.localPlayer.heading))
      .addScaledVector(frame.east, Math.sin(this.localPlayer.heading))
      .normalize();
    this.introEndPos
      .copy(playerWorldPos)
      .addScaledVector(fwd, -this.vehicleFeatures.cameraFollowDistance)
      .addScaledVector(frame.up, this.vehicleFeatures.cameraFollowHeight);
    this.introEndLookAt.copy(playerWorldPos).addScaledVector(fwd, 0.5);
  }

  private introDirScratch = new Vector3();
  private introPosScratch = new Vector3();
  private introStartUnit = new Vector3();
  private introPathEndUnit = new Vector3();
  private introUpScratch = new Vector3();
  private introLookAtResult = new Vector3();
  private static readonly _introWorldUp = new Vector3(0, 1, 0);

  /** Smooth great-circle interpolation between unit directions (stable turn rate vs lerp+normalize). */
  private slerpUnitVectors(a: Vector3, b: Vector3, t: number, out: Vector3): Vector3 {
    const dot = MathUtils.clamp(a.dot(b), -1, 1);
    const theta = Math.acos(dot);
    if (theta < 1e-4) {
      return out.copy(a).lerp(b, t).normalize();
    }
    const sinT = Math.sin(theta);
    const w0 = Math.sin((1 - t) * theta) / sinT;
    const w1 = Math.sin(t * theta) / sinT;
    return out.copy(a).multiplyScalar(w0).addScaledVector(b, w1).normalize();
  }

  private getChaseCameraRigParams() {
    const v = this.voidCameraBlend;
    return {
      followDist: this.vehicleFeatures.cameraFollowDistance + v * VOID_CAMERA_DIST_DELTA,
      followHeight: this.vehicleFeatures.cameraFollowHeight + v * VOID_CAMERA_EXTRA_HEIGHT,
      tiltScale: this.vehicleFeatures.cameraTiltScale * (1 - VOID_CAMERA_TILT_DAMP * v),
    };
  }

  private getVoidCameraChaseForRig():
    | {
        worldPos: Vector3;
        forward: Vector3;
        up: Vector3;
      }
    | null {
    if (
      !this.inCosmicVoid ||
      !(this.localPlayer instanceof Carpet) ||
      !this.localPlayer.isVoidPlaneFlight
    ) {
      return null;
    }
    const c = this.localPlayer;
    c.getVoidPlaneWorldPos(this._voidChasePos);
    this._voidChaseForward
      .set(0, 0, 0)
      .addScaledVector(c.getVoidPlaneNorth(), Math.cos(c.heading))
      .addScaledVector(c.getVoidPlaneEast(), Math.sin(c.heading))
      .normalize();
    return {
      worldPos: this._voidChasePos,
      forward: this._voidChaseForward,
      up: c.getVoidPlaneUp(),
    };
  }

  private tick = () => {
    if (!this.running) return;
    requestAnimationFrame(this.tick);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.gameTime += dt;
    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    /**
     * Twister *player* effects (forced spin, proximity audio) off in void and during
     * carpet void transitions. World twister visuals use a separate check — always sim
     * time when the ocean twisters are visible, or the shader time uniform stalls.
     */
    const twisterSuppressed = this.inCosmicVoid || this.coastCarpetDuringCosmicTransition;
    const voidCamTarget = this.inCosmicVoid || this.voidEntryInProgress ? 1 : 0;
    this.voidCameraBlend += (voidCamTarget - this.voidCameraBlend) * (1 - Math.exp(-VOID_CAMERA_BLEND_SPEED * dt));
    if (this.waterSpouts && this.inCosmicVoid) {
      this.waterSpouts.group.visible = false;
    }
    this.dayNightCycle.moonProgress = this.moonThreat?.progress ?? 0;

    if (this.localPlayer instanceof Boat && this.progression) {
      const state = this.progression.upgrades.state;
      const atHighSpeed = this.localPlayer.speedRatio >= 0.8;
      this.ringManager.upgrades.highSpeedMult = atHighSpeed
        ? state.boatHighSpeedDiamondMult
        : 1;
    } else {
      this.ringManager.upgrades.highSpeedMult = 1;
    }

    if (this.introActive) {
      this.skyGremlins?.setSuspended(true);
      this.localPlayer.visibility = 1;
      this.introTimer += dt;
      const raw = Math.min(this.introTimer / Game.INTRO_DURATION, 1);
      // Ease-in-out: avoids the old ease-out spike at t≈0 that made the first part of the zoom feel jerky.
      const t = raw * raw * (3 - 2 * raw);

      this.localPlayer.update(dt, 0, false, false, false, false);

      this.computeIntroEndTargets(globeRadius);

      // Blend in the *live* end pose only in the last segment so the slerp path is stable, then
      // the final frame matches `snapTo` (avoids a late corkscrew + a discontinuous first chase frame).
      const rawBlend = Math.max(0, t - Game.INTRO_LIVE_END_BLEND_START) / (1 - Game.INTRO_LIVE_END_BLEND_START);
      const wEnd = rawBlend * rawBlend * (3 - 2 * rawBlend);
      this.introBlendedEnd.copy(this.introFrozenEndPos).lerp(this.introEndPos, wEnd);
      this.introBlendedLook.copy(this.introFrozenEndLookAt).lerp(this.introEndLookAt, wEnd);

      this.introStartUnit.copy(this.introStartPos).normalize();
      this.introPathEndUnit.copy(this.introBlendedEnd).normalize();
      const startDist = this.introStartPos.length();
      const endDist = this.introBlendedEnd.length();

      const dir = this.slerpUnitVectors(
        this.introStartUnit,
        this.introPathEndUnit,
        t,
        this.introDirScratch,
      );
      const dist = startDist + (endDist - startDist) * t;
      const pos = this.introPosScratch.copy(dir).multiplyScalar(dist);

      this.introLookAtResult.copy(this.introBlendedLook).multiplyScalar(t);
      this.introPathEndUnit.copy(pos).normalize();
      this.introUpScratch
        .copy(Game._introWorldUp)
        .lerp(this.introPathEndUnit, t)
        .normalize();
      // sin²(πt): zero d/dt at t∈{0,1} so the roll is not “spinning to a stop” at the cut to chase.
      const sRoll = Math.sin(t * Math.PI);
      const rollZ = sRoll * sRoll * 0.12;
      this.cameraRig.setPositionAndLookAt(pos, this.introLookAtResult, rollZ, this.introUpScratch);
      if (this.localPlayer instanceof Plane) {
        this.localPlayer.updateGremlinDamageHpBar(dt, this.cameraRig.camera);
      }

      this.globe.update(dt);
      if (!this.inCosmicVoid && !this.voidEntryInProgress) {
        this.moonThreat?.update(dt);
      }
      for (const portal of this.cosmicWorldPortals) {
        portal.update(dt, this.cameraRig.camera, 0); // Hide during intro
      }
      this.remotePlanes.update(dt, this.cameraRig.camera);
      this.flagSystem?.update(dt);
      this.applyDayNightPreset();
      this.audioManager.update(dt);
      this.aurora?.update(dt, this.cameraRig.camera);

      this.localPlayer.group.updateMatrixWorld(true);
      this.meteorShower?.update(
        dt,
        this.moonThreat?.progress ?? 0,
        this.localPlayer.qPosition,
        this.localPlayer.heading,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      );
      this.waterSpouts?.update(dt);
      this.skyJellyfish?.update(
        dt,
        this.localPlayer.group.matrixWorld,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
        false,
        false,
      );
      this.jellyfishCaptureRing?.setProgress(this.skyJellyfish?.getCaptureProgress() ?? 0);
      this.updateOceanFish(dt, false);
      if (this.playerLight) {
        this.playerLight.position.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
        const up = this.playerLight.position.clone().normalize();
        this.playerLight.position.addScaledVector(up, 0.15);
      }

      this.remotePlayerNameLabels.update(
        this.remotePlanes,
        this.cameraRig.camera,
        this.renderer.domElement,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      );

      // "Friends, together": pointer to + tether/heart with paired A2A friends here.
      if (this.friendBondFX) {
        const friends: FriendInWorld[] = [];
        if (this.friendVisitorIds.size > 0) {
          this.remotePlanes.forEachRemote((p) => {
            const vid = p.visitorId;
            if (vid && this.friendVisitorIds.has(vid)) {
              p.group.updateMatrixWorld(true);
              friends.push({
                name: p.name,
                bondLevel: friendBondLevel(this.friendByVisitor.get(vid)?.bond),
                pos: new Vector3().setFromMatrixPosition(p.group.matrixWorld),
              });
              // Bond grows from time spent together: +1 every 12s co-present.
              const acc = (this.bondTimers.get(vid) ?? 0) + dt;
              if (acc >= 12) { this.bumpBond(vid, 1); this.bondTimers.set(vid, acc - 12); }
              else this.bondTimers.set(vid, acc);
              // Tell the companion a paired friend is here so it can point them out.
              if (!this.friendHereAnnounced.has(vid)) {
                this.friendHereAnnounced.add(vid);
                this.companion?.emitMoment(
                  "game.event.friend_here",
                  { name: p.name, bondLevel: friendBondLevel(this.friendByVisitor.get(vid)?.bond) },
                  { salience: 0.6, voiceRelevant: true },
                );
              }
              // Offer a "fly together" duo once per friend per session.
              if (!this.duo && !this.duoChipOffered.has(vid)) {
                this.duoChipOffered.add(vid);
                this.showDuoChip(p.id, p.name, vid);
              }
            }
          });
        }
        if (friends.length > 0) {
          this.friendBondFX.update(
            this.localPlayerWorldScratch,
            this.cameraRig.camera,
            this.renderer.domElement,
            friends,
            dt,
          );
        } else {
          this.friendBondFX.clear();
        }
      }
      this.updateDuo(dt);

      // Focus shadow camera on the player for high-resolution local shadows.
      // Covers ±5 world units around the player (2048/10 = 205 texels/unit vs 47 at globe-wide).
      const _shadowPlayerPos = this.localPlayerWorldScratch.setFromMatrixPosition(
        this.localPlayer.group.matrixWorld,
      );
      this.sunLight.target.position.copy(_shadowPlayerPos);
      this.sunLight.target.updateMatrixWorld();
      this.sunLight.shadow.camera.left   = -5;
      this.sunLight.shadow.camera.right  =  5;
      this.sunLight.shadow.camera.top    =  5;
      this.sunLight.shadow.camera.bottom = -5;
      this.sunLight.shadow.camera.updateProjectionMatrix();

      this.renderer.render(this.scene, this.cameraRig.camera);

      if (raw >= 1) {
        this.introActive = false;
        const landingAtCampsite = this.pendingCampsiteAfterIntro;
        if (!landingAtCampsite) {
          this.cameraRig.snapTo(
            this.localPlayer.qPosition,
            this.localPlayer.heading,
            this.localPlayer.altitude,
            globeRadius,
            this.vehicleFeatures.cameraFollowDistance,
            this.vehicleFeatures.cameraFollowHeight,
          );
        }
        this.hud.show();
        if (!landingAtCampsite) {
          this.beginTutorialSpotlightAfterIntro();
        }
        if (landingAtCampsite) {
          this.pendingCampsiteAfterIntro = false;
          void this.doLanding();
        }
      }
      this.syncQuestTrackersToHud();
      return;
    }

    /* ── Campsite phase ────────────────────────────────── */
    if (this.gamePhase === "campsite" && this.campsiteScene) {
      this.syncQuestTrackersToHud();
      this.skyGremlins?.setSuspended(true);
      this.localPlayer.visibility = 1;
      if (!this.inCosmicVoid && !this.voidEntryInProgress) {
        this.moonThreat?.update(dt);
      }
      this.localPlayer.group.updateMatrixWorld(true);
      this.meteorShower?.update(
        dt,
        this.moonThreat?.progress ?? 0,
        this.localPlayer.qPosition,
        this.localPlayer.heading,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      );
      this.waterSpouts?.update(dt);
      this.skyJellyfish?.update(
        dt,
        this.localPlayer.group.matrixWorld,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
        false,
        false,
      );
      this.updateOceanFish(dt, false);
      if (this.moonThreat?.isNearImpact || this.moonThreat?.hasImpacted) {
        this.campsiteScene.exit();
        this.localPlayer.group.visible = true;
        this.startMoonImpactCinematic();
        return;
      }
      const result = this.campsiteScene.update(dt);
      this.applyDayNightPreset();
      this.campsiteScene.updatePreset(this.dayNightCycle.getPreset());
      this.audioManager.update(dt);
      this.renderer.render(this.campsiteScene.scene, this.campsiteScene.camera);
      if (result.takeOff) this.doTakeOff();
      return;
    }
    if (this.gamePhase === "transitioning") {
      this.syncQuestTrackersToHud();
      this.skyGremlins?.setSuspended(true);
      if (this.coastCarpetDuringCosmicTransition && this.localPlayer instanceof Carpet) {
        this.localPlayer.update(dt, 0, false, false, false, false, false, { maintainSpeed: true });
        const voidCam = this.getChaseCameraRigParams();
        this.cameraRig.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.heading,
          this.localPlayer.altitude,
          globeRadius,
          0,
          this.localPlayer.speedRatio,
          voidCam.tiltScale,
          voidCam.followDist,
          voidCam.followHeight,
          this.vehicleFeatures.cameraSpeedZoom,
          this.vehicleFeatures.cameraFovBoost,
          this.getVoidCameraChaseForRig(),
        );
        if (this.playerLight) {
          this.playerLight.position.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
          const up = this.playerLight.position.clone().normalize();
          this.playerLight.position.addScaledVector(up, 0.15);
        }
      } else {
        this.localPlayer.group.updateMatrixWorld(true);
      }
      this.meteorShower?.update(
        dt,
        this.moonThreat?.progress ?? 0,
        this.localPlayer.qPosition,
        this.localPlayer.heading,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      );
      this.waterSpouts?.update(dt);
      this.skyJellyfish?.update(
        dt,
        this.localPlayer.group.matrixWorld,
        this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
        false,
        false,
      );
      this.updateOceanFish(dt, false);
      for (const portal of this.cosmicWorldPortals) {
        portal.update(dt, this.cameraRig.camera, 1.0);
      }
      this.renderer.render(this.scene, this.cameraRig.camera);
      return;
    }

    /* ── Moon impact cinematic phase ────────────────────── */
    if (this.gamePhase === "moonImpact") {
      this.syncQuestTrackersToHud();
      this.skyGremlins?.setSuspended(true);
      this.moonThreat?.update(dt);
      this.tickMoonImpactCinematic(dt);
      return;
    }

    /* ── Moonstone union cinematic phase ────────────────── */
    if (String(this.gamePhase) === "moonstoneUnion") {
      this.syncQuestTrackersToHud();
      this.skyGremlins?.setSuspended(true);
      this.tickMoonstoneUnionCinematic(dt);
      return;
    }

    if (this.portalInteractionSuppressTimer > 0) {
      this.portalInteractionSuppressTimer = Math.max(0, this.portalInteractionSuppressTimer - dt);
    }

    let { turnRate, forward, brake, elevate, descend, paintball, specialAction, interact } =
      this.touchControls ? this.touchControls.getState() : this.controls.getState();
    // Companion voice/chat control: a timed override on top of the player's own
    // input. Applied before the level-up / twister blocks so those still win.
    if (this.voiceControl) {
      const vc = this.voiceControl;
      if (vc.turnRate !== 0) turnRate = vc.turnRate;
      if (vc.forward) forward = true;
      if (vc.brake) brake = true;
      if (vc.elevate) elevate = true;
      if (vc.descend) descend = true;
      vc.remaining -= dt;
      if (vc.remaining <= 0) this.voiceControl = null;
    }
    if (this.voiceFireQueued) {
      paintball = true;
      this.voiceFireQueued = false;
    }
    if (this.choosingLevelUpUpgrade) {
      forward = false;
      brake = true;
      turnRate = 0;
      paintball = false;
      specialAction = false;
      interact = false;
    }
    this.updateVehicleTutorial({ turnRate, forward, brake, elevate, paintball, specialAction });

    // Twister spin: one burst per engagement, then cooldown (collision was re-arming every frame → infinite spin).
    if (!twisterSuppressed) {
      if (this.twisterSpinCooldown > 0) {
        this.twisterSpinCooldown = Math.max(0, this.twisterSpinCooldown - dt);
      }
      if (this.waterSpouts) {
        const playerPos = this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
        if (
          this.waterSpouts.checkCollision(playerPos, 0.45) &&
          this.twisterSpinTimer <= 0 &&
          this.twisterSpinCooldown <= 0
        ) {
          this.twisterSpinTimer = TWISTER_SPIN_DURATION_SEC;
        }
      }
      if (this.twisterSpinTimer > 0) {
        this.twisterSpinTimer -= dt;
        if (this.twisterSpinTimer <= 0) {
          this.twisterSpinTimer = 0;
          this.twisterSpinCooldown = TWISTER_SPIN_COOLDOWN_SEC;
        }

        const spinT = Math.max(0, this.twisterSpinTimer);
        let spinInput = 8.0; // Plane
        if (this.localPlayer.vehicle === "carpet") spinInput = 8.0;
        else if (this.localPlayer.vehicle === "boat") spinInput = 7.0;

        // Start fast, slow down at the end
        const spinDecay = spinT / TWISTER_SPIN_DURATION_SEC;
        spinInput *= Math.pow(spinDecay, 0.5);

        turnRate = spinInput; // Force spin
        forward = false; // Kill forward input
        brake = true; // Force brake
      }
    }

    this.localPlayer.visibility = 1;
    this.localPlayer.update(dt, turnRate, forward, brake, elevate, paintball, descend);
    this.localPlayer.group.updateMatrixWorld(true);

    // Keep the AI companion aware of the current objective / danger / environment
    // so it can guide the player. Built ~every 3s; the manager dedupes unchanged state.
    if (this.companion) {
      this.companionSituationTimer += dt;
      if (this.companionSituationTimer >= 3) {
        this.companionSituationTimer = 0;
        this.emitCompanionSituation();
        // During a live voice call, retained state doesn't reach the voice agent —
        // inject a fresh situation summary (silently) every ~30s so it stays aware.
        if (this.companion.inCall) {
          this.companionCallContextTimer += 3;
          if (this.companionCallContextTimer >= 30) {
            this.companionCallContextTimer = 0;
            this.companion.injectCallContext(this.composeSituationSummary(this.buildSituationSnapshot()));
          }
        }
      }
      // Less often, refresh "where are other agents" so the companion can suggest
      // meeting up. Only meaningful when this player has a companion themselves.
      this.companionRendezvousTimer += dt;
      if (this.companionRendezvousTimer >= 20) {
        this.companionRendezvousTimer = 0;
        void this.emitRendezvous();
        this.emitCoopState();
        this.emitFriendsState();
      }
      // A2A: detect when we meet another companion-pilot so the agents greet.
      this.companionEncounterTimer += dt;
      if (this.companionEncounterTimer >= 0.7) {
        this.companionEncounterTimer = 0;
        this.localPlayer.group.updateMatrixWorld(true);
        this.detectCompanionEncounters(
          new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld),
        );
      }
    }
    if (
      this.raceManager &&
      this.gamePhase === "flying" &&
      !this.inCosmicVoid &&
      !this.voidEntryInProgress
    ) {
      this.raceManager.update(dt);
    }

    if (
      specialAction &&
      this.localPlayer instanceof Carpet &&
      this.carpetPortalSystem &&
      !this.inCosmicVoid &&
      this.portalInteractionSuppressTimer <= 0
    ) {
      this.carpetPortalSystem.placePortal(this.localPlayer);
      this.completeVehicleTutorialStep("portal1");
      this.completeVehicleTutorialStep("portal2");
    }

    if (this.localPlayer instanceof Carpet && this.carpetPortalSystem) {
      const portalUpdate = this.carpetPortalSystem.update(dt, this.localPlayer);
      if (portalUpdate.didTeleport) {
        this.handleCarpetPortalTeleport();
        this.completeVehicleTutorialStep("portalTravel");
      }
    }

    if (paintball && this.localPlayer instanceof Plane && this.paintballSystem) {
      this.paintballSystem.tryLocalFire(this.localPlayer);
    }
    if (
      this.inCosmicVoid &&
      this.localPlayer instanceof Carpet &&
      this.capybaraFlameShots &&
      this.localPlayer.hasCapybara &&
      this.portalInteractionSuppressTimer <= 0
    ) {
      this.localPlayer.getVoidPlaneWorldPos(this._carpetVoidWorldScratch);
      const hasAim = this.voidMoths?.getNearestMothToPoint(
        this._carpetVoidWorldScratch,
        this._voidMothAimScratch,
      ) ?? false;
      const maxRange = this.capybaraFlameShots.voidMaxRange;
      const inRange =
        hasAim &&
        this._carpetVoidWorldScratch.distanceTo(this._voidMothAimScratch) <= maxRange;
      this.capybaraFlameShots.tryFireVoidAutofire(
        this.localPlayer,
        this.audioManager,
        inRange ? this._voidMothAimScratch : null,
      );
    }

    const portalInteractionSuppressed = this.portalInteractionSuppressTimer > 0 || this.inCosmicVoid;

    // Auto-enter cosmic void portal on proximity — no key press needed, just fly into it.
    if (
      !portalInteractionSuppressed &&
      this.localPlayer instanceof Carpet &&
      !ProgressionManager.loadPlayerWorldState().voidPortalsClosed
    ) {
      const pPos = this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      for (const portal of this.cosmicWorldPortals) {
        if (pPos.distanceTo(portal.worldPosition) < 0.45) {
          void this.doEnterCosmicVoid();
          break;
        }
      }
    }

    if (this.moonThreat && !this.moonThreat.hasImpacted) {
      this.localPlayer.group.updateMatrixWorld(true);
      const playerPos = _moonCollisionScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      const moonPos = this.moonThreat.worldPosition;
      const moonR = this.moonThreat.worldRadius;
      const buffer = moonR + 0.3;
      const toPlayer = playerPos.clone().sub(moonPos);
      const dist = toPlayer.length();
      if (dist < buffer && dist > 0.001) {
        const push = buffer - dist;
        const pushDir = toPlayer.divideScalar(dist);
        const up = playerPos.clone().normalize();
        const altPush = pushDir.dot(up) * push;
        this.localPlayer.altitude += Math.max(altPush, push * 0.5);
        this.localPlayer.applyMatrix();
      }
    }

    const voidCam = this.getChaseCameraRigParams();
    this.cameraRig.update(
      dt,
      this.localPlayer.qPosition,
      this.localPlayer.heading,
      this.localPlayer.altitude,
      globeRadius,
      turnRate,
      this.localPlayer.speedRatio,
      voidCam.tiltScale,
      voidCam.followDist,
      voidCam.followHeight,
      this.vehicleFeatures.cameraSpeedZoom,
      this.vehicleFeatures.cameraFovBoost,
      this.getVoidCameraChaseForRig(),
    );
    if (this.localPlayer instanceof Plane) {
      this.localPlayer.updateGremlinDamageHpBar(dt, this.cameraRig.camera);
    }

    this.globe.update(dt);

    this.remotePlanes.update(dt, this.cameraRig.camera);
    this.flagSystem?.update(dt);

    if (this.npcPlanes && !this.inCosmicVoid) {
      const _npcPlayerPos = this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      this.npcPlanes.update(dt, _npcPlayerPos, (msg) => {
        this.hud.showAmbientToast(msg);
      });
    }

    if (this.npcBoats) {
      const _npcBoatPlayerPos = this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      this.npcBoats.update(dt, _npcBoatPlayerPos, (msg) => {
        this.hud.showAmbientToast(msg);
      });
    }

    if (this.ghostPlanes && !this.inCosmicVoid) {
      const _ghostPlayerPos = this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      this.ghostPlanes.update(dt, _ghostPlayerPos, this.cameraRig.camera, this.renderer.domElement);
    }

    if (this.localPlayer instanceof Plane && this.skyGremlins) {
      if (this.gameTime >= Game.SKY_GREMLIN_SPAWN_DELAY_SEC) {
        this.skyGremlins.setSuspended(false);
        this.skyGremlins.update(dt, this.localPlayer, this.moonThreat?.progress ?? 0, this.cameraRig.camera);
      } else {
        this.skyGremlins.setSuspended(true);
      }
    } else {
      this.skyGremlins?.setSuspended(true);
    }
    this.paintballSystem?.update(dt, this.cameraRig.camera.position);
    this.capybaraFlameShots?.update(dt, this.cameraRig.camera.position);

    this.localPlayer.group.updateMatrixWorld(true);

    this.collectVFX.update(dt);
    this.waypointBeacon?.update(dt);
    if (this.vehicleFeatures.collectibleDiamonds && !portalInteractionSuppressed) {
      this.ringManager.update(dt, this.localPlayer.qPosition, this.localPlayer.altitude);
    }
    if (this.gremlinHearts && this.localPlayer instanceof Plane) {
      this.gremlinHearts.update(dt, this.localPlayer, portalInteractionSuppressed);
    }

    if (!portalInteractionSuppressed && this.birdFlocks.length > 0 && this.flockFormationHUD) {
      let bestProgress = 0;
      let anyCompleted = false;
      for (const flock of this.birdFlocks) {
        const { progress, justCompleted } = flock.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.altitude,
          this.localPlayer.heading,
        );
        bestProgress = Math.max(bestProgress, progress);
        if (justCompleted) anyCompleted = true;
      }
      this.flockFormationHUD.setProgress(bestProgress);
      if (anyCompleted) {
        this.hud.showFlockFormationCelebrate();
        this.awardXP("flock", FLOCK_FORMATION_XP);
        this.vehicleFlashTimer = 0.35;
        this.cameraRig.shake();
      }
    }

    if (!portalInteractionSuppressed && this.rainbowArches.length > 0) {
      const dayW = this.dayNightCycle.getDayWeight();
      let rainbowHits = 0;
      for (const arch of this.rainbowArches) {
        const { justCollected } = arch.update(dt, this.localPlayer.qPosition, this.localPlayer.altitude, dayW);
        if (justCollected) rainbowHits++;
      }
      if (rainbowHits > 0) {
        this.hud.showRainbowCelebrate();
        this.awardXP("rainbow", RAINBOW_XP * rainbowHits);
        this.vehicleFlashTimer = 0.35;
      }
    }

    if (!portalInteractionSuppressed && this.lanternClusters.length > 0) {
      const nightW = this.dayNightCycle.getNightWeight();
      for (let li = 0; li < this.lanternClusters.length; li++) {
        const cluster = this.lanternClusters[li]!;
        const { justCollected } = cluster.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.altitude,
          nightW,
          li,
          this.worldConfig?.seed ?? 42,
        );
        if (justCollected) {
          const litCount = cluster.lanternCount;
          const loadedLanternSfx = LANTERN_COLLECT_SFX_IDS.filter((id) =>
            this.audioManager.hasSFX(id),
          );
          if (loadedLanternSfx.length > 0) {
            const lanternSfx =
              loadedLanternSfx[Math.floor(Math.random() * loadedLanternSfx.length)]!;
            this.audioManager.playSFX(lanternSfx, LANTERN_COLLECT_SFX_VOLUME);
          }
          this.hud.showLanternCelebrate(litCount);

          const srvUrl = this.getServerUrl();
          fetch(`${srvUrl}/api/lanterns/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ count: litCount, worldSlug: this.worldSlug }),
          })
            .catch(() => {});

          this.awardXP("lantern", LANTERN_XP);
          this.vehicleFlashTimer = 0.35;
          this.cameraRig.shake();
        }
      }
    }

    if (!portalInteractionSuppressed && this.fireflyClusters.length > 0) {
      const nightW = this.dayNightCycle.getNightWeight();
      for (let fi = 0; fi < this.fireflyClusters.length; fi++) {
        const cluster = this.fireflyClusters[fi]!;
        const { justCollected } = cluster.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.altitude,
          nightW,
          fi,
        );
        if (justCollected) {
          this.hud.showFireflyCelebrate();
          this.awardXP("firefly", FIREFLY_XP);
          this.vehicleFlashTimer = 0.35;
        }
      }
    }

    if (!portalInteractionSuppressed && this.volcanoes.length > 0) {
      for (const volcano of this.volcanoes) {
        const { justCollected } = volcano.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.altitude,
        );
        if (justCollected) {
          this.hud.showVolcanoCelebrate();
          this.awardXP("volcano", VOLCANO_XP);
          this.vehicleFlashTimer = 0.35;
          this.cameraRig.shake();
        }
      }
    }

    if (!portalInteractionSuppressed && this.braziers) {
      const playerWorldPos = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      const eternalFlameAvailable =
        (ProgressionManager.loadPlayerWorldState().eternalFlameCount ?? 0) > 0;
      const { newlyLitIndices, newlyLitUsedEternalFlame, burnProgress } =
        this.braziers.update(
        dt,
        playerWorldPos,
        true,
        eternalFlameAvailable
          ? {
              eternalFlameAvailable: true,
              onConsumeEternal: () => {
                const p = ProgressionManager.loadPlayerWorldState();
                const next = Math.max(0, (p.eternalFlameCount ?? 0) - 1);
                this.savePlayerWorldState({ eternalFlameCount: next });
                this.eternalFlameUI?.syncFromSave();
              },
            }
          : undefined,
      );
      if (newlyLitIndices.length > 0) {
        const allFiveEternalNow = this.braziers?.allFiveEternalAndLit() ?? false;
        if (newlyLitUsedEternalFlame) {
          if (!allFiveEternalNow) {
            this.hud.showBrazierEternalFlameLit();
          }
        } else {
          this.hud.showBrazierLit();
        }
        this.companion?.emitMoment(
          "game.event.brazier_lit",
          {
            eternal: this.braziers?.eternalFlameCount ?? 0,
            total: BRAZIER_COUNT,
            allEternal: allFiveEternalNow,
          },
          { salience: allFiveEternalNow ? 0.8 : 0.6, voiceRelevant: allFiveEternalNow },
        );
        this.savePlayerWorldState();
      }
      const firstFlameFizzled =
        !this.showedBrazierFizzleHint &&
        burnProgress.some((p, i) => (this.lastBrazierProgress[i] ?? 0) > 0 && p <= 0);
      if (firstFlameFizzled) {
        this.showedBrazierFizzleHint = true;
        this.hud.showBrazierFizzleHint();
        this.savePlayerWorldState({ brazierFizzleHintShown: true });
      }
      this.hud.updateBrazierStatus(burnProgress);
      this.lastBrazierProgress = burnProgress;
      const allFive =
        burnProgress.length >= BRAZIER_COUNT &&
        burnProgress.every((p) => p > 0);
      if (allFive && !this.prevAllFiveBraziers) {
        const allFiveEternal = this.braziers?.allFiveEternalAndLit() ?? false;
        if (newlyLitUsedEternalFlame && allFiveEternal) {
          this.applyEternalFlamesMoonSave();
        } else {
          this.applyBrazierMoonShield(BRAZIER_MOON_PAUSE_MS);
        }
      }
      this.prevAllFiveBraziers = allFive;
    }

    /* ── Campsite landing detection ─────────────────────── */
    this.campsiteMarker?.update(dt);
    if (this.campsiteMarker) {
      if (portalInteractionSuppressed) {
        this.hud.showCampsitePrompt(false);
      } else {
        const nearCamp = this.campsiteMarker.isPlayerNear(
          this.localPlayer.qPosition, this.localPlayer.altitude, globeRadius,
        );
        this.hud.showCampsitePrompt(nearCamp);
        if (nearCamp && interact) {
          this.doLanding();
        }
      }
    }

    if (this.vehicleFlashTimer > 0) {
      this.vehicleFlashTimer -= dt;
      const intensity = Math.max(0, this.vehicleFlashTimer / 0.35);
      const emissiveVal = intensity * intensity;
      this.localPlayer.group.traverse((child) => {
        const mat = (child as any).material;
        if (mat instanceof MeshPhongMaterial) {
          mat.emissive.setRGB(emissiveVal * 0.4, emissiveVal * 1.0, emissiveVal * 0.8);
        }
      });
    }

    if (this.playerLight) {
      this.playerLight.position.setFromMatrixPosition(this.localPlayer.group.matrixWorld);
      const up = this.playerLight.position.clone().normalize();
      this.playerLight.position.addScaledVector(up, 0.15);
    }
    if (this.vehicleFeatures.speedLines) {
      this.speedLines.update(dt, this.localPlayer.speed, this.cameraRig.camera);
    }
    if (this.vehicleFeatures.contrails) {
      this.contrails.update(this.localPlayer.group.matrixWorld, this.cameraRig.camera);
    }
    if (this.vehicleFeatures.wakeTrail) {
      this.wakeTrail.update(this.localPlayer.group.matrixWorld, this.cameraRig.camera);
    }
    this.updateOceanFish(dt, !portalInteractionSuppressed);
    if (this.vehicleFeatures.carpetTrail) {
      this.carpetTrail.update(
        this.localPlayer.group.matrixWorld,
        this.cameraRig.camera,
        this.localPlayer.speedRatio,
      );
      if (this.inCosmicVoid && this.voidCarpetTrail && this.localPlayer instanceof Carpet) {
        this.voidCarpetTrail.update(
          this.localPlayer.group.matrixWorld,
          this.cameraRig.camera,
          this.localPlayer.speedRatio,
        );
      }
      this.carpetWake.update(
        dt,
        this.localPlayer.qPosition,
        this.localPlayer.heading,
        globeRadius,
        this.localPlayer.speed,
        elevate,
        this.gameSeed,
        this.gameTerrainType,
        this.cameraRig.camera,
      );
      this.carpetLeaves.update(
        dt,
        this.localPlayer.qPosition,
        this.localPlayer.heading,
        globeRadius,
        this.localPlayer.speed,
        this.localPlayer.altitude,
        this.gameSeed,
        this.gameTerrainType,
      );

      if (this.localPlayer instanceof Carpet) {
        this.carpetDriftSmoke.update(
          dt,
          this.localPlayer.qPosition,
          this.localPlayer.heading,
          this.localPlayer.altitude,
          globeRadius,
          this.localPlayer.isDrifting,
          this.localPlayer.driftIntensity,
        );
      }
    }

    if (portalInteractionSuppressed || this.inCosmicVoid) {
      this.landmarkHUD.hide();
    } else {
      this.landmarkDetector.update(this.localPlayer.qPosition);
    }
    const questPlayerPos = new Vector3().setFromMatrixPosition(this.localPlayer.group.matrixWorld);
    const moonstoneShakeTrauma =
      this.playerVehicle === "carpet"
        ? this.globe.getMoonstoneShakeTrauma(questPlayerPos)
        : 0;
    const twisterTrauma = !twisterSuppressed && this.twisterSpinTimer > 0 ? 0.6 : 0;

    /* Moon threat + cinematic before package/balloon dialogue so nothing spawns the same frame impact starts. */
    if (!this.inCosmicVoid && !this.voidEntryInProgress) {
      this.moonThreat?.update(dt);
    }
    
    // Fade in portals over 2 seconds after the intro sequence ends
    const portalOpacity = Math.max(0, Math.min(1, (this.gameTime - Game.INTRO_DURATION) / 2.0));
    for (const portal of this.cosmicWorldPortals) {
      portal.update(dt, this.cameraRig.camera, portalOpacity);
    }
      if (this.inCosmicVoid) {
        this.voidEternalFlame?.update(dt, this.cameraRig.camera);
        this.voidFlameShield?.update(dt);
        this.updateVoidFlameArrow();
        this.updateVoidEnemyArrows();
        this.updateVoidWaveController();
        if (this.voidEternalFlame && this.localPlayer instanceof Carpet) {
          this.localPlayer.group.updateMatrixWorld(true);
          const c = this.localPlayer;
          const voidMothPlane: VoidMothPlaneContext | null = c.isVoidPlaneFlight
            ? {
                planeUp: c.getVoidPlaneUp(),
                planeN: c.getVoidPlaneNorth(),
                planeE: c.getVoidPlaneEast(),
                flamePos: this.voidEternalFlame.group.position,
              }
            : null;
          this.voidMoths?.update(
            dt,
            this.voidEternalFlame.group.position,
            c.isVoidPlaneFlight
              ? c.getVoidPlaneWorldPos(this._carpetVoidWorldScratch)
              : cartesianFromSpherical(
                  c.qPosition,
                  c.altitude,
                  globeRadius,
                ),
            this.cameraRig.camera,
            this.capybaraFlameShots,
            this.voidFlameShield,
            voidMothPlane,
          );
        }
      }
    const moonThreatTrauma =
      this.inCosmicVoid || this.voidEntryInProgress
        ? 0
        : (this.moonThreat?.getShakeTrauma() ?? 0);
    this.cameraRig.setTrauma(Math.max(moonThreatTrauma, moonstoneShakeTrauma, twisterTrauma));
    if (this.moonThreat) {
      if (this.moonThreat.isNearImpact || this.moonThreat.hasImpacted) {
        this.startMoonImpactCinematic();
      }
    }
    /* String() avoids TS narrowing: startMoonImpactCinematic() can set phase to moonImpact this frame. */
    if (String(this.gamePhase) === "moonImpact") {
      this.tickMoonImpactCinematic(dt);
      return;
    }

    this.meteorShower?.update(
      dt,
      this.moonThreat?.progress ?? 0,
      this.localPlayer.qPosition,
      this.localPlayer.heading,
      questPlayerPos,
    );
    /* Advance twister VFX / splash sim whenever we're not in the cosmic void (group hidden there). */
    if (!this.inCosmicVoid) {
      this.waterSpouts?.update(dt);
    }

    let twisterVol = 0;
    if (!twisterSuppressed && this.waterSpouts) {
      const dist = this.waterSpouts.getClosestDistance(questPlayerPos);
      if (dist < 3.0) {
        // Ramp volume up as we get closer (max volume at distance 0.5)
        twisterVol = Math.max(0, Math.min(1, 1.0 - (dist - 0.5) / 2.5));
        // Scale down overall volume so it's not deafening
        twisterVol *= 0.45;
      }
    }
    this.audioManager.setLoopVolume("twister", twisterVol);

    const moonstoneProgress = this.updateMoonstoneRuins(questPlayerPos, !portalInteractionSuppressed);
    const moonstoneRumbleVol =
      !this.inCosmicVoid && !this.voidEntryInProgress && moonstoneProgress > 0
        ? MOONSTONE_RUMBLE_MAX_VOL * (0.5 + 0.5 * moonstoneProgress)
        : 0;
    this.audioManager.setLoopVolume(MOONSTONE_RUMBLE_LOOP_NAME, moonstoneRumbleVol);

    /* If both moonstones are lifted at once, enter the union cinematic. */
    if (this.globe.consumeMoonstoneUnionTrigger(Date.now())) {
      this.startMoonstoneUnionCinematic();
      return;
    }

    if (this.skyJellyfish) {
      this.localPlayer.group.updateMatrixWorld(true);
      const selfieActive = this.selfieProgressCached > 0;
      this.skyJellyfish.update(
        dt,
        this.localPlayer.group.matrixWorld,
        questPlayerPos,
        !portalInteractionSuppressed,
        selfieActive,
      );
      const jellyfishProgress = this.skyJellyfish.getCaptureProgress();
      this.jellyfishCaptureRing?.setProgress(moonstoneProgress > 0 ? moonstoneProgress : jellyfishProgress);
    } else {
      this.jellyfishCaptureRing?.setProgress(moonstoneProgress);
    }

    if (this.packageQuest && this.moonThreat) {
      this.packageQuest.moonProgress = this.moonThreat.progress;
    }
    
    this.packageQuest?.update(dt, this.localPlayer.qPosition, this.cameraRig.camera, questPlayerPos, !portalInteractionSuppressed);
    _carpetSelfiePlayerNormal.copy(_carpetSelfieRefUp).applyQuaternion(this.localPlayer.qPosition).normalize();
    this.carpetLandmarkSelfieQuest?.update(dt, _carpetSelfiePlayerNormal, this.playerVehicle === "carpet" && !portalInteractionSuppressed);
    
    (this.localPlayer as any).carrying = this.packageQuest?.isCarrying ?? false;
    if (this.packageQuest?.isCarrying) {
      const dm = this.packageQuest.getDeliverySurfaceDistanceMetres(questPlayerPos);
      if (dm !== null) this.packageQuestHUD.setDeliveryDistanceMetres(dm);
    }
    if (!portalInteractionSuppressed) {
      this.updateBalloonGreetings(dt, questPlayerPos);
      this.updateObservatoryGreetings(dt, questPlayerPos);
      this.updateStonehengeWhispers(dt, questPlayerPos);
      this.updateBrazierWhispers(dt, questPlayerPos);
    }
    this.updateStonehengeFloat();
    this.globe.updateFloatingTrees(this.moonThreat?.progress ?? 0, this.gameTime);

    if (this.playerVehicle === "plane") {
      const engineVol =
        0.095 + (this.localPlayer as Plane).engineSpeedRatio * 0.28;
      this.audioManager.setLoopVolume("engine_biplane", engineVol);
    } else if (this.playerVehicle === "carpet") {
      const carpet = this.localPlayer as Carpet;
      const targetVol =
        this.inCosmicVoid || this.voidEntryInProgress
          ? 0
          : carpet.isOverWater
            ? OCEAN_WAVES_LOOP_VOL
            : 0;
      this.audioManager.setLoopVolume(OCEAN_WAVES_LOOP_NAME, targetVol);
    }

    const moonProg = this.moonThreat?.progress ?? 0;
    if (
      moonProg >= 0.75 &&
      !this.inCosmicVoid &&
      !this.voidEntryInProgress
    ) {
      this.panicDialogueCooldown -= dt;
      if (this.panicDialogueCooldown <= 0 && !this.packageQuestHUD.isBubbleShowing) {
        const { npcName, line } = pickPanicLine();
        this.packageQuestHUD.showBubble(npcName, line);
        const urgency = (moonProg - 0.75) / 0.25;
        this.panicDialogueCooldown = 12 - urgency * 8;
      }
    }

    this.applyDayNightPreset();
    this.audioManager.update(dt);
    this.lensFlare?.update(this.cameraRig.camera);
    this.aurora?.update(dt, this.cameraRig.camera);
    this.rainOverlay?.update(dt, this.dayNightCycle.getRainWeight(moonProg), moonProg);

    this.remotePlayerNameLabels.update(
      this.remotePlanes,
      this.cameraRig.camera,
      this.renderer.domElement,
      this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
    );

    this.syncQuestTrackersToHud();
    this.renderer.render(this.scene, this.cameraRig.camera);
    if (this.vehicleFeatures.speedLines && !this.inCosmicVoid) {
      this.speedLines.render(this.renderer);
    }
    if (!this.inCosmicVoid) this.lensFlare?.render(this.renderer);
    if (!this.inCosmicVoid) this.rainOverlay?.render(this.renderer);
  };

  /* ── Moon impact cinematic ────────────────────────────────────── */

  private moonCinematicCamera: PerspectiveCamera | null = null;
  private vignetteOverlay: HTMLDivElement | null = null;

  private startMoonImpactCinematic() {
    if (this.gamePhase === "moonImpact") return;
    this.raceManager?.abort();
    this.meteorShower?.reset();
    this.skyJellyfish?.reset();
    // The most dramatic beat — tell the companion the world was lost (mirrors the
    // world_saved moment), so the failure ending isn't silent to it.
    this.companion?.emitMoment(
      "game.event.world_lost",
      { world: this.worldConfig?.name },
      { salience: 1.0, voiceRelevant: true },
    );
    this.gamePhase = "moonImpact";
    this.moonCinematicStep = "fadeOut1";
    this.moonCinematicTimer = 0;
    this.hud.root.style.display = "none";

    // Dismiss any open level-up card overlay so it doesn't block the cutscene.
    this.levelUpCards.dispose();
    this.choosingLevelUpUpgrade = false;

    this.controls.enabled = false;
    if (this.touchControls) this.touchControls.enabled = false;

    for (const id of DIALOGUE_LOOP_IDS) {
      this.audioManager.fadeOutLoop(id);
    }
    this.audioManager.fadeOutLoop(RUMBLE_LOOP_NAME);
    this.packageQuestHUD.hideBubble();

    // Build a wide-angle camera positioned far from the globe
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.moonCinematicCamera = new PerspectiveCamera(50, aspect, 0.1, 200);
    const globeR = this.worldConfig?.globeRadius ?? 5;
    this.moonCinematicCamera.position.set(globeR * 3.2, globeR * 1.8, globeR * 3.2);
    this.moonCinematicCamera.lookAt(0, globeR * 0.3, 0);

    // Vignette that darkens over the cinematic
    this.vignetteOverlay = document.createElement("div");
    const v = this.vignetteOverlay;
    v.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:5;" +
      "background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.0) 100%);" +
      "opacity:0;transition:none;";
    this.container.appendChild(v);

    this.transitionOverlay?.fadeOut(); // fade to black
  }

  private tickMoonImpactCinematic(dt: number) {
    this.moonCinematicTimer += dt;
    if (this.moonCinematicStep === "fadeOut1") {
      this.localPlayer.visibility = Math.max(
        0,
        1 - this.moonCinematicTimer / Game.MOON_NETWORK_VISIBILITY_FADE_SEC,
      );
    } else {
      this.localPlayer.visibility = 0;
    }
    this.globe.update(dt);
    for (const portal of this.cosmicWorldPortals) {
      portal.update(dt, this.cameraRig.camera, 1.0);
    }
    /* Twister materials use `time`; skipping this during the cinematic froze the vortex. */
    if (!this.inCosmicVoid) {
      this.waterSpouts?.update(dt);
    }

    if (this.moonThreat) {
      this.cameraRig.setTrauma(this.moonThreat.getShakeTrauma());
    }

    const cam = this.moonCinematicCamera ?? this.cameraRig.camera;

    switch (this.moonCinematicStep) {
      /* Step 1: Fade to black (0.5s CSS transition) */
      case "fadeOut1":
        if (this.moonCinematicTimer > 0.7) {
          this.moonCinematicStep = "wideShot";
          this.moonCinematicTimer = 0;
          // Hide player, switch to cinematic camera, fade back in
          this.localPlayer.group.visible = false;
          this.transitionOverlay?.fadeIn();
        }
        this.renderer.render(this.scene, this.cameraRig.camera);
        break;

      /* Step 2: Wide-angle shot — shockwave + debris play out */
      case "wideShot": {
        // Slow cinematic camera orbit
        const orbitSpeed = 0.04;
        const globeR = this.worldConfig?.globeRadius ?? 5;
        const angle = this.moonCinematicTimer * orbitSpeed;
        const dist = globeR * 3.8;
        cam.position.set(
          Math.sin(angle) * dist,
          globeR * 1.6 + this.moonCinematicTimer * 0.08,
          Math.cos(angle) * dist,
        );
        cam.lookAt(0, globeR * 0.2, 0);

        // Apply trauma shake to cinematic camera too
        if (this.moonThreat) {
          const trauma = this.moonThreat.getShakeTrauma();
          const amp = trauma * trauma * 0.18;
          const t = this.moonCinematicTimer * 11;
          cam.position.x += Math.sin(t * 23.1 + 1.7) * amp;
          cam.position.y += Math.sin(t * 17.3 + 4.2) * amp;
          cam.position.z += Math.cos(t * 19.7 + 2.9) * amp;
        }

        // Darken the scene progressively via vignette
        if (this.vignetteOverlay) {
          const vt = Math.min(this.moonCinematicTimer / 7.0, 1);
          const edgeDark = 0.3 + vt * 0.7;
          const centerDark = vt * 0.4;
          const clearR = Math.max(5, 30 - vt * 25);
          this.vignetteOverlay.style.background =
            `radial-gradient(ellipse at center, rgba(0,0,0,${centerDark}) ${clearR}%, rgba(0,0,0,${edgeDark}) 100%)`;
          this.vignetteOverlay.style.opacity = "1";
        }

        this.renderer.render(this.scene, cam);

        // After the shockwave + debris play, fade to final black
        if (this.moonCinematicTimer > 5.0) {
          this.moonCinematicStep = "fadeOut2";
          this.moonCinematicTimer = 0;
          this.transitionOverlay?.fadeOut();
        }
        break;
      }

      /* Step 3: Final fade to black — cinematic complete */
      case "fadeOut2":
        if (this.moonThreat) {
          const trauma = this.moonThreat.getShakeTrauma();
          const amp = trauma * trauma * 0.18;
          const t2 = this.moonCinematicTimer * 11;
          cam.position.x += Math.sin(t2 * 23.1 + 1.7) * amp;
          cam.position.y += Math.sin(t2 * 17.3 + 4.2) * amp;
          cam.position.z += Math.cos(t2 * 19.7 + 2.9) * amp;
        }
        this.renderer.render(this.scene, cam);
        if (this.moonCinematicTimer > 1.0) {
          if (this.vignetteOverlay) {
            this.vignetteOverlay.remove();
            this.vignetteOverlay = null;
          }
          void this.returnToMainMenuAfterMoonImpact();
        }
        break;

      case "done":
        break;
    }

    /* fadeOutLoop / stopWhenSilent only advance in update(); flying tick skips this during moonImpact. */
    this.audioManager.update(dt);
  }

  /* ── Moonstone union cinematic ────────────────────────────────
     Triggered when both moonstone halves are floating simultaneously.
     Directed in five beats: establish → ascent → wide convergence →
     close push-in on the mating halves → beauty hold. A screen-filling
     white flash marks the moment of contact. */

  private static readonly MOONSTONE_UNION_INHALE_SEC = 1.3;
  private static readonly MOONSTONE_UNION_ASCENT_SEC = 2.6;
  private static readonly MOONSTONE_UNION_CONVERGE_SEC = 3.4;
  private static readonly MOONSTONE_UNION_JOIN_SEC = 2.6;
  private static readonly MOONSTONE_UNION_RELEASE_SEC = 2.0;
  /** Longer brazier cutaways so each shot still catches active rising motion. */
  private static readonly MOONSTONE_UNION_BRAZIER_SHOT_SEC = 1.1;
  private static readonly MOONSTONE_UNION_FADEOUT_SEC = 0.9;
  private static readonly MOONSTONE_UNION_LETTERBOX_VH = 10.5;
  /** Extra altitude (world units) each half climbs during the ascent beat. */
  private static readonly MOONSTONE_UNION_ASCENT_RISE = 0.9;
  /** How far past the surface (in globe radii) the halves meet. */
  private static readonly MOONSTONE_UNION_ALTITUDE_FRAC = 0.55;

  private startMoonstoneUnionCinematic() {
    if (String(this.gamePhase) === "moonstoneUnion" || String(this.gamePhase) === "moonImpact") return;
    if (this.globe.isMoonstonePostUnionActive()) return;
    if (this.globe.getMoonstoneCount() < 2) return;
    this.companion?.emitMoment(
      "game.event.world_saved",
      {
        world: this.worldConfig?.name,
        teammates: this.coPresentCompanions.map((m) => m.companionName ?? m.name),
      },
      { salience: 1.0, voiceRelevant: true },
    );
    // Saving the world together is a big bond moment.
    for (const m of this.coPresentCompanions) this.bumpBond(this.visitorIdForSocket(m.socketId), 5);
    this.raceManager?.abort();
    this.ensureBraziersSpawned();

    this.gamePhase = "moonstoneUnion";
    this.moonstoneUnionStep = "inhale";
    this.moonstoneUnionTimer = 0;

    this.controls.enabled = false;
    if (this.touchControls) this.touchControls.enabled = false;
    this.hud.root.style.display = "none";
    this.levelUpCards.dispose();
    this.choosingLevelUpUpgrade = false;
    this.packageQuestHUD.hideBubble();

    // Cache per-ruin cinematic frames: start pos (current floating), normal, rest quat.
    this.moonstoneUnionRestPos = [];
    this.moonstoneUnionRestQuat = [];
    this.moonstoneUnionNormals = [];
    this.moonstoneUnionTargetQuat = [];
    this.moonstoneUnionBrazierShotOrder = [];
    this.moonstoneUnionBrazierShotOrder = this.buildMoonstoneUnionBrazierShotOrder();
    this.braziers?.setRevealSequence(this.moonstoneUnionBrazierShotOrder);
    const count = this.globe.getMoonstoneCount();
    for (let i = 0; i < count; i++) {
      const cur = new Vector3();
      const nrm = new Vector3();
      const rq = new Quaternion();
      this.globe.readMoonstoneCurrentPosition(i, cur);
      this.globe.readMoonstoneNormal(i, nrm);
      this.globe.readMoonstoneRestQuaternion(i, rq);
      this.moonstoneUnionRestPos.push(cur);
      this.moonstoneUnionNormals.push(nrm);
      this.moonstoneUnionRestQuat.push(rq);
    }

    // Midpoint normal (upward direction at the union site) and tangential side axis.
    const n0 = this.moonstoneUnionNormals[0]!;
    const n1 = this.moonstoneUnionNormals[1]!;
    this.moonstoneUnionMidNormal.copy(n0).add(n1).normalize();
    // Side axis: component of (n0 - n1) perpendicular to midNormal.
    const diff = new Vector3().copy(n0).sub(n1);
    const along = new Vector3().copy(this.moonstoneUnionMidNormal).multiplyScalar(diff.dot(this.moonstoneUnionMidNormal));
    this.moonstoneUnionSideAxis.copy(diff).sub(along).normalize();
    if (this.moonstoneUnionSideAxis.lengthSq() < 1e-4) {
      // Fallback when both sites are nearly antipodal along the same axis.
      const fallback = new Vector3(1, 0, 0);
      if (Math.abs(fallback.dot(this.moonstoneUnionMidNormal)) > 0.95) fallback.set(0, 1, 0);
      const tmp = new Vector3().copy(fallback).cross(this.moonstoneUnionMidNormal).normalize();
      this.moonstoneUnionSideAxis.copy(tmp);
    }

    // Midpoint of the two surface anchor positions — anchors the camera lookAt during ascent.
    const base0 = new Vector3();
    const base1 = new Vector3();
    this.globe.readMoonstoneBasePosition(0, base0);
    this.globe.readMoonstoneBasePosition(1, base1);
    this.moonstoneUnionCenterSite.copy(base0).add(base1).multiplyScalar(0.5);

    // Union point: far out along midNormal, above the globe.
    const globeR = this.worldConfig?.globeRadius ?? 5;
    const unionDist = globeR * (1.0 + Game.MOONSTONE_UNION_ALTITUDE_FRAC);
    this.moonstoneUnionUnionPoint.copy(this.moonstoneUnionMidNormal).multiplyScalar(unionDist);

    // Camera "right" for side framing — perpendicular to midNormal, stable.
    const worldUp = new Vector3(0, 1, 0);
    if (Math.abs(worldUp.dot(this.moonstoneUnionMidNormal)) > 0.9) worldUp.set(1, 0, 0);
    this.moonstoneUnionCamRight.copy(this.moonstoneUnionMidNormal).cross(worldUp).normalize();

    /* Both halves are authored in the same local frame (left-half + right-half
       geometry that tiles into a full ring when placed at a shared origin in a
       shared orientation). Build a single canonical target basis where:
         local +Y → midNormal  (ring axis points away from the globe)
         local +X → a stable world direction (camera-right) so the ring opening
                    faces the camera during the close-up
       and apply the SAME target quaternion to both halves so their
       complementary geometry forms the circle. */
    const xAx = new Vector3().copy(this.moonstoneUnionCamRight);
    const yAx = new Vector3().copy(this.moonstoneUnionMidNormal);
    xAx.addScaledVector(yAx, -xAx.dot(yAx)).normalize();
    const zAx = new Vector3().crossVectors(xAx, yAx).normalize();
    const basis = new Matrix4().makeBasis(xAx, yAx, zAx);
    const sharedTarget = new Quaternion().setFromRotationMatrix(basis);
    for (let i = 0; i < count; i++) {
      this.moonstoneUnionTargetQuat.push(sharedTarget.clone());
    }

    // Dedicated cinematic camera — drives its own FOV independent of the chase rig.
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.moonstoneUnionCamera = new PerspectiveCamera(42, aspect, 0.05, 400);

    // Letterbox bars + flash overlay.
    this.moonstoneUnionLetterTop = this.makeUnionBar(true);
    this.moonstoneUnionLetterBot = this.makeUnionBar(false);
    this.container.appendChild(this.moonstoneUnionLetterTop);
    this.container.appendChild(this.moonstoneUnionLetterBot);

    this.moonstoneUnionFlashEl = document.createElement("div");
    this.moonstoneUnionFlashEl.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:7;" +
      "background:#ffffff;opacity:0;transition:none;";
    this.container.appendChild(this.moonstoneUnionFlashEl);

    // Bright white bloom behind the halves that builds through convergence,
    // blinds at the join, and lingers during release. Two layered sprites:
    // a wide soft halo + a tight core for the hot center.
    const glowTex = Game.getMoonstoneUnionGlowTexture();
    const haloMat = new SpriteMaterial({
      map: glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
      fog: false,
    });
    this.moonstoneUnionGlow = new Sprite(haloMat);
    this.moonstoneUnionGlow.position.copy(this.moonstoneUnionUnionPoint);
    this.moonstoneUnionGlow.scale.setScalar(0.0001);
    this.moonstoneUnionGlow.renderOrder = 9999;
    this.scene.add(this.moonstoneUnionGlow);

    const coreMat = new SpriteMaterial({
      map: glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      // Respect depth so the moonstone halves occlude the glow; combined with
      // the per-frame "push behind camera" below, this keeps the bloom as
      // backlight rather than a screen-filling overlay.
      depthTest: true,
      blending: AdditiveBlending,
      fog: false,
    });
    this.moonstoneUnionCoreGlow = new Sprite(coreMat);
    this.moonstoneUnionCoreGlow.position.copy(this.moonstoneUnionUnionPoint);
    this.moonstoneUnionCoreGlow.scale.setScalar(0.0001);
    this.moonstoneUnionCoreGlow.renderOrder = 10000;
    this.scene.add(this.moonstoneUnionCoreGlow);

    this.moonstoneUnionVignetteEl = document.createElement("div");
    this.moonstoneUnionVignetteEl.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:6;" +
      "background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%);" +
      "opacity:0;transition:opacity 1.3s ease;";
    this.container.appendChild(this.moonstoneUnionVignetteEl);
    requestAnimationFrame(() => {
      if (this.moonstoneUnionVignetteEl) this.moonstoneUnionVignetteEl.style.opacity = "1";
    });

    // Globe stops authoring moonstone transforms for the duration.
    this.globe.setMoonstoneCinematicActive(true);
    // Hide player for a clean cinematic frame.
    this.localPlayer.group.visible = false;
    // Ensure rumble loop is audible through the cinematic.
    this.audioManager.setLoopVolume(MOONSTONE_RUMBLE_LOOP_NAME, MOONSTONE_RUMBLE_MAX_VOL);
  }

  /** Lazily-built radial-gradient texture used for the union glow sprites. */
  private static moonstoneUnionGlowTex: CanvasTexture | null = null;
  private static getMoonstoneUnionGlowTexture(): CanvasTexture {
    if (Game.moonstoneUnionGlowTex) return Game.moonstoneUnionGlowTex;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const cx = size / 2;
    const cy = size / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    grad.addColorStop(0.0, "rgba(255,255,255,1)");
    grad.addColorStop(0.22, "rgba(255,255,255,0.85)");
    grad.addColorStop(0.55, "rgba(255,250,220,0.32)");
    grad.addColorStop(0.85, "rgba(255,250,220,0.05)");
    grad.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    Game.moonstoneUnionGlowTex = tex;
    return tex;
  }

  /**
   * Deterministic montage order for brazier reveal shots. We keep the locations
   * varied per seed, but stable inside a given world so the sequence feels
   * authored rather than random.
   */
  private buildMoonstoneUnionBrazierShotOrder(): number[] {
    const count = this.braziers?.worldPositions.length ?? 0;
    return Array.from({ length: count }, (_, i) => i).sort((a, b) => {
      const ha = (((this.gameSeed ^ 0x9e3779b9) + a * 2654435761) >>> 0);
      const hb = (((this.gameSeed ^ 0x9e3779b9) + b * 2654435761) >>> 0);
      return ha - hb;
    });
  }

  private makeUnionBar(top: boolean): HTMLDivElement {
    const bar = document.createElement("div");
    bar.style.cssText =
      `position:absolute;left:0;right:0;${top ? "top:0" : "bottom:0"};` +
      "height:0vh;background:#000;z-index:8;pointer-events:none;" +
      "transition:height 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);";
    return bar;
  }

  private tickMoonstoneUnionCinematic(dt: number) {
    this.moonstoneUnionTimer += dt;
    this.globe.update(dt);
    if (!this.inCosmicVoid) {
      this.waterSpouts?.update(dt);
    }
    this.localPlayer.group.updateMatrixWorld(true);
    if (this.moonstoneUnionStep === "brazierMontage") {
      this.braziers?.startReveal();
    }
    this.braziers?.update(
      dt,
      this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      false,
    );

    const cam = this.moonstoneUnionCamera;
    if (!cam) {
      this.endMoonstoneUnionCinematic();
      return;
    }

    const globeR = this.worldConfig?.globeRadius ?? 5;
    const midN = this.moonstoneUnionMidNormal;
    const side = this.moonstoneUnionSideAxis;
    const right = this.moonstoneUnionCamRight;
    const center = this.moonstoneUnionCenterSite;
    const unionPt = this.moonstoneUnionUnionPoint;

    // Per-phase normalized progress (0..1) with smoothstep easing.
    const smooth = (x: number) => {
      const t = Math.max(0, Math.min(1, x));
      return t * t * (3 - 2 * t);
    };

    // ── Stone positions per phase ─────────────────────────
    // rest: current floating position (at cinematic start)
    // ascend: rest + normal * ASCENT_RISE (still anchored to each site's normal)
    // stage: midway between ascend and unionPt, offset along +/- side so pair is visible
    // join: unionPt (halves overlap at center)
    const count = this.globe.getMoonstoneCount();
    const ascendOffsets: Vector3[] = [];
    const stagePositions: Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const rest = this.moonstoneUnionRestPos[i]!;
      const n = this.moonstoneUnionNormals[i]!;
      const ascend = new Vector3().copy(rest).addScaledVector(n, Game.MOONSTONE_UNION_ASCENT_RISE);
      ascendOffsets.push(ascend);
      // Stage closer to union point but still separated along side axis.
      const sign = i === 0 ? +1 : -1;
      const stage = new Vector3().copy(unionPt).addScaledVector(side, sign * globeR * 0.38);
      stagePositions.push(stage);
    }

    let flashAlpha = 0;
    // Glow intensity & scale are driven per beat below. Initial defaults (off).
    let glowOpacity = 0;
    let coreOpacity = 0;
    let haloScale = 0;
    let coreScale = 0;
    // Rim light intensity boost applied each frame. Starts at baseline.
    const rimBase = this.globe.getMoonstoneRimIntensityBase();
    let rimIntensity = rimBase;

    switch (this.moonstoneUnionStep) {
      /* ── Beat 1: Inhale — frame the globe from a high wide angle. */
      case "inhale": {
        const t = smooth(this.moonstoneUnionTimer / Game.MOONSTONE_UNION_INHALE_SEC);
        if (this.moonstoneUnionLetterTop)
          this.moonstoneUnionLetterTop.style.height = `${t * Game.MOONSTONE_UNION_LETTERBOX_VH}vh`;
        if (this.moonstoneUnionLetterBot)
          this.moonstoneUnionLetterBot.style.height = `${t * Game.MOONSTONE_UNION_LETTERBOX_VH}vh`;

        // Stones stay at their floating position; apply a subtle wobble.
        const wobT = this.moonstoneUnionTimer;
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          const rest = this.moonstoneUnionRestPos[i]!;
          const n = this.moonstoneUnionNormals[i]!;
          root.position.copy(rest).addScaledVector(n, Math.sin(wobT * 2.2 + i) * 0.01);
          root.quaternion.copy(this.moonstoneUnionRestQuat[i]!);
        }

        // Camera: slight push-in on the establishing shot.
        const camPos = new Vector3()
          .copy(midN)
          .multiplyScalar(globeR * (2.6 - 0.35 * t))
          .addScaledVector(right, globeR * (1.6 - 0.3 * t))
          .addScaledVector(side, globeR * 0.3);
        cam.position.copy(camPos);
        cam.up.copy(midN);
        cam.lookAt(center);
        cam.fov = 46 - 4 * t;
        cam.updateProjectionMatrix();

        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_INHALE_SEC) {
          this.moonstoneUnionStep = "ascent";
          this.moonstoneUnionTimer = 0;
        }
        break;
      }

      /* ── Beat 2: Ascent — both halves rise dramatically from the surface. */
      case "ascent": {
        const t = smooth(this.moonstoneUnionTimer / Game.MOONSTONE_UNION_ASCENT_SEC);
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          const rest = this.moonstoneUnionRestPos[i]!;
          const ascend = ascendOffsets[i]!;
          root.position.lerpVectors(rest, ascend, t);
          // Tiny floaty wobble on top of the rise.
          const wob = Math.sin(this.moonstoneUnionTimer * 3.6 + i * 1.7) * 0.012 * (1 - t * 0.4);
          root.position.addScaledVector(this.moonstoneUnionNormals[i]!, wob);
          // Begin the slerp toward the shared target while the halves are still
          // anchored to their own sites (only 25% toward target — subtle).
          const qStart = this.moonstoneUnionRestQuat[i]!;
          const qEnd = this.moonstoneUnionTargetQuat[i]!;
          root.quaternion.slerpQuaternions(qStart, qEnd, t * 0.25);
          // Subtle spin around own normal for a "wakeup" feel — decays at end of ascent.
          const decay = 1 - t;
          const spin = new Quaternion().setFromAxisAngle(
            this.moonstoneUnionNormals[i]!,
            t * 0.6 * decay,
          );
          root.quaternion.premultiply(spin);
        }

        // Camera: slow truck sideways + upward lift, maintaining the full vista.
        const dist = globeR * (3.0 - 0.2 * t);
        const up = globeR * (1.4 + 0.4 * t);
        const lateral = globeR * (1.2 - 0.25 * t);
        const camPos = new Vector3()
          .copy(midN).multiplyScalar(up)
          .addScaledVector(right, dist * Math.cos(t * 0.5))
          .addScaledVector(side, lateral);
        cam.position.copy(camPos);
        cam.up.copy(midN);
        const lookT = new Vector3().lerpVectors(center, unionPt, t * 0.45);
        cam.lookAt(lookT);
        cam.fov = 42 - 2 * t;
        cam.updateProjectionMatrix();

        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_ASCENT_SEC) {
          this.moonstoneUnionStep = "converge";
          this.moonstoneUnionTimer = 0;
        }
        break;
      }

      /* ── Beat 3: Wide convergence — halves arc toward the meeting point. */
      case "converge": {
        const t = smooth(this.moonstoneUnionTimer / Game.MOONSTONE_UNION_CONVERGE_SEC);
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          const ascend = ascendOffsets[i]!;
          const stage = stagePositions[i]!;
          // Quadratic arc: interpolate with a slight outward bulge for drama.
          const straight = new Vector3().lerpVectors(ascend, stage, t);
          const bulgeAxis = this.moonstoneUnionNormals[i]!;
          const bulge = Math.sin(Math.PI * t) * globeR * 0.22;
          root.position.copy(straight).addScaledVector(bulgeAxis, bulge);

          // Main alignment beat: slerp from 25% (where ascent left us) to ~95%
          // so the final click into place happens in "join".
          const mixRot = 0.25 + smooth(t) * 0.7;
          const qStart = this.moonstoneUnionRestQuat[i]!;
          const qEnd = this.moonstoneUnionTargetQuat[i]!;
          root.quaternion.slerpQuaternions(qStart, qEnd, mixRot);
          // Slow spin around midNormal for momentum — decays to ~0 by end of converge
          // so the halves settle with no rogue rotation into the join.
          const decay = 1 - smooth(t);
          const spinAngle = this.moonstoneUnionTimer * 0.55 * (i === 0 ? 1 : -1) * decay;
          const spin = new Quaternion().setFromAxisAngle(
            this.moonstoneUnionMidNormal,
            spinAngle,
          );
          root.quaternion.premultiply(spin);
        }

        // Camera: big pullback for the wide shot, slight orbit.
        const angle = 0.15 + t * 0.5;
        const dist = globeR * (3.2 + 0.6 * t);
        const up = globeR * (1.6 + 0.2 * t);
        const camPos = new Vector3()
          .copy(midN).multiplyScalar(up)
          .addScaledVector(right, dist * Math.cos(angle))
          .addScaledVector(side, dist * Math.sin(angle));
        cam.position.copy(camPos);
        cam.up.copy(midN);
        const lookT = new Vector3().lerpVectors(center, unionPt, 0.5 + t * 0.4);
        cam.lookAt(lookT);
        cam.fov = 40 - 2 * t;
        cam.updateProjectionMatrix();

        // Glow stays fully off during converge — the bloom is reserved for
        // the post-combine moment so the halves read clearly as they approach.
        // Rim brightens as the halves close to foreshadow the union.
        rimIntensity = rimBase + smooth(t) * 0.6;

        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_CONVERGE_SEC) {
          this.moonstoneUnionStep = "join";
          this.moonstoneUnionTimer = 0;
        }
        break;
      }

      /* ── Beat 4: Join — camera zooms in; halves slowly form a circle; white flash on contact. */
      case "join": {
        const t = smooth(this.moonstoneUnionTimer / Game.MOONSTONE_UNION_JOIN_SEC);
        // Ease the final closing so the touch feels earned.
        const close = Math.pow(t, 1.35);
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          const stage = stagePositions[i]!;
          root.position.lerpVectors(stage, unionPt, close);
          // Rotation locks to target alignment — hits exactly qEnd by the end of
          // the beat so both halves share the canonical ring orientation.
          const qStart = this.moonstoneUnionRestQuat[i]!;
          const qEnd = this.moonstoneUnionTargetQuat[i]!;
          root.quaternion.slerpQuaternions(qStart, qEnd, 0.95 + 0.05 * close);
        }

        // Camera: smooth push-in toward the union point, narrowing FOV.
        const dist = globeR * (2.6 - 1.4 * t);
        const up = globeR * (0.85 - 0.25 * t);
        const side1 = globeR * (0.9 - 0.7 * t);
        const camPos = new Vector3()
          .copy(unionPt)
          .addScaledVector(right, dist)
          .addScaledVector(midN, up)
          .addScaledVector(side, side1);
        cam.position.copy(camPos);
        cam.up.copy(midN);
        cam.lookAt(unionPt);
        cam.fov = 36 - 10 * t;
        cam.updateProjectionMatrix();

        // White flash ramps up over the last 20% of the join, peaks at contact.
        if (t > 0.78) {
          const fx = Math.min(1, (t - 0.78) / 0.22);
          flashAlpha = fx * fx;
        }

        // Glow stays off during join. The screen flash carries the contact
        // moment; the backlight bloom is introduced in `release`.
        // Rim climbs further and peaks at contact — a Fresnel halo around the
        // halves as they kiss.
        rimIntensity = rimBase + 0.6 + smooth(t) * 1.4;

        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_JOIN_SEC) {
          this.moonstoneUnionStep = "release";
          this.moonstoneUnionTimer = 0;
        }
        break;
      }

      /* ── Beat 5: Release — hold on the completed ring, slow orbit. */
      case "release": {
        const t = smooth(this.moonstoneUnionTimer / Game.MOONSTONE_UNION_RELEASE_SEC);
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          root.position.copy(unionPt);
          root.quaternion.copy(this.moonstoneUnionTargetQuat[i]!);
          // A whisper of shared rotation keeps the ring from feeling frozen.
          const spin = new Quaternion().setFromAxisAngle(this.moonstoneUnionMidNormal, this.moonstoneUnionTimer * 0.18);
          root.quaternion.premultiply(spin);
        }

        // Slow orbit around the completed ring.
        const orbit = this.moonstoneUnionTimer * 0.22;
        const dist = globeR * 1.25;
        const camPos = new Vector3()
          .copy(unionPt)
          .addScaledVector(right, dist * Math.cos(orbit))
          .addScaledVector(side, dist * Math.sin(orbit))
          .addScaledVector(midN, globeR * 0.18);
        cam.position.copy(camPos);
        cam.up.copy(midN);
        cam.lookAt(unionPt);
        cam.fov = 26 + 2 * t;
        cam.updateProjectionMatrix();

        // Fade out lingering flash.
        flashAlpha = Math.max(0, 0.3 - this.moonstoneUnionTimer * 0.8);

        // Glow introduction: the backlight halo *emerges* right after the
        // halves combine. A quick bloom in the first ~25% of the beat, then a
        // steady breathing hold.
        const emerge = smooth(Math.min(1, this.moonstoneUnionTimer / 0.5));
        const breath = 0.5 + 0.5 * Math.sin(this.moonstoneUnionTimer * 1.6);
        glowOpacity = emerge * (0.55 + 0.08 * breath);
        coreOpacity = emerge * (0.38 + 0.08 * breath);
        haloScale = globeR * (0.8 + emerge * (2.8 + 0.25 * breath));
        coreScale = globeR * (0.4 + emerge * (1.0 + 0.15 * breath));
        // Rim holds bright with a breathing pulse so the completed ring glows.
        rimIntensity = rimBase + 1.8 + 0.2 * breath;

        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_RELEASE_SEC) {
          if (this.moonstoneUnionBrazierShotOrder.length > 0) {
            this.moonstoneUnionStep = "brazierMontage";
            this.moonstoneUnionTimer = 0;
          } else {
            this.moonstoneUnionStep = "fadeOut";
            this.moonstoneUnionTimer = 0;
            this.transitionOverlay?.fadeOut();
            // Begin letterbox retraction.
            if (this.moonstoneUnionLetterTop) this.moonstoneUnionLetterTop.style.height = "0vh";
            if (this.moonstoneUnionLetterBot) this.moonstoneUnionLetterBot.style.height = "0vh";
          }
        }
        break;
      }

      /* ── Beat 6: Brazier montage — cut across different locations as the
         newly awakened braziers rise out of the earth. */
      case "brazierMontage": {
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          root.position.copy(unionPt);
          root.quaternion.copy(this.moonstoneUnionTargetQuat[i]!);
        }

        const order = this.moonstoneUnionBrazierShotOrder;
        const shotDur = Game.MOONSTONE_UNION_BRAZIER_SHOT_SEC;
        const totalDur = order.length * shotDur;
        if (!this.braziers || order.length === 0) {
          this.moonstoneUnionStep = "fadeOut";
          this.moonstoneUnionTimer = 0;
          this.transitionOverlay?.fadeOut();
          if (this.moonstoneUnionLetterTop) this.moonstoneUnionLetterTop.style.height = "0vh";
          if (this.moonstoneUnionLetterBot) this.moonstoneUnionLetterBot.style.height = "0vh";
          break;
        }

        const shotIdx = Math.min(order.length - 1, Math.floor(this.moonstoneUnionTimer / shotDur));
        const shotT = smooth((this.moonstoneUnionTimer - shotIdx * shotDur) / shotDur);
        const brazierIdx = order[shotIdx]!;
        this.braziers.readWorldPosition(brazierIdx, this.moonstoneUnionShotTarget);
        this.moonstoneUnionShotNormal.copy(this.moonstoneUnionShotTarget).normalize();

        // Build a local tangent frame so each brazier shot hugs the globe surface.
        this.moonstoneUnionShotLookAt.set(0, 1, 0);
        if (Math.abs(this.moonstoneUnionShotNormal.y) > 0.92) {
          this.moonstoneUnionShotLookAt.set(1, 0, 0);
        }
        this.moonstoneUnionShotSide
          .crossVectors(this.moonstoneUnionShotLookAt, this.moonstoneUnionShotNormal)
          .normalize();
        this.moonstoneUnionShotForward
          .crossVectors(this.moonstoneUnionShotNormal, this.moonstoneUnionShotSide)
          .normalize();

        // Slow pan/orbit around the brazier with a fixed lift above the ground.
        // The shot now arcs around the target instead of trucking inward/upward.
        const orbitDir = shotIdx % 2 === 0 ? 1 : -1;
        const orbitStart = -0.22 * orbitDir;
        const orbitSweep = 0.44 * orbitDir;
        const orbitAngle = orbitStart + orbitSweep * shotT;
        const orbitRadius = globeR * 0.36;
        const lift = globeR * 0.07;
        cam.position
          .copy(this.moonstoneUnionShotTarget)
          .addScaledVector(this.moonstoneUnionShotNormal, lift)
          .addScaledVector(this.moonstoneUnionShotSide, Math.cos(orbitAngle) * orbitRadius)
          .addScaledVector(this.moonstoneUnionShotForward, Math.sin(orbitAngle) * orbitRadius);
        // Ground-rumble shake that is strongest when a brazier first punches
        // upward, then settles as the shot lands.
        const shakeEase = 1 - shotT;
        const shakeAmp = globeR * (0.003 * shakeEase + 0.0008);
        const shakeT = this.moonstoneUnionTimer * 12.5 + brazierIdx * 1.73;
        cam.position.addScaledVector(
          this.moonstoneUnionShotSide,
          Math.sin(shakeT * 2.7 + 0.2) * shakeAmp * 0.18,
        );
        cam.position.addScaledVector(
          this.moonstoneUnionShotForward,
          Math.cos(shakeT * 3.2 + 2.4) * shakeAmp * 0.28,
        );
        cam.up.copy(this.moonstoneUnionShotNormal);
        cam.lookAt(
          this.moonstoneUnionShotLookAt
            .copy(this.moonstoneUnionShotTarget)
            .addScaledVector(this.moonstoneUnionShotNormal, globeR * 0.03),
        );
        cam.fov = 30.5;
        cam.updateProjectionMatrix();

        // Keep a whisper of glow/rim alive off-screen so the union still feels
        // active in the world while we cut across the brazier awakenings.
        glowOpacity = 0.08;
        coreOpacity = 0.04;
        haloScale = globeR * 1.2;
        coreScale = globeR * 0.6;
        rimIntensity = rimBase + 0.9;

        if (this.moonstoneUnionTimer >= totalDur) {
          this.moonstoneUnionStep = "fadeOut";
          this.moonstoneUnionTimer = 0;
          this.transitionOverlay?.fadeOut();
          if (this.moonstoneUnionLetterTop) this.moonstoneUnionLetterTop.style.height = "0vh";
          if (this.moonstoneUnionLetterBot) this.moonstoneUnionLetterBot.style.height = "0vh";
        }
        break;
      }

      /* ── Fade to black, then restore gameplay. */
      case "fadeOut": {
        // Hold camera on the ring while the overlay fades.
        const dist = globeR * 1.2;
        const orbit = 0.22 * (Game.MOONSTONE_UNION_RELEASE_SEC + this.moonstoneUnionTimer);
        const camPos = new Vector3()
          .copy(unionPt)
          .addScaledVector(right, dist * Math.cos(orbit))
          .addScaledVector(side, dist * Math.sin(orbit))
          .addScaledVector(midN, globeR * 0.2);
        cam.position.copy(camPos);
        cam.up.copy(midN);
        cam.lookAt(unionPt);
        for (let i = 0; i < count; i++) {
          const root = this.globe.getMoonstoneRoot(i);
          if (!root) continue;
          root.position.copy(unionPt);
          root.quaternion.copy(this.moonstoneUnionTargetQuat[i]!);
        }
        // Glow fades with the screen.
        const fadeT = Math.min(1, this.moonstoneUnionTimer / Game.MOONSTONE_UNION_FADEOUT_SEC);
        const gSettle = 1 - fadeT;
        glowOpacity = 0.5 * gSettle;
        coreOpacity = 0.35 * gSettle;
        haloScale = globeR * (3.6 + 0.8 * fadeT);
        coreScale = globeR * (1.4 + 0.4 * fadeT);
        rimIntensity = rimBase + 1.8 * gSettle;
        if (this.moonstoneUnionTimer >= Game.MOONSTONE_UNION_FADEOUT_SEC) {
          this.endMoonstoneUnionCinematic();
          return;
        }
        break;
      }

      case "done":
        break;
    }

    if (this.moonstoneUnionFlashEl) {
      this.moonstoneUnionFlashEl.style.opacity = flashAlpha.toFixed(3);
    }

    // Drive rim light intensity live through the cinematic.
    this.globe.setMoonstoneRimIntensity(rimIntensity);

    // Push the glow sprites *behind* the moonstones along the camera view
    // direction so the halves always read clearly in front. Sprites auto-face
    // the camera regardless of this offset, and depthTest takes care of
    // occlusion on their periphery.
    const camToUnion = new Vector3().subVectors(unionPt, cam.position).normalize();
    const BEHIND_OFFSET = globeR * 0.55;

    if (this.moonstoneUnionGlow) {
      const mat = this.moonstoneUnionGlow.material as SpriteMaterial;
      mat.opacity = glowOpacity;
      const s = Math.max(0.0001, haloScale);
      this.moonstoneUnionGlow.scale.setScalar(s);
      this.moonstoneUnionGlow.position
        .copy(unionPt)
        .addScaledVector(camToUnion, BEHIND_OFFSET);
      this.moonstoneUnionGlow.visible = glowOpacity > 0.001;
    }
    if (this.moonstoneUnionCoreGlow) {
      const mat = this.moonstoneUnionCoreGlow.material as SpriteMaterial;
      mat.opacity = coreOpacity;
      const s = Math.max(0.0001, coreScale);
      this.moonstoneUnionCoreGlow.scale.setScalar(s);
      // Core sits slightly closer than the halo for a layered backlight.
      this.moonstoneUnionCoreGlow.position
        .copy(unionPt)
        .addScaledVector(camToUnion, BEHIND_OFFSET * 0.6);
      this.moonstoneUnionCoreGlow.visible = coreOpacity > 0.001;
    }

    this.renderer.render(this.scene, cam);
    this.audioManager.update(dt);
  }

  private endMoonstoneUnionCinematic() {
    // Commit the moonstones to their new persistent world state: a completed
    // ring hovering above the globe after the ritual is done.
    this.globe.activateMoonstonePostUnion(
      this.moonstoneUnionUnionPoint,
      this.moonstoneUnionMidNormal,
      this.moonstoneUnionTargetQuat,
    );
    this.savePlayerWorldState({ moonstoneUnionComplete: true, braziersRevealed: true });
    this.globe.setMoonstoneCinematicActive(false);
    this.globe.setMoonstoneRimIntensity(this.globe.getMoonstoneRimIntensityBase());

    // Tear down overlays.
    this.moonstoneUnionLetterTop?.remove();
    this.moonstoneUnionLetterBot?.remove();
    this.moonstoneUnionFlashEl?.remove();
    this.moonstoneUnionVignetteEl?.remove();
    this.moonstoneUnionLetterTop = null;
    this.moonstoneUnionLetterBot = null;
    this.moonstoneUnionFlashEl = null;
    this.moonstoneUnionVignetteEl = null;
    this.moonstoneUnionCamera = null;

    // Remove glow sprites from the scene and dispose their materials. The
    // shared canvas texture is cached on the class and reused.
    if (this.moonstoneUnionGlow) {
      this.scene.remove(this.moonstoneUnionGlow);
      (this.moonstoneUnionGlow.material as SpriteMaterial).dispose();
      this.moonstoneUnionGlow = null;
    }
    if (this.moonstoneUnionCoreGlow) {
      this.scene.remove(this.moonstoneUnionCoreGlow);
      (this.moonstoneUnionCoreGlow.material as SpriteMaterial).dispose();
      this.moonstoneUnionCoreGlow = null;
    }
    this.moonstoneUnionRestPos = [];
    this.moonstoneUnionRestQuat = [];
    this.moonstoneUnionNormals = [];
    this.moonstoneUnionTargetQuat = [];

    // Restore UI + gameplay.
    this.hud.root.style.display = "";
    this.hud.refreshTopRightLayout();
    this.localPlayer.group.visible = true;
    this.controls.enabled = true;
    if (this.touchControls) this.touchControls.enabled = true;

    // Reseat the chase camera exactly where the player is so the fade-in lands gracefully.
    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    this.cameraRig.snapTo(
      this.localPlayer.qPosition,
      this.localPlayer.heading,
      this.localPlayer.altitude,
      globeRadius,
      this.vehicleFeatures.cameraFollowDistance,
      this.vehicleFeatures.cameraFollowHeight,
    );

    this.moonstoneUnionStep = "done";
    this.gamePhase = "flying";
    // Rumble loop volume will be re-evaluated next frame by the flying-phase update.
    this.audioManager.setLoopVolume(MOONSTONE_RUMBLE_LOOP_NAME, 0);
    const fadeInPromise = this.transitionOverlay?.fadeIn();
    if (fadeInPromise) {
      void fadeInPromise.then(() => {
        this.hud.showBrazierRiseQuest();
      });
    } else {
      this.hud.showBrazierRiseQuest();
    }
  }

  private createVhsOverlay(): HTMLDivElement {
    // Inject keyframe styles once.
    const styleId = "vhs-rewind-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes vhs-scan {
          0%   { background-position: 0 0; }
          100% { background-position: 0 8px; }
        }
        @keyframes vhs-bands {
          0%   { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        @keyframes vhs-blink {
          0%,49%  { opacity: 1; }
          50%,100%{ opacity: 0; }
        }
        @keyframes vhs-flicker {
          0%,100%{ opacity: 1; }
          91%    { opacity: 0.88; }
          93%    { opacity: 1; }
          95%    { opacity: 0.82; }
          97%    { opacity: 1; }
        }
      `;
      document.head.appendChild(s);
    }

    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      position: "absolute",
      inset: "0",
      zIndex: "6",
      pointerEvents: "none",
      animation: "vhs-flicker 0.18s step-end infinite",
    });

    // Fine horizontal scan lines — kept subtle (≈30% of original opacity).
    const scanLines = document.createElement("div");
    Object.assign(scanLines.style, {
      position: "absolute",
      inset: "0",
      background:
        "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
      backgroundSize: "100% 4px",
      animation: "vhs-scan 0.06s linear infinite",
    });

    // Wider scrolling tracking bands — subtle.
    const bands = document.createElement("div");
    Object.assign(bands.style, {
      position: "absolute",
      inset: "0",
      background:
        "repeating-linear-gradient(to bottom, transparent 0px, transparent 24px, rgba(255,255,255,0.015) 24px, rgba(255,255,255,0.015) 30px, transparent 30px, transparent 60px)",
      backgroundSize: "100% 60px",
      animation: "vhs-bands 0.12s linear infinite",
    });

    // Horizontal glitch line — JS-driven random positioning.
    const glitchLine = document.createElement("div");
    Object.assign(glitchLine.style, {
      position: "absolute",
      left: "0",
      right: "0",
      height: "3px",
      background: "rgba(255,255,255,0.7)",
      mixBlendMode: "screen",
      opacity: "0",
    });
    this.vhsGlitchInterval = setInterval(() => {
      if (!glitchLine.isConnected) return;
      glitchLine.style.top = `${10 + Math.random() * 80}%`;
      glitchLine.style.height = `${1 + Math.floor(Math.random() * 4)}px`;
      glitchLine.style.opacity = Math.random() > 0.45 ? "0.8" : "0";
    }, 80);

    // ◀◀ RWD indicator — bottom-right, blinking.
    const indicator = document.createElement("div");
    indicator.textContent = t("◀◀  RWD", "◀◀  倒带");
    Object.assign(indicator.style, {
      position: "absolute",
      bottom: "2.5rem",
      right: "2rem",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "clamp(0.75rem, 2vw, 1rem)",
      fontWeight: "700",
      color: "#ffffff",
      letterSpacing: "0.22em",
      textShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 20px rgba(255,200,50,0.6)",
      animation: "vhs-blink 0.5s step-end infinite",
    });

    wrap.appendChild(scanLines);
    wrap.appendChild(bands);
    wrap.appendChild(glitchLine);
    wrap.appendChild(indicator);
    this.container.appendChild(wrap);
    return wrap;
  }

  /* ── Campsite landing / takeoff ─────────────────────────────── */

  private async doLanding() {
    if (!this.transitionOverlay || !this.campsiteScene) return;
    if (this.gamePhase !== "flying") return;

    this.gamePhase = "transitioning";
    this.hud.showCampsitePrompt(false);
    this.hud.setCampsiteButtonVisible(false);
    this.controls.enabled = false;
    if (this.touchControls) this.touchControls.enabled = false;

    await this.transitionOverlay.fadeOut();

    this.localPlayer.group.visible = false;
    this.campsiteScene.enter(
      this.playerVehicle,
      this.hullColor,
      this.dayNightCycle.getPreset(),
    );

    /* Swap control hints to campsite layout */
    if (this.vehicleHintsEl) this.vehicleHintsEl.style.display = "none";
    if (this.vehicleTutorialHints) this.vehicleTutorialHints.root.style.display = "none";
    if (!this.campsiteHintsEl) {
      this.campsiteHintsEl = mountCampsiteControlHints(this.hud.root, !this.mobile);
    } else {
      this.campsiteHintsEl.style.display = "";
    }

    /* Switch to campsite rendering before fade-in so the overlay reveals the camp scene,
       not an empty globe (which read as a second fade to black when zoomed in). */
    this.gamePhase = "campsite";

    await this.transitionOverlay.fadeIn();
  }

  private async doTakeOff() {
    if (!this.transitionOverlay || !this.campsiteScene || !this.campsiteMarker) return;
    this.gamePhase = "transitioning";

    await this.transitionOverlay.fadeOut();

    this.campsiteScene.exit();
    this.localPlayer.group.visible = true;

    /* Restore vehicle control hints */
    if (this.campsiteHintsEl) this.campsiteHintsEl.style.display = "none";
    if (this.vehicleHintsEl) {
      this.vehicleHintsEl.style.display = this.activeVehicleTutorial ? "none" : "";
    }
    if (this.vehicleTutorialHints) this.vehicleTutorialHints.root.style.display = "";

    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    this.localPlayer.qPosition.copy(this.campsiteMarker.surfaceQuat);
    this.localPlayer.altitude = 0.4;
    this.localPlayer.heading = 0;

    this.cameraRig.snapTo(
      this.localPlayer.qPosition,
      this.localPlayer.heading,
      this.localPlayer.altitude,
      globeRadius,
      this.vehicleFeatures.cameraFollowDistance,
      this.vehicleFeatures.cameraFollowHeight,
    );

    if (this.localPlayer instanceof Carpet && this.carpetPortalSystem) {
      this.carpetPortalSystem.syncToCarpet(this.localPlayer);
      this.carpetTrail.reset();
      this.voidCarpetTrail?.reset();
      this.carpetWake.reset();
      this.carpetLeaves.reset();
    }

    this.controls.enabled = true;
    if (this.touchControls) this.touchControls.enabled = true;

    await this.transitionOverlay.fadeIn();
    this.gamePhase = "flying";
    if (CAMPSITE_HOME_ENABLED) this.hud.setCampsiteButtonVisible(true);
  }

  /** Per-vehicle quest lines under the world name (gremlin / package / jelly / brazier hint / fish). */
  private syncQuestTrackersToHud() {
    if (this.gamePhase !== "flying") {
      if (!this.questTrackersHidden) {
        this.hud.setQuestTrackers(null);
        this.questTrackersHidden = true;
      }
      this.questTrackerNextSyncAtMs = 0;
      return;
    }
    const now = performance.now();
    if (!this.questTrackersHidden && now < this.questTrackerNextSyncAtMs) {
      return;
    }
    this.questTrackerNextSyncAtMs = now + QUEST_TRACKER_SYNC_INTERVAL_MS;

    const v = this.playerVehicle;
    if (v === "plane") {
      const kills = this.skyGremlins?.getSessionGremlinKills() ?? 0;
      const pkg =
        this.vehicleFeatures.packageQuests && this.packageQuest
          ? {
              current: this.packageQuest.getCompletedDeliveryCount(),
              max: PACKAGE_DELIVERIES_PER_WORLD,
            }
          : null;
      const raceCompleted = !!ProgressionManager.loadPlayerWorldState().raceEternalFlameClaimed;
      this.hud.setQuestTrackers({
        vehicle: "plane",
        gremlin: { current: kills, max: GREMLIN_TAKEDOWNS_FOR_KING },
        pkg,
        raceCompleted,
      });
      this.questTrackersHidden = false;
    } else if (v === "carpet") {
      const jelly = this.skyJellyfish?.getCollectedCount() ?? 0;
      const ws = ProgressionManager.loadPlayerWorldState();
      const eternalFlameActive = !!(ws.moonFrozenByEternalFlames || ws.voidPortalsClosed);
      this.hud.setQuestTrackers({
        vehicle: "carpet",
        jelly: { current: jelly, max: JELLY_COUNT },
        brazierHint: true,
        eternalFlameActive,
      });
      this.questTrackersHidden = false;
    } else if (v === "boat") {
      this.hud.setQuestTrackers({
        vehicle: "boat",
        fish: { current: this.fishCaught, max: FISH_COUNT_BEFORE_MYSTERY_OCTOPUS },
      });
      this.questTrackersHidden = false;
    } else {
      this.hud.setQuestTrackers(null);
      this.questTrackersHidden = true;
    }
  }

  private setPortalHintVisible(visible: boolean) {
    if (!this.vehicleHintsEl) return;
    const rows = this.vehicleHintsEl.querySelectorAll(".control-hints-row");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as HTMLElement;
      if (row.textContent?.includes("Portal")) {
        row.style.display = visible ? "" : "none";
      }
    }
  }

  private clearTutorialSpotlight() {
    if (this.tutorialSpotlightOnResize) {
      window.removeEventListener("resize", this.tutorialSpotlightOnResize);
      this.tutorialSpotlightOnResize = null;
    }
    if (this.tutorialSpotlightRepaintTimer != null) {
      clearTimeout(this.tutorialSpotlightRepaintTimer);
      this.tutorialSpotlightRepaintTimer = null;
    }
    if (this.tutorialSpotlightHoldTimer != null) {
      clearTimeout(this.tutorialSpotlightHoldTimer);
      this.tutorialSpotlightHoldTimer = null;
    }
    if (this.tutorialSpotlightFadeTimer != null) {
      clearTimeout(this.tutorialSpotlightFadeTimer);
      this.tutorialSpotlightFadeTimer = null;
    }
    this.tutorialSpotlightEl?.remove();
    this.tutorialSpotlightEl = null;
  }

  private getTutorialSpotlightTargetEl(): HTMLElement | null {
    if (this.vehicleTutorialHints?.root.isConnected) {
      return this.vehicleTutorialHints.root;
    }
    const hints = this.vehicleHintsEl;
    if (hints?.isConnected && hints.style.display !== "none") {
      return hints;
    }
    return null;
  }

  private syncTutorialSpotlightRect(spotlight: HTMLDivElement, target: HTMLElement, pad: number) {
    const r = target.getBoundingClientRect();
    const w = r.width + pad * 2;
    const h = r.height + pad * 2;
    if (w <= 1 || h <= 1) return;
    spotlight.style.left = `${Math.max(0, r.left - pad)}px`;
    spotlight.style.top = `${Math.max(0, r.top - pad)}px`;
    spotlight.style.width = `${w}px`;
    spotlight.style.height = `${h}px`;
  }

  /**
   * After the lobby preview zoom and the in-world intro camera finish, briefly dim the screen
   * and leave the desktop control / first-flight tutorial panel clear.
   */
  private beginTutorialSpotlightAfterIntro() {
    this.clearTutorialSpotlight();
    if (this.mobile) return;
    const target = this.getTutorialSpotlightTargetEl();
    if (!target) return;

    const pad = 14;
    const dim = "rgba(0, 0, 0, 0.5)";
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = [
      "position:fixed",
      "pointer-events:none",
      "z-index:150",
      "border-radius:16px",
      `box-shadow:0 0 0 9999px ${dim}`,
      "opacity:0",
      "transition:opacity 0.35s ease",
    ].join(";");

    this.syncTutorialSpotlightRect(el, target, pad);
    this.container.appendChild(el);
    this.tutorialSpotlightEl = el;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.tutorialSpotlightEl) return;
        this.syncTutorialSpotlightRect(this.tutorialSpotlightEl, target, pad);
        this.tutorialSpotlightEl.style.opacity = "1";
      });
    });

    const onResize = () => {
      if (!this.tutorialSpotlightEl || !target.isConnected) return;
      this.syncTutorialSpotlightRect(this.tutorialSpotlightEl, target, pad);
    };
    this.tutorialSpotlightOnResize = onResize;
    window.addEventListener("resize", onResize);

    this.tutorialSpotlightRepaintTimer = setTimeout(() => {
      this.tutorialSpotlightRepaintTimer = null;
      if (this.tutorialSpotlightEl && target.isConnected) {
        this.syncTutorialSpotlightRect(this.tutorialSpotlightEl, target, pad);
      }
    }, 420);

    this.tutorialSpotlightHoldTimer = setTimeout(() => {
      this.tutorialSpotlightHoldTimer = null;
      if (!this.tutorialSpotlightEl) return;
      const s = this.tutorialSpotlightEl;
      const fadeMs = Game.TUTORIAL_SPOTLIGHT_FADE_MS;
      s.style.transition = `opacity ${fadeMs / 1000}s ease, box-shadow ${fadeMs / 1000}s ease`;
      s.style.opacity = "0";
      s.style.boxShadow = "0 0 0 9999px rgba(0,0,0,0)";
      this.tutorialSpotlightFadeTimer = setTimeout(() => {
        this.tutorialSpotlightFadeTimer = null;
        this.clearTutorialSpotlight();
      }, fadeMs + 40);
    }, Game.TUTORIAL_SPOTLIGHT_HOLD_MS);
  }

  private clearVehicleTutorialTimers() {
    if (this.vehicleTutorialAdvanceTimeout != null) {
      clearTimeout(this.vehicleTutorialAdvanceTimeout);
      this.vehicleTutorialAdvanceTimeout = null;
    }
    if (this.vehicleTutorialOverallTimeout != null) {
      clearTimeout(this.vehicleTutorialOverallTimeout);
      this.vehicleTutorialOverallTimeout = null;
    }
    this.vehicleTutorialAdvancePending = false;
  }

  private startVehicleTutorialIfNeeded(vehicle: Vehicle) {
    this.vehicleTutorialHints?.dispose();
    this.vehicleTutorialHints = null;
    this.activeVehicleTutorial = null;
    this.clearVehicleTutorialTimers();

    if (this.mobile) return;
    const tutorials = ProgressionManager.loadPlayerWorldState().vehicleTutorialsCompleted;
    if (tutorials?.[vehicle]) return;

    this.activeVehicleTutorial = { vehicle, stepIndex: 0 };
    if (this.vehicleHintsEl) {
      this.vehicleHintsEl.classList.add("control-hints--hidden");
      this.vehicleHintsEl.setAttribute("aria-hidden", "true");
      this.vehicleHintsEl.style.display = "none";
    }
    this.vehicleTutorialHints = mountVehicleTutorialHints(
      this.hud.root,
      !this.mobile,
      vehicleTutorialRows(vehicle),
      vehicle === "boat" ? t("First voyage", "首次航行") : t("First flight", "首次飞行"),
    );
    this.vehicleTutorialOverallTimeout = setTimeout(() => {
      this.vehicleTutorialOverallTimeout = null;
      this.expireVehicleTutorialDueToTimeout();
    }, VEHICLE_TUTORIAL_OVERALL_MAX_MS);
  }

  private updateVehicleTutorial(input: {
    turnRate: number;
    forward: boolean;
    brake: boolean;
    elevate: boolean;
    paintball: boolean;
    specialAction: boolean;
  }) {
    if (!this.activeVehicleTutorial || this.vehicleTutorialAdvancePending) return;
    const step =
      VEHICLE_TUTORIAL_STEPS[this.activeVehicleTutorial.vehicle][this.activeVehicleTutorial.stepIndex];
    if (!step) {
      this.finishVehicleTutorial();
      return;
    }

    let completed = false;
    if (step.id === "move") {
      completed = input.forward || input.brake || Math.abs(input.turnRate) > 0;
    } else if (step.id === "elevate") {
      completed = input.elevate;
    } else if (step.id === "shoot") {
      completed = input.paintball;
    }
    if (!completed) return;

    this.scheduleVehicleTutorialAdvance();
  }

  private completeVehicleTutorialStep(stepId: VehicleTutorialStepId) {
    if (!this.activeVehicleTutorial || this.vehicleTutorialAdvancePending) return;
    const step =
      VEHICLE_TUTORIAL_STEPS[this.activeVehicleTutorial.vehicle][this.activeVehicleTutorial.stepIndex];
    if (step?.id !== stepId) return;
    this.scheduleVehicleTutorialAdvance();
  }

  private scheduleVehicleTutorialAdvance() {
    if (!this.activeVehicleTutorial || this.vehicleTutorialAdvancePending) return;
    this.vehicleTutorialAdvancePending = true;
    const delay = vehicleTutorialAdvanceDelayMs(
      this.activeVehicleTutorial.vehicle,
      this.activeVehicleTutorial.stepIndex,
    );
    this.vehicleTutorialAdvanceTimeout = setTimeout(() => {
      this.vehicleTutorialAdvanceTimeout = null;
      if (!this.activeVehicleTutorial) {
        this.vehicleTutorialAdvancePending = false;
        return;
      }

      const steps = VEHICLE_TUTORIAL_STEPS[this.activeVehicleTutorial.vehicle];
      const nextStepIndex = this.activeVehicleTutorial.stepIndex + 1;
      if (nextStepIndex >= steps.length) {
        this.transitionVehicleTutorialToStep(steps.length, true);
        return;
      }

      this.transitionVehicleTutorialToStep(nextStepIndex);
    }, delay);
  }

  private transitionVehicleTutorialToStep(nextStepIndex: number, finishAfterHold = false) {
    const hints = this.vehicleTutorialHints;
    if (!this.activeVehicleTutorial || !hints) {
      this.vehicleTutorialAdvancePending = false;
      return;
    }

    hints.root.classList.add("control-hints--hidden");
    window.setTimeout(() => {
      if (!this.activeVehicleTutorial || !this.vehicleTutorialHints) {
        this.vehicleTutorialAdvancePending = false;
        return;
      }
      this.activeVehicleTutorial.stepIndex = nextStepIndex;
      this.vehicleTutorialHints.setStep(nextStepIndex);
      requestAnimationFrame(() => {
        this.vehicleTutorialHints?.root.classList.remove("control-hints--hidden");
        if (finishAfterHold) {
          this.vehicleTutorialAdvanceTimeout = setTimeout(() => {
            this.vehicleTutorialAdvanceTimeout = null;
            this.finishVehicleTutorial();
          }, VEHICLE_TUTORIAL_ADVANCE_DELAY_MS);
        } else {
          this.vehicleTutorialAdvancePending = false;
        }
      });
    }, VEHICLE_TUTORIAL_STEP_FADE_MS);
  }

  /** Hide tutorial panel, restore full controls hints (after normal completion or timeout). */
  private removeVehicleTutorialFromDomAfterFade() {
    const hints = this.vehicleTutorialHints;
    hints?.root.classList.add("control-hints--hidden");
    this.vehicleTutorialHints = null;
    this.activeVehicleTutorial = null;
    window.setTimeout(() => {
      hints?.dispose();
      if (!this.vehicleHintsEl) return;
      this.vehicleHintsEl.style.display = "";
      this.vehicleHintsEl.removeAttribute("aria-hidden");
      requestAnimationFrame(() => {
        this.vehicleHintsEl?.classList.remove("control-hints--hidden");
      });
    }, VEHICLE_TUTORIAL_FADE_MS + 10);
  }

  private finishVehicleTutorial() {
    const tutorial = this.activeVehicleTutorial;
    if (!tutorial) return;

    this.clearVehicleTutorialTimers();

    const prev = ProgressionManager.loadPlayerWorldState();
    this.savePlayerWorldState({
      vehicleTutorialsCompleted: {
        ...(prev.vehicleTutorialsCompleted ?? {}),
        [tutorial.vehicle]: true,
      },
    });

    this.removeVehicleTutorialFromDomAfterFade();
  }

  /**
   * Tutorial exceeded the overall time budget: free the player and show keyboard hints.
   * Marked complete in save so the flow is not repeated every session.
   */
  private expireVehicleTutorialDueToTimeout() {
    if (!this.activeVehicleTutorial) return;

    this.clearVehicleTutorialTimers();

    const v = this.activeVehicleTutorial.vehicle;
    const prev = ProgressionManager.loadPlayerWorldState();
    this.savePlayerWorldState({
      vehicleTutorialsCompleted: {
        ...(prev.vehicleTutorialsCompleted ?? {}),
        [v]: true,
      },
    });

    this.removeVehicleTutorialFromDomAfterFade();
  }

  private startVoidAmbientMusic() {
    void this.audioManager
      .loadSFX(VOID_MUSIC_LOOP_NAME, "/audio/music/void_1.mp3")
      .then(() => {
        if (!this.inCosmicVoid) return;
        this.audioManager.startLoop(VOID_MUSIC_LOOP_NAME, 0);
        this.audioManager.setLoopVolume(VOID_MUSIC_LOOP_NAME, VOID_MUSIC_LOOP_MAX_VOL);
        this.voidAmbientMusicActive = true;
      });
  }

  private stopVoidAmbientMusic() {
    if (!this.voidAmbientMusicActive) return;
    this.audioManager.stopLoop(VOID_MUSIC_LOOP_NAME);
    this.voidAmbientMusicActive = false;
  }

  private clearVoidEternalFlameIntroSchedulers() {
    for (const t of this.voidEternalFlameIntroTimeouts) clearTimeout(t);
    this.voidEternalFlameIntroTimeouts = [];
  }

  /** Wave configs: [totalMoths, maxConcurrent, spawnMinSec, spawnMaxSec, elderChance]. */
  private static readonly VOID_WAVE_CONFIGS: readonly [number, number, number, number, number][] = [
    [5,  4,  1.4, 2.2, 0.0],  // wave 1 — small scouting brood, leisurely pace
    [9,  6,  0.9, 1.6, 0.0],  // wave 2 — Hungering Flight, faster spawns
    [14, 9,  0.5, 1.1, 0.35], // wave 3 — Mothwing Eldest lead the relentless tide
  ];
  private static readonly VOID_BETWEEN_WAVE_PAUSE_MS = 350;
  /** Time after `pause` before the next wave’s spawns start (must fit dialogue; shorter = snappier). */
  private static readonly VOID_BETWEEN_WAVE_TO_NEXT_MS = 2600;
  /** Off-screen red arrows only when a moth is within this distance of the eternal flame. */
  private static readonly VOID_ENEMY_ARROW_MAX_FLAME_DIST = 1.4;

  /**
   * Show the intro bubble, then start wave 1.
   * Timings must stay in sync with {@link PackageQuestHUD#showBubble} display duration (~4s).
   */
  private scheduleCosmicVoidEternalFlameIntro() {
    this.clearVoidEternalFlameIntroSchedulers();
    if (!this.inCosmicVoid || !this.voidMoths) return;
    this.voidWave = 0;
    this.voidWavePendingTransition = false;
    this.voidShieldWarnedHalf = false;
    this.voidShieldWarnedCritical = false;

    const [line1] = ETERNAL_FLAME_VOID_BUBBLES;
    const bubbleMs = 4000;
    const leadInMs = 400;
    this.voidEternalFlameIntroTimeouts.push(
      setTimeout(() => {
        if (!this.inCosmicVoid) return;
        this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, line1);
      }, leadInMs),
    );
    this.voidEternalFlameIntroTimeouts.push(
      setTimeout(() => {
        if (!this.inCosmicVoid || !this.voidMoths) return;
        this.startVoidWave(1);
      }, leadInMs + bubbleMs),
    );
  }

  /** Configure and begin a numbered void wave (1-based). */
  private startVoidWave(wave: number) {
    if (!this.voidMoths) return;
    const cfg = Game.VOID_WAVE_CONFIGS[wave - 1];
    if (!cfg) return;
    this.companion?.emitMoment("game.event.void_wave", { wave }, { salience: 0.85, voiceRelevant: true });
    const [total, maxConc, spawnMin, spawnMax, elderChance] = cfg;
    this.voidMoths.configureWave(total, maxConc, spawnMin, spawnMax, elderChance);
    this.voidMoths.setMothSpawningEnabled(true);
    this.voidWave = wave;
    this.voidWavePendingTransition = false;
  }

  /**
   * Called each frame during void: checks for wave-cleared → schedule inter-wave dialogue → next wave.
   * Also checks shield HP thresholds and fires HP-warning dialogue.
   */
  private updateVoidWaveController() {
    if (!this.inCosmicVoid || !this.voidMoths) return;

    // Shield HP warnings
    if (this.voidFlameShield) {
      const hp = this.voidFlameShield.getHitPoints();
      const max = this.voidFlameShield.getMaxHitPoints();
      if (!this.voidShieldWarnedHalf && hp <= Math.floor(max * 0.5)) {
        this.voidShieldWarnedHalf = true;
        this.companion?.emitMoment("game.event.shield_low", { hp, max, level: "half" }, { salience: 0.9, voiceRelevant: true });
        this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, VOID_SHIELD_LOW_HP_DIALOGUE[0]);
      } else if (!this.voidShieldWarnedCritical && hp <= 3 && hp > 0) {
        this.voidShieldWarnedCritical = true;
        this.companion?.emitMoment("game.event.shield_low", { hp, max, level: "critical" }, { salience: 0.95, voiceRelevant: true });
        this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, VOID_SHIELD_LOW_HP_DIALOGUE[1]);
      }
    }

    // Victory: final wave cleared
    if (
      this.voidWave === Game.VOID_WAVE_CONFIGS.length &&
      !this.voidVictoryTriggered &&
      !this.voidFlameShattered &&
      this.voidMoths.isWaveCleared()
    ) {
      void this.handleVoidVictory();
      return;
    }

    // Wave transition
    if (
      this.voidWave > 0 &&
      this.voidWave < Game.VOID_WAVE_CONFIGS.length &&
      !this.voidWavePendingTransition &&
      this.voidMoths.isWaveCleared()
    ) {
      this.voidWavePendingTransition = true;
      const nextWave = this.voidWave + 1;
      const betweenLine = VOID_WAVE_BETWEEN_DIALOGUE[this.voidWave - 1];
      const pauseBeforeMs = Game.VOID_BETWEEN_WAVE_PAUSE_MS;
      const toNextMs = Game.VOID_BETWEEN_WAVE_TO_NEXT_MS;

      // Brief pause, then show between-wave dialogue, then start next wave
      const t1 = setTimeout(() => {
        if (!this.inCosmicVoid) return;
        if (betweenLine) {
          this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, betweenLine);
        }
      }, pauseBeforeMs);
      const t2 = setTimeout(() => {
        if (!this.inCosmicVoid || !this.voidMoths) return;
        this.startVoidWave(nextWave);
      }, pauseBeforeMs + toNextMs);
      this.voidEternalFlameIntroTimeouts.push(t1, t2);
    }
  }

  /** A moth reached the flame while the shield was gone: shatter sequence → main menu. */
  private async handleVoidFlameShattered() {
    if (this.voidFlameShattered) return;
    this.voidFlameShattered = true;

    // Stop moth spawning immediately
    this.voidMoths?.setMothSpawningEnabled(false);

    // Dim/hide the flame
    if (this.voidEternalFlame) {
      this.voidEternalFlame.group.visible = false;
    }

    // Show the shatter dialogue briefly
    this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, VOID_FLAME_SHATTER_DIALOGUE);
    await new Promise<void>((r) => setTimeout(r, 2600));

    if (!this.transitionOverlay) return;
    this.running = false;
    this.stopVoidAmbientMusic();

    await this.transitionOverlay.fadeOut({
      durationSec: 1.5,
      message: t("You failed to protect the eternal flame.", "你没能守护住永恒之火。"),
      holdAtFullSec: 2.0,
    });

    this.removeVoidEternalFlame();
    this.inCosmicVoid = false;
    this.socketClient?.disconnect();
    this.remotePlanes.dispose();

    this.restoreWorldVisibilityFromVoid();

    this.teardownGameplaySession("void_failed");
    this.dayNightCycle.moonProgress = 0;
    this.moonThreat?.reset();
    this.shouldShowBrazierMoonResume = false;
    this.applyDayNightPreset();
    this.gamePhase = "flying";
    this.moonCinematicStep = "done";
    this.moonCinematicCamera = null;
    this.introActive = false;
    this.vehicleHintsEl = null;
    this.campsiteHintsEl = null;
    this.mountLobby();
    this.previewActive = true;
    window.addEventListener("resize", this.onPreviewResize);
    this.onPreviewResize();
    this.resetPreviewAnimationClock();
    this.stepPreview(this.consumePreviewFrameDt());
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    requestAnimationFrame(this.previewTick);
    if (this.transitionOverlay) {
      await this.transitionOverlay.fadeIn();
      this.transitionOverlay.dispose();
      this.transitionOverlay = null;
    }
  }

  /** All three waves survived — eternal flame thanks player and returns them to the world. */
  private async handleVoidVictory() {
    if (this.voidVictoryTriggered) return;
    this.voidVictoryTriggered = true;

    // Stop any remaining moths and spawning
    this.voidMoths?.setMothSpawningEnabled(false);

    // Dramatic pause before the flame speaks
    await new Promise<void>((r) => setTimeout(r, 1800));
    if (!this.inCosmicVoid) return;

    // Line 1 — gratitude
    this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, VOID_VICTORY_DIALOGUE[0]);
    await new Promise<void>((r) => setTimeout(r, 5200));
    if (!this.inCosmicVoid) return;

    // Line 2 — willing sacrifice / reveal of purpose
    this.packageQuestHUD.showBubble(ETERNAL_FLAME_SPEAKER, VOID_VICTORY_DIALOGUE[1]);
    await new Promise<void>((r) => setTimeout(r, 5500));
    if (!this.inCosmicVoid) return;

    this.stopVoidAmbientMusic();

    // Persist before `exitCosmicVoid` so `restoreWorldVisibilityFromVoid` does not
    // re-show portals, and clear portal meshes so proximity cannot re-trigger entry.
    const prev = ProgressionManager.loadPlayerWorldState();
    this.savePlayerWorldState({
      eternalFlameCount: (prev.eternalFlameCount ?? 0) + 1,
      voidPortalsClosed: true,
    });
    this.reportQuestCompleted("eternal_flame_defended", {
      waves: Game.VOID_WAVE_CONFIGS.length,
    });
    this.eternalFlameUI?.syncFromSave();
    this.clearCosmicWorldPortals();

    // Fade to black and return to the world
    await this.exitCosmicVoid();

    // Brief delay so the world has a moment to settle before the overlay appears
    await new Promise<void>((r) => setTimeout(r, 600));
    this.eternalFlameUI?.playKingLootSequence();
  }

  private removeVoidEternalFlame() {
    if (this.localPlayer instanceof Carpet) {
      this.localPlayer.exitVoidPlaneFlight();
    }
    this.clearVoidEternalFlameIntroSchedulers();
    this.voidWave = 0;
    this.voidWavePendingTransition = false;
    this.voidShieldWarnedHalf = false;
    this.voidShieldWarnedCritical = false;
    this.voidFlameShattered = false;
    this.voidVictoryTriggered = false;
    this.stopVoidAmbientMusic();
    if (this.voidMoths) {
      this.voidMoths.group.removeFromParent();
      this.voidMoths.dispose();
      this.voidMoths = null;
    }
    if (this.voidFlameShield) {
      if (this.voidEternalFlame) {
        this.voidEternalFlame.group.remove(this.voidFlameShield.group);
      }
      this.voidFlameShield.dispose();
      this.voidFlameShield = null;
    }
    if (!this.voidEternalFlame) return;
    this.voidEternalFlame.group.removeFromParent();
    this.voidEternalFlame.dispose();
    this.voidEternalFlame = null;
    this.destroyVoidFlameArrow();
    this.destroyVoidEnemyArrows();
  }

  private createVoidFlameArrow() {
    this.destroyVoidFlameArrow();
    const el = document.createElement("div");
    el.style.cssText = `
      position:absolute;
      width:32px;height:32px;
      pointer-events:none;
      z-index:10;
      display:none;
      align-items:center;
      justify-content:center;
      transform-origin:center center;
    `;
    const inner = document.createElement("div");
    inner.style.cssText = `
      width:0;height:0;
      border-left:10px solid transparent;
      border-right:10px solid transparent;
      border-bottom:22px solid rgba(80,180,255,0.92);
      filter:drop-shadow(0 0 6px rgba(100,200,255,0.9));
    `;
    el.appendChild(inner);
    this.container.appendChild(el);
    this.voidFlameArrowEl = el;
  }

  private destroyVoidFlameArrow() {
    if (this.voidFlameArrowEl) {
      this.voidFlameArrowEl.remove();
      this.voidFlameArrowEl = null;
    }
  }

  private static readonly ENEMY_ARROW_POOL = 12;

  private createVoidEnemyArrows() {
    this.destroyVoidEnemyArrows();
    for (let i = 0; i < Game.ENEMY_ARROW_POOL; i++) {
      const el = document.createElement("div");
      el.style.cssText = `
        position:absolute;
        width:32px;height:32px;
        pointer-events:none;
        z-index:10;
        display:none;
        align-items:center;
        justify-content:center;
        transform-origin:center center;
      `;
      const inner = document.createElement("div");
      inner.style.cssText = `
        width:0;height:0;
        border-left:9px solid transparent;
        border-right:9px solid transparent;
        border-bottom:20px solid rgba(255,45,45,0.92);
        filter:drop-shadow(0 0 5px rgba(255,80,0,0.85));
      `;
      el.appendChild(inner);
      this.container.appendChild(el);
      this.voidEnemyArrowEls.push(el);
    }
  }

  private destroyVoidEnemyArrows() {
    for (const el of this.voidEnemyArrowEls) el.remove();
    this.voidEnemyArrowEls = [];
  }

  private readonly _enemyArrowPosScratch: Vector3[] = [];
  private readonly _enemyArrowNdc = new Vector3();

  private updateVoidEnemyArrows() {
    if (!this.voidMoths || this.voidEnemyArrowEls.length === 0) return;
    const flame = this.voidEternalFlame?.group.position;
    if (!flame) {
      for (const el of this.voidEnemyArrowEls) el.style.display = "none";
      return;
    }
    const maxD2 = Game.VOID_ENEMY_ARROW_MAX_FLAME_DIST * Game.VOID_ENEMY_ARROW_MAX_FLAME_DIST;
    const cam = this.cameraRig.camera;
    const cw = this.container.clientWidth || window.innerWidth;
    const ch = this.container.clientHeight || window.innerHeight;
    const margin = 44;
    const hw = 16;
    const hh = 16;

    this.voidMoths.getLivingPositions(this._enemyArrowPosScratch, Game.ENEMY_ARROW_POOL);

    for (let i = 0; i < this.voidEnemyArrowEls.length; i++) {
      const el = this.voidEnemyArrowEls[i]!;
      const pos = this._enemyArrowPosScratch[i];
      if (!pos) { el.style.display = "none"; continue; }
      if (pos.distanceToSquared(flame) > maxD2) { el.style.display = "none"; continue; }
      this._enemyArrowNdc.copy(pos).project(cam);
      const ndcX = this._enemyArrowNdc.x;
      const ndcY = this._enemyArrowNdc.y;
      const ndcZ = this._enemyArrowNdc.z;
      const sx = (ndcX * 0.5 + 0.5) * cw;
      const sy = (-ndcY * 0.5 + 0.5) * ch;
      const behind = ndcZ > 1;
      const inView = !behind && sx >= margin && sx <= cw - margin && sy >= margin && sy <= ch - margin;
      if (inView) { el.style.display = "none"; continue; }
      el.style.display = "flex";
      const fx = behind ? -ndcX : ndcX;
      const fy = behind ? -ndcY : ndcY;
      const angle = Math.atan2(-fx, fy) * (180 / Math.PI);
      const absX = Math.abs(fx);
      const absY = Math.abs(fy);
      const scale = Math.max(absX, absY) > 0.001 ? 1 / Math.max(absX, absY) : 1;
      const ex = Math.max(margin, Math.min(cw - margin, (fx * scale * 0.5 + 0.5) * cw));
      const ey = Math.max(margin, Math.min(ch - margin, (-fy * scale * 0.5 + 0.5) * ch));
      el.style.left = `${ex - hw}px`;
      el.style.top = `${ey - hh}px`;
      el.style.transform = `rotate(${angle}deg)`;
    }
  }

  private updateVoidFlameArrow() {
    const el = this.voidFlameArrowEl;
    if (!el || !this.voidEternalFlame) { el && (el.style.display = "none"); return; }
    const flamePos = this.voidEternalFlame.group.position;
    const cam = this.cameraRig.camera;
    const tmp = flamePos.clone().project(cam);
    const ndcX = tmp.x;
    const ndcY = tmp.y;
    const ndcZ = tmp.z;
    const cw = this.container.clientWidth || window.innerWidth;
    const ch = this.container.clientHeight || window.innerHeight;
    const margin = 40;
    const sx = (ndcX * 0.5 + 0.5) * cw;
    const sy = (-ndcY * 0.5 + 0.5) * ch;
    const behind = ndcZ > 1;
    const inView = !behind && sx >= margin && sx <= cw - margin && sy >= margin && sy <= ch - margin;
    if (inView) { el.style.display = "none"; return; }
    el.style.display = "flex";
    // When behind camera, flip the NDC coords so arrow points away from where the cam is facing.
    const fx = behind ? -ndcX : ndcX;
    const fy = behind ? -ndcY : ndcY;
    const angle = Math.atan2(-fx, fy) * (180 / Math.PI);
    const hw = 16; // half element width
    const hh = 16;
    const edgePad = margin;
    const t = Math.max(
      Math.abs(fx) > 0.001 ? (Math.sign(fx) * 1 - 0) / fx : Infinity,
      Math.abs(fy) > 0.001 ? (Math.sign(fy) * 1 - 0) / fy : Infinity,
    );
    const clampX = Math.max(edgePad, Math.min(cw - edgePad, (fx * Math.min(1, Math.abs(1 / (Math.abs(fx) + 1e-6))) * 0.5 + 0.5) * cw));
    const clampY = Math.max(edgePad, Math.min(ch - edgePad, (-fy * Math.min(1, Math.abs(1 / (Math.abs(fy) + 1e-6))) * 0.5 + 0.5) * ch));
    // Clamp screen-space position to edges
    let ex = (fx * 0.5 + 0.5) * cw;
    let ey = (-fy * 0.5 + 0.5) * ch;
    // Remap from projected coords to edge: scale so the dominant axis hits its edge
    const absX = Math.abs(fx);
    const absY = Math.abs(fy);
    const scale = Math.max(absX, absY) > 0.001 ? 1 / Math.max(absX, absY) : 1;
    const clX = fx * scale;
    const clY = fy * scale;
    ex = Math.max(edgePad, Math.min(cw - edgePad, (clX * 0.5 + 0.5) * cw));
    ey = Math.max(edgePad, Math.min(ch - edgePad, (-clY * 0.5 + 0.5) * ch));
    el.style.left = `${ex - hw}px`;
    el.style.top = `${ey - hh}px`;
    el.style.transform = `rotate(${angle}deg)`;
    void clampX; void clampY; void t;
  }

  private async doEnterCosmicVoid() {
    if (!this.transitionOverlay || this.inCosmicVoid) return;
    this.raceManager?.abort();
    this.flagSystem?.setSuppressed(true);
    this.socketClient?.emitFlagSuppressed(true);
    this.coastCarpetDuringCosmicTransition = true;
    this.voidEntryInProgress = true;
    this.twisterSpinTimer = 0;
    this.twisterSpinCooldown = 0;
    try {
      this.gamePhase = "transitioning";
      this.portalInteractionSuppressTimer = PORTAL_INTERACTION_SUPPRESS_SEC;

      this.audioManager.resumeContextIfNeeded();
      this.audioManager.playSFX("portal_1", PORTAL_TELEPORT_SFX_VOLUME);

      await this.transitionOverlay.fadeOut();
      this.inCosmicVoid = true;
      this.voidEntryInProgress = false;
      this.stateSync?.stop();
      this.remotePlanes.setVisible(false);
      this.remotePlayerNameLabels.setVisible(false);

      this.globe.group.visible = false;
      this.ringManager.group.visible = false;
      if (this.waterSpouts) this.waterSpouts.group.visible = false;
      if (this.meteorShower) this.meteorShower.group.visible = false;
      if (this.oceanFish) this.oceanFish.group.visible = false;
      if (this.skyJellyfish) this.skyJellyfish.group.visible = false;
      if (this.campsiteMarker) this.campsiteMarker.group.visible = false;
      for (const portal of this.cosmicWorldPortals) portal.group.visible = false;
      if (this.carpetPortalSystem) this.carpetPortalSystem.group.visible = false;
      if (this.carpetTrail) this.carpetTrail.group.visible = false;
      if (this.voidCarpetTrail) {
        this.voidCarpetTrail.group.visible = true;
        this.voidCarpetTrail.reset();
      }
      if (this.carpetWake) this.carpetWake.group.visible = false;
      if (this.carpetLeaves) this.carpetLeaves.group.visible = false;
      for (const fb of this.birdFlocks) fb.group.visible = false;
      for (const ra of this.rainbowArches) ra.group.visible = false;
      for (const fl of this.lanternClusters) fl.group.visible = false;
      for (const fc of this.fireflyClusters) fc.group.visible = false;
      for (const v of this.volcanoes) v.group.visible = false;
      if (this.braziers) this.braziers.setVisible(false);
      if (this.moonThreat) {
        this.moonThreat.group.visible = false;
        this.moonThreat.setSceneMoonVfxVisible(false);
      }
      if (this.gremlinHearts) this.gremlinHearts.group.visible = false;
      if (this.packageQuest) this.packageQuest.group.visible = false;
      if (this.collectVFX) this.collectVFX.group.visible = false;
      this.npcPlanes?.setVisible(false);
      this.ghostPlanes?.setVisible(false);
      this.hideGhostEncounterChip();

      this.packageQuestHUD.hideBubble();
      this.packageQuestHUD.hideDeliveryTarget();
      this.setPortalHintVisible(false);

      this.hud.setWorldName(t("Cosmic Void", "宇宙虚空"));
      this.hud.setPlayerCountVisible(false);

      this.applyDayNightPreset();

      if (this.localPlayer instanceof Carpet) {
        this.removeVoidEternalFlame();
        const c = this.localPlayer;
        c.group.updateMatrixWorld(true);
        const globeR = this.worldConfig?.globeRadius ?? 5;
        c.enterVoidPlaneFlight(globeR);
        c.getVoidFlameTargetWorld(this._voidEternalFlamePosScratch);
        const p = this._voidEternalFlamePosScratch;
        const vf = new EternalFlameWorld();
        await vf.init();
        vf.setWorldPosition(p.x, p.y, p.z);
        vf.alignToCamera(this.cameraRig.camera);
        this.voidEternalFlame = vf;
        this.voidFlameShield = new VoidFlameShield(
          this.audioManager,
          SHIELD_IMPACT_ENERGY_SFX,
          SHIELD_IMPACT_ENERGY_SFX_VOL,
        );
        this.voidEternalFlame.group.add(this.voidFlameShield.group);
        this.scene.add(vf.group);
        this.startVoidAmbientMusic();

        this.voidMoths = new VoidMothsManager(
          this.paintballSystem,
          (isKill) => {
            this.cameraRig.shake(isKill ? 0.022 : 0.014, isKill ? 0.18 : 0.12);
            this.vehicleFlashTimer = 0.14;
            this.playVoidMothStruckSfx(isKill);
          },
          () => {
            void this.handleVoidFlameShattered();
          },
        );
        this.scene.add(this.voidMoths.group);
      }

      await this.transitionOverlay.fadeIn();
      this.gamePhase = "flying";
      this.touchControls?.setCosmicVoid(true);
      this.createVoidFlameArrow();
      this.createVoidEnemyArrows();
      if (this.voidMoths) {
        this.scheduleCosmicVoidEternalFlameIntro();
      }
    } finally {
      this.coastCarpetDuringCosmicTransition = false;
      this.voidEntryInProgress = false;
    }
  }

  public async exitCosmicVoid() {
    if (!this.transitionOverlay || !this.inCosmicVoid) return;
    this.coastCarpetDuringCosmicTransition = true;
    try {
      this.gamePhase = "transitioning";
      this.portalInteractionSuppressTimer = PORTAL_INTERACTION_SUPPRESS_SEC;

      this.audioManager.resumeContextIfNeeded();
      this.audioManager.playSFX("portal_1", PORTAL_TELEPORT_SFX_VOLUME);

      await this.transitionOverlay.fadeOut();
      this.removeVoidEternalFlame();
      this.inCosmicVoid = false;
      this.touchControls?.setCosmicVoid(false);
      this.socketClient?.disconnect();
      this.remotePlanes.dispose();
      this.initNetworking(this.worldSlug); // Restart stateSync and socket
      this.remotePlanes.setVisible(true);
      this.remotePlayerNameLabels.setVisible(true);

      this.restoreWorldVisibilityFromVoid();
      this.applyDayNightPreset();

      await this.transitionOverlay.fadeIn();
      this.gamePhase = "flying";
    } finally {
      this.coastCarpetDuringCosmicTransition = false;
    }
  }

  /** Disposes and removes all cosmic void portal visuals (e.g. after completion). */
  private clearCosmicWorldPortals() {
    for (const portal of this.cosmicWorldPortals) {
      this.scene.remove(portal.group);
      portal.dispose();
    }
    this.cosmicWorldPortals = [];
  }

  /** Restore all scene objects that were hidden when entering the cosmic void. */
  private restoreWorldVisibilityFromVoid() {
    this.globe.group.visible = true;
    this.ringManager.group.visible = true;
    if (this.waterSpouts) this.waterSpouts.group.visible = true;
    if (this.meteorShower) this.meteorShower.group.visible = true;
    if (this.oceanFish) this.oceanFish.group.visible = true;
    if (this.skyJellyfish) this.skyJellyfish.group.visible = true;
    if (this.campsiteMarker) this.campsiteMarker.group.visible = true;
    if (!ProgressionManager.loadPlayerWorldState().voidPortalsClosed) {
      for (const portal of this.cosmicWorldPortals) portal.group.visible = true;
    }
    if (this.carpetPortalSystem) this.carpetPortalSystem.group.visible = true;
    if (this.carpetTrail) this.carpetTrail.group.visible = true;
    if (this.voidCarpetTrail) {
      this.voidCarpetTrail.group.visible = false;
      this.voidCarpetTrail.reset();
    }
    if (this.carpetWake) this.carpetWake.group.visible = true;
    if (this.carpetLeaves) this.carpetLeaves.group.visible = true;
    for (const fb of this.birdFlocks) fb.group.visible = true;
    for (const ra of this.rainbowArches) ra.group.visible = true;
    for (const fl of this.lanternClusters) fl.group.visible = true;
    for (const fc of this.fireflyClusters) fc.group.visible = true;
    for (const v of this.volcanoes) v.group.visible = true;
    if (this.braziers) this.braziers.setVisible(true);
    if (this.moonThreat) {
      this.moonThreat.group.visible = true;
      this.moonThreat.setSceneMoonVfxVisible(true);
    }
    if (this.gremlinHearts) this.gremlinHearts.group.visible = true;
    if (this.packageQuest) this.packageQuest.group.visible = true;
    if (this.collectVFX) this.collectVFX.group.visible = true;
    this.npcPlanes?.setVisible(true);
    this.ghostPlanes?.setVisible(true);
    this.setPortalHintVisible(true);
    this.hud.setWorldName(
      localizeWorldName(this.worldConfig?.name ?? t("Unknown World", "未知世界")),
    );
    this.hud.setPlayerCountVisible(true);
  }

  private handleCarpetPortalTeleport() {
    if (!(this.localPlayer instanceof Carpet)) return;

    this.audioManager.resumeContextIfNeeded();
    this.audioManager.playSFX("portal_1", PORTAL_TELEPORT_SFX_VOLUME);
    this.carpetPortalTeleportSeq++;
    this.stateSync?.flush();

    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    this.portalInteractionSuppressTimer = PORTAL_INTERACTION_SUPPRESS_SEC;
    this.landmarkHUD.hide();
    this.hud.showCampsitePrompt(false);

    this.carpetTrail.reset();
    this.voidCarpetTrail?.reset();
    this.carpetWake.reset();
    this.carpetLeaves.reset();
    this.localPlayer.group.updateMatrixWorld(true);
    this.skyJellyfish?.snapFollowers(this.localPlayer.group.matrixWorld);

    this.cameraRig.snapTo(
      this.localPlayer.qPosition,
      this.localPlayer.heading,
      this.localPlayer.altitude,
      globeRadius,
      this.vehicleFeatures.cameraFollowDistance,
      this.vehicleFeatures.cameraFollowHeight,
    );
    this.stateSync?.flush();
  }

  /* ── Resize ──────────────────────────────────────────────────────── */

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.cameraRig.resize(w / h);
    this.campsiteScene?.resize(w / h);
    this.oceanFish?.setFishingLineResolution(w, h);
    if (this.moonstoneUnionCamera) {
      this.moonstoneUnionCamera.aspect = w / h;
      this.moonstoneUnionCamera.updateProjectionMatrix();
    }
  };

  /* ── Helpers ─────────────────────────────────────────────────────── */

  private createSkyGradient(stops: { stop: number; color: string }[]): CanvasTexture {
    this.skyCanvas = document.createElement("canvas");
    this.skyCanvas.width = 512;
    this.skyCanvas.height = 512;
    this.paintRadialSky(stops);
    this.skyGradientSignature = this.skyGradientStopsSignature(stops);
    this.skyTexture = new CanvasTexture(this.skyCanvas);
    this.skyTexture.colorSpace = SRGBColorSpace;
    return this.skyTexture;
  }

  private updateSkyGradient(stops: { stop: number; color: string }[]) {
    if (!this.skyCanvas) return;
    const sig = this.skyGradientStopsSignature(stops);
    if (sig === this.skyGradientSignature) return;
    this.paintRadialSky(stops);
    this.skyGradientSignature = sig;
    this.skyTexture.needsUpdate = true;
  }

  private skyGradientStopsSignature(stops: { stop: number; color: string }[]): string {
    return stops.map((s) => `${s.stop}:${s.color}`).join("|");
  }

  private paintRadialSky(stops: { stop: number; color: string }[]) {
    const S = 512;
    const ctx = this.skyCanvas.getContext("2d")!;
    const cx = S / 2;
    const cy = S;
    const outerR = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    for (const s of stops) {
      gradient.addColorStop(1.0 - s.stop, s.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, S, S);
  }

  /** Ocean, birds, weather, and world loops — inaudible in the cosmic void / during void entry. */
  private silenceWorldAmbienceForCosmicVoid() {
    this.audioManager.setLoopVolume(RAIN_LOOP_NAME, 0);
    this.audioManager.setLoopVolume("crickets_loop", 0);
    this.audioManager.setLoopVolume(BIRDS_LOOP_NAME, 0);
    this.audioManager.setLoopVolume(RUMBLE_LOOP_NAME, 0);
    this.audioManager.setLoopVolume(OCEAN_WAVES_LOOP_NAME, 0);
    this.audioManager.setLoopVolume(MOONSTONE_RUMBLE_LOOP_NAME, 0);
    this.audioManager.setLoopVolume("twister", 0);
    this.audioManager.setWeights(0, 0, 0);
    this.audioManager.setEndTimesWeight(0);
  }

  private applyDayNightPreset() {
    this.dayNightCycle.moonProgress = this.moonThreat?.progress ?? 0;
    const p = this.dayNightCycle.getPreset();
    const fogScale = this.mobile ? 0.7 : 1;

    if (this.inCosmicVoid) {
      this.updateSkyGradient([
        { stop: 0.0, color: "#010003" },
        { stop: 0.3, color: "#020005" },
        { stop: 0.6, color: "#040008" },
        { stop: 1.0, color: "#060010" },
      ]); // Deep space colors
      const fog = this.scene.fog as Fog;
      fog.color.set(0x010003);
      fog.near = p.fogNear * fogScale;
      fog.far = p.fogFar * fogScale;

      this.hemiLight.color.set(0x111122);
      this.hemiLight.groundColor.set(0x000000);
      this.hemiLight.intensity = 0.5;
      
      this.ambientLight.color.set(0x221144);
      this.ambientLight.intensity = 0.4;
      
      this.sunLight.color.set(0x4422ff);
      this.sunLight.intensity = 0.8;
      
      if (this.starfield) {
        this.starfield.group.visible = true;
        this.starfield.setOpacity(1.0);
      }
      if (this.aurora) {
        this.aurora.group.visible = false;
        this.aurora.setOpacity(0);
      }
      this.silenceWorldAmbienceForCosmicVoid();
      return;
    }
    if (this.voidEntryInProgress) {
      this.silenceWorldAmbienceForCosmicVoid();
      return;
    }

    this.updateSkyGradient(p.skyGradient);

    const fog = this.scene.fog as Fog;
    fog.color.set(p.fogColor);
    fog.near = p.fogNear * fogScale;
    fog.far = p.fogFar * fogScale;

    this.hemiLight.color.set(p.hemiSkyColor);
    this.hemiLight.groundColor.set(p.hemiGroundColor);
    this.hemiLight.intensity = p.hemiIntensity;

    this.ambientLight.color.set(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.sunLight.color.set(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.sun2Light.color.set(p.sun2Color);
    this.sun2Light.intensity = p.sun2Intensity;

    this.fillLight.color.set(p.fillColor);
    this.fillLight.intensity = p.fillIntensity;
    this.fill2Light.color.set(p.fill2Color);
    this.fill2Light.intensity = p.fill2Intensity;

    this.backLight.color.set(p.backColor);
    this.backLight.intensity = p.backIntensity;

    const godRayElapsed = this.previewActive ? this.previewGodRayTime : this.gameTime;
    this.godRays.update(godRayElapsed, this.sunLight.position, this.globe.group.position, p.sunColor, p.sunIntensity);

    this.globe.setAtmosphereGlow(p.atmosphereGlow);
    this.globe.setCloudOpacity(p.cloudOpacity);
    globalRimColor.set(p.rimColor);
    this.globe.setRimColor(p.rimColor);
    this.globe.setOceanColors(p.oceanShallow, p.oceanDeep, p.oceanFoam);

    const nightW = this.dayNightCycle.getNightWeight();
    const dayW = this.dayNightCycle.getDayWeight();

    if (this.starfield) {
      this.starfield.group.visible = nightW > 0.01;
      this.starfield.setOpacity(nightW);
    }
    if (this.aurora) {
      this.aurora.group.visible = nightW > 0.01;
      this.aurora.setOpacity(nightW);
    }
    if (this.playerLight) {
      this.playerLight.intensity = nightW * PLAYER_LIGHT_NIGHT_INTENSITY;
    }
    if (this.lensFlare) this.lensFlare.setColorScale([
      p.flareColorScale[0] * dayW,
      p.flareColorScale[1] * dayW,
      p.flareColorScale[2] * dayW,
    ]);

    const moonProg = this.moonThreat?.progress ?? 0;
    const rainW = this.dayNightCycle.getRainWeight(moonProg);
    const rainDampen = 1 - rainW;
    this.audioManager.setLoopVolume(RAIN_LOOP_NAME, rainW * RAIN_LOOP_MAX_VOL);
    this.audioManager.setLoopVolume("crickets_loop", nightW * CRICKETS_LOOP_MAX_VOL * rainDampen);
    this.audioManager.setLoopVolume(BIRDS_LOOP_NAME, dayW * BIRDS_LOOP_MAX_VOL * rainDampen);

    let rumbleVol = 0;
    if (moonProg >= 0.75 && !this.moonThreat?.hasImpacted) {
      const t = Math.min(1, (moonProg - 0.75) / 0.25);
      const eased = t * t * (3 - 2 * t);
      rumbleVol = eased * RUMBLE_MAX_VOL;
    }
    this.audioManager.setLoopVolume(RUMBLE_LOOP_NAME, rumbleVol);

    const mw = this.dayNightCycle.getMusicWeights();
    const endTimesBlend = moonProg >= 0.65
      ? Math.min(1, (moonProg - 0.65) / 0.15)
      : 0;
    this.audioManager.setEndTimesWeight(endTimesBlend);
    this.audioManager.setWeights(mw.day, mw.evening, mw.night);
  }

  private playLevelUpSfx() {
    const pick =
      LEVELUP_SFX_IDS[Math.floor(Math.random() * LEVELUP_SFX_IDS.length)]!;
    this.audioManager.playSFX(pick, LEVELUP_SFX_VOLUME, 1, 0.2);
  }

  private restoreMoonstoneUnionFromSave() {
    if (this.globe.isMoonstonePostUnionActive()) return;
    const count = this.globe.getMoonstoneCount();
    if (count < 2) return;

    const n0 = new Vector3();
    const n1 = new Vector3();
    if (!this.globe.readMoonstoneNormal(0, n0) || !this.globe.readMoonstoneNormal(1, n1)) return;

    const midNormal = n0.add(n1);
    if (midNormal.lengthSq() < 1e-6) return;
    midNormal.normalize();

    const globeR = this.worldConfig?.globeRadius ?? 5;
    const unionPoint = new Vector3()
      .copy(midNormal)
      .multiplyScalar(globeR * (1.0 + Game.MOONSTONE_UNION_ALTITUDE_FRAC));

    const worldUp = new Vector3(0, 1, 0);
    if (Math.abs(worldUp.dot(midNormal)) > 0.9) worldUp.set(1, 0, 0);
    const camRight = new Vector3().copy(midNormal).cross(worldUp).normalize();
    const xAx = new Vector3().copy(camRight);
    const yAx = new Vector3().copy(midNormal);
    xAx.addScaledVector(yAx, -xAx.dot(yAx)).normalize();
    const zAx = new Vector3().crossVectors(xAx, yAx).normalize();
    const basis = new Matrix4().makeBasis(xAx, yAx, zAx);
    const sharedTarget = new Quaternion().setFromRotationMatrix(basis);
    const quats = Array.from({ length: count }, () => sharedTarget.clone());

    this.globe.activateMoonstonePostUnion(unionPoint, midNormal, quats);
  }

  private restorePlayerWorldState() {
    const saved = ProgressionManager.loadPlayerWorldState();
    if (saved.moonstoneUnionComplete) {
      this.restoreMoonstoneUnionFromSave();
    }

    const savedBurnEndsAtMs = Array.from({ length: BRAZIER_COUNT }, (_unused, i) => {
      const end = saved.brazierBurnEndsAtMs?.[i];
      return typeof end === "number" && Number.isFinite(end) ? end : null;
    });
    const savedEternal = Array.from({ length: BRAZIER_COUNT }, (_u, i) =>
      !!(saved.brazierEternal?.[i]),
    );
    const brazierState: SavedBrazierState = {
      revealed:
        !!saved.braziersRevealed ||
        !!saved.moonstoneUnionComplete ||
        savedBurnEndsAtMs.some((end) => end != null) ||
        savedEternal.some((e) => e),
      burnEndsAtMs: savedBurnEndsAtMs,
      burnEternal: savedEternal,
    };
    this.braziers?.restorePersistentState(brazierState);
    this.showedBrazierFizzleHint = !!saved.brazierFizzleHintShown;
    if (this.braziers) {
      this.lastBrazierProgress = this.braziers.getBurnProgressSnapshot();
      this.hud.updateBrazierStatus(this.lastBrazierProgress);
      this.prevAllFiveBraziers =
        this.lastBrazierProgress.length >= BRAZIER_COUNT &&
        this.lastBrazierProgress.every((p) => p > 0);
    }
    if (saved.moonFrozenByEternalFlames && this.moonThreat) {
      this.moonThreat.freezeApproachForever(saved.moonFrozenElapsedSec);
    }
  }

  private savePlayerWorldState(overrides: Partial<SavedPlayerWorldState> = {}) {
    const prev = ProgressionManager.loadPlayerWorldState();
    const brazierState = this.braziers?.capturePersistentState();
    const next: SavedPlayerWorldState = {
      moonstoneUnionComplete: this.globe.isMoonstonePostUnionActive() || !!prev.moonstoneUnionComplete,
      braziersRevealed: brazierState?.revealed ?? prev.braziersRevealed ?? false,
      brazierBurnEndsAtMs:
        brazierState?.burnEndsAtMs ??
        prev.brazierBurnEndsAtMs ??
        Array.from({ length: BRAZIER_COUNT }, () => null),
      brazierEternal:
        brazierState?.burnEternal ??
        prev.brazierEternal ??
        Array.from({ length: BRAZIER_COUNT }, () => false),
      brazierFizzleHintShown: this.showedBrazierFizzleHint || !!prev.brazierFizzleHintShown,
      eternalFlameCount: prev.eternalFlameCount ?? 0,
      gremlinKingEternalFlameClaimed: !!prev.gremlinKingEternalFlameClaimed,
      jellyfishSetEternalFlameClaimed: !!prev.jellyfishSetEternalFlameClaimed,
      packageThirdDeliveryEternalFlameClaimed: !!prev.packageThirdDeliveryEternalFlameClaimed,
      boatMysteryOctopusEternalFlameClaimed: !!prev.boatMysteryOctopusEternalFlameClaimed,
      raceEternalFlameClaimed: !!prev.raceEternalFlameClaimed,
      moonFrozenByEternalFlames:
        overrides.moonFrozenByEternalFlames ?? prev.moonFrozenByEternalFlames ?? false,
      moonFrozenElapsedSec: overrides.moonFrozenElapsedSec ?? prev.moonFrozenElapsedSec,
      completedMoonApproachRunCount:
        overrides.completedMoonApproachRunCount ?? prev.completedMoonApproachRunCount ?? 0,
      voidPortalsClosed: overrides.voidPortalsClosed ?? prev.voidPortalsClosed,
      freeplayModeUnlocked: overrides.freeplayModeUnlocked ?? prev.freeplayModeUnlocked,
      pendingFreeplayUnlockCelebration:
        overrides.pendingFreeplayUnlockCelebration ?? prev.pendingFreeplayUnlockCelebration,
      freeplayUnlockModalAcked: overrides.freeplayUnlockModalAcked ?? prev.freeplayUnlockModalAcked,
      freeplayLobbyToggle: overrides.freeplayLobbyToggle ?? prev.freeplayLobbyToggle,
      vehicleTutorialsCompleted:
        overrides.vehicleTutorialsCompleted ?? prev.vehicleTutorialsCompleted,
      ...overrides,
    };
    next.pendingEternalVictoryCelebration =
      overrides.pendingEternalVictoryCelebration ?? prev.pendingEternalVictoryCelebration ?? false;
    next.brazierBurnEndsAtMs = Array.from({ length: BRAZIER_COUNT }, (_unused, i) => {
      const end = next.brazierBurnEndsAtMs?.[i];
      return typeof end === "number" && Number.isFinite(end) ? end : null;
    });
    next.brazierEternal = Array.from({ length: BRAZIER_COUNT }, (_unused, i) =>
      !!(next.brazierEternal?.[i]),
    );
    if (next.moonstoneUnionComplete) next.braziersRevealed = true;
    ProgressionManager.savePlayerWorldState(next);
  }

  /**
   * Posts to the main-menu “saved [world]” feed only when this player has permanently
   * stopped the moon (all five braziers lit with eternal flame). Throttled to limit abuse.
   */
  private maybeReportSaveFeed() {
    if (!this.worldSlug || !this.worldConfig?.name) return;
    const ws = ProgressionManager.loadPlayerWorldState();
    if (!ws.moonFrozenByEternalFlames) return;
    const eternal = ws.brazierEternal;
    if (!eternal || eternal.length < BRAZIER_COUNT) return;
    for (let i = 0; i < BRAZIER_COUNT; i++) {
      if (!eternal[i]) return;
    }
    const now = Date.now();
    const last = this.lastSaveFeedAtBySlug.get(this.worldSlug) ?? 0;
    if (now - last < SAVE_FEED_MIN_INTERVAL_MS) return;
    this.lastSaveFeedAtBySlug.set(this.worldSlug, now);
    const name = (this.playerName || "Pilot").trim() || "Pilot";
    const worldName = this.worldConfig.name;
    void fetch(`${this.getServerUrl()}/api/save-feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: name.slice(0, 48),
        worldName: worldName.slice(0, 80),
        worldSlug: this.worldSlug.slice(0, 32),
      }),
    }).catch(() => {});
  }

  private runDurationSec(): number {
    if (this.gameSessionStartedAtMs <= 0) return 0;
    return Math.max(0, Math.round((Date.now() - this.gameSessionStartedAtMs) / 1000));
  }

  private sessionDeltaSinceLastHeartbeatSec(now = Date.now()): number {
    if (this.gameSessionLastHeartbeatAtMs <= 0) return this.runDurationSec();
    return Math.max(0, Math.round((now - this.gameSessionLastHeartbeatAtMs) / 1000));
  }

  private startSessionHeartbeat() {
    this.stopSessionHeartbeat();
    this.gameSessionHeartbeatTimer = setInterval(() => {
      this.reportSessionHeartbeat();
    }, SESSION_HEARTBEAT_MS);
  }

  private stopSessionHeartbeat() {
    if (this.gameSessionHeartbeatTimer != null) {
      clearInterval(this.gameSessionHeartbeatTimer);
      this.gameSessionHeartbeatTimer = null;
    }
  }

  private reportGameEvent(
    type: "world_saved" | "quest_completed" | "session_heartbeat" | "session_ended" | "flag_event",
    metadata: Record<string, unknown> = {},
    overrides?: { runDurationSec?: number; level?: number },
  ) {
    if (!this.worldSlug || !this.worldConfig?.name) return;
    const name = (this.playerName || "Pilot").trim() || "Pilot";
    const body = {
      type,
      playerName: name.slice(0, 48),
      worldName: this.worldConfig.name.slice(0, 80),
      worldSlug: this.worldSlug.slice(0, 32),
      vehicle: this.playerVehicle,
      level: overrides?.level ?? this.progression?.getLevel?.(),
      runDurationSec: overrides?.runDurationSec ?? this.runDurationSec(),
      metadata,
    };
    void fetch(`${this.getServerUrl()}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  private reportQuestCompleted(questType: string, metadata: Record<string, unknown> = {}) {
    this.reportGameEvent("quest_completed", { questType, ...metadata });
  }

  private reportWorldSaved(milestone: string, metadata: Record<string, unknown> = {}) {
    this.reportGameEvent("world_saved", { milestone, ...metadata });
  }

  private reportSessionHeartbeat() {
    if (this.gameSessionEndReported || this.gameSessionStartedAtMs <= 0) return;
    const now = Date.now();
    const deltaSec = this.sessionDeltaSinceLastHeartbeatSec(now);
    if (deltaSec <= 0) return;
    this.gameSessionLastHeartbeatAtMs = now;
    this.reportGameEvent(
      "session_heartbeat",
      {
        sessionId: this.gameSessionId,
        totalDurationSec: this.runDurationSec(),
      },
      { runDurationSec: deltaSec },
    );
  }

  private reportSessionEnded(reason: string) {
    if (this.gameSessionEndReported || this.gameSessionStartedAtMs <= 0) return;
    this.gameSessionEndReported = true;
    this.stopSessionHeartbeat();
    const now = Date.now();
    const deltaSec = this.sessionDeltaSinceLastHeartbeatSec(now);
    this.gameSessionLastHeartbeatAtMs = now;
    const currentXp = this.progression?.getXP?.() ?? this.gameSessionStartXp;
    const currentLevel = this.progression?.getLevel?.() ?? this.gameSessionStartLevel;
    this.reportGameEvent(
      "session_ended",
      {
        sessionId: this.gameSessionId,
        reason,
        startLevel: this.gameSessionStartLevel,
        endLevel: currentLevel,
        xpGained: Math.max(0, currentXp - this.gameSessionStartXp),
        totalDurationSec: this.runDurationSec(),
      },
      { level: currentLevel, runDurationSec: deltaSec },
    );
  }

  /** Places braziers in the world if they have not been created yet. */
  private ensureBraziersSpawned() {
    if (this.braziers) return;
    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    const seed = this.gameSeed;
    const terrainType = this.gameTerrainType;
    this.braziers = new Braziers(this.scene, globeRadius, seed, terrainType);
    this.hud.initBrazierTracker(BRAZIER_COUNT);
    this.brazierInRange = new Array(BRAZIER_COUNT).fill(false);
    this.brazierCooldown = new Array(BRAZIER_COUNT).fill(0);
    this.lastBrazierProgress = new Array(BRAZIER_COUNT).fill(0);
    this.showedBrazierFizzleHint = false;
    this.prevAllFiveBraziers = false;
  }

  private handleLevelUp(level: number) {
    this.companion?.setRetained("game.player.level", { level });
    this.companion?.emitMoment("game.event.level_up", { level }, { salience: 0.6 });
    this.playLevelUpSfx();
    this.ensureBraziersSpawned();
    this.hud.showLevelUp(level);

    const cards = this.progression.upgrades.drawCards(3);
    if (cards.length === 0) return;

    this.choosingLevelUpUpgrade = true;
    this.controls.enabled = false;
    if (this.touchControls) this.touchControls.enabled = false;

    setTimeout(() => {
      if (this.gamePhase !== "flying") {
        this.choosingLevelUpUpgrade = false;
        this.controls.enabled = true;
        if (this.touchControls) this.touchControls.enabled = true;
        return;
      }
      this.levelUpCards.show(cards, (id) => {
        this.progression.upgrades.apply(id);
        this.propagateUpgrades();
        this.progression.save();
        this.choosingLevelUpUpgrade = false;
        this.controls.enabled = true;
        if (this.touchControls) this.touchControls.enabled = true;
      });
    }, 450);
  }

  /**
   * Single XP chokepoint so per-source modifiers (Selfie XP, Delivery XP) stay consistent.
   *
   * Diamonds already have their per-source multipliers applied inside
   * RingManager (diamondXpMult, wake_rider highSpeedMult).
   */
  private updateOceanFish(dt: number, allowCapture: boolean) {
    if (!this.oceanFish || !(this.localPlayer instanceof Boat)) return;
    this.cameraRig.camera.getWorldPosition(this.fishCamScratch);
    this.oceanFish.update(
      dt,
      this.localPlayer.qPosition,
      this.localPlayer.group.matrixWorld,
      this.localPlayerWorldScratch.setFromMatrixPosition(this.localPlayer.group.matrixWorld),
      this.fishCamScratch,
      this.localPlayer.heading,
      this.dayNightCycle.getDayWeight(),
      this.dayNightCycle.getNightWeight(),
      allowCapture,
    );
  }

  /**
   * Carpet-only moonstone ritual: entering range of an idle ruin starts a local-only
   * lift cycle on this client. The returned 0..1 value drives the reused HUD ring
   * while the nearest nearby ruin is in its 5-second raise phase.
   */
  private updateMoonstoneRuins(playerWorldPos: Vector3, allowInteraction: boolean): number {
    if (!(this.localPlayer instanceof Carpet)) return 0;

    const now = Date.now();
    if (allowInteraction) {
      const idx = this.globe.findNearestActivatableMoonstone(playerWorldPos, MOONSTONE_ACTIVATE_DIST, now);
      if (idx >= 0) {
        this.globe.startMoonstoneRuinCycle(idx, now);
      }
    }

    return this.globe.getNearbyMoonstoneRaiseProgress(playerWorldPos, MOONSTONE_ACTIVATE_DIST, now);
  }

  private awardXP(source: XpSource, base: number) {
    if (base <= 0) return;
    const s = this.progression.upgrades.state;
    let amt = base;
    switch (source) {
      case "delivery":
        amt *= s.deliveryXpMult;
        break;
      case "selfie":
        amt *= s.carpetSelfieXpMult;
        break;
      case "fish":
        amt *= s.fishXpMult;
        break;
      default:
        break;
    }
    const rounded = Math.max(0, Math.round(amt));
    if (rounded <= 0) return;
    this.hud.showXPGain(rounded);
    // Tell the companion about the cozy, infrequent collectibles (skip the
    // high-frequency diamond/gremlin stream so we don't spam its budget).
    if (this.companion) {
      const note = COMPANION_XP_MOMENTS[source];
      if (note) this.companion.emitMoment(`game.event.${source}`, { what: note, xp: rounded }, { salience: 0.4 });
    }
    this.progression.addXP(rounded);
  }

  private propagateUpgrades() {
    const s = this.progression.upgrades.state;

    if (this.localPlayer instanceof Plane) {
      const plane = this.localPlayer;
      const oldMaxHp = plane.getGremlinMaxHp();
      Object.assign(plane.upgrades, {
        maxSpeedMult: s.maxSpeedMult,
        boostSpeedMult: s.boostSpeedMult,
        boostDurationMult: s.boostDurationMult,
        altSpeedMult: s.altSpeedMult,
        bankMult: s.bankMult,
        brakeDecelMult: s.brakeDecelMult,
        gremlinHpMaxMult: s.planeGremlinHpMaxMult,
      });
      plane.reconcileGremlinMaxHpChange(oldMaxHp);
    } else if (this.localPlayer instanceof Carpet) {
      Object.assign(this.localPlayer.upgrades, {
        maxSpeedMult: s.carpetSpeedMult,
        boostSpeedMult: s.carpetBoostSpeedMult,
        boostDurationMult: s.carpetBoostDurationMult,
        bankMult: s.carpetBankMult,
      });
    } else if (this.localPlayer instanceof Boat) {
      Object.assign(this.localPlayer.upgrades, {
        maxSpeedMult: s.boatSpeedMult,
        turnMult: s.boatTurnMult,
        accelMult: s.boatAccelMult,
        boostSpeedMult: s.boostSpeedMult,
        boostDurationMult: s.boostDurationMult,
      });
    }

    this.ringManager.upgrades.diamondXpMult = s.diamondXpMult;

    if (this.gremlinHearts) {
      this.gremlinHearts.setHeartHealMult(s.heartHealMult);
    }

    if (this.carpetPortalSystem) {
      this.carpetPortalSystem.upgrades.triggerRadiusMult = s.carpetPortalRadiusMult;
    }

    if (this.paintballSystem) {
      this.paintballSystem.setLocalPaintballMultipliers(
        s.paintballSpeedMult,
        s.paintballRangeMult,
      );
      this.paintballSystem.setLocalDoubleTap(s.paintballDoubleTapEnabled);
      this.socketClient?.emitPaintballSetUpgrades({
        doubleTap: s.paintballDoubleTapEnabled,
        speedMult: s.paintballSpeedMult,
        rangeMult: s.paintballRangeMult,
      });
    }

    if (this.oceanFish && this.localPlayer instanceof Boat) {
      this.oceanFish.setTuningFromUpgrades(s);
    }

    this.spawnExtraCollectibles(s);
  }

  private spawnExtraCollectibles(s: import("./UpgradeManager").UpgradeState) {
    const globeRadius = this.worldConfig?.globeRadius ?? 5;
    const seed = this.gameSeed;

    // Diamond Magnet
    const diamondDelta = s.diamondCountBonus - this.prevDiamondCountBonus;
    if (diamondDelta > 0) {
      this.ringManager.spawnBonusDiamonds(diamondDelta);
      this.prevDiamondCountBonus = s.diamondCountBonus;
    }

    const heartDelta = s.worldHeartCountBonus - this.prevWorldHeartCountBonus;
    if (heartDelta > 0 && this.gremlinHearts) {
      this.gremlinHearts.addBonusHearts(heartDelta);
      this.prevWorldHeartCountBonus = s.worldHeartCountBonus;
    }

    // Rainbow Finder
    const rainbowDelta = s.extraRainbows - this.prevExtraRainbows;
    for (let i = 0; i < rainbowDelta; i++) {
      const idx = this.rainbowArches.length;
      const arch = new RainbowArch(this.scene, globeRadius, seed, idx);
      this.rainbowArches.push(arch);
    }
    this.prevExtraRainbows = s.extraRainbows;

    // Firefly Season
    const fireflyDelta = s.extraFireflies - this.prevExtraFireflies;
    for (let i = 0; i < fireflyDelta; i++) {
      const idx = this.fireflyClusters.length;
      const cluster = new FireflyCluster(this.scene, globeRadius, seed, this.gameTerrainType, idx);
      this.fireflyClusters.push(cluster);
    }
    this.prevExtraFireflies = s.extraFireflies;

    // Lantern Festival
    const lanternDelta = s.extraLanterns - this.prevExtraLanterns;
    for (let i = 0; i < lanternDelta; i++) {
      const idx = this.lanternClusters.length;
      const cluster = new FloatingLanterns(this.scene, globeRadius, seed, idx);
      this.lanternClusters.push(cluster);
    }
    this.prevExtraLanterns = s.extraLanterns;
  }

  private updateBalloonGreetings(dt: number, playerWorld: Vector3) {
    for (let i = 0; i < this.balloonGreetCooldown.length; i++) {
      this.balloonGreetCooldown[i] = Math.max(0, this.balloonGreetCooldown[i] - dt);
    }
    if (this.packageQuestHUD.isBubbleShowing) return;
    for (let i = 0; i < this.globe.balloonCount; i++) {
      if (!this.globe.getBalloonWorldPosition(i, this.balloonPosScratch)) continue;
      const dist = playerWorld.distanceTo(this.balloonPosScratch);
      if (dist < BALLOON_GREET_DIST) {
        if (!this.balloonInRange[i]) {
          if (this.balloonGreetCooldown[i] <= 0) {
            const moonProg = this.moonThreat?.progress ?? 0;
            const isDay = this.dayNightCycle.getDayWeight() > 0.5;
            const { npcName, line } = pickBalloonGreeting(
              this.gameSeed,
              i,
              this.balloonGreetSalt++,
              moonProg,
              isDay,
            );
            this.packageQuestHUD.showBubble(npcName, line);
            this.balloonGreetCooldown[i] = moonProg >= 0.75 ? 10 : BALLOON_GREET_COOLDOWN;
          }
          this.balloonInRange[i] = true;
        }
      } else if (dist > BALLOON_GREET_EXIT_DIST) {
        this.balloonInRange[i] = false;
      }
    }
  }

  private updateObservatoryGreetings(dt: number, playerWorld: Vector3) {
    for (let i = 0; i < this.observatoryCooldown.length; i++) {
      this.observatoryCooldown[i] = Math.max(0, this.observatoryCooldown[i] - dt);
    }
    if (this.packageQuestHUD.isBubbleShowing || this.packageQuestHUD.isWhisperShowing) return;
    for (let i = 0; i < this.observatoryWorldPositions.length; i++) {
      const dist = playerWorld.distanceTo(this.observatoryWorldPositions[i]);
      if (dist < OBSERVATORY_GREET_DIST) {
        if (!this.observatoryInRange[i]) {
          if (this.observatoryCooldown[i] <= 0) {
            const moonProg = this.moonThreat?.progress ?? 0;
            const { npcName, line } = pickObservatoryGreeting(i, moonProg);
            this.packageQuestHUD.showBubble(npcName, line);
            this.observatoryCooldown[i] = moonProg >= 0.75 ? 12 : OBSERVATORY_GREET_COOLDOWN;
          }
          this.observatoryInRange[i] = true;
        }
      } else if (dist > OBSERVATORY_GREET_EXIT_DIST) {
        this.observatoryInRange[i] = false;
      }
    }
  }

  private updateStonehengeWhispers(dt: number, playerWorld: Vector3) {
    for (let i = 0; i < this.stonehengeCooldown.length; i++) {
      this.stonehengeCooldown[i] = Math.max(0, this.stonehengeCooldown[i] - dt);
    }
    if (this.packageQuestHUD.isBubbleShowing || this.packageQuestHUD.isWhisperShowing) return;
    for (let i = 0; i < this.stonehengeWorldPositions.length; i++) {
      const dist = playerWorld.distanceTo(this.stonehengeWorldPositions[i]);
      if (dist < STONEHENGE_WHISPER_DIST) {
        if (!this.stonehengeInRange[i]) {
          if (this.stonehengeCooldown[i] <= 0) {
            const moonProg = this.moonThreat?.progress ?? 0;
            const whisper = pickStonehengeWhisper(moonProg);
            this.packageQuestHUD.showWhisper(whisper);
            this.stonehengeCooldown[i] = moonProg >= 0.75 ? 15 : STONEHENGE_WHISPER_COOLDOWN;
          }
          this.stonehengeInRange[i] = true;
        }
      } else if (dist > STONEHENGE_WHISPER_EXIT_DIST) {
        this.stonehengeInRange[i] = false;
      }
    }
  }

  private updateBrazierWhispers(dt: number, playerWorld: Vector3) {
    if (!this.braziers || !this.braziers.isRevealed()) return;
    for (let i = 0; i < this.brazierCooldown.length; i++) {
      this.brazierCooldown[i] = Math.max(0, this.brazierCooldown[i]! - dt);
    }
    if (this.packageQuestHUD.isBubbleShowing || this.packageQuestHUD.isWhisperShowing) return;

    const positions = this.braziers.worldPositions;
    const litCount  = this.lastBrazierProgress.filter(p => p > 0).length;

    for (let i = 0; i < positions.length; i++) {
      const dist = playerWorld.distanceTo(positions[i]!);
      if (dist < BRAZIER_WHISPER_DIST) {
        if (!this.brazierInRange[i]) {
          if (this.brazierCooldown[i]! <= 0) {
            const isLit  = (this.lastBrazierProgress[i] ?? 0) > 0;
            const ws = ProgressionManager.loadPlayerWorldState();
            const whisper = pickBrazierWhisper(isLit, litCount, {
              eternalFlameInInventory: (ws.eternalFlameCount ?? 0) > 0,
              allFiveEternalLit: this.braziers?.allFiveEternalAndLit() ?? false,
              moonFrozenForever: !!ws.moonFrozenByEternalFlames,
              gremlinKingDefeated: !!ws.gremlinKingEternalFlameClaimed,
            });
            this.packageQuestHUD.showWhisper(whisper);
            this.brazierCooldown[i] = BRAZIER_WHISPER_COOLDOWN;
          }
          this.brazierInRange[i] = true;
        }
      } else if (dist > BRAZIER_WHISPER_EXIT_DIST) {
        this.brazierInRange[i] = false;
      }
    }
  }

  private updateStonehengeFloat() {
    const moonProg = this.moonThreat?.progress ?? 0;
    // Ease in from 50 % → 65 % moon progress; stay at 1 thereafter.
    const t = Math.max(0, Math.min(1, (moonProg - 0.50) / 0.15));

    for (const group of this.globe.stonehengeGroups) {
      for (const child of group.children) {
        const ud = child.userData;
        if (!ud.isFloating) continue;
        const mesh = child as Mesh;
        if (t <= 0) {
          mesh.position.y = ud.baseY;
          mesh.rotation.x = 0;
          mesh.rotation.z = 0;
        } else {
          const bob = Math.sin(this.gameTime * ud.speed + ud.phase) * ud.amp * 0.35;
          mesh.position.y = ud.baseY + ud.amp * 3.0 * t + bob * t;
          mesh.rotation.x = ud.tiltX * t;
          mesh.rotation.z = ud.tiltZ * t;
        }
      }
    }
  }

  private getServerUrl(): string {
    return this.serverUrlCache ?? "http://localhost:3001";
  }

  /* ── Cleanup ─────────────────────────────────────────────────────── */

  dispose() {
    this.clearTutorialSpotlight();
    this.container.removeEventListener("click", this.onUiClickSound);
    this.reportSessionEnded("dispose");
    this.running = false;
    this.previewActive = false;
    this.paintballSystem?.dispose();
    this.paintballSystem = null;
    this.skyGremlins?.dispose();
    this.skyGremlins = null;
    this.npcPaintballUnsub?.();
    this.npcPaintballUnsub = null;
    this.npcPlanes?.dispose();
    this.npcPlanes = null;
    this.npcBoats?.dispose();
    this.npcBoats = null;
    this.ghostPlanes?.dispose();
    this.ghostPlanes = null;
    this.hideGhostEncounterChip();
    if (this.gremlinHearts) {
      this.scene.remove(this.gremlinHearts.group);
      this.gremlinHearts.dispose();
      this.gremlinHearts = null;
    }
    this.lastGremlinHitSfxAt = 0;
    this.lastVoidMothHitSfxAt = 0;
    if (this.kingEternalFlameRewardTimeout != null) {
      clearTimeout(this.kingEternalFlameRewardTimeout);
      this.kingEternalFlameRewardTimeout = null;
    }
    if (this.jellyfishEternalFlameRewardTimeout != null) {
      clearTimeout(this.jellyfishEternalFlameRewardTimeout);
      this.jellyfishEternalFlameRewardTimeout = null;
    }
    if (this.packageThirdEternalFlameRewardTimeout != null) {
      clearTimeout(this.packageThirdEternalFlameRewardTimeout);
      this.packageThirdEternalFlameRewardTimeout = null;
    }
    if (this.boatOctopusEternalFlameRewardTimeout != null) {
      clearTimeout(this.boatOctopusEternalFlameRewardTimeout);
      this.boatOctopusEternalFlameRewardTimeout = null;
    }
    this.meteorShower?.dispose();
    this.meteorShower = null;
    this.waterSpouts?.dispose();
    this.waterSpouts = null;
    this.skyJellyfish?.dispose();
    this.skyJellyfish = null;
    this.jellyfishCaptureRing?.dispose();
    this.jellyfishCaptureRing = null;
    this.oceanFish?.dispose();
    this.oceanFish = null;
    this.controls?.dispose();
    this.touchControls?.dispose();
    this.speedLines?.dispose();
    this.contrails?.dispose();
    this.wakeTrail?.dispose();
    this.carpetTrail?.dispose();
    this.voidCarpetTrail?.dispose();
    this.voidCarpetTrail = null;
    this.carpetWake?.dispose();
    this.carpetLeaves?.dispose();
    this.carpetDriftSmoke?.dispose();
    if (this.carpetPortalSystem) {
      this.scene?.remove(this.carpetPortalSystem.group);
      this.carpetPortalSystem.dispose();
      this.carpetPortalSystem = null;
    }
    this.capybaraFlameShots?.dispose();
    this.capybaraFlameShots = null;
    for (const portal of this.cosmicWorldPortals) {
      this.scene?.remove(portal.group);
      portal.dispose();
    }
    this.cosmicWorldPortals = [];
    this.lensFlare?.dispose();
    this.rainOverlay?.dispose();
    this.starfield?.dispose();
    this.aurora?.dispose();
    this.ringManager?.dispose();
    this.raceManager?.dispose();
    this.raceManager = null;
    this.collectVFX?.dispose();
    this.removeVoidEternalFlame();
    this.localPlayer?.dispose();
    this.globe?.dispose();
    this.godRays?.dispose();
    this.renderer?.dispose();
    this.landmarkHUD?.dispose();
    this.packageQuest?.dispose();
    this.packageQuestHUD.dispose();
    this.carpetSelfiePhotoUI?.dispose();
    this.eternalFlameUI?.dispose();
    this.eternalFlameUI = null;
    this.debugMenu?.dispose();
    this.debugMenu = null;
    for (const f of this.birdFlocks) f.dispose();
    this.birdFlocks = [];
    for (const r of this.rainbowArches) r.dispose();
    this.rainbowArches = [];
    for (const l of this.lanternClusters) l.dispose();
    this.lanternClusters = [];
    for (const f of this.fireflyClusters) f.dispose();
    this.fireflyClusters = [];
    for (const v of this.volcanoes) v.dispose();
    this.volcanoes = [];
    this.campsiteMarker?.dispose();
    this.campsiteScene?.dispose();
    this.transitionOverlay?.dispose();
    this.flockFormationHUD?.dispose();
    this.remotePlayerNameLabels.dispose();
    this.friendBondFX?.dispose();
    this.friendBondFX = null;
    this.duo = null;
    this.removeDuoBar();
    this.endPairWait();
    this.flagSystem?.dispose();
    this.flagSystem = null;
    this.stateSync?.stop();
    this.socketClient?.disconnect();
    this.audioManager.dispose();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("resize", this.onPreviewResize);
    this.removeLoadingOverlay({ immediate: true });
  }
}
