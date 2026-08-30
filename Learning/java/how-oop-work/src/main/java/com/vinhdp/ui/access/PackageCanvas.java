package com.vinhdp.ui.access;

import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Sơ đồ package: hộp lồng hộp đúng theo cây thư mục, class nằm trong package của nó.
 * Bấm vào một class để đổi "người đang nhìn" — cả bảng bên phải đổi theo.
 */
public class PackageCanvas extends Canvas {

    private static final double W = 700;
    private static final double H = 410;

    private static final Color INK = Color.web("#1f2430");
    private static final Color MUTED = Color.web("#64748b");

    private static final Font PKG_FONT = Font.font("Consolas", 11.5);
    private static final Font CLASS_FONT = Font.font("Consolas", FontWeight.BOLD, 13);
    private static final Font ROLE_FONT = Font.font("Segoe UI", 10.5);
    private static final Font BADGE_FONT = Font.font("Consolas", FontWeight.BOLD, 10);

    /** Toạ độ các hộp class, dùng cho bắt sự kiện click. */
    private final Map<String, double[]> classRects = new HashMap<>();

    private String selected = "Main";
    private Consumer<String> onSelect = name -> { };

    public PackageCanvas() {
        super(W, H);
        setOnMouseClicked(event -> {
            for (Map.Entry<String, double[]> entry : classRects.entrySet()) {
                double[] r = entry.getValue();
                if (event.getX() >= r[0] && event.getX() <= r[0] + r[2]
                        && event.getY() >= r[1] && event.getY() <= r[1] + r[3]) {
                    onSelect.accept(entry.getKey());
                    return;
                }
            }
        });
    }

    public void setOnSelect(Consumer<String> handler) {
        this.onSelect = handler;
    }

    public void select(String className) {
        this.selected = className;
        draw();
    }

    public void draw() {
        GraphicsContext gc = getGraphicsContext2D();
        gc.clearRect(0, 0, W, H);
        classRects.clear();

        pkg(gc, "com.vinhdp", 8, 16, 684, 372, "#f8fafc");
        pkg(gc, ".encapsulation", 22, 44, 452, 328, "#f1f5f9");

        classBox(gc, "Main", "gọi TheATM như người dùng thường", 38, 74, 180, 46);

        pkg(gc, ".bankst", 38, 130, 420, 226, "#eef2ff");
        classBox(gc, "TheATM", "nơi cất giữ state", 54, 160, 180, 58);
        classBox(gc, "BankEmployee", "cùng nhà, mở khoá thẻ được", 254, 160, 186, 58);

        pkg(gc, ".vip", 54, 236, 250, 104, "#faf5ff");
        classBox(gc, "TheATMVIP", "extends TheATM", 70, 268, 200, 54);

        pkg(gc, ".ui", 490, 44, 198, 116, "#fefce8");
        classBox(gc, "EncapsulationApp", "tầng giao diện, ở ngoài cùng", 504, 76, 170, 62);

        drawExtendsArrow(gc);
        drawHint(gc);
    }

    // ---------------------------------------------------------------- vẽ
    private void pkg(GraphicsContext gc, String name,
                     double x, double y, double w, double h, String fill) {
        gc.setFill(Color.web(fill));
        gc.fillRoundRect(x, y, w, h, 10, 10);
        gc.setStroke(Color.web("#cbd5e1"));
        gc.setLineWidth(1.2);
        gc.setLineDashes(5, 4);
        gc.strokeRoundRect(x, y, w, h, 10, 10);
        gc.setLineDashes(null);

        gc.setFill(MUTED);
        gc.setFont(PKG_FONT);
        gc.fillText("package " + name, x + 12, y + 17);
    }

    private void classBox(GraphicsContext gc, String name, String role,
                          double x, double y, double w, double h) {
        boolean isSelected = name.equals(selected);
        boolean isTarget = name.equals(AccessModel.TARGET);

        gc.setFill(isSelected ? Color.web("#dbeafe")
                : isTarget ? Color.web("#fffbeb") : Color.WHITE);
        gc.fillRoundRect(x, y, w, h, 8, 8);

        gc.setStroke(isSelected ? Color.web("#2563eb")
                : isTarget ? Color.web("#d97706") : Color.web("#dfe3e9"));
        gc.setLineWidth(isSelected ? 2.4 : 1.2);
        gc.strokeRoundRect(x, y, w, h, 8, 8);

        gc.setFill(INK);
        gc.setFont(CLASS_FONT);
        gc.fillText(name, x + 12, y + 22);

        gc.setFill(MUTED);
        gc.setFont(ROLE_FONT);
        gc.fillText(role, x + 12, y + 38);

        if (isTarget) {
            badge(gc, "đang soi", x + w - 62, y + 8, "#d97706");
        } else if (isSelected) {
            badge(gc, "đang nhìn", x + w - 70, y + 8, "#2563eb");
        }

        classRects.put(name, new double[]{x, y, w, h});
    }

    private void badge(GraphicsContext gc, String text, double x, double y, String color) {
        gc.setFill(Color.web(color));
        gc.fillRoundRect(x, y, text.length() * 6.2 + 10, 15, 8, 8);
        gc.setFill(Color.WHITE);
        gc.setFont(BADGE_FONT);
        gc.fillText(text, x + 6, y + 11);
    }

    /** Mũi tên UML rỗng đầu: TheATMVIP extends TheATM. */
    private void drawExtendsArrow(GraphicsContext gc) {
        double[] child = classRects.get("TheATMVIP");
        double[] parent = classRects.get(AccessModel.TARGET);
        if (child == null || parent == null) {
            return;
        }
        double x = child[0] + 160;
        double fromY = child[1];
        double toY = parent[1] + parent[3];

        gc.setStroke(Color.web("#7c3aed"));
        gc.setLineWidth(1.8);
        gc.strokeLine(x, fromY, x, toY + 10);

        gc.setFill(Color.WHITE);
        gc.fillPolygon(new double[]{x, x - 7, x + 7},
                new double[]{toY, toY + 11, toY + 11}, 3);
        gc.strokePolygon(new double[]{x, x - 7, x + 7},
                new double[]{toY, toY + 11, toY + 11}, 3);

        gc.setFill(Color.web("#7c3aed"));
        gc.setFont(PKG_FONT);
        gc.fillText("extends", x + 12, (fromY + toY) / 2 + 6);
    }

    private void drawHint(GraphicsContext gc) {
        gc.setFill(MUTED);
        gc.setFont(ROLE_FONT);
        gc.fillText("Bấm vào một class để xem nó với tới được những gì của TheATM.",
                20, H - 8);
    }

    /** Bảng vị trí class, để app biết còn class nào chưa vẽ. */
    public Map<String, double[]> classRects() {
        return new LinkedHashMap<>(classRects);
    }
}
