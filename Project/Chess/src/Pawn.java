public class Pawn extends Piece {
    public Pawn(boolean white) {
        super(white, 'P');
    }

    @Override
    public boolean canMove(Board board, Spot start, Spot end) {
        if (isDestinationFriendly(end)) {
            return false;
        }

        int direction = isWhite() ? -1 : 1;
        int dx = end.getX() - start.getX();
        int dy = end.getY() - start.getY();

        // Forward move by one square
        if (dy == 0 && dx == direction && end.getPiece() == null) {
            return true;
        }

        // Initial double-step move
        if (dy == 0 && dx == 2 * direction && !hasMoved() && end.getPiece() == null) {
            Spot between = board.getBox(start.getX() + direction, start.getY());
            return between.getPiece() == null;
        }

        // Diagonal capture
        if (Math.abs(dy) == 1 && dx == direction && end.getPiece() != null) {
            return end.getPiece().isWhite() != isWhite();
        }

        return false;
    }
}
