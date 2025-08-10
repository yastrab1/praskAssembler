let programCounter = 0;
let program = ""
let memory = []
let canvas = null;

function initMemory(){
    let memorySize = document.getElementById("memorySize").value;
    for (let i = 0; i < memorySize; i++){
        memory.push(0);
    }
    canvas = document.getElementById("memoryCanvas");
    drawMemory();
}

function submitProgram(){
    program = document.getElementById("program").value;
}

function drawMemory() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cellSize = 20;
    const cellsPerRow = Math.floor(canvas.width / cellSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < memory.length; i++) {
        const x = (i % cellsPerRow) * cellSize;
        const y = Math.floor(i / cellsPerRow) * cellSize;

        ctx.strokeStyle = '#000';
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(memory[i].toString(), x + cellSize / 2, y + cellSize / 2);
    }
    ctx.fillText(programCounter.toString(), 400, 400)
}

function runLine() {
    line = program.split('\n')[programCounter];
    const parameters = line.split(' ');
    const command = parameters[0];
    for (const parameterIndex in parameters){
        parameters[parameterIndex] = parseInt(parameters[parameterIndex]);
    }
    if (command === "add"){
        memory[parameters[3]] = memory[parameters[1]] + memory[parameters[2]];
    }
    if (command === "sub"){
        memory[parameters[3]] = memory[parameters[1]] - memory[parameters[2]];
    }
    if (command === "mul"){
        memory[parameters[3]] = memory[parameters[1]] * memory[parameters[2]];
    }
    if (command === "div"){
        memory[parameters[3]] = Math.floor(memory[parameters[1]] / memory[parameters[2]]);
        memory[parameters[4]] = memory[parameters[1]] % memory[parameters[2]];
    }
    if (command === "jmp"){
        programCounter = parameters[1];
    }
    if (command === "eq") {
        if (memory[parameters[1]] === memory[parameters[2]]) {
            programCounter = parameters[3];
        }
    }
    if (command === "lt") {
        if (memory[parameters[1]] < memory[parameters[2]]) {
            programCounter = parameters[3];
        }
    }
    if (command === "set"){
        memory[parameters[1]] = parameters[2];
    }
    if (command === "read"){
        memory[parameters[2]] = memory[memory[parameters[1]]];
    }
    if (command === "write"){
        memory[memory[parameters[1]]] = memory[parameters[2]];
    }
    drawMemory();
    programCounter++;
}