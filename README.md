# Parallel Sudoku Solver

A modern web-based Sudoku solver that uses parallel processing and OCR capabilities to solve Sudoku puzzles. The solver can handle both manual input and image recognition of printed Sudoku puzzles.

## Features

- Parallel processing using Web Workers
- OCR capabilities for reading Sudoku puzzles from images
- Interactive grid for manual input
- Visual solving process with animations
- Responsive design
- Performance metrics

## Technical Stack

- Pure JavaScript (ES6+)
- HTML5
- CSS3
- Tesseract.js for OCR
- Web Workers API for parallelization

## Directory Structure

```
sudoku-solver/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Styles for the application
├── js/
│   ├── SudokuSolver.js # Core solving logic
│   └── SudokuUI.js     # UI handling and interactions
└── README.md          # Project documentation
```

## Setup

1. Clone the repository
2. Serve the files using a local web server (required for ES6 modules)
   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```
3. Open `http://localhost:8000` in your browser

## Usage

### Manual Input
1. Click on any cell in the grid
2. Type a number from 1-9
3. Click "Solve Puzzle" when ready

### Image Input
1. Click "Upload Image"
2. Select a clear image of a Sudoku puzzle
3. Wait for OCR processing
4. Correct any recognition errors manually
5. Click "Solve Puzzle"

### Controls
- **Solve Puzzle**: Starts the solving process
- **Upload Image**: Opens file picker for puzzle images
- **Clear Grid**: Resets the entire grid

## Performance

The solver uses Web Workers for parallel processing, with the number of workers automatically adjusted based on the available CPU cores. The solving process is visualized with animations, and timing information is displayed upon completion.

## Browser Compatibility

Requires a modern browser with support for:
- ES6 Modules
- Web Workers
- CSS Grid
- Async/Await

## License

MIT License - Feel free to use and modify as needed.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request