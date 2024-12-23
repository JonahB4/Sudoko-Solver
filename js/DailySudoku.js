class DailySudoku {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = null;
        this.difficulty = '';
        this.timer = 0;
        this.timerInterval = null;
        this.cells = [];
        this.startTime = null;
        
        this.initializeGrid();
        this.initializeEventListeners();
        this.loadDailyPuzzle();
        
        // Check if today's puzzle is already completed
        if (this.isPuzzleCompleted()) {
            this.showCompletedMessage();
        }
    }

    initializeGrid() {
        const grid = document.getElementById('dailyGrid');
        grid.innerHTML = '';
        this.cells = []; // Clear existing cells array

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'cell';
                input.maxLength = 1;
                input.dataset.row = i;
                input.dataset.col = j;
                
                // Update input handling
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Allow direct number replacement
                    if (/^[1-9]$/.test(value)) {
                        e.target.value = value;
                        if (!this.startTime) {
                            this.startTimer();
                        }
                        this.checkCompletion();
                    } else {
                        e.target.value = e.target.dataset.lastValue || '';
                    }
                    // Store the valid value for future reference
                    if (e.target.value) {
                        e.target.dataset.lastValue = e.target.value;
                    }
                });

                // Add keydown event for direct number input
                input.addEventListener('keydown', (e) => {
                    if (input.readOnly || input.classList.contains('initial-number')) {
                        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                            e.preventDefault();
                            return;
                        }
                    }

                    // Handle number keys (both main keyboard and numpad)
                    if (/^[1-9]$/.test(e.key) || (e.keyCode >= 97 && e.keyCode <= 105)) {
                        e.preventDefault();
                        const num = e.keyCode >= 97 ? e.keyCode - 96 : e.key;
                        input.value = num;
                        if (!this.startTime) {
                            this.startTimer();
                        }
                        this.checkCompletion();
                    }

                    // Handle arrow keys
                    const row = parseInt(input.dataset.row);
                    const col = parseInt(input.dataset.col);

                    switch (e.key) {
                        case 'ArrowLeft':
                            this.moveFocus(row, col, 0, -1);
                            e.preventDefault();
                            break;
                        case 'ArrowRight':
                            this.moveFocus(row, col, 0, 1);
                            e.preventDefault();
                            break;
                        case 'ArrowUp':
                            this.moveFocus(row, col, -1, 0);
                            e.preventDefault();
                            break;
                        case 'ArrowDown':
                            this.moveFocus(row, col, 1, 0);
                            e.preventDefault();
                            break;
                    }
                });

                grid.appendChild(input);
                this.cells.push(input);
            }
        }
    }

    // Add this new method for cell focusing
    focusCell(row, col) {
        const index = row * 9 + col;
        if (index >= 0 && index < this.cells.length) {
            this.cells[index].focus();
        }
    }

    async loadDailyPuzzle() {
        // Remove any existing completion messages
        const existingMessage = document.querySelector('.completed-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        if (this.isPuzzleCompleted()) {
            this.showCompletedMessage();
            return;
        }

        if (this.isPuzzleRevealed()) {
            this.showRevealedState();
            return;
        }

        try {
            const today = new Date();
            const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
            const dayOfWeek = today.getDay();
            
            const difficulties = ['medium', 'easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
            this.difficulty = difficulties[dayOfWeek];

            document.querySelector('.date').textContent = today.toLocaleDateString();
            document.querySelector('.difficulty').textContent = this.difficulty.toUpperCase();

            const puzzle = this.generatePuzzle(seed, this.difficulty);
            console.log('Puzzle generated:', puzzle); // Debug log
            
            this.grid = puzzle.grid;
            this.solution = puzzle.solution;
            
            this.updateGridUI();
            this.loadBestTimes();
        } catch (error) {
            console.error('Error generating puzzle:', error);
            this.setStatus('Error generating puzzle. Please try again.', 'error');
        }
    }

    generatePuzzle(seed, difficulty) {
        // Reset random seed
        Math.seedrandom(seed);
        
        // Generate a complete solved grid
        const solution = this.generateSolvedGrid();
        console.log('Generated solution:', solution); // Debug log
        
        // Create puzzle by removing numbers based on difficulty
        const removeCounts = {
            easy: 36,
            medium: 46,
            hard: 52
        };
        
        // Create a deep copy of the solution
        const grid = JSON.parse(JSON.stringify(solution));
        
        // Create array of all positions
        const positions = Array.from({length: 81}, (_, i) => i);
        this.shuffleArray(positions);
        
        // Remove numbers based on difficulty
        let numbersRemoved = 0;
        for (let i = 0; i < positions.length && numbersRemoved < removeCounts[difficulty]; i++) {
            const pos = positions[i];
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            
            const temp = grid[row][col];
            grid[row][col] = 0;
            
            // Make a copy for testing
            const tempGrid = JSON.parse(JSON.stringify(grid));
            
            // Check if puzzle still has a unique solution
            if (this.hasUniqueSolution(tempGrid)) {
                numbersRemoved++;
            } else {
                grid[row][col] = temp; // Put the number back
            }
        }
        
        console.log('Final puzzle:', grid); // Debug log
        return { grid, solution };
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.querySelector('.timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    checkSolution() {
        const currentGrid = this.getCurrentGrid();
        let isCorrect = true;

        // First remove all previous error highlights
        this.cells.forEach(cell => {
            cell.classList.remove('incorrect');
        });

        // Check each cell and highlight incorrect ones
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            
            if (!cell.classList.contains('initial-number')) { // Only check user-entered numbers
                const value = parseInt(cell.value) || 0;
                if (value === 0) {
                    isCorrect = false; // Incomplete puzzle
                } else if (value !== this.solution[row][col]) {
                    cell.classList.add('incorrect');
                    isCorrect = false;
                }
            }
        });

        if (isCorrect) {
            this.showCongratulations();
        } else {
            this.setStatus('Not quite right. Keep trying!', 'error');
        }
    }

    saveBestTime(time) {
        const times = JSON.parse(localStorage.getItem('bestTimes') || '{}');
        const difficulty = this.difficulty;
        
        if (!times[difficulty] || time < times[difficulty]) {
            times[difficulty] = time;
            localStorage.setItem('bestTimes', JSON.stringify(times));
            this.loadBestTimes();
        }
    }

    loadBestTimes() {
        const times = JSON.parse(localStorage.getItem('bestTimes') || '{}');
        const bestTimesDiv = document.getElementById('bestTimes');
        bestTimesDiv.innerHTML = '';
        
        Object.entries(times).forEach(([difficulty, time]) => {
            const minutes = Math.floor(time / 60000);
            const seconds = Math.floor((time % 60000) / 1000);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const div = document.createElement('div');
            div.textContent = `${difficulty}: ${timeStr}`;
            bestTimesDiv.appendChild(div);
        });
    }

    setStatus(message, type = '') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = 'status ' + type;
    }

    initializeEventListeners() {
        document.getElementById('checkBtn').addEventListener('click', () => this.checkSolution());
        document.getElementById('newGameBtn').addEventListener('click', () => this.loadDailyPuzzle());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('revealBtn').addEventListener('click', () => this.revealSolution());
    }

    updateGridUI() {
        // First completely reset all cells
        this.cells.forEach(cell => {
            cell.value = '';
            cell.readOnly = false;
            cell.classList.remove('initial-number', 'error');
            cell.removeAttribute('readonly');
            cell.style.backgroundColor = 'white';
        });

        // Then set only the initial numbers
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.grid[row][col];
            
            if (value !== 0) {
                cell.value = value;
                cell.readOnly = true;
                cell.classList.add('initial-number');
                cell.setAttribute('readonly', 'readonly');
            }
        });
    }

    generateSolvedGrid() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal boxes first
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(grid, i, i);
        }
        
        // Solve the rest of the grid
        if (this.solveSudoku(grid)) {
            return grid;
        }
        throw new Error("Failed to generate valid grid");
    }

    fillBox(grid, startRow, startCol) {
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[startRow + i][startCol + j] = numbers[index];
                index++;
            }
        }
    }

    solveSudoku(grid) {
        const emptyCell = this.findEmptyCell(grid);
        if (!emptyCell) return true;

        const [row, col] = emptyCell;
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of numbers) {
            if (this.isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                if (this.solveSudoku(grid)) {
                    return true;
                }
                grid[row][col] = 0;
            }
        }
        return false;
    }

    findEmptyCell(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) return [row, col];
            }
        }
        return null;
    }

    isValidPlacement(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (x !== col && grid[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (x !== row && grid[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if ((boxRow + i !== row || boxCol + j !== col) && 
                    grid[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    removeNumbers(solution, count) {
        const grid = JSON.parse(JSON.stringify(solution)); // Deep copy
        const positions = [];
        
        // Create array of all positions
        for (let i = 0; i < 81; i++) {
            positions.push(i);
        }

        // Shuffle positions
        this.shuffleArray(positions);

        // Remove numbers
        for (let i = 0; i < count; i++) {
            const pos = positions[i];
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            grid[row][col] = 0;
        }

        return grid;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getCurrentGrid() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = cell.value.trim();
            grid[row][col] = value === '' ? 0 : parseInt(value);
        });
        return grid;
    }

    compareGrids(grid1, grid2) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid1[i][j] !== grid2[i][j]) {
                    console.log(`Mismatch at [${i},${j}]: ${grid1[i][j]} !== ${grid2[i][j]}`); // Debug log
                    return false;
                }
            }
        }
        return true;
    }

    clearGrid() {
        this.cells.forEach(cell => {
            if (!cell.classList.contains('initial-number')) {
                cell.value = '';
                cell.classList.remove('error', 'revealed');
                cell.readOnly = false;
            }
        });
        
        // Reset timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.startTime = null;
            document.querySelector('.timer').textContent = '00:00';
        }
        
        this.setStatus('');
    }

    hasUniqueSolution(grid) {
        let solutions = 0;
        
        const solve = (g) => {
            if (solutions > 1) return;
            
            const emptyCell = this.findEmptyCell(g);
            if (!emptyCell) {
                solutions++;
                return;
            }
            
            const [row, col] = emptyCell;
            for (let num = 1; num <= 9; num++) {
                if (this.isValidPlacement(g, row, col, num)) {
                    g[row][col] = num;
                    solve(g);
                    g[row][col] = 0;
                }
            }
        };
        
        solve(grid);
        return solutions === 1;
    }

    moveFocus(row, col, rowDelta, colDelta) {
        let newRow = row;
        let newCol = col;
        
        do {
            newRow += rowDelta;
            newCol += colDelta;
        } while (
            newRow >= 0 && newRow < 9 && 
            newCol >= 0 && newCol < 9 && 
            this.cells[newRow * 9 + newCol].readOnly
        );

        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
            this.focusCell(newRow, newCol);
        }
    }

    checkCompletion() {
        // Check if all cells are filled
        const allFilled = this.cells.every(cell => cell.value !== '');
        if (!allFilled) return;

        const currentGrid = this.getCurrentGrid();
        const isCorrect = this.compareGrids(currentGrid, this.solution);
        
        if (isCorrect) {
            this.showCongratulations();
        }
    }

    showCongratulations() {
        // Double check that the solution is actually correct
        const currentGrid = this.getCurrentGrid();
        if (!this.compareGrids(currentGrid, this.solution)) {
            return;
        }

        clearInterval(this.timerInterval);
        const finalTime = Date.now() - this.startTime;
        this.saveBestTime(finalTime);
        this.markPuzzleCompleted(finalTime);

        // Create congratulations modal
        const modal = document.createElement('div');
        modal.className = 'congratulations-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Congratulations!</h2>
                <p>You've completed the puzzle for ${new Date().toLocaleDateString()}</p>
                <p>Time: ${Math.floor(finalTime / 60000)}:${Math.floor((finalTime % 60000) / 1000).toString().padStart(2, '0')}</p>
                <p>Come back tomorrow for a new challenge!</p>
                <button class="btn primary" onclick="location.reload()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    revealSolution() {
        if (confirm('Are you sure you want to see the solution? This will end your current game.')) {
            clearInterval(this.timerInterval);
            
            // Save revealed state to localStorage
            const revealedPuzzles = JSON.parse(localStorage.getItem('revealedSudokuPuzzles') || '{}');
            revealedPuzzles[this.getDateString()] = {
                revealedAt: new Date().toISOString(),
                solution: this.solution // Save the solution as well
            };
            localStorage.setItem('revealedSudokuPuzzles', JSON.stringify(revealedPuzzles));

            this.showRevealedState();
        }
    }

    isPuzzleCompleted() {
        const completedPuzzles = JSON.parse(localStorage.getItem('completedPuzzles') || '{}');
        const today = this.getDateString();
        return completedPuzzles[today];
    }

    getDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    markPuzzleCompleted(timeInMs) {
        const completedPuzzles = JSON.parse(localStorage.getItem('completedPuzzles') || '{}');
        completedPuzzles[this.getDateString()] = {
            completedAt: new Date().toISOString(),
            timeToSolve: timeInMs,
            difficulty: this.difficulty
        };
        localStorage.setItem('completedPuzzles', JSON.stringify(completedPuzzles));
    }

    showCompletedMessage() {
        const completedPuzzles = JSON.parse(localStorage.getItem('completedPuzzles') || '{}');
        const todayData = completedPuzzles[this.getDateString()];
        
        // Show the solution in the grid
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            cell.value = this.solution[row][col];
            cell.readOnly = true;
            cell.classList.add('completed');
        });

        // Disable buttons
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('clearBtn').disabled = true;
        document.getElementById('revealBtn').disabled = true;

        // Only show completion message if it doesn't already exist
        if (!document.querySelector('.completed-message')) {
            const minutes = Math.floor(todayData.timeToSolve / 60000);
            const seconds = Math.floor((todayData.timeToSolve % 60000) / 1000);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const message = document.createElement('div');
            message.className = 'completed-message';
            message.innerHTML = `
                <h2>You've already completed today's puzzle!</h2>
                <p>Completed at: ${new Date(todayData.completedAt).toLocaleTimeString()}</p>
                <p>Your time: ${timeStr}</p>
                <p>Come back tomorrow for a new challenge!</p>
            `;

            // Insert message after the grid
            const gridContainer = document.getElementById('dailyGrid').parentElement;
            gridContainer.insertBefore(message, document.querySelector('.game-controls'));
        }
    }

    // Add this method to handle revealed state
    showRevealedState() {
        // Get the saved solution from localStorage if needed
        if (!this.solution) {
            const revealedPuzzles = JSON.parse(localStorage.getItem('revealedSudokuPuzzles') || '{}');
            const todayData = revealedPuzzles[this.getDateString()];
            this.solution = todayData.solution;
        }

        // Show the solution in the grid
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            cell.value = this.solution[row][col];
            cell.classList.add('revealed');
            cell.readOnly = true;
        });

        // Disable all interactions
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('newGameBtn').disabled = true;
        document.getElementById('clearBtn').disabled = true;
        document.getElementById('revealBtn').disabled = true;

        // Show revealed message
        if (!document.querySelector('.completed-message')) {
            const message = document.createElement('div');
            message.className = 'completed-message';
            message.innerHTML = `
                <h2>Puzzle Revealed</h2>
                <p>Come back tomorrow for a new challenge!</p>
                <p>Next puzzle available at midnight</p>
            `;

            const gridContainer = document.getElementById('dailyGrid').parentElement;
            gridContainer.appendChild(message);
        }
    }

    // Add method to check if puzzle was revealed
    isPuzzleRevealed() {
        const revealedPuzzles = JSON.parse(localStorage.getItem('revealedSudokuPuzzles') || '{}');
        return revealedPuzzles[this.getDateString()];
    }
}

// Add seedrandom function for consistent daily puzzles
Math.seedrandom = function(seed) {
    const s = seed.toString();
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    this._seed = Math.abs(hash);
};

Math.random = function() {
    this._seed = (this._seed * 9301 + 49297) % 233280;
    return (this._seed / 233280);
};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.dailySudoku = new DailySudoku();
}); 