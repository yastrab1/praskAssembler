let programCounter = 0;
let program = ""
let memory = []
let canvas = null;
let labels = {}
const cellSize = 40;
let readMemoryCellsThisLine = []
let writtenMemoryCellsThisLine = []
let selectedCell = null;

function initMemory() {
    memory = [];
    let memorySize = 100// document.getElementById("memorySize").value;
    for (let i = 0; i < memorySize; i++) {
        memory.push(0);
    }
    canvas = document.getElementById("memoryCanvas");
    writtenMemoryCellsThisLine = []
    readMemoryCellsThisLine = []
    selectedCell = null;
    drawMemory();
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
        if (writtenMemoryCellsThisLine.includes(i)) {
            ctx.strokeStyle = '#0000ff';
            width = 5;
        }
        if (writtenMemoryCellsThisLine.includes(i) && readMemoryCellsThisLine.includes(i)) {
            ctx.strokeStyle = '#ff00ff';
            width = 5
        }
        if (selectedCell === i) {
            ctx.strokeStyle = '#00ff00';
            width = 5;
        }
        ctx.lineWidth = width;
        ctx.strokeRect(x, y, cellSize, cellSize, width);

        ctx.fillStyle = '#e6e9ee';
        ctx.font = '18px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((memory[i] ?? 0).toString(), x + cellSize / 2, y + cellSize / 2);

        const programContainer = document.getElementById("programContainer");
        for (const children of programContainer.children) {
            if (children.tagName.toLowerCase() === "div") {
                children.removeAttribute("class")
            }
        }
        if (programCounter < programContainer.children.length) {
            programContainer.children[programCounter].className = "programLineHighlight"
        }
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
    const lines = program.split('\n');
    const line = lines[programCounter];

    if (programCounter < 0 || programCounter >= lines.length) {
        return;
    }
    programCounter++;
    if (line.startsWith("#") || line.startsWith("label")) {

        drawMemory()
        return;
    }

    const parameters = line.split(' ');
    const command = parameters[0];

    for (const parameterIndex in parameters) {
        parameters[parameterIndex] = parameters[parameterIndex];
    }
    if (command === "add") {
        write(parseInt(parameters[3]), read(parseInt(parameters[1])) + read(parseInt(parameters[2])));
    } else if (command === "sub") {
        write(parseInt(parameters[3]), read(parseInt(parameters[1])) - read(parseInt(parameters[2])));
    }
        // else if (command === "mul") {
        //     write(parameters[3], read(parameters[1]) * read(parameters[2]));
    // }
    else if (command === "jmp") {
        programCounter = labels[parameters[1]];
    } else if (command === "eq") {
        if (read(parseInt(parameters[1])) === read(parseInt(parameters[2]))) {
            programCounter = labels[parameters[3]];
        }
    } else if (command === "lt") {
        if (read(parseInt(parameters[1])) < read(parseInt(parameters[2]))) {
            programCounter = labels[parameters[3]];
        }
    } else if (command === "set") {
        write(parseInt(parameters[1]), parseInt(parameters[2]));
    } else if (command === "read") {
        write(read(read(parseInt(parameters[1]))), parseInt(parameters[2]));
    } else if (command === "write") {
        write(read(parseInt(parameters[1])), read(parseInt(parameters[2])));
    }else {
        setError("Unknown command: " + command);
        return;
    }

    drawMemory();
    writtenMemoryCellsThisLine = []
    readMemoryCellsThisLine = []
    selectedCell = null;
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
        const res = await fetch(String(n) + '.md');


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
function loadLabels(){
    const lines = program.split('\n');
    for (const i in lines) {
        console.log(i)
        const parameters = lines[i].split(' ');
        if (parameters[0] === "label") {
            console.log(parameters[1])
            console.log(parseInt(i))
            labels[parameters[1]] = parseInt(i);
        }
    }
}

function saveProgram() {
    let programContainer = document.getElementById("programContainer");
    let programTextArea = document.getElementById("program");
    program = programTextArea.value;
    loadLabels()

    let programLines = program.split('\n');
    let children = []
    for (let child of programContainer.children) {
        children.push(child)
    }

    for (const child of children) {
        programContainer.removeChild(child)
    }
    for (const line of programLines) {
        programContainer.appendChild(document.createElement("div")).textContent = line;
    }

}

function editProgram() {
    let programContainer = document.getElementById("programContainer");
    let children = []
    for (let child of programContainer.children) {
        children.push(child)
    }

    for (const child of children) {
        programContainer.removeChild(child)
    }


    let textarea = document.createElement("textarea");
    textarea.id = "program";
    textarea.value = program;
    textarea.rows = 20;
    textarea.placeholder = "Enter your program here...";
    programContainer.appendChild(textarea);
}
async function runProgram() {
    initMemory();
    saveProgram();
    resetProgram();
    while (programCounter < program.split('\n').length) {
        console.log(programCounter);
        runLine();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

}
document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("memoryCanvas");
    canvas.addEventListener("click", function (e) {
        const cellsPerRow = Math.floor(canvas.width / cellSize);
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let addr = Math.floor(x / cellSize) + Math.floor(y / cellSize) * cellsPerRow;
        selectedCell = addr;
        drawMemory()
    });
})
document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "backspace") {
        write(selectedCell, Math.floor(read(selectedCell) / 10));
        drawMemory()
        return;
    }

    const number = parseInt(e.key);
    if (isNaN(number)) {
        return;
    }
    if (selectedCell === null) {
        return;
    }


    write(selectedCell, read(selectedCell) * 10 + number);
    drawMemory()
})