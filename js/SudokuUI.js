// SudokuUI.js
import SudokuSolver from './SudokuSolver.js';

class SudokuUI {
    constructor() {
        this.solver = new SudokuSolver();
        this.cells = [];
        this.solving = false;
        this.workers = [];
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
                    // Remove any highlighting when manually edited
                    e.target.classList.remove('ocr-detected', 'mismatch');
                });

                grid.appendChild(input);
                this.cells.push(input);
            }
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Clear previous state
            this.clearGrid();
            
            // Show loading state
            this.setStatus('Processing image...', 'success');
            document.body.classList.add('loading');

            // Display the original image
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.onload = () => {
                imagePreview.style.display = 'block'; // Show image after it loads
            };
            imagePreview.src = URL.createObjectURL(file);

            // Initialize Tesseract if needed
            if (this.workers.length === 0) {
                const worker = await Tesseract.createWorker();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                await worker.setParameters({
                    tessedit_char_whitelist: '123456789',
                    tessedit_pageseg_mode: '6',
                });
                this.workers.push(worker);
            }

            // Process the image
            const processedImage = await this.preprocessImage(file);
            const grid = await this.recognizeGrid(processedImage);
            
            // Update UI with recognized numbers
            this.updateGridWithRecognizedNumbers(grid);
            
            const numbersPlaced = grid.flat().filter(val => val !== 0).length;
            this.setStatus(`Grid processed with ${numbersPlaced} numbers detected. Please verify and correct any mistakes.`, 'success');

        } catch (error) {
            console.error('Recognition Error:', error);
            this.setStatus('Error processing image. Please try again.', 'error');
        } finally {
            document.body.classList.remove('loading');
        }
    }

    updateGridWithRecognizedNumbers(grid) {
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = grid[row][col];
            
            if (value !== 0) {
                cell.value = value;
                cell.classList.add('ocr-detected');
            } else {
                cell.value = '';
                cell.classList.remove('ocr-detected');
            }
        });
    }

    logGridToConsole(grid) {
        console.log('Detected numbers in grid:');
        let gridStr = '';
        for (let i = 0; i < 9; i++) {
            if (i % 3 === 0 && i !== 0) {
                gridStr += '-'.repeat(25) + '\n';
            }
            for (let j = 0; j < 9; j++) {
                if (j % 3 === 0 && j !== 0) {
                    gridStr += '| ';
                }
                gridStr += (grid[i][j] || '.') + ' ';
            }
            gridStr += '\n';
        }
        console.log(gridStr);
    }

    

    async recognizeGrid(canvas) {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        const cellWidth = canvas.width / 9;
        const cellHeight = canvas.height / 9;
        const worker = this.workers[0];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellCanvas = document.createElement('canvas');
                const cellCtx = cellCanvas.getContext('2d');
                
                cellCanvas.width = cellWidth * 2;
                cellCanvas.height = cellHeight * 2;

                cellCtx.fillStyle = 'white';
                cellCtx.fillRect(0, 0, cellCanvas.width, cellCanvas.height);

                const padding = Math.min(cellWidth, cellHeight) * 0.15;
                cellCtx.drawImage(
                    canvas,
                    col * cellWidth + padding,
                    row * cellHeight + padding,
                    cellWidth - (2 * padding),
                    cellHeight - (2 * padding),
                    padding,
                    padding,
                    cellCanvas.width - (2 * padding),
                    cellCanvas.height - (2 * padding)
                );

                try {
                    const { data: { text, confidence } } = await worker.recognize(cellCanvas);
                    const cleanedText = text.trim().replace(/[^1-9]/g, '');
                    const number = parseInt(cleanedText);
                    
                    if (!isNaN(number) && number >= 1 && number <= 9 && confidence > 30) {
                        if (this.isReasonableNumber(grid, row, col, number)) {
                            grid[row][col] = number;
                            console.log(`Detected ${number} at (${row},${col}) with confidence ${confidence}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error recognizing cell at ${row},${col}:`, error);
                }
            }
        }

        return this.validateAndCleanGrid(grid);
    }

    enhanceCellImage(imageData) {
        const data = imageData.data;
        const threshold = this.getAdaptiveThreshold(data);

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const value = avg > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
    }

    getAdaptiveThreshold(data) {
        // Calculate histogram
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const avg = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
            histogram[avg]++;
        }

        // Otsu's method for threshold
        let total = data.length / 4;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;

        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;

            sumB += i * histogram[i];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const variance = wB * wF * (mB - mF) * (mB - mF);

            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = i;
            }
        }

        return threshold;
    }

    isReasonableNumber(grid, row, col, number) {
        // Check immediate neighbors for obvious conflicts
        const rowStart = Math.max(0, row - 1);
        const rowEnd = Math.min(8, row + 1);
        const colStart = Math.max(0, col - 1);
        const colEnd = Math.min(8, col + 1);

        for (let i = rowStart; i <= rowEnd; i++) {
            for (let j = colStart; j <= colEnd; j++) {
                if (grid[i][j] === number) {
                    return false;
                }
            }
        }

        return true;
    }

    validateAndCleanGrid(grid) {
        // Remove obviously incorrect numbers
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] !== 0) {
                    // Check row
                    let rowCount = 0;
                    for (let c = 0; c < 9; c++) {
                        if (grid[row][c] === grid[row][col]) rowCount++;
                    }
                    
                    // Check column
                    let colCount = 0;
                    for (let r = 0; r < 9; r++) {
                        if (grid[r][col] === grid[row][col]) colCount++;
                    }

                    // If there are duplicates, remove the number
                    if (rowCount > 1 || colCount > 1) {
                        grid[row][col] = 0;
                    }
                }
            }
        }

        return grid;
    }

    isValidSudokuGrid(grid) {
        // Extremely lenient validation that only checks for basic structure
        // Count filled cells
        const filledCells = grid.flat().filter(val => val !== 0).length;
        
        // Require at least 15 numbers (even more lenient than before)
        if (filledCells < 15) {
            console.log('Too few numbers detected:', filledCells);
            return false;
        }

        // Simple validation that only checks for immediate obvious conflicts
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] !== 0) {
                    // Check only immediate neighbors for obvious conflicts
                    if (this.hasObviousConflict(grid, i, j)) {
                        console.log(`Conflict detected at (${i},${j}) with value ${grid[i][j]}`);
                        return false;
                    }
                }
            }
        }

        return true;
    }

    hasObviousConflict(grid, row, col) {
        const value = grid[row][col];
        
        // Check only immediate adjacent cells in same row/column
        for (let i = -1; i <= 1; i++) {
            if (row + i >= 0 && row + i < 9 && i !== 0) {
                if (grid[row + i][col] === value) {
                    return true;
                }
            }
            if (col + i >= 0 && col + i < 9 && i !== 0) {
                if (grid[row][col + i] === value) {
                    return true;
                }
            }
        }
        
        return false;
    }

    

    initializeEventListeners() {
        document.getElementById('solveBtn').addEventListener('click', () => this.solve());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    
    async preprocessImage(file) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = await createImageBitmap(file);

        const size = Math.max(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        const xOffset = (size - img.width) / 2;
        const yOffset = (size - img.height) / 2;
        ctx.drawImage(img, xOffset, yOffset, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const contrast = 1.5;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const color = factor * (avg - 128) + 128;
            
            const threshold = 128;
            const final = color > threshold ? 255 : 0;
            
            data[i] = final;     // R
            data[i + 1] = final; // G
            data[i + 2] = final; // B
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    

    async preprocessImage(file) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = await createImageBitmap(file);

        // Increase maximum size for better recognition
        const maxSize = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Enhanced image preprocessing
        ctx.drawImage(img, 0, 0, width, height);
        
        // Increase contrast and brightness
        ctx.filter = 'contrast(200%) brightness(120%)';
        ctx.drawImage(canvas, 0, 0);

        // Convert to grayscale with enhanced contrast
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // Enhance contrast in grayscale conversion
            const enhanced = avg > 128 ? 255 : 0;
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
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
        this.cells.forEach(cell => {
            cell.value = '';
            cell.classList.remove('ocr-detected');
        });
        
        // Also clear the image preview
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        
        this.setStatus('');
    }

    setStatus(message, type = '') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = 'status ' + type;
    }

    // Cleanup method
    async destroy() {
        for (const worker of this.workers) {
            await worker.terminate();
        }
        this.workers = [];
    }
}


export default SudokuUI;