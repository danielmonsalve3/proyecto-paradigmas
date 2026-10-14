# Indicadores de camas hospitalarias (MINSALUD) – Paradigma reactivo con React

## Ejecutar
    cd camas         # accede a la carpeta camas, para permitir ejecutar los comandos npm. Si ya se esta en la carpeta este paso no es necesario
    npm install
    npm run dev      # abre http://localhost:5173

## Estructura
- `src/indicadores.js`: lógica pura (validación y cálculo de razón, proporción, odds, etc.).
- `src/App.jsx`: estado único (`useState`), derivados (`useMemo`) y componentes de la vista.
- `src/styles.css`: estilos.
