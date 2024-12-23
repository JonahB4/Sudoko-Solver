class SymbolSprint {
    constructor() {
        this.themes = {
            weather: [
                { symbol: '☀️', number: 1 },
                { symbol: '🌧️', number: 2 },
                { symbol: '⛈️', number: 3 },
                { symbol: '❄️', number: 4 },
                { symbol: '🌈', number: 5 },
                { symbol: '⚡', number: 6 }
            ],
            space: [
                { symbol: '🌟', number: 1 },
                { symbol: '🌙', number: 2 },
                { symbol: '🚀', number: 3 },
                { symbol: '👽', number: 4 },
                { symbol: '🛸', number: 5 },
                { symbol: '🌍', number: 6 }
            ],
            animals: [
                { symbol: '🦁', number: 1 },
                { symbol: '🐘', number: 2 },
                { symbol: '🦒', number: 3 },
                { symbol: '🦊', number: 4 },
                { symbol: '🐼', number: 5 },
                { symbol: '🦋', number: 6 }
            ],
            food: [
                { symbol: '🍕', number: 1 },
                { symbol: '🍔', number: 2 },
                { symbol: '🌮', number: 3 },
                { symbol: '🍦', number: 4 },
                { symbol: '🍎', number: 5 },
                { symbol: '🍫', number: 6 }
            ],
            sports: [
                { symbol: '⚽', number: 1 },
                { symbol: '🏀', number: 2 },
                { symbol: '⚾', number: 3 },
                { symbol: '🎾', number: 4 },
                { symbol: '🏈', number: 5 },
                { symbol: '⛳', number: 6 }
            ],
            plants: [
                { symbol: '🌸', number: 1 },
                { symbol: '🌺', number: 2 },
                { symbol: '🌻', number: 3 },
                { symbol: '🌹', number: 4 },
                { symbol: '🌴', number: 5 },
                { symbol: '🍄', number: 6 }
            ],
            ocean: [
                { symbol: '🐋', number: 1 },
                { symbol: '🐠', number: 2 },
                { symbol: '🦈', number: 3 },
                { symbol: '🐙', number: 4 },
                { symbol: '🦀', number: 5 },
                { symbol: '🐚', number: 6 }
            ],
            music: [
                { symbol: '🎸', number: 1 },
                { symbol: '🎹', number: 2 },
                { symbol: '🎺', number: 3 },
                { symbol: '🥁', number: 4 },
                { symbol: '🎻', number: 5 },
                { symbol: '🎼', number: 6 }
            ],
            holiday: [
                { symbol: '🎄', number: 1 },
                { symbol: '🎃', number: 2 },
                { symbol: '🎅', number: 3 },
                { symbol: '🎁', number: 4 },
                { symbol: '🦃', number: 5 },
                { symbol: '🥚', number: 6 }
            ],
            fantasy: [
                { symbol: '🦄', number: 1 },
                { symbol: '🧙‍♂️', number: 2 },
                { symbol: '🐉', number: 3 },
                { symbol: '🧚', number: 4 },
                { symbol: '🔮', number: 5 },
                { symbol: '⚔️', number: 6 }
            ]
        };

        // Get today's theme
        const { theme, symbolMap } = this.getDailyTheme();
        this.currentTheme = theme;
        this.symbolMap = symbolMap;
        this.symbols = symbolMap.map(s => s.symbol);

        this.grid = Array(6).fill().map(() => Array(6).fill(null));
        this.solution = null;
        this.difficulty = '';
        this.hintsRemaining = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.cells = [];
        this.startTime = null;
        this.selectedSymbol = null;
        
        this.initializeGrid();
        this.initializeSymbolSelector();
        this.initializeEventListeners();
        this.loadDailyPuzzle();

        // Show instructions if first visit
        if (!localStorage.getItem('symbolSprintInstructionsShown')) {
            this.showInstructions();
            localStorage.setItem('symbolSprintInstructionsShown', 'true');
        }
    }

    getDailyTheme() {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Special dates for holiday theme
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        // Check for special dates
        if (month === 12 && (day >= 20 && day <= 26)) {
            return { theme: 'holiday', symbolMap: this.themes.holiday }; // Christmas
        } else if (month === 10 && (day >= 25 && day <= 31)) {
            return { theme: 'holiday', symbolMap: this.themes.holiday }; // Halloween
        } else if (month === 11 && (day >= 20 && day <= 26)) {
            return { theme: 'holiday', symbolMap: this.themes.holiday }; // Thanksgiving
        }

        // For non-holiday dates, use seed to select theme
        const themeNames = Object.keys(this.themes).filter(t => t !== 'holiday');
        const themeIndex = seed % themeNames.length;
        const theme = themeNames[themeIndex];
        
        return { theme, symbolMap: this.themes[theme] };
    }

    initializeGrid() {
        const grid = document.getElementById('symbolGrid');
        grid.innerHTML = '';
        this.cells = [];

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                const cell = document.createElement('div');
                cell.className = 'symbol-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.tabIndex = 0;
                
                cell.addEventListener('click', () => this.handleCellClick(cell));
                
                cell.addEventListener('keydown', (e) => {
                    if (cell.classList.contains('initial')) {
                        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                            e.preventDefault();
                            return;
                        }
                    }

                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);

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
                        default:
                            const num = parseInt(e.key);
                            if (num >= 1 && num <= 6) {
                                const symbolObj = this.symbolMap.find(s => s.number === num);
                                if (symbolObj) {
                                    this.placeSymbol(cell, row, col, symbolObj.symbol);
                                }
                            }
                    }
                });

                grid.appendChild(cell);
                this.cells.push(cell);
            }
        }
    }

    initializeSymbolSelector() {
        const selector = document.querySelector('.symbols-available');
        selector.innerHTML = `
            <div class="theme-name">Today's Theme: ${this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1)}</div>
            <div class="options-container"></div>
        `;
        
        const optionsContainer = selector.querySelector('.options-container');
        this.symbolMap.forEach(({ symbol, number }) => {
            const option = document.createElement('div');
            option.className = 'symbol-option';
            option.innerHTML = `
                <span class="symbol">${symbol}</span>
                <span class="number">${number}</span>
            `;
            option.addEventListener('click', () => this.selectSymbol(symbol));
            optionsContainer.appendChild(option);
        });
    }

    selectSymbol(symbol) {
        this.selectedSymbol = symbol;
        document.querySelectorAll('.symbol-option').forEach(option => {
            option.classList.toggle('selected', option.textContent === symbol);
        });
    }

    handleCellClick(cell) {
        if (cell.classList.contains('initial') || !this.selectedSymbol) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        this.placeSymbol(cell, row, col, this.selectedSymbol);
    }

    placeSymbol(cell, row, col, symbol) {
        cell.textContent = symbol;
        this.grid[row][col] = symbol;

        if (!this.startTime) {
            this.startTimer();
        }

        this.validateMove(row, col);
        this.checkCompletion();
    }

    validateMove(row, col) {
        const isValid = this.isValidPlacement(this.grid, row, col, this.grid[row][col]);
        const cell = this.cells[row * 6 + col];

        if (!isValid) {
            cell.classList.remove('invalid');
        }
    }

    isValidPlacement(grid, row, col, symbol) {
        // Check row
        for (let x = 0; x < 6; x++) {
            if (x !== col && grid[row][x] === symbol) return false;
        }

        // Check column
        for (let x = 0; x < 6; x++) {
            if (x !== row && grid[x][col] === symbol) return false;
        }

        // Check 2x3 box
        const boxRow = Math.floor(row / 2) * 2;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 3; j++) {
                if (boxRow + i !== row || boxCol + j !== col) {
                    if (grid[boxRow + i][boxCol + j] === symbol) return false;
                }
            }
        }

        return true;
    }

    initializeEventListeners() {
        document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGrid());
        document.getElementById('solveBtn').addEventListener('click', () => this.showSolution());
        document.getElementById('checkBtn').addEventListener('click', () => this.checkSolution());
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

    async loadDailyPuzzle() {
        try {
            const today = new Date();
            const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
            const dayOfWeek = today.getDay();
            
            const difficulties = ['medium', 'easy', 'easy', 'medium', 'hard', 'hard', 'hard'];
            this.difficulty = difficulties[dayOfWeek];

            document.querySelector('.date').textContent = today.toLocaleDateString();
            document.querySelector('.difficulty').textContent = this.difficulty.toUpperCase();

            const puzzle = this.generatePuzzle(seed);
            this.grid = puzzle.grid;
            this.solution = puzzle.solution;
            
            // Check completion status after generating puzzle
            if (this.isPuzzleCompleted()) {
                this.showCompletedState();
            } else {
                this.updateGridUI();
            }
            
            this.loadBestTimes();
        } catch (error) {
            console.error('Error generating puzzle:', error);
            this.setStatus('Error generating puzzle. Please try again.', 'error');
        }
    }

    generatePuzzle(seed) {
        // Simple seeded random number generator
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // Generate a solved grid first
        const solution = this.generateSolvedGrid(random);
        const grid = JSON.parse(JSON.stringify(solution));

        // Remove symbols based on difficulty
        const cellsToRemove = {
            'easy': 16,
            'medium': 22,
            'hard': 28
        }[this.difficulty];

        const positions = Array.from({length: 36}, (_, i) => i);
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < cellsToRemove; i++) {
            const pos = positions[i];
            const row = Math.floor(pos / 6);
            const col = pos % 6;
            grid[row][col] = null;
        }

        return { grid, solution };
    }

    generateSolvedGrid(random) {
        const grid = Array(6).fill().map(() => Array(6).fill(null));
        this.solveSudoku(grid, random);
        return grid;
    }

    solveSudoku(grid, random) {
        const emptyCell = this.findEmptyCell(grid);
        if (!emptyCell) return true;

        const [row, col] = emptyCell;
        const symbols = [...this.symbols];
        
        // Shuffle symbols
        for (let i = symbols.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
        }

        for (const symbol of symbols) {
            if (this.isValidPlacement(grid, row, col, symbol)) {
                grid[row][col] = symbol;
                if (this.solveSudoku(grid, random)) return true;
                grid[row][col] = null;
            }
        }
        return false;
    }

    findEmptyCell(grid) {
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (grid[row][col] === null) return [row, col];
            }
        }
        return null;
    }

    updateGridUI() {
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 6);
            const col = index % 6;
            const value = this.grid[row][col];
            
            cell.textContent = value || '';
            cell.classList.toggle('initial', value !== null);
        });
    }

    loadBestTimes() {
        const times = JSON.parse(localStorage.getItem('symbolSprintTimes') || '{}');
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

    giveHint() {
        if (this.hintsRemaining <= 0) {
            this.setStatus('No hints remaining!', 'error');
            return;
        }

        // Find a random empty cell
        const emptyCells = this.cells.filter(cell => !cell.textContent);
        if (emptyCells.length === 0) return;

        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        cell.textContent = this.solution[row][col];
        this.grid[row][col] = this.solution[row][col];
        cell.classList.add('hint');

        this.hintsRemaining--;
        document.querySelector('.hints-remaining').textContent = `Hints: ${this.hintsRemaining}`;
    }

    resetGrid() {
        this.updateGridUI();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.startTime = null;
            document.querySelector('.timer').textContent = '00:00';
        }
    }

    showSolution() {
        if (confirm('Are you sure you want to see the solution? This will end your current game.')) {
            clearInterval(this.timerInterval);
            const finalTime = this.startTime ? Date.now() - this.startTime : 0;
            
            // Save completion status
            this.markPuzzleCompleted(finalTime);

            // Show solution and disable interactions
            this.cells.forEach((cell, index) => {
                const row = Math.floor(index / 6);
                const col = index % 6;
                cell.textContent = this.solution[row][col];
                cell.classList.add('revealed');
                cell.style.pointerEvents = 'none';
            });

            // Hide symbol selector
            document.querySelector('.symbol-selector').style.display = 'none';

            // Disable buttons
            document.getElementById('hintBtn').disabled = true;
            document.getElementById('resetBtn').disabled = true;
            document.getElementById('solveBtn').disabled = true;
            document.getElementById('checkBtn').disabled = true;

            // Show completion message
            const message = document.createElement('div');
            message.className = 'completed-state';
            message.innerHTML = `
                <h2>Puzzle Revealed</h2>
                ${finalTime > 0 ? `
                    <div class="completion-time">
                        ${Math.floor(finalTime / 60000)}:${Math.floor((finalTime % 60000) / 1000).toString().padStart(2, '0')}
                    </div>
                ` : ''}
                <p>Come back tomorrow for a new challenge!</p>
                <p>Next puzzle available at midnight</p>
            `;

            const gridContainer = document.getElementById('symbolGrid').parentElement;
            gridContainer.appendChild(message);
        }
    }

    isPuzzleCompleted() {
        const completedPuzzles = JSON.parse(localStorage.getItem('symbolSprintCompleted') || '{}');
        const today = this.getDateString();
        return completedPuzzles[today];
    }

    getDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }

    markPuzzleCompleted(timeInMs) {
        const completedPuzzles = JSON.parse(localStorage.getItem('symbolSprintCompleted') || '{}');
        completedPuzzles[this.getDateString()] = {
            completedAt: new Date().toISOString(),
            timeToSolve: timeInMs,
            difficulty: this.difficulty
        };
        localStorage.setItem('symbolSprintCompleted', JSON.stringify(completedPuzzles));
    }

    showCompletedState() {
        const completedPuzzles = JSON.parse(localStorage.getItem('symbolSprintCompleted') || '{}');
        const todayData = completedPuzzles[this.getDateString()];
        
        // Show the solution in the grid
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 6);
            const col = index % 6;
            cell.textContent = this.solution[row][col];
            cell.classList.add('completed');
            cell.style.pointerEvents = 'none';
        });

        // Disable all interactions
        document.querySelector('.symbol-selector').style.display = 'none';
        document.getElementById('hintBtn').disabled = true;
        document.getElementById('resetBtn').disabled = true;
        document.getElementById('solveBtn').disabled = true;
        document.getElementById('checkBtn').disabled = true;

        // Show completion message
        const message = document.createElement('div');
        message.className = 'completed-state';
        message.innerHTML = `
            <h2>You've already completed today's puzzle!</h2>
            <div class="completion-time">
                ${Math.floor(todayData.timeToSolve / 60000)}:${Math.floor((todayData.timeToSolve % 60000) / 1000).toString().padStart(2, '0')}
            </div>
            <p>Completed at: ${new Date(todayData.completedAt).toLocaleTimeString()}</p>
            <p>Come back tomorrow for a new challenge!</p>
            <p>Next puzzle available at midnight</p>
        `;

        const gridContainer = document.getElementById('symbolGrid').parentElement;
        gridContainer.appendChild(message);
    }

    checkCompletion() {
        // Check if all cells are filled
        const allFilled = this.cells.every(cell => cell.textContent !== '');
        if (!allFilled) return;

        // Check if all placements are valid
        let isCorrect = true;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const symbol = this.grid[row][col];
                if (!this.isValidPlacement(this.grid, row, col, symbol)) {
                    isCorrect = false;
                    break;
                }
            }
            if (!isCorrect) break;
        }

        if (isCorrect) {
            this.showCongratulations();
        }
    }

    showCongratulations() {
        clearInterval(this.timerInterval);
        const finalTime = Date.now() - this.startTime;
        
        // Save completion status
        this.markPuzzleCompleted(finalTime);

        // Create congratulations modal
        const modal = document.createElement('div');
        modal.className = 'congratulations-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Congratulations!</h2>
                <p>You've completed today's Symbol Sprint!</p>
                <div class="completion-time">
                    ${Math.floor(finalTime / 60000)}:${Math.floor((finalTime % 60000) / 1000).toString().padStart(2, '0')}
                </div>
                <p>Come back tomorrow for a new challenge!</p>
                <button class="btn primary">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Show completed state immediately behind the modal
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 6);
            const col = index % 6;
            cell.textContent = this.solution[row][col];
            cell.classList.add('completed');
            cell.style.pointerEvents = 'none';
        });

        // Disable buttons and hide symbol selector
        document.getElementById('hintBtn').disabled = true;
        document.getElementById('resetBtn').disabled = true;
        document.getElementById('solveBtn').disabled = true;
        document.getElementById('checkBtn').disabled = true;
        document.querySelector('.symbol-selector').style.display = 'none';

        // Add completion message below grid
        const message = document.createElement('div');
        message.className = 'completed-state';
        message.innerHTML = `
            <h2>Puzzle Complete!</h2>
            <div class="completion-time">
                ${Math.floor(finalTime / 60000)}:${Math.floor((finalTime % 60000) / 1000).toString().padStart(2, '0')}
            </div>
            <p>Completed at: ${new Date().toLocaleTimeString()}</p>
            <p>Come back tomorrow for a new challenge!</p>
            <p>Next puzzle available at midnight</p>
        `;

        // Add event listener to modal close button
        modal.querySelector('button').addEventListener('click', () => {
            modal.remove();
            const gridContainer = document.getElementById('symbolGrid').parentElement;
            gridContainer.appendChild(message);
        });
    }

    moveFocus(row, col, rowDelta, colDelta) {
        let newRow = row + rowDelta;
        let newCol = col + colDelta;

        // Handle wrapping around edges
        if (newRow < 0) newRow = 5;
        if (newRow > 5) newRow = 0;
        if (newCol < 0) newCol = 5;
        if (newCol > 5) newCol = 0;

        const newCell = this.cells[newRow * 6 + newCol];
        if (newCell) {
            newCell.focus();
        }
    }

    showInstructions() {
        const modal = document.createElement('div');
        modal.className = 'instructions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>How to Play Symbol Sprint</h2>
                <div class="instructions-body">
                    <p>Welcome to Symbol Sprint! A fun twist on Sudoku using symbols.</p>
                    
                    <h3>Rules:</h3>
                    <ul>
                        <li>Fill the 6x6 grid with symbols</li>
                        <li>Each symbol must appear only once in each:</li>
                        <ul>
                            <li>Row</li>
                            <li>Column</li>
                            <li>2x3 box</li>
                        </ul>
                    </ul>

                    <h3>Controls:</h3>
                    <ul>
                        <li>Click a cell or use arrow keys to navigate</li>
                        <li>Type numbers 1-6 to place symbols</li>
                        <li>Or click symbols from the selector below the grid</li>
                    </ul>

                    <h3>Features:</h3>
                    <ul>
                        <li>Use hints when stuck (limited to 3)</li>
                        <li>Timer tracks your solving speed</li>
                        <li>New puzzle every day!</li>
                    </ul>
                </div>
                <button class="btn primary" onclick="this.closest('.instructions-modal').remove()">Got it!</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    checkSolution() {
        let isCorrect = true;
        
        // First remove all previous error highlights
        this.cells.forEach(cell => {
            cell.classList.remove('incorrect');
        });

        // Check each cell and highlight incorrect ones
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 6);
            const col = index % 6;
            
            if (!cell.classList.contains('initial')) { // Only check user-entered symbols
                const symbol = this.grid[row][col];
                if (!symbol) {
                    isCorrect = false; // Incomplete puzzle
                } else if (symbol !== this.solution[row][col]) {
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
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.symbolSprint = new SymbolSprint();
}); 