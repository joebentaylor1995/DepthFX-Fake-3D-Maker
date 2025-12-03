/**
 * Compiles a shader from source.
 */
export const compileShader = (
  gl: WebGL2RenderingContext,
  shaderSource: string,
  shaderType: number
): WebGLShader | null => {
  const shader = gl.createShader(shaderType);
  if (!shader) return null;

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

/**
 * Creates a WebGL program from vertex and fragment shader sources.
 */
export const createProgram = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null => {
  const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

/**
 * Creates a texture from an image element.
 */
export const createTexture = (
  gl: WebGL2RenderingContext,
  image: HTMLImageElement | null
): WebGLTexture | null => {
  if (!image) return null;
  
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Flip Y for WebGL texture coordinates so images aren't upside down
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Set parameters so we don't need mips and can handle non-power-of-2
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
};

/**
 * Creates a 1x1 white texture to serve as a placeholder
 */
export const createPlaceholderTexture = (gl: WebGL2RenderingContext): WebGLTexture | null => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // No need to flip for 1x1 pixel, but safe to keep consistent
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
  
  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, 
    gl.RGBA, 
    1, 
    1, 
    0, 
    gl.RGBA, 
    gl.UNSIGNED_BYTE, 
    new Uint8Array([50, 50, 55, 255]) // Dark gray placeholder
  );
  return texture;
}