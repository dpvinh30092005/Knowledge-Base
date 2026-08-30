import java.util.Locale;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Player white = new HumanPlayer(true);
        Player black = new HumanPlayer(false);
        Game game = new Game(white, black);

        try (Scanner scanner = new Scanner(System.in)) {
            while (true) {
                printBoard(game.getBoard());
                printStatus(game);

                if (game.isEnd()) {
                    break;
                }

                String side = game.getCurrentTurn().isWhiteSide() ? "White" : "Black";
                System.out.print(side + " to move (e2 e4, resign, quit): ");
                String line = scanner.nextLine().trim().toLowerCase(Locale.ROOT);

                if (line.equals("quit")) {
                    System.out.println("Game ended by user.");
                    break;
                }

                if (line.equals("resign")) {
                    game.resign(game.getCurrentTurn());
                    continue;
                }

                String[] parts = line.split("\\s+");
                if (parts.length != 2 || !isValidSquare(parts[0]) || !isValidSquare(parts[1])) {
                    System.out.println("Invalid input. Use format: e2 e4");
                    continue;
                }

                int[] start = parseSquare(parts[0]);
                int[] end = parseSquare(parts[1]);
                boolean moved = game.playerMove(game.getCurrentTurn(), start[0], start[1], end[0], end[1]);

                if (!moved) {
                    System.out.println("Illegal move. Try again.");
                }
            }
        }
    }

    private static void printStatus(Game game) {
        GameStatus status = game.getStatus();
        if (status == GameStatus.ACTIVE) {
            return;
        }
        if (status == GameStatus.CHECK) {
            System.out.println("Check.");
            return;
        }
        if (status == GameStatus.WHITE_WIN) {
            System.out.println("Checkmate. White wins.");
            return;
        }
        if (status == GameStatus.BLACK_WIN) {
            System.out.println("Checkmate. Black wins.");
            return;
        }
        if (status == GameStatus.STALEMATE) {
            System.out.println("Stalemate.");
            return;
        }
        System.out.println("Game status: " + status);
    }

    private static boolean isValidSquare(String text) {
        if (text.length() != 2) {
            return false;
        }
        char file = text.charAt(0);
        char rank = text.charAt(1);
        return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
    }

    private static int[] parseSquare(String text) {
        int y = text.charAt(0) - 'a';
        int rank = text.charAt(1) - '0';
        int x = 8 - rank;
        return new int[] {x, y};
    }

    private static void printBoard(Board board) {
        System.out.println();
        for (int x = 0; x < 8; x++) {
            int rank = 8 - x;
            System.out.print(rank + " ");
            for (int y = 0; y < 8; y++) {
                Piece piece = board.getBox(x, y).getPiece();
                char marker = (piece == null) ? '.' : piece.getBoardChar();
                System.out.print(marker + " ");
            }
            System.out.println();
        }
        System.out.println("  a b c d e f g h");
        System.out.println();
    }
}
