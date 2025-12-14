let programCounter = 0;
let program = ""
let memory = []
let canvas = null;
let labels = {}
const cellSize = 40;
let readMemoryCellsThisLine = []
let writtenMemoryCellsThisLine = []
let selectedCell = null;
let savedProgram = false;
let currentOpenedProblem = null;
let lastExecutedLine = null;
let programRunning = false;
const maximumCellValue = 1000;

const commandSyntax = {
    "set": ["int","int"],
    "add": ["int","int","int"],
    "sub": ["int","int","int"],
    "copy": ["int","int"],
    "jump": ["string"],
    "eq": ["int","int","string"],
    "lt": ["int","int","string"],
    "read": ["int","int"],
    "write": ["int","int"],
}
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


function highlightLine() {
    if (!savedProgram) return;
    const programContainer = document.getElementById("programContainer");
    for (const children of programContainer.children) {
        if (children.tagName.toLowerCase() === "div") {
            children.removeAttribute("class")
        }
    }
    if (lastExecutedLine !== null && lastExecutedLine >= 0 && lastExecutedLine < programContainer.children.length) {
        programContainer.children[lastExecutedLine].className = "programLineHighlight";
    }
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
        highlightLine();
    }

    // Update PC display in UI as well
    const pcEl = document.getElementById('pcDisplay');
    if (pcEl) pcEl.textContent = programCounter.toString();
}

function read(address) {
    if (address < 0 || address >= memory.length) {
        setError("Čítanie mimo pamäte, z adresy: " + address);
        return;
    }
    readMemoryCellsThisLine.push(address);
    return memory[address];
}

function write(address, value) {
    if (address < 0 || address >= memory.length) {
        setError("Písanie mimo pamäte, na adresu: " + address);
        return;
    }
    if (value >= maximumCellValue) {
        setError(`Nedá sa napísať číslo väčšie než ${maximumCellValue}: ${value}`);
        return;
    }
    if (value < 0) {
        setError(`Nedá sa napísať záporné číslo: ${value}`);
        return;
    }
    writtenMemoryCellsThisLine.push(address);
    memory[address] = value;
}

function jump(label) {
    if (!labels[label]) {
        setError("Neznámy label: " + label);
        return;
    }
    programCounter = labels[label];
}

function runLine() {
    if (!savedProgram) return;
    const lines = program.split('\n');
    const currentIndex = programCounter;
    const line = lines[currentIndex];

    if (currentIndex < 0 || currentIndex >= lines.length) {
        return;
    }
    programCounter++;
    if (isIrrelevantLine(line)) {
        // Also consider comments/labels as the last executed line for highlighting
        lastExecutedLine = currentIndex;
        drawMemory();
        runLine(); //Auto-skip irrelevant lines
        return;
    }

    const parameters = line.split(' ');
    const command = parameters[0];

    for (const parameterIndex in parameters) {
        parameters[parameterIndex] = parameters[parameterIndex];
    }
    // Record the line we are executing now (non-comment/non-label)
    lastExecutedLine = currentIndex;
    if (command === "add") {
        write(parseInt(parameters[3]), read(parseInt(parameters[1])) + read(parseInt(parameters[2])));
    } else if (command === "sub") {
        write(parseInt(parameters[3]), read(parseInt(parameters[1])) - read(parseInt(parameters[2])));
    } else if (command === "copy") {
        write(parseInt(parameters[2]), read(parseInt(parameters[1])));
    } else if (command === "jump") {
        jump(parameters[1]);
    } else if (command === "eq") {
        if (read(parseInt(parameters[1])) === read(parseInt(parameters[2]))) {
            jump(parameters[3]);
        }
    } else if (command === "lt") {
        if (read(parseInt(parameters[1])) < read(parseInt(parameters[2]))) {
            jump(parameters[3]);
        }
    } else if (command === "set") {
        write(parseInt(parameters[1]), parseInt(parameters[2]));
    } else if (command === "read") {
        const pointer_addr = parseInt(parameters[1]);
        const result_addr = parseInt(parameters[2]);
        write(result_addr, read(read(pointer_addr)));
    } else if (command === "write") {
        const ptr_addr = parseInt(parameters[1]);
        const source_addr = parseInt(parameters[2]);
        write(read(ptr_addr), read(source_addr));
    } else {
        setError("Neznámy príkaz: " + command);
        return;
    }

    drawMemory();
    writtenMemoryCellsThisLine = []
    readMemoryCellsThisLine = []
    selectedCell = null;
}

function resetProgram() {
    programCounter = 0;
    lastExecutedLine = null;
    drawMemory();
}

function loadProgramFromLocalStorage(exercise) {
    editProgram()
    if (localStorage.getItem(exercise)) {
        document.getElementById("program").value = localStorage.getItem(exercise)
    }
}

// Load exercise description from a text file (e.g., 1.txt) and display in the center panel
async function loadExercise(n) {
    currentOpenedProblem = n;
    const el = document.getElementById('exerciseContent');
    if (!el) return;
    try {
        el.textContent = 'Loading exercise #' + n + '...';
        const res = await fetch("/assembler/"+String(n) + '.md');


        el.innerHTML = marked.parse(await res.text());
    } catch (err) {
        el.textContent = 'Could not load exercise ' + n + '.txt\n' + (err?.message || String(err));
    }
    loadProgramFromLocalStorage(n);
}

function setError(error) {
    const el = document.getElementById('error');
    if (!el) return;
    el.textContent = error;
}

function addError(error) {
    const el = document.getElementById('error');
    if (!el) return;
    setError(el.textContent + "\n" + error);
}

function loadLabels() {
    const lines = program.split('\n');
    for (const i in lines) {
        const parameters = lines[i].split(' ');
        if (parameters[0] === "label") {
            labels[parameters[1]] = parseInt(i);
        }
    }
}

function saveProgram() {
    if (savedProgram) return;
    setError("")

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
    localStorage.setItem(currentOpenedProblem, program)
    syntaxCheck();
    savedProgram = true;
}

function editProgram() {
    if (!savedProgram) return;
    setError("")
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
    savedProgram = false;
}

async function runProgram(wait = true,stepTimeout=1000) {
    let steps = 0;
    programRunning = true;
    saveProgram();
    resetProgram();
    while (programCounter < program.split('\n').length) {
        if (!programRunning) return
        console.log(programCounter);
        runLine();
        steps+=1;
        if (wait){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (steps === stepTimeout){
            programRunning = false;
            return;
        }
    }
    programRunning = false;
}

function setupMemoryFromEntry(entry) {
    const conditions = entry["startingCondition"]
    console.log(conditions)
    for (const [addr, value] of Object.entries(conditions)) {
        write(parseInt(addr), parseInt(value))
    }
}

function checkResultsFromEntry(entry) {
    const conditions = entry["result"]

    for (const [addr, value] of Object.entries(conditions)) {

        if (read(parseInt(addr)) !== parseInt(value)) {
            setError("Nesprávna odpoveď")
            return false;
        }
    }
    return true;
}


async function testProgram() {
    if (currentOpenedProblem === null) {
        setError("Najprv vyber nejakú úlohu")
        return
    }
    setError("")
    const testingManifest = await fetch("testingManifest.json").then(res => res.json());
    let myProblem = null;
    for (const problem of testingManifest["problems"]) {
        if (problem["name"] === currentOpenedProblem) {
            myProblem = problem;
        }
    }
    let result = true;
    for (const entry of myProblem["testingEntries"]) {
        initMemory();
        setupMemoryFromEntry(entry);
        await runProgram(false);
        result = result && checkResultsFromEntry(entry);
    }
    initMemory()
    alert(result ? "Správne!" : "Nesprávne!")
    if (result) {
        document.getElementById(currentOpenedProblem).classList.add("finished");
        const completed = localStorage.getItem("completed")
        localStorage.setItem("completed", completed + "," + currentOpenedProblem)
        displayConfetti()
    }

}

function displayFinishedProblems() {
    if (localStorage.getItem("completed") === null) return;
    const completed = localStorage.getItem("completed").split(",")
    for (const key of completed) {
        const el = document.getElementById(key);
        if (el) {
            el.classList.add("finished");
        }
    }
}

function pauseProgram() {
    programRunning = false;
}

function isIrrelevantLine(line) {
    return line.startsWith("#") || line.startsWith("label") || line.trim() === "";
}

function syntaxCheck(){
    const lines = program.split('\n');
    for (const line of lines) {
        if (isIrrelevantLine(line)) {continue}

        const parameters = line.split(' ');
        const command = parameters[0];
        if (!commandSyntax[parameters[0]]) {
            addError("Riadok " + (lines.indexOf(line) + 1) + ": Neznámy: " + parameters[0]);
            continue
        }
        const syntax = commandSyntax[command];
        if (parameters.length !== syntax.length+1) {
            addError(`Riadok ${(lines.indexOf(line) + 1)} Nesprávny počet parametrov pre: ${command}, má byť ${syntax.length}, je ${parameters.length-1}`);
        }
        for (let i = 1; i < syntax.length; i++) {
            if (syntax[i] === "int") {
                if (isNaN(parseInt(parameters[i]))) {
                    addError(`Line ${(lines.indexOf(line) + 1)} Neplatné číslo pre parameter ${i + 1}: ${parameters[i]}`);
                }
            }
        }

    }
}

document.addEventListener("DOMContentLoaded", function () {
    displayFinishedProblems()
    canvas = document.getElementById("memoryCanvas");
    const textArea = document.getElementById("program");
    initMemory();
    canvas.addEventListener("click", function (e) {
        canvas.focus()
        const cellsPerRow = Math.floor(canvas.width / cellSize);
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let addr = Math.floor(x / cellSize) + Math.floor(y / cellSize) * cellsPerRow;
        selectedCell = addr;
        drawMemory()
    });
    canvas.addEventListener("keydown", function (e) {
        if (e.key.toLowerCase() === "backspace") {
            write(selectedCell, Math.floor(read(selectedCell) / 10));
            drawMemory()
            return;
        }
        if (e.key.toLowerCase() === "escape") {
            selectedCell = null;
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
})


function displayConfetti() {
    const colors = ['#ff0', '#0f0', '#0ff', '#f0f', '#f00', '#00f'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');

        const size = Math.floor(Math.random() * 8 + 4) + 'px';
        confetti.style.width = size;
        confetti.style.height = size;

        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        confetti.style.position = 'absolute';
        confetti.style.left = Math.random() * (window.innerWidth-50) + 'px';
        confetti.style.top = Math.random() * (window.innerHeight) / 2 + 'px';

        const rotate = Math.random() * 360;
        confetti.style.transform = `rotate(${rotate}deg)`;

        const duration = Math.random() * 2 + 2;
        confetti.style.transition = `transform ${duration}s linear, top ${duration}s linear, opacity ${duration}s`;

        document.body.appendChild(confetti);

        requestAnimationFrame(() => {
            confetti.style.top = (window.innerHeight-20) + 'px';
            confetti.style.transform = `rotate(${rotate + 360}deg)`;
            confetti.style.opacity = '0';
        });

        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);

    }
}
