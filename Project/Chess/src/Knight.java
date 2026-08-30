public class Knight extends Piece {
    public Knight(boolean white) {
        super(white, 'N');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        int x = Math.abs(start.getX() - end.getX());
        int y = Math.abs(start.getY() - end.getY());
        return (x == 1 && y == 2) || (x == 2 && y == 1);
    }
}
