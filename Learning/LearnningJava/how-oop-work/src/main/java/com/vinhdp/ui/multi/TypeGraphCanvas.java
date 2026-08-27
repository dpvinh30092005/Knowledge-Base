package com.vinhdp.ui.multi;

import com.vinhdp.ui.multi.DefaultMethodModel.Edge;
import com.vinhdp.ui.multi.DefaultMethodModel.Kind;
import com.vinhdp.ui.multi.DefaultMethodModel.Scenario;
import com.vinhdp.ui.multi.DefaultMethodModel.Step;
import com.vinhdp.ui.multi.DefaultMethodModel.TypeNode;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;

import java.util.HashMap;
import java.util.Map;

/** Vẽ cây type của một kịch bản và tô màu theo bước giải thích đang chọn. */
public class TypeGraphCanvas extends Canvas {

    private static final double W = 660;
    private static final double H = 372;

    private static final Color INK = Color.web("#1f2430");
    private static final Color MUTED = Color.web("#64748b");

    private static final Color CAND_FILL = Color.web("#fef3c7");
    private static final Color CAND_BORDER = Color.web("#d97706");
    private static final Color OUT_FILL = Color.web("#fee2e2");
    private static final Color OUT_BORDER = Color.web("#dc2626");
    private static final Color WIN_FILL = Color.web("#dcfce7");
    private static final Color WIN_BORDER = Color.web("#16a34a");

    private static final Font NAME_FONT = Font.font("Consolas", FontWeight.BOLD, 13);
    private static final Font BODY_FONT = Font.font("Consolas", 11);
    private static final Font TAG_FONT = Font.font("Consolas", 10.5);
    private static final Font EDGE_FONT = Font.font("Consolas", 10.5);

    private final Map<String, TypeNode> nodes = new HashMap<>();

    private Scenario scenario;
    private Step step;

    public TypeGraphCanvas() {
        super(W, H);
    }

    public void render(Scenario scenario, Step step) {
        this.scenario = scenario;
        this.step = step;
        nodes.clear();
        scenario.nodes().forEach(node -> nodes.put(node.name(), node));

        GraphicsContext gc = getGraphicsContext2D();
        gc.clearRect(0, 0, W, H);

        scenario.edges().forEach(edge -> drawEdge(gc, edge));
        scenario.nodes().forEach(node -> drawNode(gc, node));
    }

    // ---------------------------------------------------------------- node
    private void drawNode(GraphicsContext gc, TypeNode node) {
        boolean candidate = step.candidates().contains(node.name());
        boolean eliminated = step.eliminated().contains(node.name());
        boolean winner = node.name().equals(step.winner());

        Color fill = winner ? WIN_FILL
                : eliminated ? OUT_FILL
                : candidate ? CAND_FILL
                : Color.WHITE;
        Color border = winner ? WIN_BORDER
                : eliminated ? OUT_BORDER
                : candidate ? CAND_BORDER
                : Color.web("#cbd5e1");

        gc.setFill(fill);
        gc.fillRoundRect(node.x(), node.y(), node.w(), node.h(), 9, 9);

        gc.setStroke(border);
        gc.setLineWidth(winner || candidate || eliminated ? 2.2 : 1.2);
        //Interface vẽ nét đứt, class vẽ nét liền — đúng quy ước UML
        if (node.kind() == Kind.INTERFACE) {
            gc.setLineDashes(6, 4);
        }
        gc.strokeRoundRect(node.x(), node.y(), node.w(), node.h(), 9, 9);
        gc.setLineDashes(null);

        double textX = node.x() + 12;
        double textY = node.y() + 16;

        gc.setFont(TAG_FONT);
        gc.setFill(MUTED);
        gc.fillText(switch (node.kind()) {
            case INTERFACE -> "«interface»";
            case CLASS -> "«class»";
            case TARGET -> "«class» — đang xét";
        }, textX, textY);

        gc.setFont(NAME_FONT);
        gc.setFill(INK);
        gc.fillText(node.name(), textX, textY + 19);

        gc.setFont(BODY_FONT);
        gc.setFill(node.body().isEmpty() ? MUTED : Color.web("#334155"));
        String body = node.body().isEmpty() ? "không khai báo send()" : node.body();
        gc.fillText(clip(body, (int) (node.w() / 6.6)), textX, textY + 37);

        if (eliminated) {
            //Gạch ngang qua dòng method để thấy rõ bản này bị loại
            gc.setStroke(OUT_BORDER);
            gc.setLineWidth(1.6);
            gc.strokeLine(textX - 2, textY + 33, node.x() + node.w() - 12, textY + 33);
        }
        if (winner) {
            gc.setFill(WIN_BORDER);
            gc.setFont(TAG_FONT);
            gc.fillText("bản được chạy", node.x() + node.w() - 92, textY);
        }
    }

    // ---------------------------------------------------------------- edge
    private void drawEdge(GraphicsContext gc, Edge edge) {
        TypeNode from = nodes.get(edge.from());
        TypeNode to = nodes.get(edge.to());
        if (from == null || to == null) {
            return;
        }
        double x1 = from.x() + from.w() / 2;
        double y1 = from.y();
        double x2 = to.x() + to.w() / 2;
        double y2 = to.y() + to.h();

        gc.setStroke(Color.web("#94a3b8"));
        gc.setLineWidth(1.6);
        if (edge.kind().dashed) {
            gc.setLineDashes(6, 4);
        }
        gc.strokeLine(x1, y1, x2, y2);
        gc.setLineDashes(null);

        //Đầu mũi tên rỗng theo quy ước UML cho quan hệ kế thừa
        double angle = Math.atan2(y2 - y1, x2 - x1);
        double size = 11;
        double leftX = x2 - size * Math.cos(angle - Math.PI / 8);
        double leftY = y2 - size * Math.sin(angle - Math.PI / 8);
        double rightX = x2 - size * Math.cos(angle + Math.PI / 8);
        double rightY = y2 - size * Math.sin(angle + Math.PI / 8);

        gc.setFill(Color.WHITE);
        gc.fillPolygon(new double[]{x2, leftX, rightX}, new double[]{y2, leftY, rightY}, 3);
        gc.setStroke(Color.web("#94a3b8"));
        gc.strokePolygon(new double[]{x2, leftX, rightX}, new double[]{y2, leftY, rightY}, 3);

        gc.setFill(MUTED);
        gc.setFont(EDGE_FONT);
        gc.fillText(edge.kind().label, (x1 + x2) / 2 + 6, (y1 + y2) / 2);
    }

    private static String clip(String text, int max) {
        return text.length() <= max ? text : text.substring(0, Math.max(1, max - 1)) + "…";
    }
}
