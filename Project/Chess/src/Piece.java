public abstract class Piece {
    private final boolean white;
    private boolean killed;
    private boolean moved;
    private final char symbol;

    protected Piece(boolean white, char symbol) {
        this.white = white;
        this.symbol = symbol;
        this.killed = false;
        this.moved = false;
    }

    public boolean isWhite() {
        return white;
    }

    public boolean isKilled() {
        return killed;
    }

    public void setKilled(boolean killed) {
        this.killed = killed;
    }

    public boolean hasMoved() {
        return moved;
    }

    public void setMoved(boolean moved) {
        this.moved = moved;
    }

    public char getBoardChar() {
        return white ? Character.toUpperCase(symbol) : Character.toLowerCase(symbol);
    }

    protected boolean isDestinationFriendly(Spot end) {
        return end.getPiece() != null && end.getPiece().isWhite() == white;
    }

    public abstract boolean canMove(Board board, Spot start, Spot end);
}
