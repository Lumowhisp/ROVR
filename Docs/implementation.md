# Safe Route --- Map Implementation

## 1. Goal

Build the first Safe Route map MVP using **TomTom Maps Web SDK inside a
WebView**, while keeping the surrounding app in Expo React Native.

The initial target is to make the map work in **Expo Go** without
requiring a native map SDK.

## 2. MVP Architecture

``` text
Expo React Native
        |
        v
react-native-webview
        |
        v
TomTom Maps Web SDK
        |
        +---- Map display
        +---- Markers
        +---- Route polyline
        +---- Walking-path polyline
        +---- Polygon / area coverage
        +---- Safety overlays
```

`react-native-webview` is currently included in Expo Go, so this
approach is suitable for the early development stage. [Expo WebView
documentation](https://docs.expo.dev/versions/latest/sdk/webview/)

## 3. Technology Stack

### Mobile

-   Expo
-   React Native
-   Expo Router, if already used by the project
-   `react-native-webview`
-   `expo-location` for GPS/location access

### Map

-   TomTom Maps SDK for JavaScript
-   TomTom Routing APIs
-   TomTom traffic/incident APIs where required

### Backend

-   Node.js / Express
-   MongoDB
-   Existing Safe Route backend

### Data

-   User GPS coordinates
-   Road segments
-   Safety scores
-   Manually preferred routes
-   Area coverage
-   Incidents / safety points

## 4. Installation

Install WebView through Expo:

``` bash
npx expo install react-native-webview
```

Then verify:

``` bash
npx expo start
```

Open the application in Expo Go.

Do not introduce a native TomTom map SDK at the MVP stage.

## 5. Map WebView

Create a dedicated component:

``` text
components/
└── map/
    ├── TomTomMap.tsx
    ├── map.html
    └── mapBridge.ts
```

`TomTomMap.tsx` owns the React Native WebView.

`map.html` contains the TomTom JavaScript map.

`mapBridge.ts` handles communication between React Native and the map.

## 6. Communication Between RN and TomTom

React Native and the WebView should communicate through messages.

### React Native → Map

Use this for:

-   Center map
-   Add marker
-   Draw walking path
-   Draw route
-   Draw polygon
-   Update safety layer
-   Clear overlays

Example message:

``` js
{
  type: "DRAW_WALKING_PATH",
  coordinates: [
    [28.4595, 77.5020],
    [28.4597, 77.5024],
    [28.4600, 77.5028]
  ]
}
```

### Map → React Native

Use this for:

-   Map ready
-   Marker selected
-   Route selected
-   Map error
-   User interaction events

Example:

``` js
{
  type: "MAP_READY"
}
```

## 7. GPS Walking Tracking

For the MVP, collect the user's current location using Expo Location.

Conceptually:

``` text
GPS
 |
 +-- latitude
 +-- longitude
 +-- timestamp
 |
 v
React Native
 |
 v
Walking coordinates[]
 |
 v
WebView
 |
 v
TomTom Polyline
```

Store coordinates as:

``` js
[
  { latitude: 28.4595, longitude: 77.5020 },
  { latitude: 28.4597, longitude: 77.5024 },
  { latitude: 28.4600, longitude: 77.5028 }
]
```

Initially, use foreground location tracking.

Background tracking should be added later with a development build when
required.

## 8. Walking Polyline

Every new GPS coordinate should be appended to the current path.

``` text
P1 → P2 → P3 → P4 → P5
```

The map receives the complete coordinate sequence and renders a
polyline.

Requirements:

-   Do not create a new map instance for every GPS update.
-   Keep one map instance alive.
-   Update the existing polyline when possible.
-   Filter obviously bad GPS points.
-   Store timestamps with coordinates.
-   Avoid excessive updates; use a sensible distance/time threshold.

## 9. Route Polyline

When the user requests a route:

``` text
User
 |
 v
Origin + Destination
 |
 v
TomTom Routing API
 |
 v
Route geometry
 |
 v
React Native
 |
 v
TomTom Web Map
```

The selected route is displayed separately from the user's actual
walking path.

We should maintain two different concepts:

``` text
recommendedRoute[]
actualWalkingPath[]
```

This allows us to compare:

-   Recommended route
-   Actual route
-   Deviations
-   Areas covered

## 10. Area Coverage

For campus/local-area coverage, divide the target area into logical
cells or use actual geographic polygons.

Example:

``` text
+-----+-----+-----+
| A1  | A2  | A3  |
+-----+-----+-----+
| B1  | B2  | B3  |
+-----+-----+-----+
| C1  | C2  | C3  |
+-----+-----+-----+
```

When the user's GPS path enters a cell:

``` text
cell.covered = true
```

The map then renders that cell as a covered polygon.

For a more accurate version later:

``` text
GPS path
   |
   v
Point-in-polygon / road-segment matching
   |
   v
Covered geographic area
```

## 11. Road Segment Model

The long-term Safe Route model should not depend entirely on map
rendering.

Create our own road-segment data model:

``` js
{
  segmentId: "SEG_001",
  coordinates: [...],
  safetyScore: 82,
  usageScore: 76,
  incidentScore: 15,
  manualPreference: 90
}
```

TomTom provides the geographic map layer.

Our backend owns:

-   Safety score
-   Usage
-   Incidents
-   Manual route preference
-   Coverage
-   Other project-specific features

## 12. Safety Visualization

Eventually the map can contain:

``` text
TomTom Base Map
      +
Road Segments
      +
Safety Score
      +
User Walking Path
      +
Recommended Route
      +
Area Coverage
```

Example conceptual scoring:

``` text
Road Segment
-------------------------
Usage          30%
Incidents      25%
Lighting       15%
Manual Usage   15%
Coverage       15%
-------------------------
Safety Score   100
```

The exact scoring formula will be decided separately.

## 13. Data Flow

``` text
                    ┌───────────────┐
                    │  User GPS     │
                    └───────┬───────┘
                            │
                            v
                    ┌───────────────┐
                    │ Expo Location │
                    └───────┬───────┘
                            │
                            v
                    ┌───────────────┐
                    │ React Native  │
                    └───────┬───────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                v           v           v
           Walking      Backend      Routing
            Path       Safety Data     API
                │           │           │
                └───────────┼───────────┘
                            v
                    ┌───────────────┐
                    │    WebView    │
                    │ TomTom Map    │
                    └───────────────┘
```

## 14. MVP Phases

### Phase 1 --- Map

-   [ ] Install WebView
-   [ ] Render TomTom map
-   [ ] Set initial location
-   [ ] Add zoom controls
-   [ ] Add current-location marker

### Phase 2 --- GPS

-   [ ] Request location permission
-   [ ] Read current location
-   [ ] Track foreground location
-   [ ] Show current position
-   [ ] Store GPS points

### Phase 3 --- Walking Path

-   [ ] Create coordinate array
-   [ ] Draw walking polyline
-   [ ] Update polyline while walking
-   [ ] Handle GPS noise
-   [ ] Save completed path

### Phase 4 --- Routing

-   [ ] Connect TomTom Routing API
-   [ ] Select origin/destination
-   [ ] Receive route geometry
-   [ ] Display route polyline
-   [ ] Compare route with actual walking path

### Phase 5 --- Coverage

-   [ ] Define target area
-   [ ] Create grid/polygon model
-   [ ] Detect visited cells
-   [ ] Render covered cells
-   [ ] Calculate coverage percentage

### Phase 6 --- Safe Route

-   [ ] Create road segments
-   [ ] Attach safety data
-   [ ] Calculate safety score
-   [ ] Rank possible routes
-   [ ] Display safest route
-   [ ] Add manually preferred routes

## 15. Expo Go vs Development Build

### Expo Go

Use Expo Go for:

-   Map rendering
-   WebView
-   Markers
-   Polylines
-   Polygons
-   Basic foreground location
-   UI development
-   API integration

### Development Build

Move to a development build when we need:

-   Background location tracking
-   Native modules not included in Expo Go
-   Production-like native configuration
-   Native map SDK experimentation

Expo documents that Expo Go can only use native libraries already
bundled into the Expo Go app. `react-native-webview` is one of the
supported libraries. [Expo development-build
FAQ](https://docs.expo.dev/develop/development-builds/faq/)

## 16. Important Design Decision

Do **not** tightly couple the safety algorithm to TomTom.

Use this separation:

``` text
              MAP LAYER
             TomTom SDK
                 |
                 |
        ---------------------
        |                   |
   Visualization       Geographic data
        |
        v
       SAFE ROUTE ENGINE
        |
        +-- Safety score
        +-- Usage
        +-- Incidents
        +-- Manual preference
        +-- Coverage
```

This means we can change the map provider later without rewriting the
core Safe Route algorithm.

## 17. First Deliverable

The first working milestone should be:

> **Open the Safe Route app in Expo Go → show TomTom map → show current
> location → start tracking → draw the user's walking path as a
> polyline.**

Do not implement the complete safety model yet.

Once this works reliably, add road segments and area coverage.

## 18. Future Migration

If the project grows beyond the MVP:

``` text
MVP
Expo Go
  +
WebView
  +
TomTom Web SDK

        ↓

Production development

Expo Development Build
  +
Native capabilities
  +
Improved location tracking
  +
Background tracking
```

The core Safe Route data model should remain independent of this
migration.
