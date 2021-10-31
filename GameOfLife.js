$(document).ready(() => {
  $(() => $('[data-toggle="popover"]').popover());
  document.getElementById('size').addEventListener('input', () => setupValues());
  document.getElementById('pattern').addEventListener('change', () => {
    let customControls = document.getElementById('customControls');
    checkPattern();
    document.getElementById('pattern').blur();

    if(document.getElementById('pattern').value === 'Custom')
      customControls.classList.remove('d-none');
    else
      customControls.classList.add('d-none');
  });
  document.getElementById('unlimited').addEventListener('change', () => {
    bounds = bounds ? false : true;
    customDraw();
  });
  document.getElementById('showGrid').addEventListener('change', () => {
    showGrid = showGrid ? false : true;
    customDraw();
  });
  document.getElementById('start').addEventListener('click', () => {
    drawing = false;
    document.getElementById('pause').disabled = false;
    document.getElementById('start').disabled = true;
    document.getElementById('speed').disabled = false;
    document.getElementById('size').disabled = true;
    document.getElementById('pattern').disabled = true;
    document.getElementById('rule').disabled = true;
    document.getElementById('start').blur();
    loop();
  });
  document.getElementById('pause').addEventListener('click', () => {
    drawing = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('start').disabled = false;
    document.getElementById('speed').disabled = true;
    document.getElementById('size').disabled = false;
    document.getElementById('pattern').disabled = false;
    document.getElementById('rule').disabled = false;
    document.getElementById('pause').blur();
    noLoop();
  });
  document.getElementById('speed').addEventListener('input', () => {
    frameRate(parseInt(document.getElementById('speed').value));
    let speed = document.getElementById('speed').value;
    document.getElementById('fps').innerHTML = `${speed < 10 ? 0 : ''}${speed}`;
  });
  document.getElementById('hide_menu').addEventListener('click', async () => {
    document.getElementById('menu').style.right = '-400px';
    await new Promise(r => setTimeout(r, 300));
    document.getElementById('show_menu').style.visibility = 'visible';
    document.getElementById('show_menu').style.opacity = 1;
  });
  document.getElementById('show_menu').addEventListener('click', async () => {
    document.getElementById('menu').style.right = '10px';
    document.getElementById('show_menu').style.opacity = 0;
    await new Promise(r => setTimeout(r, 500));
    document.getElementById('show_menu').style.visibility = 'hidden';
  });
});

let tileSize, nCols, nRows, grid, bounds, showGrid, drawing;

function setup(){
  let field = createCanvas(windowWidth, windowHeight);
  field.mousePressed(drawCustomStandard);
  field.doubleClicked(drawCustomDoubleClick);
  fill(3, 19, 255);
  strokeWeight(0.2);
  frameRate(parseInt(document.getElementById('speed').value));
  bounds = true;
  showGrid = true;
  drawing = true;
  setupValues();
  noLoop();
}

function draw(){
  customDraw();
  grid = calculateNextGeneration();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  setupValues();
}

function mouseDragged(){
  if($('#defaultCanvas0:hover').length === 1) drawCustomStandard();
}

function keyPressed(){
  if(keyCode === 32)//Space
    if(document.getElementById('start').disabled == false)
      document.getElementById('start').click();
    else document.getElementById('pause').click();
  else if(keyCode === 27){//Esc
    document.getElementById('pause').click();
    clearGrid();
  }
}

function setupValues(){
  let multiplier = pow(2, document.getElementById('size').value)/2;
  let smallerSize = min(width, height);
  tileSize = max(smallerSize/screen.pixelDepth/multiplier, 3);
  nCols = Math.floor(width/tileSize);
  nRows = Math.floor(height/tileSize);
  checkPattern();
  customDraw();
}

function customDraw(){
  clear();
  if(showGrid) drawGrid();
  drawCells();
  if(bounds) drawBorders();
}

function clearGrid(){
  grid = createGrid();
  customDraw();
}

function drawCustomStandard(){
  if(document.getElementById('pattern').value === 'Custom' && drawing){
    let cellX = round((mouseX - (mouseX % tileSize))/tileSize);
    let cellY = round((mouseY - (mouseY % tileSize))/tileSize);

    if(mouseButton === 'left') grid[cellX][cellY] = 1;
    else if(mouseButton === 'right') grid[cellX][cellY] = 0;

    customDraw();
  }
}

function drawCustomDoubleClick(){
  if(document.getElementById('pattern').value === 'Custom' && drawing){
    let cellX = round((mouseX - (mouseX % tileSize))/tileSize);
    let cellY = round((mouseY - (mouseY % tileSize))/tileSize);

    grid[cellX][cellY] = 0;
    customDraw();
  }
}

function drawBorders(){
  fill(0);
  for (let i = 0; i < nCols; i++) rect(i * tileSize, 0, tileSize, tileSize);//Top Border
  for (let i = 0; i < nRows; i++) rect(0, i * tileSize, tileSize, tileSize);//Left Border
  for (let i = 0; i < nCols; i++) rect(i * tileSize, (nRows-1)*tileSize, tileSize, tileSize);//Bottom Border
  for (let i = 0; i < nRows; i++) rect((nCols-1)*tileSize, i * tileSize, tileSize, tileSize);//Right Border
  fill(3, 19, 255);
}

function createGrid() {
  let newGrid = new Array(nCols);
  for (let i = 0; i < nCols; i++) newGrid[i] = new Array(nRows);
  for (let i = 0; i < nCols; i++)
    for (let j = 0; j < nRows; j++) newGrid[i][j] = 0;
  return newGrid;
}

function drawGrid() {
  for (let i = 0; i < width; i += tileSize) line(i, 0, i, height); //Vertical bars
  for (let i = 0; i < height; i += tileSize) line(0, i, width, i); //Horizontal bars
}

function drawCells() {
  for (let i = 0; i < nCols; i++)
    for (let j = 0; j < nRows; j++)
      if (grid[i][j] === 1)
        rect(i * tileSize, j * tileSize, tileSize, tileSize);
}

function calculateNextGeneration() {

  let survive = [0,0,0,0,0,0,0,0,0];
  let born = [0,0,0,0,0,0,0,0,0];
  let slashPassed = false;

  for (const element of document.getElementById('rule').value)
    if (element === '/') slashPassed = true;
    else if (slashPassed) born[element] = 1;
    else survive[element] = 1;
    
  let nextGrid = createGrid();
  let offset = bounds ? 1 : 0;

  for (let i = offset; i < nCols-offset; i++)
    for (let j = offset; j < nRows-offset; j++) {
      let actualCell = grid[i][j];
      let neighbors = 0;

      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          if (!(x === 0 && y === 0))
            neighbors += grid[(x + i + nCols) % nCols][(y + j + nRows) % nRows];

      if (actualCell === 1 && survive[neighbors]) nextGrid[i][j] = 1; // Cell survives
      else if (actualCell === 0 && born[neighbors]) nextGrid[i][j] = 1; // Cell is born
      else nextGrid[i][j] = 0; // Cell dies or remains dead
    }
  return nextGrid;
}

function checkPattern(){
  grid = createGrid();
  drawing = false;
  switch(document.getElementById('pattern').value){
    case 'Custom': drawing = true; break;
    case 'Gosper Glider Gun': applyGosperGliderGun(); break;
    case 'Random': applyRandomPattern(); break;
    case 'Pulsar1': applyPulsar1(); break;
    case 'Pulsar2': applyPulsar2(); break;
  }
  customDraw();
}

function applyGosperGliderGun(){
  let GosperGliderGun = [[1, 5],[1, 6],[2, 5],[2, 6],[11, 5],[11, 6],[11, 7],[12, 4],[12, 8],[13, 3],[13, 9],[14, 3],[14, 9],[15, 6],[16, 4],[16, 8],[17, 5],[17, 6],[17, 7],[18, 6],[21, 3],[21, 4],[21, 5],[22, 3],[22, 4],[22, 5],[23, 2],[23, 6],[25, 1],[25, 2],[25, 6],[25, 7],[35, 3],[35, 4],[36, 3],[36, 4]];
  GosperGliderGun.forEach(coords => grid[coords[0]][coords[1]] = 1);
}

function applyPulsar1(){
  let Pulsar1 = [[20,6],[20,7],[20,8],[20,9],[20,10],[20,11],[20,12],[20,13],[20,14],[20,15]];
  Pulsar1.forEach(coords => grid[coords[0]][coords[1]] = 1);
}

function applyPulsar2(){
  let Pulsar2 = [[10,7],[10,13],[11,7],[11,13],[12,7],[12,8],[12,12],[12,13],[14,3],[14,4],[14,5],[14,8],[14,9],[14,11],[14,12],[14,15],[14,16],[14,17],[15,5],[15,7],[15,9],[15,11],[15,13],[15,15],[16,7],[16,8],[16,12],[16,13],[18,7],[18,8],[18,12],[18,13],[19,5],[19,7],[19,9],[19,11],[19,13],[19,15],[20,3],[20,4],[20,5],[20,8],[20,9],[20,11],[20,12],[20,15],[20,16],[20,17],[22,7],[22,8],[22,12],[22,13],[23,7],[23,13],[24,7],[24,13]];
  Pulsar2.forEach(coords => grid[coords[0]][coords[1]] = 1);
}

function applyRandomPattern(){
  for (let i = 1; i < nCols-1; i++)
    for (let j = 1; j < nRows-1; j++)
      grid[i][j] = random() < 0.2 ? 1 : 0;
}
