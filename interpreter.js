let programCounter = 0;
let program = ""
let memory = []
let canvas = null;
let labels = {}
const cellSize = 40;
let readMemoryCellsThisLine = []
let writtenMemoryCellsThisLine = []

function initMemory() {
    memory = [];
    let memorySize = 100// document.getElementById("memorySize").value;
    for (let i = 0; i < memorySize; i++) {
        memory.push(0);
    }
    canvas = document.getElementById("memoryCanvas");
    drawMemory();
}

function loadProgramFromTextarea() {
    program = document.getElementById("program").value;
}

function drawMemory() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cellsPerRow = Math.floor(canvas.width / cellSize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < memory.length; i++) {
        const x = (i % cellsPerRow) * cellSize;
        const y = Math.floor(i / cellsPerRow) * cellSize;

        ctx.strokeStyle = '#3a4254';
        let width = 1
        if (readMemoryCellsThisLine.includes(i)) {
            ctx.strokeStyle = '#00ff00';
            width = 5;
        }
        if (writtenMemoryCellsThisLine.includes(i)){
            ctx.strokeStyle = '#0000ff';

            width = 5;
        }
        ctx.lineWidth = width;
        ctx.strokeRect(x, y, cellSize, cellSize,width);

        ctx.fillStyle = '#e6e9ee';
        ctx.font = '18px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((memory[i] ?? 0).toString(), x + cellSize / 2, y + cellSize / 2);
    }

    // Update PC display in UI as well
    const pcEl = document.getElementById('pcDisplay');
    if (pcEl) pcEl.textContent = programCounter.toString();
}

function read(address) {
    readMemoryCellsThisLine.push(address);
    return memory[address];
}

function write(address, value) {
    writtenMemoryCellsThisLine.push(address);
    memory[address] = value;
}

function runLine() {
    loadProgramFromTextarea()

    const lines = program.split('\n');
    const line = lines[programCounter];

    if (programCounter < 0 || programCounter >= lines.length) {
        return;
    }
    if (line.startsWith("#")) {
        return;
    }

    const parameters = line.split(' ');
    const command = parameters[0];

    for (const parameterIndex in parameters) {
        parameters[parameterIndex] = parseInt(parameters[parameterIndex]);
    }
    if (command === "add") {
        write(parameters[3], read(parameters[1]) + read(parameters[2]));
    } else if (command === "sub") {
        write(parameters[3], read(parameters[1]) - read(parameters[2]));
    } else if (command === "jmp") {
        programCounter = labels[parameters[1]];
    } else if (command === "eq") {
        if (read(parameters[1]) === read(parameters[2])) {
            programCounter = labels[parameters[3]];
        }
    } else if (command === "lt") {
        if (read(parameters[1]) < read(parameters[2])) {
            programCounter = labels[parameters[3]];
        }
    } else if (command === "set") {
        write(parameters[1], parameters[2]);
    } else if (command === "read") {
        write(parameters[2], read(read(parameters[1])));
    } else if (command === "write") {
        write(read(parameters[1], read(parameters[2])));
    } else if (command === "label") {
        labels[parameters[1]] = programCounter;
    } else {
        setError("Unknown command: " + command);
        return;
    }
    programCounter++;
    drawMemory();
    writtenMemoryCellsThisLine = []
    readMemoryCellsThisLine = []
}

function resetProgram() {
    programCounter = 0;
    drawMemory();
}

// Load exercise description from a text file (e.g., 1.txt) and display in the center panel
async function loadExercise(n) {
    const el = document.getElementById('exerciseContent');
    if (!el) return;
    try {
        el.textContent = 'Loading exercise #' + n + '...';
        const res = await fetch(String(n) + '.txt');


        el.innerHTML = marked.parse(await res.text());
    } catch (err) {
        el.textContent = 'Could not load exercise ' + n + '.txt\n' + (err?.message || String(err));
    }
}

function setError(error) {
    const el = document.getElementById('error');
    if (!el) return;
    el.textContent = error;
}

window.onload