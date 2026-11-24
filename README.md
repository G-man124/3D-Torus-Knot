#  3D-Torus-Knot

A smooth, hardware-accelerated 3D Torus Knot rendered from scratch using **Pure WebGL**—with zero external 3D libraries or frameworks.

---

## ✨ Features
* **Pure WebGL Rendering:** Built natively using raw WebGL shaders (GLSL) and matrix math—no Three.js or external dependencies.
* **Procedural Geometry:** Mathematically generates a smooth $(p, q)$-torus knot mesh with calculated surface normals for realistic shading.
* **60 FPS Animation:** Smooth, hardware-accelerated rotation and lighting right in the browser.
* **Zero Build Step:** Lightweight vanilla HTML, CSS, and JavaScript.

---

## 🚀 Getting Started

### Prerequisites
* A modern web browser with WebGL support (Chrome, Firefox, Edge, or Safari).
* *(Optional)* [Python 3](https://python.org) or any local web server.

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/G-man124/3D-Torus-Knot
   cd 3D-Torus-Knot
   ```

2. **Launch the project:**
   * **Option A (Direct):** Open `index.html` directly in your web browser.
   * **Option B (Local Server):** If using ES modules or external shader files, start a local server:
     ```bash
     python3 -m http.server
     ```
     Then navigate to [http://localhost:8000](http://localhost:8000).
---

## 🛠️ Built With
* **WebGL** (Custom Vertex & Fragment Shaders)
* **HTML5 Canvas**
* **Vanilla JavaScript**

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
