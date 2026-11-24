    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl', { antialias: true });

    // Vertex Shader: Transforms 3D vertices & smooth normals
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uProjection;
      uniform mat4 uModelView;
      uniform mat3 uNormalMatrix;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec4 mvPosition = uModelView * vec4(aPosition, 1.0);
        vPosition = mvPosition.xyz;
        vNormal = normalize(uNormalMatrix * aNormal);
        gl_Position = uProjection * mvPosition;
      }
    `;

    // Fragment Shader: Per-pixel smooth lighting, rim glow, and specular reflection
    const fsSource = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        // Iridescent Three.js Normal Base Color
        vec3 baseColor = N * 0.5 + 0.5;

        // Key Light (Top-Left-Front)
        vec3 L1 = normalize(vec3(-0.6, 0.8, 0.9));
        vec3 H1 = normalize(L1 + V);
        float diff1 = max(dot(N, L1), 0.0);
        float spec1 = pow(max(dot(N, H1), 0.0), 48.0);

        // Cool Rim / Back Light for 3D edge separation
        vec3 L2 = normalize(vec3(0.7, -0.5, -0.6));
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        vec3 ambient = baseColor * 0.25;
        vec3 diffuse = baseColor * diff1 * 0.85;
        vec3 specular = vec3(1.0, 0.98, 0.95) * spec1 * 0.65;
        vec3 rimLight = vec3(0.2, 0.7, 1.0) * rim * 0.45;

        gl_FragColor = vec4(ambient + diffuse + specular + rimLight, 1.0);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // High-Density Torus Knot with Analytical Smooth Normals
    function createSmoothTorusKnot(radius = 0.85, tube = 0.26, tubularSegments = 260, radialSegments = 48) {
      const positions = [];
      const normals = [];
      const indices = [];
      const p = 2, q = 3;

      function getCenter(t) {
        const r = Math.cos(q * t) + 2.0;
        return [
          radius * 0.5 * r * Math.cos(p * t),
          radius * 0.5 * r * Math.sin(p * t),
          -radius * 0.5 * Math.sin(q * t)
        ];
      }

      function norm(v) {
        const len = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / len, v[1] / len, v[2] / len];
      }

      function cross(a, b) {
        return [
          a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]
        ];
      }

      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * Math.PI * 2;
        const P1 = getCenter(u);
        const P2 = getCenter(u + 0.001);

        const T = norm([P2[0] - P1[0], P2[1] - P1[1], P2[2] - P1[2]]);
        const N = norm([P2[0] + P1[0], P2[1] + P1[1], P2[2] + P1[2]]);
        const B = norm(cross(T, N));
        const realN = cross(B, T);

        for (let j = 0; j <= radialSegments; j++) {
          const v = (j / radialSegments) * Math.PI * 2;
          const cosV = -Math.cos(v);
          const sinV = Math.sin(v);

          // Exact analytical surface normal (eliminates polygon edges)
          const nx = cosV * realN[0] + sinV * B[0];
          const ny = cosV * realN[1] + sinV * B[1];
          const nz = cosV * realN[2] + sinV * B[2];

          normals.push(nx, ny, nz);
          positions.push(
            P1[0] + tube * nx,
            P1[1] + tube * ny,
            P1[2] + tube * nz
          );
        }
      }

      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;
          indices.push(a, b, d, b, c, d);
        }
      }

      return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices)
      };
    }

    // Enable 32-bit indices for high-resolution smooth mesh
    gl.getExtension('OES_element_index_uint');
    const mesh = createSmoothTorusKnot();

    // Upload Geometry Buffers to GPU
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    const uProjection = gl.getUniformLocation(program, 'uProjection');
    const uModelView = gl.getUniformLocation(program, 'uModelView');
    const uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');

    // Matrix Math Helpers
    function perspective(fov, aspect, near, far) {
      const f = 1.0 / Math.tan(fov / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    }

    function getModelView(rx, ry, dist) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      return new Float32Array([
        cy, sx * sy, -cx * sy, 0,
        0, cx, sx, 0,
        sy, -sx * cy, cx * cy, 0,
        0, 0, -dist, 1
      ]);
    }

    function getNormalMat3(m) {
      return new Float32Array([
        m[0], m[1], m[2],
        m[4], m[5], m[6],
        m[8], m[9], m[10]
      ]);
    }

    // Interactive Camera State
    let camDist = 3.5;
    let rotX = -0.45;
    let rotY = 0.5;
    let dragging = false;
    let lastX = 0, lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.008;
      rotX += (e.clientY - lastY) * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => dragging = false);
    canvas.addEventListener('wheel', (e) => {
      camDist = Math.max(1.8, Math.min(8.0, camDist + e.deltaY * 0.003));
    });

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    function render() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (!dragging) {
        rotY += 0.007;
        rotX += 0.003;
      }

      const proj = perspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 100.0);
      const mv = getModelView(rotX, rotY, camDist);
      const normMat = getNormalMat3(mv);

      gl.uniformMatrix4fv(uProjection, false, proj);
      gl.uniformMatrix4fv(uModelView, false, mv);
      gl.uniformMatrix3fv(uNormalMatrix, false, normMat);

      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
      requestAnimationFrame(render);
    }

    render();
