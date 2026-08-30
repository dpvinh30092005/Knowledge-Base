const boardEl = document.getElementById("board");
const turnLabel = document.getElementById("turnLabel");
const selectedLabel = document.getElementById("selectedLabel");
const moveForm = document.getElementById("moveForm");
const moveText = document.getElementById("moveText");
const resetBtn = document.getElementById("resetBtn");

const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟"
};

let board = [];
let whiteTurn = true;
let selected = null;

function createInitialBoard() {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];
}

function toSquare(x, y) {
  return `${String.fromCharCode(97 + y)}${8 - x}`;
}

function parseSquare(text) {
  if (!/^[a-h][1-8]$/i.test(text)) return null;
  const sq = text.toLowerCase();
  return {
    x: 8 - Number(sq[1]),
    y: sq.charCodeAt(0) - 97
  };
}

function getPieceColor(piece) {
  if (!piece) return null;
  return piece[0] === "w" ? "white" : "black";
}

function canMoveBasic(fromX, fromY, toX, toY) {
  const piece = board[fromX][fromY];
  if (!piece) return false;
  const sourceColor = getPieceColor(piece);
  const target = board[toX][toY];
  const targetColor = getPieceColor(target);

  if (targetColor && targetColor === sourceColor) return false;
  if (fromX === toX && fromY === toY) return false;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const type = piece[1];

  if (type === "N") return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
  if (type === "K") return adx <= 1 && ady <= 1;

  if (type === "P") {
    const dir = sourceColor === "white" ? -1 : 1;
    const startRow = sourceColor === "white" ? 6 : 1;
    if (dy === 0 && !target && dx === dir) return true;
    if (dy === 0 && !target && fromX === startRow && dx === 2 * dir && !board[fromX + dir][fromY]) return true;
    return ady === 1 && dx === dir && !!target && targetColor !== sourceColor;
  }

  if (type === "R" || type === "B" || type === "Q") {
    let stepX = 0;
    let stepY = 0;

    if (type === "R" || type === "Q") {
      if (fromX === toX) stepY = dy > 0 ? 1 : -1;
      else if (fromY === toY) stepX = dx > 0 ? 1 : -1;
    }
    if (type === "B" || (type === "Q" && stepX === 0 && stepY === 0)) {
      if (adx === ady) {
        stepX = dx > 0 ? 1 : -1;
        stepY = dy > 0 ? 1 : -1;
      }
    }

    if (stepX === 0 && stepY === 0) return false;

    let x = fromX + stepX;
    let y = fromY + stepY;
    while (x !== toX || y !== toY) {
      if (board[x][y]) return false;
      x += stepX;
      y += stepY;
    }
    return true;
  }

  return false;
}

function tryMove(fromX, fromY, toX, toY) {
  const piece = board[fromX][fromY];
  if (!piece) return false;
  const pieceColor = getPieceColor(piece);
  if ((whiteTurn && pieceColor !== "white") || (!whiteTurn && pieceColor !== "black")) return false;
  if (!canMoveBasic(fromX, fromY, toX, toY)) return false;

  board[toX][toY] = piece;
  board[fromX][fromY] = null;

  // Auto promote pawn to queen.
  if (piece === "wP" && toX === 0) board[toX][toY] = "wQ";
  if (piece === "bP" && toX === 7) board[toX][toY] = "bQ";

  whiteTurn = !whiteTurn;
  return true;
}

function onSquareClick(x, y) {
  const piece = board[x][y];
  if (!selected) {
    if (!piece) return;
    const color = getPieceColor(piece);
    if ((whiteTurn && color !== "white") || (!whiteTurn && color !== "black")) return;
    selected = { x, y };
  } else {
    if (!tryMove(selected.x, selected.y, x, y)) {
      const color = getPieceColor(piece);
      if (piece && ((whiteTurn && color === "white") || (!whiteTurn && color === "black"))) {
        selected = { x, y };
      } else {
        selected = null;
      }
    } else {
      selected = null;
    }
  }
  render();
}

function render() {
  boardEl.innerHTML = "";
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.square = toSquare(x, y);
      const piece = board[x][y];
      square.textContent = piece ? PIECES[piece] : "";
      if (piece) {
        square.classList.add(piece[0] === "w" ? "piece-white" : "piece-black");
      }

      if (selected && selected.x === x && selected.y === y) {
        square.classList.add("selected");
      } else if (selected && canMoveBasic(selected.x, selected.y, x, y)) {
        square.classList.add("target");
      }

      square.addEventListener("click", () => onSquareClick(x, y));
      boardEl.appendChild(square);
    }
  }

  turnLabel.textContent = `Turn: ${whiteTurn ? "White" : "Black"}`;
  selectedLabel.textContent = selected
    ? `Selected: ${toSquare(selected.x, selected.y)}`
    : "Selected: none";
}

moveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = moveText.value.trim();
  const parts = value.split(/\s+/);
  if (parts.length !== 2) return;

  const from = parseSquare(parts[0]);
  const to = parseSquare(parts[1]);
  if (!from || !to) return;

  if (tryMove(from.x, from.y, to.x, to.y)) {
    selected = null;
    moveText.value = "";
    render();
  }
});

resetBtn.addEventListener("click", () => {
  board = createInitialBoard();
  whiteTurn = true;
  selected = null;
  render();
});

board = createInitialBoard();
render();
