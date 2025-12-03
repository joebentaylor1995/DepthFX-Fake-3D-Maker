export interface ShaderParams {
  masterGain: number;      // Master Gain
  knobTrack: number;       // Baseline Intensity
  knobGain: number;        // Overall Multiplier
  knobGeoMult: number;     // Tilt Amount
  knobCoverBase: number;   // Base Mesh Scale
  knobParallax: number;    // Parallax Amount
  knobDepthGam: number;    // Depth Contrast
}

export interface TextureState {
  image: HTMLImageElement | null;
  depth: HTMLImageElement | null;
}