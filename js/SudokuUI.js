// SudokuUI.js
import SudokuSolver from './SudokuSolver.js';

class SudokuUI {
    constructor() {
        this.solver = new SudokuSolver();
        this.cells = [];
        this.solving = false;
        this.initializeGrid();
        this.initializeEventListeners();
    }

    initializeGrid() {
        const grid = document.getElementById('sudokuGrid');
        grid.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'cell';
                input.maxLength = 1;
                input.dataset.row = i;
                input.dataset.col = j;
                
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (!/^[1-9]$/.test(value)) {
                        e.target.value = '';
                    }
                });

                grid.appendChild(input);
                this.cells.push(input);
            }
        }
    }

    initializeEventListeners() {
        document.getElementById('solveBtn').addEventListener('click', () => this.solve());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const imagePreview = document.getElementById('imagePreview');
        imagePreview.style.display = 'block';
        imagePreview.src = URL.createObjectURL(file);

        this.setStatus('Processing image...', 'success');
        document.body.classList.add('loading');

        try {
            const worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            
            // Enhanced Tesseract configuration
            await worker.setParameters({
                tessedit_char_whitelist: '123456789',
                preserve_interword_spaces: '1',
                tessedit_pageseg_mode: '6', // Assume uniform text block
                tessjs_create_box: '1',
                tessjs_create_unlv: '1',
                tessedit_min_confidence: 60, // Increase confidence threshold
            });

            const { data } = await worker.recognize(file);
            await worker.terminate();

            // Clear the grid
            this.clearGrid();

            // Get image dimensions
            const img = new Image();
            await new Promise(resolve => {
                img.onload = resolve;
                img.src = URL.createObjectURL(file);
            });

            const cellWidth = img.width / 9;
            const cellHeight = img.height / 9;

            // Create a temporary grid to store candidates
            const tempGrid = Array(9).fill().map(() => Array(9).fill(null));
            
            // First pass: collect all candidates with their confidence scores
            data.symbols
                .filter(symbol => /[1-9]/.test(symbol.text) && symbol.confidence > 60)
                .forEach(symbol => {
                    const centerX = symbol.bbox.x0 + (symbol.bbox.x1 - symbol.bbox.x0) / 2;
                    const centerY = symbol.bbox.y0 + (symbol.bbox.y1 - symbol.bbox.y0) / 2;

                    const col = Math.floor(centerX / cellWidth);
                    const row = Math.floor(centerY / cellHeight);

                    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
                        if (!tempGrid[row][col]) {
                            tempGrid[row][col] = {
                                value: parseInt(symbol.text),
                                confidence: symbol.confidence
                            };
                        } else if (symbol.confidence > tempGrid[row][col].confidence) {
                            // Keep the higher confidence value
                            tempGrid[row][col] = {
                                value: parseInt(symbol.text),
                                confidence: symbol.confidence
                            };
                        }
                    }
                });

            // Second pass: validate and fill the grid
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (tempGrid[row][col]) {
                        const value = tempGrid[row][col].value;
                        
                        // Validate the number doesn't already exist in row/column/box
                        if (this.isValidPlacement(row, col, value)) {
                            const cellIndex = row * 9 + col;
                            this.cells[cellIndex].value = value;
                        }
                    }
                }
            }

            this.setStatus('Image processed successfully! Please verify the numbers.', 'success');
        } catch (error) {
            console.error('OCR Error:', error);
            this.setStatus('Error processing image: ' + error.message, 'error');
        } finally {
            document.body.classList.remove('loading');
        }
    }

    isValidPlacement(row, col, value) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (i !== col) {
                const cellIndex = row * 9 + i;
                if (this.cells[cellIndex].value === value.toString()) {
                    return false;
                }
            }
        }

        // Check column
        for (let i = 0; i < 9; i++) {
            if (i !== row) {
                const cellIndex = i * 9 + col;
                if (this.cells[cellIndex].value === value.toString()) {
                    return false;
                }
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (boxRow + i !== row || boxCol + j !== col) {
                    const cellIndex = (boxRow + i) * 9 + (boxCol + j);
                    if (this.cells[cellIndex].value === value.toString()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    getGridValues() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        this.cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = parseInt(cell.value) || 0;
            grid[row][col] = value;
        });
        return grid;
    }

    async solve() {
        if (this.solving) return;
        this.solving = true;
        document.body.classList.add('loading');

        try {
            const grid = this.getGridValues();
            Object.assign(this.solver.grid, grid);

            const startTime = performance.now();
            const solution = await this.solver.solve();
            
            if (solution.solution) {
                const endTime = performance.now();
                this.updateGrid(solution.solution);
                this.setStatus(`Solved in ${(endTime - startTime).toFixed(2)}ms!`, 'success');
            } else {
                this.setStatus('No solution exists!', 'error');
            }
        } catch (error) {
            this.setStatus(error.message, 'error');
        } finally {
            this.solving = false;
            document.body.classList.remove('loading');
        }
    }

    updateGrid(solution) {
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            
            cell.classList.add('solving');
            setTimeout(() => {
                cell.value = solution[row][col];
                cell.classList.remove('solving');
            }, index * 20);
        });
    }

    clearGrid() {
        this.cells.forEach(cell => cell.value = '');
        this.setStatus('');
        document.getElementById('imagePreview').style.display = 'none';
    }

    setStatus(message, type = '') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = 'status ' + type;
    }
}

export default SudokuUI;