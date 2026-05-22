# 🍅 Pomodoro Timer

Un **Pomodoro Timer** con diseño estilo Android / Material Design, construido con HTML, CSS y JavaScript puro. Compatible con **GitHub Pages**.

🔗 **Demo en vivo:** [https://aalexiscs.github.io/pomodoro-timer](https://aalexiscs.github.io/pomodoro-timer)

---

## ✨ Características

- 🎨 **Diseño Material Design** — Estilo Android con elevaciones, ripple effects y transiciones suaves
- 🌈 **Temas dinámicos** — Rojo (Pomodoro), Verde (Descanso corto), Azul (Descanso largo)
- 🌙 **Modo oscuro/claro** — Persistido en `localStorage`
- ⏱️ **Anillo de progreso SVG** — Animación circular fluida
- 🔊 **Sonidos Web Audio API** — Sin archivos externos
- 📊 **Estadísticas de sesión** — Contador de pomodoros y tiempo enfocado
- 🔴 **Puntos de progreso** — Visualización de avance hacia la meta (4 pomodoros)
- ⌨️ **Atajos de teclado** — Control rápido sin mouse
- 📱 **Responsive** — Funciona en móvil, tablet y escritorio
- 💾 **Persistencia de sesión** — Guarda el progreso al cambiar de pestaña

---

## 🎮 Modos

| Modo | Duración | Color |
|------|----------|-------|
| 🍅 Pomodoro | 25 minutos | Rojo |
| ☕ Descanso corto | 5 minutos | Verde |
| 🌙 Descanso largo | 15 minutos | Azul |

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play / Pause |
| `R` | Reiniciar timer |
| `1` | Modo Pomodoro |
| `2` | Modo Descanso corto |
| `3` | Modo Descanso largo |

---

## 🚀 Uso Local

```bash
# Clonar el repositorio
git clone https://github.com/aalexiscs/pomodoro-timer.git

# Abrir en el navegador
cd pomodoro-timer
# Abrir index.html directamente o usar un servidor local:
npx serve .
```

---

## 🌐 Despliegue en GitHub Pages

1. Ve a **Settings** → **Pages** en tu repositorio
2. En **Source**, selecciona la rama `main` y carpeta `/ (root)`
3. Haz clic en **Save**
4. Tu app estará disponible en `https://aalexiscs.github.io/pomodoro-timer`

---

## 📁 Estructura del Proyecto

```
pomodoro-timer/
├── index.html        # Estructura HTML principal
├── css/
│   └── style.css     # Estilos Material Design
├── js/
│   └── app.js        # Lógica del timer y UI
└── README.md
```

---

## 🛠️ Stack Tecnológico

- **HTML5** — Semántico y accesible (ARIA)
- **CSS3** — Variables CSS, animaciones, Grid/Flexbox
- **JavaScript ES6+** — Sin dependencias ni frameworks
- **Web Audio API** — Sonidos generados programáticamente
- **Google Fonts** — Tipografía Roboto

---

## 📱 Técnica Pomodoro

La técnica Pomodoro es un método de gestión del tiempo:

1. 🍅 Trabaja enfocado durante **25 minutos**
2. ☕ Toma un **descanso corto de 5 minutos**
3. Repite 4 veces
4. 🌙 Toma un **descanso largo de 15 minutos**

---

## 📄 Licencia

MIT © [aalexiscs](https://github.com/aalexiscs)
