public class Rook extends Piece {
    public Rook(boolean white) {
        super(white, 'R');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        boolean sameRow = start.getX() == end.getX();
        boolean sameCol = start.getY() == end.getY();
        if (!sameRow && !sameCol) {
            return false;
        }

        return board.isPathClear(start, end);
    }
}
