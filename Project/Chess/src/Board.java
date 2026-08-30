public class Board {
    private final Spot[][] boxes;

    public Board() {
        boxes = new Spot[8][8];
        resetBoard();
    }

    public Spot getBox(int x, int y) {
        if (!isValidPosition(x, y)) {
            throw new IllegalArgumentException("Index out of bound: (" + x + ", " + y + ")");
        }
        return boxes[x][y];
    }

    public static boolean isValidPosition(int x, int y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    public void resetBoard() {
        for (int x = 0; x < 8; x++) {
            for (int y = 0; y < 8; y++) {
                boxes[x][y] = new Spot(x, y, null);
            }
        }

        // Black pieces
        boxes[0][0].setPiece(new Rook(false));
        boxes[0][1].setPiece(new Knight(false));
        boxes[0][2].setPiece(new Bishop(false));
        boxes[0][3].setPiece(new Queen(false));
        boxes[0][4].setPiece(new King(false));
        boxes[0][5].setPiece(new Bishop(false));
        boxes[0][6].setPiece(new Knight(false));
        boxes[0][7].setPiece(new Rook(false));
        for (int y = 0; y < 8; y++) {
            boxes[1][y].setPiece(new Pawn(false));
        }

        // White pieces
        boxes[7][0].setPiece(new Rook(true));
        boxes[7][1].setPiece(new Knight(true));
        boxes[7][2].setPiece(new Bishop(true));
        boxes[7][3].setPiece(new Queen(true));
        boxes[7][4].setPiece(new King(true));
        boxes[7][5].setPiece(new Bishop(true));
        boxes[7][6].setPiece(new Knight(true));
        boxes[7][7].setPiece(new Rook(true));
        for (int y = 0; y < 8; y++) {
            boxes[6][y].setPiece(new Pawn(true));
        }
    }

    public boolean isPathClear(Spot start, Spot end) {
        int dx = Integer.compare(end.getX(), start.getX());
        int dy = Integer.compare(end.getY(), start.getY());

        int x = start.getX() + dx;
        int y = start.getY() + dy;
        while (x != end.getX() || y != end.getY()) {
            if (boxes[x][y].getPiece() != null) {
                return false;
            }
            x += dx;
            y += dy;
        }
        return true;
    }

    public Spot findKing(boolean whiteSide) {
        for (int x = 0; x < 8; x++) {
            for (int y = 0; y < 8; y++) {
                Piece piece = boxes[x][y].getPiece();
                if (piece instanceof King && piece.isWhite() == whiteSide) {
                    return boxes[x][y];
                }
            }
        }
        return null;
    }
}
