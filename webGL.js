var squareRotation = 0.0;

main();

function main() {
  const canvas = document.querySelector('#glCanvas');
  const gl = canvas.getContext('webgl');

  if (gl === null) {
    alert('What...no WebGL?? No canvas for you!');
  }
  
  // Vertex shader program
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying lowp vec4 vColor;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
  `;
  
  // Fragment shader program
  const fsSource = `
  varying lowp vec4 vColor;
  
  void main() {
    gl_FragColor = vColor;
  }
  `;
  
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  
  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using for
  // aVertexPosition, aVevrtexColor and also look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
  
  // Call the routine that builds all the objects we'll be drawing
  const buffers = initBuffers(gl);
  
  var then = 0;
  
  // draw the scene repeatedly
  function render(now) {
    now *= 0.001;   // convert to seconds
    const deltaTime = now - then;
    then = now;
    
    drawScene(gl, programInfo, buffers, deltaTime);
    
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function initBuffers(gl) {
  
  // position buffer
  const positions = [
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,
    1.0, -1.0
  ];
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(positions),
    gl.STATIC_DRAW);
  
  // color buffer
  const colors = [
    1.0, 1.0, 1.0, 1.0,     // white
    1.0, 0.0, 0.0, 1.0,     // red
    0.0, 1.0, 0.0, 1.0,     // green
    0.0, 0.0, 1.0, 1.0,     // blue
  ];
  
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(colors),
      gl.STATIC_DRAW);
  
  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  
  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
    
  mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);
  
  const modelViewMatrix = mat4.create();
  
  mat4.translate(modelViewMatrix, // destination matrix
    modelViewMatrix,              // matrix to translate
    [-0.0, 0.0, -6.0]);           // amount to translate
    
  mat4.rotate(modelViewMatrix,    // destination matrix
    modelViewMatrix,              // matrix to translate
    squareRotation,               // amount to rotate in radians
    [0, 0, 1]);                   // axis of rotation
  
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;    // pull out 2 values per iteration
    const type = gl.FLOAT;      // 32-bit floats
    const normalize = false;    // don't normalize
    const stride = 0;           // how many bytes to get from one set of balues to the next
                                // 0 = use type and numComponents above
    const offset = 0;           // how many bytes inside the buffer to start from
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }
  
  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;  // pull out 4 values per iteration
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
  }
  
  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  
  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
  
  // update rotation for next draw
  
  squareRotation += deltaTime;
  
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize shader program: ' + gl.getProgramInfoLof(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

