import { ShaderParams } from './types';

export const DEFAULT_PARAMS: ShaderParams = {
  masterGain: 2.490,
  knobTrack: 0.110,
  knobGain: 0.350,
  knobGeoMult: 0.047,
  knobCoverBase: 1.020,
  knobParallax: 0.057,
  knobDepthGam: 1.300,
};

// Map friendly names to the internal keys
export const PARAM_CONFIG = [
  { key: 'masterGain', label: 'Master Gain', min: 0.0, max: 5.0, step: 0.01 },
  { key: 'knobTrack', label: 'Baseline Intensity', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'knobGain', label: 'Overall Multiplier', min: 0.0, max: 3.0, step: 0.01 },
  { key: 'knobGeoMult', label: 'Tilt Amount', min: 0.0, max: 0.2, step: 0.001 },
  { key: 'knobCoverBase', label: 'Base Scale (Cover)', min: 1.0, max: 1.5, step: 0.01 },
  { key: 'knobParallax', label: 'Parallax Amount', min: 0.0, max: 0.2, step: 0.001 },
  { key: 'knobDepthGam', label: 'Depth Contrast (Gamma)', min: 0.1, max: 3.0, step: 0.01 },
];