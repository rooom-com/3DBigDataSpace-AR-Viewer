# 3DBigDataSpace

## Introduction

The 3DBigDataSpace project is an innovative web application that enables users to explore Europe's cultural heritage artifacts in immersive 3D. The platform provides an interactive way to discover, interact with, and appreciate cultural treasures through advanced 3D visualization technology.

![3DBigDataSpace Logo](static/logo-3dbigdataspace.svg)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Run type checking
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting
- `npm run deploy` - Quick deployment script (git add, commit, push)
- `npm run production` - Start production server

## Key Features

- **3D Artifact Viewer**: Interactive examination of cultural artifacts in 3D
- **Browsing and Discovery**: Search, filter, and paginate through the artifact collection
- **Detailed Record Information**: Comprehensive metadata for each cultural heritage item
- **Embeddable 3D Viewer**: Standalone viewer that can be embedded in external websites via iframe
- **AR Support**: Augmented Reality viewing on mobile devices (iOS and Android)
- **3D Annotations**: Interactive markers with descriptions on 3D models (IIIF 3D format)

## Zenodo Integration

The 3DBigDataSpace application leverages Zenodo (zenodo.org) as a primary data source for accessing cultural heritage records.

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn package manager

---

## Embeddable 3D Viewer

The platform includes an embeddable 3D viewer that can be integrated into external websites via iframe.

### Quick Start

```html
<iframe
    src="https://your-domain.org/embed?model=MODEL_URL"
    width="800"
    height="600"
    allow="xr-spatial-tracking; accelerometer; gyroscope"
    allowfullscreen
    style="border: none;"
></iframe>
```

### URL Parameters

| Parameter     | Required | Description                                             | Example                                             |
|---------------|----------|---------------------------------------------------------|-----------------------------------------------------|
| `model`       | Yes      | GLB model URL (must end with `.glb`)                    | `?model=https://zenodo.org/.../file.glb`            |
| `usdz`        | No       | USDZ file for iOS AR (must end with `.usdz`)            | `&usdz=https://example.com/file.usdz`               |
| `annotations` | No       | JSON file with IIIF annotations (must end with `.json`) | `&annotations=https://example.com/annotations.json` |

### Example URLs

**Basic:**
```
/embed?model=https://zenodo.org/api/files/8252aacd-bec1-41a4-b343-d70b83bf06b0/68d977cec19c423e869fa911f5ca1a2f.glb
```

**With Annotations:**
```
/embed?model=https://zenodo.org/api/files/8252aacd-bec1-41a4-b343-d70b83bf06b0/68d977cec19c423e869fa911f5ca1a2f.glb&annotations=https://your-domain.org/sample-annotations.json
```



