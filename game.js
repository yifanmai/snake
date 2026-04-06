const UP = 0;
const LEFT = 1;
const DOWN = 2;
const RIGHT = 3;

const EMPTY_CELL = 0;
const SNAKE_CELL = 1;
const APPLE_CELL = 2;

const DIRECTION_TO_DIFF = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1]
];

const DIRECTION_TO_OPPOSITE = [
    DOWN,
    RIGHT,
    UP,
    LEFT
];

READY = "READY";
RUNNING = "RUNNING";
WON = "WON";
LOST = "LOST";

class World {
    /**
     *
     * @param {number} height
     * @param {number} width
     */
    constructor(height, width) {
        this.height = height;
        this.width = width;
        this.cells = new Array(this.height);
        for (let row = 0; row < this.height; ++row) {
            this.cells[row] = new Array(this.width);
        }
        this.reset();
    }

    reset() {
        for (let row = 0; row < this.width; ++row) {
            for (let col = 0; col < this.width; ++col) {
                this.cells[row][col] = EMPTY_CELL;
            }
        }
    }
}

class Display {
    /**
     *
     * @param {number} height
     * @param {number} width
     */
    reset(height, width) {
        throw new Error("reset() is not implemented");
    }

    /**
     *
     * @param {World} world
     */
    render(world) {
        throw new Error("render() is not implemented");
    }

    /**
     *
     * @param {string} message
     */
    showMessage(message) {
        throw new Error("showMessage() is not implemented");
    }
}

class TableDisplay extends Display {
    /**
     *
     * @param {number} height
     * @param {number} width
     */
    reset(height, width) {
        this.cells = [];
        
        const divElement = document.getElementById("display");
        const tableElement = document.createElement("table");
        for (let row = 0; row < height; ++row) {
            const rowElement = document.createElement("tr");
            const cellsRow = []
            for (let col = 0; col < width; ++col) {
                const cellElement = document.createElement("td");
                cellElement.setAttribute("class", "");
                cellsRow.push(cellElement)
                rowElement.appendChild(cellElement);
            }
            this.cells.push(cellsRow)
            tableElement.appendChild(rowElement);
        }
        divElement.appendChild(tableElement);
    }

    /**
     *
     * @param {World} world
     */
    render(world) {
        for (let row = 0; row < world.height; ++row) {
            for (let col = 0; col < world.width; ++col) {
                const currentClass = this.cells[row][col].getAttribute("class")
                let nextClass = "";
                if (world.cells[row][col] === SNAKE_CELL) {
                    nextClass = "snake";
                } else if (world.cells[row][col] === APPLE_CELL){
                    nextClass = "apple";
                }
                if (nextClass !== currentClass) {
                    this.cells[row][col].setAttribute("class", nextClass)
                }
            }
        }        
    }
    
    /**
     *
     * @param {string} message
     */
    showMessage(message) {
        // TODO: Update a div instead
        alert(message);
    }
}

class ConsoleDisplay extends Display {
    /**
     *
     * @param {number} height
     * @param {number} width
     */
    reset(height, width) {
        console.clear();
    }

    /**
     *
     * @param {World} world
     */
    render(world) {
        console.clear();
        for (let row = 0; row < world.height; ++row) {
            let line = "";
            line += row % 10;
            for (let col = 0; col < world.width; ++col) {
                if (world.cells[row][col] === SNAKE_CELL) {
                    line += "#";
                } else if (world.cells[row][col] === APPLE_CELL){
                    line += "*";
                } else {
                    line += ".";
                }

            }
            console.log(line);
        }
    }
    
    /**
     *
     * @param {string} message
     */
    showMessage(message) {
        console.log(message);
    }

}

/**
 *
 * @param {number} max
 * @return {number} A random integer X where 0 <= X < max
 */
function randomInt(max) {
    return Math.floor(Math.random() * max);
}

class Player {
    constructor() {
        this.direction = RIGHT;
        this.previousDirection = this.direction;
        this.bindToKeyboardEvents();
    }

    getMove() {
        this.previousDirection = this.direction;
        return this.direction;
    }

    bindToKeyboardEvents() {
        addEventListener("keydown", (event) => {
            let nextDirection = null;
            if (event.code === "ArrowUp") {
                nextDirection = UP;
                event.preventDefault();
            } else if (event.code === "ArrowLeft") {
                nextDirection = LEFT;
                event.preventDefault();
            } else if (event.code === "ArrowDown") {
                nextDirection = DOWN;
                event.preventDefault();
            } else if (event.code === "ArrowRight") {
                nextDirection = RIGHT;
                event.preventDefault();
            }
            if (nextDirection !== null) {
                event.preventDefault();
                // Prevent snake from reversing direction, which causes instant death
                if (nextDirection !== DIRECTION_TO_OPPOSITE[this.previousDirection]) {
                    this.direction = nextDirection;
                }
            }
        });
    }
}

class Game {
    /**
     *
     * @param {number} height
     * @param {number} width
     */
    constructor(height, width) {
        this.world = new World(height, width);
        this.display = new TableDisplay();
        this.reset();
        this.timer = null;
        this.player = new Player();
    }

    reset() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.world.reset();
        const snakeRow = Math.floor(this.world.height / 2);
        const snakeCol = Math.floor(this.world.width / 2);
        console.log(this.world);
        this.world.cells[snakeRow][snakeCol] = SNAKE_CELL;
        this.snakeCells = [[snakeRow, snakeCol]];
        this.placeApple();
        this.display.reset(this.world.height, this.world.width);
        this.display.render(this.world);
        this.state = READY;
    }

    placeApple() {
        const availableCells = [];
        // TODO: Check that there is at least one legal space
        for (let row = 0; row < this.world.width; ++row) {
            for (let col = 0; col < this.world.width; ++col) {
                if (this.world.cells[row][col] === EMPTY_CELL) {
                    availableCells.push([row, col]);
                }
            }
        }
        if (availableCells.length === 0) {
            return false;
        } 
        const randomIndex = randomInt(availableCells.length);
        this.appleCell = availableCells[randomIndex];
        const appleRow = this.appleCell[0];
        const appleCol = this.appleCell[1];
        this.world.cells[appleRow][appleCol] = APPLE_CELL;
        return true;
    }

    setState(state) {
        self.state = state;
        if (state === "WON") {
            this.display;
        } else if (state === "LOST") {
            this.display;
        }
    }

    step() {
        const direction = this.player.getMove();
        const snakeHead = this.snakeCells[0];
        const snakeHeadRow = snakeHead[0];
        const snakeHeadCol = snakeHead[1];
        const diff = DIRECTION_TO_DIFF[direction];
        const diffRow = diff[0];
        const diffCol = diff[1];
        let nextRow = snakeHeadRow + diffRow;
        let nextCol = snakeHeadCol + diffCol;
        if (nextRow < 0) { nextRow = this.world.height - 1; }
        else if (nextCol < 0) { nextCol = this.world.width - 1; }
        else if (nextRow >= this.world.height) { nextRow = 0; }
        else if (nextCol >= this.world.width) { nextCol = 0; }

        if (this.world.cells[nextRow][nextCol] === SNAKE_CELL) {
            this.display.render(this.world);
            this.stop(LOST);
            return;
        }

        const ateApple = this.world.cells[nextRow][nextCol] === APPLE_CELL;

        this.snakeCells.unshift([nextRow, nextCol]);
        this.world.cells[nextRow][nextCol] = SNAKE_CELL;

        if (ateApple) {
            const applePlaced = this.placeApple();
            if (!applePlaced) {
                this.stop(LOST);
            }
        } else {
            const snakeTail = this.snakeCells.pop();
            const snakeTailRow = snakeTail[0];
            const snakeTailCol = snakeTail[1];
            this.world.cells[snakeTailRow][snakeTailCol] = EMPTY_CELL;
        }

        this.display.render(this.world);
    }

    start() {
        this.timer = setInterval(() => this.step(), 250);
        this.state = RUNNING;
    }

    stop(state) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.state = state;
        if (state === WON) {
            this.display.showMessage("You won!");
        } else if (state === LOST) {
            this.display.showMessage("You lost!");
        }
    }
}

function main() {
    const game = new Game(8, 8);
    game.start();
}

main();
