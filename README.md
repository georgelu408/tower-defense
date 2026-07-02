# Tower Defense

A browser-based tower defense game built with [Phaser 3](https://phaser.io/) and TypeScript.

## Stack

- Phaser 3 for rendering and game loop
- TypeScript
- Vite for dev server and bundling
- Auto-deploys to GitHub Pages on push to `main`

## Structure

- `src/scenes/` — `Boot`, `Game`, `UI` scenes
- `src/entities/` — `Tower`, `Enemy`, `Projectile`
- `src/systems/` — `Grid` (placement grid), `WaveManager` (enemy spawning/waves)
- `src/config/` — tower stats, enemy stats, abilities, wave definitions, level layout

## Running locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
