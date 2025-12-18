# 3DBigDataSpace

Web application for exploring Europe's cultural heritage artifacts in immersive 3D with AR support.

![AR-Viewer Logo](static/logo-ar-viewer.svg)

## Features

- **3D Viewer**: Interactive Babylon.js-based viewer with annotations (IIIF 3D)
- **WebXR AR Support**: In-browser AR on Android Chrome with hit-testing and placement
- **Native AR Fallbacks**: iOS AR Quick Look (USDZ) and Android Scene Viewer (GLB)
- **Automatic Scaling**: Large objects (>2m) scaled to 2m max for practical AR viewing
- **Embeddable**: iframe integration for external websites
- **Zenodo Integration**: Cultural heritage data from zenodo.org
- **Docker Ready**: Production deployment with security hardening

---

## Quick Start

```bash
# Development
npm install
npm run dev

# Production
npm run build
node build

# Docker
docker-compose up -d
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run check` - Type checking
- `npm run format` - Format code

---

## AR Scaling

Large models (buildings, monuments) are automatically scaled for AR:
- **Max dimension**: 2 meters
- **Android**: Server-side GLB scaling via `/api/ar-glb`
- **iOS**: USDZ files (pre-scaled recommended)
- **Indicators**: "S" badge on AR buttons, scaling info in popover

Example: 50m × 30m × 20m building → 2.0m × 1.2m × 0.8m (4% scale)

---

## AR Viewer

```html
<iframe src="https://your-domain.org/embed?model=MODEL_URL"
        width="800" height="600"
        allow="xr-spatial-tracking; accelerometer; gyroscope"
        allowfullscreen></iframe>
```

**Parameters:**
- `model` (required): GLB URL from zenodo.org
- `usdz` (optional): USDZ file for iOS AR
- `annotations` (optional): IIIF annotations JSON

---

## API Endpoints

### `/api/ar-glb`
Scales GLB files for AR (max 2m). Returns scaled GLB with metadata headers.

**Query:** `?url=<zenodo-glb-url>&maxDimension=2.0`

**Response Headers:**
- `X-AR-Scale-Factor`: e.g., "0.040000"
- `X-AR-Was-Scaled`: "true"/"false"
- `X-AR-Original-Dimensions`: "50.000x30.000x20.000"
- `X-AR-Scaled-Dimensions`: "2.000x1.200x0.800"

### `/api/proxy`
CORS proxy for Zenodo resources (zenodo.org, iiif.zenodo.org).

**Query:** `?url=<zenodo-url>`

---

## Tech Stack

- **Frontend**: Svelte 5, SvelteKit 2, Tailwind CSS 4
- **3D**: Babylon.js 8 (with WebXR support), glTF Transform 4
- **Build**: Vite 7, TypeScript 5
- **Deploy**: Node.js, Docker

**Key Dependencies:**
- `@babylonjs/core` - 3D rendering and WebXR
- `@gltf-transform/*` - GLB processing
- `qrcode` - QR code generation

---

## Acknowledgments

Cultural heritage data from Zenodo. IIIF Presentation API for 3D annotations.



