# Guía IV — UCIP

Guía de administración intravenosa de fármacos para una Unidad de Cuidados Intensivos Pediátricos.

App web con buscador y filtro alfabético para consultar rápidamente los 140 fármacos de la guía.

## 🚀 Despliegue en GitHub Pages — Paso a paso

### 1. Crear el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repositorio: `guia-ucip`
3. Déjalo **público**
4. **No** marques "Add a README" (ya tenemos uno)
5. Clic en **Create repository**

### 2. Subir el proyecto desde tu Mac

Abre la terminal y ejecuta estos comandos:

```bash
# Ve a la carpeta del proyecto
cd guia-ucip

# Inicia git
git init
git add .
git commit -m "primera versión"

# Conecta con tu repo (cambia TU_USUARIO por tu nombre de GitHub)
git remote add origin https://github.com/TU_USUARIO/guia-ucip.git
git branch -M main
git push -u origin main
```

### 3. Activar GitHub Pages

1. En tu repo de GitHub, ve a **Settings** → **Pages**
2. En **Source**, selecciona **GitHub Actions**
3. ¡Listo! El workflow se ejecutará automáticamente

### 4. Esperar al despliegue

- Ve a la pestaña **Actions** de tu repo para ver el progreso
- En 1-2 minutos estará disponible en:

```
https://TU_USUARIO.github.io/guia-ucip/
```

## 💻 Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## ⚠️ Nota importante

Si cambias el nombre del repositorio, tienes que actualizar `base` en `vite.config.js`:

```js
base: '/NOMBRE-DE-TU-REPO/',
```
