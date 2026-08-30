public class King extends Piece {
    public King(boolean white) {
        super(white, 'K');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        int dx = Math.abs(start.getX() - end.getX());
        int dy = Math.abs(start.getY() - end.getY());
        return dx <= 1 && dy <= 1 && (dx + dy > 0);
    }
}
