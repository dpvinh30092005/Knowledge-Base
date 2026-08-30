public class Bishop extends Piece {
    public Bishop(boolean white) {
        super(white, 'B');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        int dx = Math.abs(start.getX() - end.getX());
        int dy = Math.abs(start.getY() - end.getY());
        if (dx != dy) {
            return false;
        }

        return board.isPathClear(start, end);
    }
}
