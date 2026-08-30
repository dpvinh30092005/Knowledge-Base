public class Queen extends Piece {
    public Queen(boolean white) {
        super(white, 'Q');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        int dx = Math.abs(start.getX() - end.getX());
        int dy = Math.abs(start.getY() - end.getY());

        boolean diagonal = dx == dy;
        boolean straight = start.getX() == end.getX() || start.getY() == end.getY();
        if (!diagonal && !straight) {
            return false;
        }

        return board.isPathClear(start, end);
    }
}
