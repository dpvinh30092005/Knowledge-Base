import java.util.ArrayList;
import java.util.List;

public class Game {
    private final Player[] players;
    private final Board board;
    private Player currentTurn;
    private GameStatus status;
    private final List<Move> movesPlayed;

    public Game(Player p1, Player p2) {
        players = new Player[2];
        board = new Board();
        movesPlayed = new ArrayList<>();
        initialize(p1, p2);
    }

    private void initialize(Player p1, Player p2) {
        players[0] = p1;
        players[1] = p2;
        board.resetBoard();
        status = GameStatus.ACTIVE;
        movesPlayed.clear();
        currentTurn = p1.isWhiteSide() ? p1 : p2;
    }

    public Board getBoard() {
        return board;
    }

    public Player getCurrentTurn() {
        return currentTurn;
    }

    public GameStatus getStatus() {
        return status;
    }

    public boolean isEnd() {
        return status == GameStatus.BLACK_WIN
                || status == GameStatus.WHITE_WIN
                || status == GameStatus.FORFEIT
                || status == GameStatus.STALEMATE
                || status == GameStatus.RESIGNATION;
    }

    public void resign(Player player) {
        if (isEnd()) {
            return;
        }
        status = player.isWhiteSide() ? GameStatus.BLACK_WIN : GameStatus.WHITE_WIN;
    }

    public boolean playerMove(Player player, int startX, int startY, int endX, int endY) {
        if (isEnd() || player != currentTurn) {
            return false;
        }
        if (!Board.isValidPosition(startX, startY) || !Board.isValidPosition(endX, endY)) {
            return false;
        }

        Spot start = board.getBox(startX, startY);
        Spot end = board.getBox(endX, endY);
        Move move = new Move(player, start, end);

        if (!isLegalMove(player.isWhiteSide(), start, end)) {
            return false;
        }

        applyMove(move);
        movesPlayed.add(move);
        updateStatusAfterMove(player);
        if (!isEnd()) {
            switchTurn();
        }
        return true;
    }

    private void switchTurn() {
        currentTurn = (currentTurn == players[0]) ? players[1] : players[0];
    }

    private boolean isLegalMove(boolean movingWhite, Spot start, Spot end) {
        if (start == end) {
            return false;
        }

        Piece piece = start.getPiece();
        if (piece == null || piece.isWhite() != movingWhite) {
            return false;
        }

        if (!piece.canMove(board, start, end)) {
            return false;
        }

        return !wouldLeaveKingInCheck(start, end, movingWhite);
    }

    private boolean wouldLeaveKingInCheck(Spot start, Spot end, boolean movingWhite) {
        Piece movingPiece = start.getPiece();
        Piece capturedPiece = end.getPiece();

        end.setPiece(movingPiece);
        start.setPiece(null);

        boolean inCheck = isKingInCheck(movingWhite);

        start.setPiece(movingPiece);
        end.setPiece(capturedPiece);
        return inCheck;
    }

    private void applyMove(Move move) {
        Piece piece = move.getStart().getPiece();
        Piece captured = move.getEnd().getPiece();
        move.setPieceKilled(captured);

        if (captured != null) {
            captured.setKilled(true);
        }

        move.getEnd().setPiece(piece);
        move.getStart().setPiece(null);
        piece.setMoved(true);

        if (piece instanceof Pawn) {
            int lastRank = piece.isWhite() ? 0 : 7;
            if (move.getEnd().getX() == lastRank) {
                Queen promoted = new Queen(piece.isWhite());
                promoted.setMoved(true);
                move.getEnd().setPiece(promoted);
            }
        }
    }

    private void updateStatusAfterMove(Player movedPlayer) {
        boolean opponentWhite = !movedPlayer.isWhiteSide();
        boolean opponentInCheck = isKingInCheck(opponentWhite);
        boolean opponentHasMove = hasAnyLegalMove(opponentWhite);

        if (opponentInCheck && !opponentHasMove) {
            status = movedPlayer.isWhiteSide() ? GameStatus.WHITE_WIN : GameStatus.BLACK_WIN;
            return;
        }

        if (!opponentInCheck && !opponentHasMove) {
            status = GameStatus.STALEMATE;
            return;
        }

        status = opponentInCheck ? GameStatus.CHECK : GameStatus.ACTIVE;
    }

    public boolean isKingInCheck(boolean whiteSide) {
        Spot king = board.findKing(whiteSide);
        if (king == null) {
            return false;
        }
        return isSquareUnderAttack(king.getX(), king.getY(), !whiteSide);
    }

    private boolean isSquareUnderAttack(int x, int y, boolean byWhite) {
        Spot target = board.getBox(x, y);
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                Spot from = board.getBox(i, j);
                Piece attacker = from.getPiece();
                if (attacker == null || attacker.isWhite() != byWhite) {
                    continue;
                }
                if (attacker.canMove(board, from, target)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean hasAnyLegalMove(boolean whiteSide) {
        for (int sx = 0; sx < 8; sx++) {
            for (int sy = 0; sy < 8; sy++) {
                Spot start = board.getBox(sx, sy);
                Piece piece = start.getPiece();
                if (piece == null || piece.isWhite() != whiteSide) {
                    continue;
                }

                for (int ex = 0; ex < 8; ex++) {
                    for (int ey = 0; ey < 8; ey++) {
                        Spot end = board.getBox(ex, ey);
                        if (isLegalMove(whiteSide, start, end)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
