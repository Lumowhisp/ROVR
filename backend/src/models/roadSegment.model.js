import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  { _id: false }
);

const roadSegmentSchema = new mongoose.Schema(
  {
    segmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    areaKey: {
      type: String,
      required: true,
      index: true,
    },
    roadName: {
      type: String,
      default: "Unnamed Road",
    },
    roadType: {
      type: String,
      required: true,
      index: true,
    },
    osmTags: {
      type: Map,
      of: String,
      default: {},
    },
    lengthMeters: {
      type: Number,
      required: true,
      min: 0,
    },
    start: {
      type: pointSchema,
      required: true,
    },
    end: {
      type: pointSchema,
      required: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
        default: "LineString",
      },
      coordinates: {
        type: [[Number]],
        required: true,
      },
    },
    hasSidewalk: {
      type: Boolean,
      default: false,
    },
    hasCycleLane: {
      type: Boolean,
      default: false,
    },
    isServiceLane: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLit: {
      type: Boolean,
      default: false,
    },
    speedLimitKph: {
      type: Number,
      default: null,
    },
    traffic: {
      estimatedLevel: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      currentLevel: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      source: {
        type: String,
        default: "osm_road_type_estimate",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.45,
      },
      currentSpeedKph: {
        type: Number,
        default: null,
      },
      freeFlowSpeedKph: {
        type: Number,
        default: null,
      },
      roadClosure: {
        type: Boolean,
        default: false,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    source: {
      provider: {
        type: String,
        default: "openstreetmap",
      },
      osmWayId: {
        type: Number,
        required: true,
        index: true,
      },
      osmSegmentIndex: {
        type: Number,
        required: true,
      },
    },
    policeDistance: {
      type: Number,
      default: null,
    },
    hospitalDistance: {
      type: Number,
      default: null,
    },
    buildingDensity: {
      type: Number,
      default: null,
    },
    shopDensity: {
      type: Number,
      default: null,
    },
    transitDensity: {
      type: Number,
      default: null,
    },
    crossingDensity: {
      type: Number,
      default: null,
    },
    streetLightDensity: {
      type: Number,
      default: null,
    },
    incidentRisk: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    incidentCountNearby: {
      type: Number,
      default: 0,
    },
    nearestIncidentDistance: {
      type: Number,
      default: null,
    },
    safetyScore: {
      type: Number,
      default: null,
    },
    modeScores: {
      walking: {
        type: Number,
        default: null,
      },
      running: {
        type: Number,
        default: null,
      },
      cycling: {
        type: Number,
        default: null,
      },
    },
    popularityScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

roadSegmentSchema.index({ geometry: "2dsphere" });
roadSegmentSchema.index(
  { areaKey: 1, "source.osmWayId": 1, "source.osmSegmentIndex": 1 },
  { unique: true }
);

export const RoadSegment = mongoose.model("RoadSegment", roadSegmentSchema);
