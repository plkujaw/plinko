# Plinko Game

A fun Plinko game built with React and Canvas.

## Quick Start (Production Build)

If you received the `plinko-game.zip` file:

1. Unzip the file
2. Choose one of these methods to run it:

   **Using Python:**
   ```bash
   python -m http.server
   ```
   Then open `http://localhost:8000`

   **Using Node.js:**
   ```bash
   npx serve
   ```
   Then open the URL shown in the terminal

   **Using VS Code:**
   Install the "Live Server" extension and right-click `index.html` -> "Open with Live Server"

## Development Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher)
2. Clone or download this repository
3. Open a terminal in the project directory
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Game Controls

- Click "Add Ball" to get a new ball
- Drag the ball to position it
- Adjust drop force using the slider
- Click "Drop Ball" to release the ball
- Use "Shake Board" to add some chaos
- Click "Reset Game" to start over

## Features

- Interactive ball physics
- Pin collision detection
- Multiplier slots with different values
- Score tracking
- Boundary physics
- Visual effects for scoring