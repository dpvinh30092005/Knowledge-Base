# Chess Game (Java Console)

A playable 2-player chess game implemented in Java.

## Features
- Full 8x8 chess board setup
- Legal move validation for all pieces
- Turn-based play (White/Black)
- Check detection
- Checkmate detection
- Stalemate detection
- Pawn promotion (auto-promote to Queen)
- Simple CLI commands: moves, `resign`, `quit`

## Project Structure
- `src/Main.java`: Console UI and input loop
- `src/Game.java`: Game flow, legal move checks, game state transitions
- `src/Board.java`: Board model and setup
- `src/Piece.java` + concrete pieces in `src/*`: Piece movement rules

## Run
From project root:

```powershell
cd src
javac *.java
java Main
```

## Web UI (HTML/CSS)
You can also open a simple browser UI:

1. Open `ui/index.html` in your browser.
2. Click a piece, then click destination square.
3. Or type moves in format `e2 e4`.

## Play
Enter moves in coordinate format:
- `e2 e4`
- `g1 f3`

Special commands:
- `resign`
- `quit`
