import React, { useEffect, useRef } from 'react';
import { ShaderParams } from '../types';
import { createProgram, createTexture, createPlaceholderTexture } from '../services/webglService';
import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from '../shaders';

interface DepthPreviewProps {
  image: HTMLImageElement | null;
  depth: HTMLImageElement | null;
  params: ShaderParams;
}

export const DepthPreview: React.FC<DepthPreviewProps> = ({ image, depth, params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>(0);
  
  // Refs for WebGL context and resources to avoid re-creation
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<{ img: WebGLTexture | null; depth: WebGLTexture | null }>({ img: null, depth: null });
  
  // Mutable state for the render loop
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const paramsRef = useRef(params);
  const imageDimsRef = useRef({ width: 1, height: 1 });

  // Update refs when props change without triggering re-initialization
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (image) {
      imageDimsRef.current = { width: image.width, height: image.height };
    }
  }, [image]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.bottom - e.clientY; // Invert Y for WebGL (0 at bottom)
    mousePos.current = { x, y: rect.height - (e.clientY - rect.top) };
  };

  const handleMouseLeave = () => {
     if(canvasRef.current) {
         // Re-center mouse effect smoothly or snap to center
         mousePos.current = { 
             x: canvasRef.current.width / 2, 
             y: canvasRef.current.height / 2 
         };
     }
  };

  // 1. Initialize WebGL (Run once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }
    glRef.current = gl;

    const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) return;
    programRef.current = program;

    // Create Quad Geometry (Full clip space)
    const positions = new Float32Array([ -1, -1, 0,  1, -1, 0, -1,  1, 0,  1,  1, 0 ]);
    const texCoords = new Float32Array([ 0, 0, 1, 0, 0, 1, 1, 1 ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionLoc = gl.getAttribLocation(program, 'aVertexPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    const texCoordLoc = gl.getAttribLocation(program, 'aTextureCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Initial Mouse Center
    mousePos.current = { x: canvas.width / 2, y: canvas.height / 2 };

    // Initial placeholders
    texturesRef.current.img = createPlaceholderTexture(gl);
    texturesRef.current.depth = createPlaceholderTexture(gl);

    // Render Loop
    const render = () => {
      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const p = paramsRef.current;

      if (!gl || !program || !canvas || !container) return;

      // Handle Resize
      const displayWidth = container.clientWidth;
      const displayHeight = container.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Reset mouse to center on resize if not interacting
        if (mousePos.current.x === 0 && mousePos.current.y === 0) {
           mousePos.current = { x: displayWidth / 2, y: displayHeight / 2 };
        }
      }

      gl.clearColor(0.05, 0.05, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Bind Textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.img);
      gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.depth);
      gl.uniform1i(gl.getUniformLocation(program, 'uCustomTexture'), 1);

      // Uniforms - Standard
      gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(program, 'uMousePos'), mousePos.current.x, mousePos.current.y);
      gl.uniform2f(gl.getUniformLocation(program, 'uImageResolution'), imageDimsRef.current.width, imageDimsRef.current.height);

      // Uniforms - Knobs
      gl.uniform1f(gl.getUniformLocation(program, 'uMasterGain'), p.masterGain);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobTrack'), p.knobTrack);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobGain'), p.knobGain);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobGeoMult'), p.knobGeoMult);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobCoverBase'), p.knobCoverBase);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobParallax'), p.knobParallax);
      gl.uniform1f(gl.getUniformLocation(program, 'uKnobDepthGam'), p.knobDepthGam);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texCoordBuffer);
        gl.deleteVertexArray(vao);
        // Clean up textures
        if (texturesRef.current.img) gl.deleteTexture(texturesRef.current.img);
        if (texturesRef.current.depth) gl.deleteTexture(texturesRef.current.depth);
      }
    };
  }, []); // Run once on mount


  // 2. Handle Texture Updates (Only runs when image/depth assets change)
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    // Update Image Texture
    if (texturesRef.current.img) gl.deleteTexture(texturesRef.current.img);
    texturesRef.current.img = image ? createTexture(gl, image) : createPlaceholderTexture(gl);

    // Update Depth Texture
    if (texturesRef.current.depth) gl.deleteTexture(texturesRef.current.depth);
    texturesRef.current.depth = depth ? createTexture(gl, depth) : createPlaceholderTexture(gl);

  }, [image, depth]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-900 overflow-hidden">
        {!image && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* Overlay handled in App.tsx now */}
            </div>
        )}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};