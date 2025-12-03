export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec2 aTextureCoord;

uniform vec2 uMousePos;
uniform vec2 uResolution;

// Dynamic uniforms replacing consts
uniform float uMasterGain;
uniform float uKnobTrack;
uniform float uKnobGain;
uniform float uKnobGeoMult;
uniform float uKnobCoverBase;

out vec2 vTextureCoord;
out vec2 vMouseDelta;
out float vDepth;
out float vStrength;

void main() {
  vTextureCoord = aTextureCoord;

  // -----------------------------
  // Mouse -> UV (robust)
  // -----------------------------
  vec2 safeRes = max(uResolution, vec2(1.0));
  
  // Normalize mouse to 0..1
  vec2 mouseUV = uMousePos / safeRes;
  mouseUV = clamp(mouseUV, 0.0, 1.0);
  
  // Calculate vector from mouse to current vertex UV
  vMouseDelta = aTextureCoord - mouseUV;

  // -----------------------------
  // Strength calculation
  // -----------------------------
  float baseStrength = (0.08 + 0.72 * clamp(uKnobTrack, 0.0, 1.0))
                     * max(uKnobGain, 1.0);

  vStrength = baseStrength * uMasterGain;

  // -----------------------------
  // Geometry offset (Mesh Tilt)
  // -----------------------------
  // We tilt the mesh slightly based on mouse position to enhance the 3D effect
  vDepth = 1.0;
  vec2 mO = vMouseDelta * vStrength * uKnobGeoMult * vDepth;

  // Scale the mesh slightly up to avoid edge gaps when tilting
  float cover = uKnobCoverBase + 0.01 * vStrength;
  vec2 scaledXY = aVertexPosition.xy * cover;

  gl_Position = vec4(vec3(scaledXY + mO, 0.0), 1.0);
}`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 vTextureCoord;
in vec2 vMouseDelta;
in float vDepth;
in float vStrength;

uniform sampler2D uTexture;        // base image
uniform sampler2D uCustomTexture;  // depth map
uniform vec2 uResolution;          // canvas size
uniform vec2 uImageResolution;     // image size for aspect ratio

// Dynamic uniforms
uniform float uKnobParallax;
uniform float uKnobDepthGam;

out vec4 fragColor;

vec2 clamp01(vec2 uv) {
  return clamp(uv, 0.0, 1.0);
}

float remapDepth(float x) {
  // Increase contrast of depth map
  float d = pow(clamp(x, 0.0, 1.0), uKnobDepthGam);
  // Map [0,1] -> [-1,1] so mid-grey is neutral (no parallax shift)
  return (d - 0.5) * 2.0;
}

void main() {
  // -----------------------------
  // Object-Fit: Cover Logic
  // -----------------------------
  float screenAspect = uResolution.x / uResolution.y;
  float imageAspect = uImageResolution.x / uImageResolution.y;
  
  // To cover the screen:
  // If screen is wider than image (screenAspect > imageAspect), we match width and crop height.
  // If screen is taller than image (screenAspect < imageAspect), we match height and crop width.
  
  float ratio = screenAspect / imageAspect;
  
  vec2 uvScale;
  if (ratio > 1.0) {
      // Screen is wider. We use full Width (U). We scale V to crop top/bottom.
      // Scaling V by (1.0/ratio) reduces the range of V we see, effectively zooming in on V.
      uvScale = vec2(1.0, 1.0 / ratio);
  } else {
      // Screen is taller. We use full Height (V). We scale U to crop left/right.
      uvScale = vec2(ratio, 1.0);
  }
  
  // Center the UVs
  vec2 uvCover = (vTextureCoord - 0.5) * uvScale + 0.5;

  // -----------------------------
  // Parallax Logic
  // -----------------------------
  // Sample depth using the corrected UVs
  // We clamp here to ensure we don't sample outside valid texture area which might cause artifacts
  float rawDepth = texture(uCustomTexture, clamp01(uvCover)).r;
  float depth = remapDepth(rawDepth);

  // Aspect fix for parallax direction consistency
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 aspectFix = vec2(aspect, 1.0);
  
  float parallaxStrength = uKnobParallax * vStrength;

  // Calculate final UV offset
  vec2 uvOffset = vMouseDelta * aspectFix * parallaxStrength * depth;
  
  // Apply offset to the cover-adjusted UVs
  vec2 finalUV = clamp01(uvCover + uvOffset);

  fragColor = texture(uTexture, finalUV);
}`;