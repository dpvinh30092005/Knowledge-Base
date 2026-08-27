package com.vinhdp.ui.jvm;

import com.vinhdp.ui.jvm.VmModel.ClassInfo;
import com.vinhdp.ui.jvm.VmModel.FieldSlot;
import com.vinhdp.ui.jvm.VmModel.HeapObject;
import com.vinhdp.ui.jvm.VmModel.Local;
import com.vinhdp.ui.jvm.VmModel.Snapshot;
import com.vinhdp.ui.jvm.VmModel.VtableEntry;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Vẽ một Snapshot: Stack, Heap, Method Area và các mũi tên nối giữa chúng. */
public class VmCanvas extends Canvas {

    private static final double W = 960;
    private static final double H = 566;

    private static final Color INK = Color.web("#1f2430");
    private static final Color MUTED = Color.web("#64748b");
    private static final Color PANEL_BORDER = Color.web("#dfe3e9");
    private static final Color SLOT_FILL = Color.web("#f8fafc");
    private static final Color SLOT_BORDER = Color.web("#e2e8f0");

    private static final Color HOT_FILL = Color.web("#fef3c7");
    private static final Color HOT_BORDER = Color.web("#d97706");
    private static final Color HIT_FILL = Color.web("#dcfce7");
    private static final Color HIT_BORDER = Color.web("#16a34a");

    private static final Color REF_ARROW = Color.web("#2563eb");
    private static final Color KLASS_ARROW = Color.web("#7c3aed");
    private static final Color LOOKUP_ARROW = Color.web("#dc2626");

    private static final Font MONO = Font.font("Consolas", 12);
    private static final Font MONO_SMALL = Font.font("Consolas", 11);
    private static final Font TITLE = Font.font("Segoe UI", FontWeight.BOLD, 11);
    private static final Font BOX_TITLE = Font.font("Consolas", FontWeight.BOLD, 12);

    private final Map<String, double[]> heapRects = new HashMap<>();
    private final Map<String, double[]> classRects = new HashMap<>();
    private final Map<String, double[]> vtableRects = new HashMap<>();
    private final Map<Integer, double[]> localRects = new HashMap<>();

    public VmCanvas() {
        super(W, H);
    }

    public void render(Snapshot state) {
        GraphicsContext gc = getGraphicsContext2D();
        gc.clearRect(0, 0, W, H);
        heapRects.clear();
        classRects.clear();
        vtableRects.clear();
        localRects.clear();

        drawFrames(gc, state, 8, 20, 214, 110);
        drawLocals(gc, state, 8, 148, 214, 155);
        drawOperands(gc, state, 8, 321, 214, 108);
        drawStdout(gc, state, 8, 447, 214, 111);

        drawHeap(gc, state, 234, 20, 330, 538);
        drawMethodArea(gc, state, 576, 20, 376, 538);

        drawReferenceArrows(gc, state);
        drawKlassArrows(gc, state);
        drawLookupArrow(gc, state);
        drawSpecialArrow(gc, state);
    }

    // ---------------------------------------------------------------- panels
    private void panel(GraphicsContext gc, String title, double x, double y, double w, double h) {
        gc.setFill(Color.WHITE);
        gc.fillRoundRect(x, y, w, h, 10, 10);
        gc.setStroke(PANEL_BORDER);
        gc.setLineWidth(1);
        gc.strokeRoundRect(x, y, w, h, 10, 10);
        gc.setFill(MUTED);
        gc.setFont(TITLE);
        gc.fillText(title.toUpperCase(), x + 12, y - 6);
    }

    private void slot(GraphicsContext gc, double x, double y, double w, double h,
                      Color fill, Color border) {
        gc.setFill(fill);
        gc.fillRoundRect(x, y, w, h, 6, 6);
        gc.setStroke(border);
        gc.setLineWidth(1);
        gc.strokeRoundRect(x, y, w, h, 6, 6);
    }

    private void drawFrames(GraphicsContext gc, Snapshot state,
                            double x, double y, double w, double h) {
        panel(gc, "JVM Stack — frames", x, y, w, h);
        gc.setFont(MONO_SMALL);

        List<String> frames = state.frames();
        double rowH = Math.min(22, (h - 24.0) / frames.size() - 4);
        double top = y + h - 10 - frames.size() * (rowH + 4);
        for (int i = 0; i < frames.size(); i++) {
            boolean isTop = i == frames.size() - 1;
            double ry = top + i * (rowH + 4);
            slot(gc, x + 10, ry, w - 20, rowH,
                    isTop ? HOT_FILL : SLOT_FILL, isTop ? HOT_BORDER : SLOT_BORDER);
            gc.setFill(INK);
            gc.fillText(clip(frames.get(i), 24), x + 17, ry + rowH * 0.7);
        }
        gc.setFill(MUTED);
        gc.setFont(MONO_SMALL);
        gc.fillText("frame mới push xuống dưới", x + 12, y + 17);
    }

    private void drawLocals(GraphicsContext gc, Snapshot state,
                            double x, double y, double w, double h) {
        String frame = state.frames().isEmpty()
                ? "main" : state.frames().get(state.frames().size() - 1);
        panel(gc, "Locals — " + clip(frame, 14), x, y, w, h);
        gc.setFont(MONO_SMALL);

        double cy = y + 12;
        for (int i = 0; i < state.locals().size(); i++) {
            Local local = state.locals().get(i);
            //Dòng gọn một hàng dùng cho danh sách tham số; dòng đầy hai hàng cho biến có kiểu
            boolean compact = local.declaredType() == null || local.declaredType().isEmpty();
            double rowH = compact ? 18 : 30;
            boolean filled = local.ref() != null;

            slot(gc, x + 10, cy, w - 20, rowH,
                    filled ? Color.web("#eff6ff") : SLOT_FILL,
                    filled ? Color.web("#bfdbfe") : SLOT_BORDER);

            if (compact) {
                gc.setFill(INK);
                gc.fillText(clip(local.name() + " = " + (filled ? local.ref() : "-"), 30),
                        x + 16, cy + 13);
            } else {
                gc.setFill(MUTED);
                gc.fillText("[" + local.slot() + "] " + local.declaredType(), x + 16, cy + 13);
                gc.setFill(INK);
                gc.fillText(clip(local.name() + " = " + (filled ? local.ref() : "-"), 24),
                        x + 16, cy + 25);
            }
            if (filled) {
                localRects.put(i, new double[]{x + 10, cy, w - 20, rowH});
            }
            cy += rowH + (compact ? 4 : 5);
        }
    }

    private void drawOperands(GraphicsContext gc, Snapshot state,
                              double x, double y, double w, double h) {
        panel(gc, "Operand stack", x, y, w, h);
        gc.setFont(MONO_SMALL);

        List<String> operands = state.operands();
        if (operands.isEmpty()) {
            gc.setFill(MUTED);
            gc.fillText("(rỗng)", x + 16, y + 26);
            return;
        }
        double rowH = 22;
        for (int i = 0; i < operands.size(); i++) {
            int fromTop = operands.size() - 1 - i;
            double ry = y + 12 + fromTop * (rowH + 4);
            boolean isTop = i == operands.size() - 1;
            slot(gc, x + 10, ry, w - 20, rowH,
                    isTop ? HOT_FILL : SLOT_FILL, isTop ? HOT_BORDER : SLOT_BORDER);
            gc.setFill(INK);
            gc.fillText(clip(operands.get(i), 22), x + 16, ry + 15);
            if (isTop) {
                gc.setFill(MUTED);
                gc.fillText("<- top", x + w - 50, ry + 15);
            }
        }
    }

    private void drawStdout(GraphicsContext gc, Snapshot state,
                            double x, double y, double w, double h) {
        panel(gc, "System.out", x, y, w, h);
        gc.setFont(MONO_SMALL);
        gc.setFill(Color.web("#166534"));
        for (int i = 0; i < state.stdout().size(); i++) {
            gc.fillText(clip(state.stdout().get(i), 24), x + 14, y + 26 + i * 19);
        }
        if (state.stdout().isEmpty()) {
            gc.setFill(MUTED);
            gc.fillText("(chưa in gì)", x + 14, y + 26);
        }
    }

    private void drawHeap(GraphicsContext gc, Snapshot state,
                          double x, double y, double w, double h) {
        panel(gc, "Heap — object thật nằm ở đây", x, y, w, h);
        gc.setFont(MONO);

        if (state.heap().isEmpty()) {
            gc.setFill(MUTED);
            gc.setFont(MONO_SMALL);
            gc.fillText("(chưa có object nào)", x + 16, y + 28);
            return;
        }

        String speaking = speakingId(state);
        boolean fieldMode = state.heap().get(0).fields().size() > 0;

        double by = y + 14;
        for (HeapObject object : state.heap()) {
            double boxH = fieldMode ? fieldBoxHeight(object) : 92;
            boolean hot = object.id().equals(state.highlightHeapId());

            slot(gc, x + 14, by, w - 28, boxH,
                    hot ? HOT_FILL : Color.web("#fbfcfe"),
                    hot ? HOT_BORDER : SLOT_BORDER);
            heapRects.put(object.id(), new double[]{x + 14, by, w - 28, boxH});

            gc.setFill(INK);
            gc.setFont(BOX_TITLE);
            gc.fillText(object.id(), x + (fieldMode ? 24 : 96), by + 24);

            gc.setFont(MONO_SMALL);
            gc.setFill(KLASS_ARROW);
            gc.fillText("klass pointer ->", x + (fieldMode ? 24 : 96), by + 44);

            if (fieldMode) {
                drawFields(gc, object, x + 22, by + 54, w - 44);
            } else {
                //Con vật thật sự nằm trong ô nhớ này
                drawCreature(gc, object.className(), x + 24, by + 16, 60, object.initialised());
                if (object.id().equals(speaking)) {
                    speechBubble(gc, x + 96, by + 52,
                            x + 14 + (w - 28) - (x + 96) - 12, 28,
                            state.stdout().get(state.stdout().size() - 1));
                } else {
                    gc.setFill(MUTED);
                    gc.fillText(object.initialised()
                            ? "fields: (không có)"
                            : "chưa chạy <init>", x + 96, by + 64);
                }
            }
            by += boxH + 14;
        }
    }

    private static final String[] OWNER_COLORS = {"#3b82f6", "#8b5cf6", "#f59e0b"};

    private double fieldBoxHeight(HeapObject object) {
        double height = 58;
        String owner = null;
        for (FieldSlot field : object.fields()) {
            if (!field.owner().equals(owner)) {
                owner = field.owner();
                height += 17;
            }
            height += 18;
        }
        return height + 8;
    }

    /**
     * Vẽ layout field bên trong object: phần của lớp CHA nằm trước, phần của lớp CON nằm sau —
     * đúng thứ tự JVM cấp phát.
     */
    private void drawFields(GraphicsContext gc, HeapObject object,
                            double x, double y, double w) {
        gc.setFont(MONO_SMALL);
        double cy = y;
        String owner = null;
        int ownerIndex = -1;

        for (FieldSlot field : object.fields()) {
            if (!field.owner().equals(owner)) {
                owner = field.owner();
                ownerIndex++;
                gc.setFill(Color.web(OWNER_COLORS[ownerIndex % OWNER_COLORS.length]));
                gc.fillText("phần của " + owner, x + 10, cy + 12);
                cy += 17;
            }

            //Dải màu bên trái cho biết field này do class nào khai báo
            gc.setFill(Color.web(OWNER_COLORS[ownerIndex % OWNER_COLORS.length]));
            gc.fillRoundRect(x + 2, cy, 4, 16, 2, 2);

            if (field.justWritten()) {
                slot(gc, x + 10, cy - 1, w - 14, 18, HIT_FILL, HIT_BORDER);
            }
            gc.setFill(field.justWritten() ? Color.web("#166534") : INK);
            gc.fillText(clip(field.name() + " = " + field.value(), 34), x + 16, cy + 13);
            cy += 18;
        }
    }

    /** Object nào đang chạy bark() ngay lúc này. */
    private String speakingId(Snapshot state) {
        if (state.stdout().isEmpty() || state.frames().isEmpty()) {
            return null;
        }
        String top = state.frames().get(state.frames().size() - 1);
        return top.endsWith(".bark()") ? state.highlightHeapId() : null;
    }

    private void speechBubble(GraphicsContext gc, double x, double y, double w, double h,
                              String text) {
        gc.setFill(Color.WHITE);
        gc.fillRoundRect(x, y, w, h, 12, 12);
        gc.setStroke(HIT_BORDER);
        gc.setLineWidth(1.6);
        gc.strokeRoundRect(x, y, w, h, 12, 12);

        //Đuôi bong bóng chỉ về phía con vật
        gc.setFill(Color.WHITE);
        gc.fillPolygon(new double[]{x + 2, x - 9, x + 2},
                new double[]{y + 8, y + 15, y + 20}, 3);
        gc.setStroke(HIT_BORDER);
        gc.strokeLine(x - 9, y + 15, x + 1, y + 8);
        gc.strokeLine(x - 9, y + 15, x + 1, y + 20);

        gc.setFill(Color.web("#166534"));
        gc.setFont(Font.font("Consolas", FontWeight.BOLD, 11.5));
        gc.fillText(clip(text, 20), x + 12, y + 19);
    }

    // ------------------------------------------------------------- con vật
    private void drawCreature(GraphicsContext gc, String className,
                              double x, double y, double size, boolean initialised) {
        if (!initialised) {
            //Chưa chạy <init>: mới chỉ là vùng nhớ trống
            gc.setStroke(Color.web("#94a3b8"));
            gc.setLineWidth(1.4);
            gc.setLineDashes(4, 4);
            gc.strokeRoundRect(x, y, size, size, 10, 10);
            gc.setLineDashes(null);
            gc.setFill(MUTED);
            gc.setFont(Font.font("Consolas", FontWeight.BOLD, 16));
            gc.fillText("?", x + size / 2 - 5, y + size / 2 + 6);
            return;
        }
        switch (className) {
            case "Cat" -> drawCat(gc, x, y, size);
            case "Fish" -> drawFish(gc, x, y, size);
            default -> drawDog(gc, x, y, size);
        }
    }

    private void drawDog(GraphicsContext gc, double x, double y, double s) {
        double cx = x + s / 2;
        double cy = y + s * 0.46;
        gc.setLineWidth(1.5);

        //Tai cụp hai bên
        gc.setFill(Color.web("#a16207"));
        gc.setStroke(Color.web("#78350f"));
        gc.fillOval(cx - s * 0.44, cy - s * 0.30, s * 0.24, s * 0.44);
        gc.strokeOval(cx - s * 0.44, cy - s * 0.30, s * 0.24, s * 0.44);
        gc.fillOval(cx + s * 0.20, cy - s * 0.30, s * 0.24, s * 0.44);
        gc.strokeOval(cx + s * 0.20, cy - s * 0.30, s * 0.24, s * 0.44);

        //Đầu
        gc.setFill(Color.web("#d9a066"));
        gc.fillOval(cx - s * 0.30, cy - s * 0.32, s * 0.60, s * 0.60);
        gc.setStroke(Color.web("#78350f"));
        gc.strokeOval(cx - s * 0.30, cy - s * 0.32, s * 0.60, s * 0.60);

        //Mắt
        gc.setFill(Color.web("#1f2430"));
        gc.fillOval(cx - s * 0.18, cy - s * 0.15, s * 0.09, s * 0.11);
        gc.fillOval(cx + s * 0.09, cy - s * 0.15, s * 0.09, s * 0.11);

        //Mõm
        gc.setFill(Color.web("#f5e0c3"));
        gc.fillOval(cx - s * 0.17, cy + s * 0.02, s * 0.34, s * 0.22);
        gc.setStroke(Color.web("#a16207"));
        gc.strokeOval(cx - s * 0.17, cy + s * 0.02, s * 0.34, s * 0.22);

        //Mũi, miệng, lưỡi đang sủa
        gc.setFill(Color.web("#1f2430"));
        gc.fillOval(cx - s * 0.05, cy + s * 0.03, s * 0.10, s * 0.07);
        gc.setStroke(Color.web("#1f2430"));
        gc.strokeLine(cx, cy + s * 0.10, cx, cy + s * 0.15);
        gc.setFill(Color.web("#be123c"));
        gc.fillOval(cx - s * 0.07, cy + s * 0.14, s * 0.14, s * 0.10);
    }

    private void drawCat(GraphicsContext gc, double x, double y, double s) {
        double cx = x + s / 2;
        double cy = y + s * 0.50;
        gc.setLineWidth(1.5);

        //Tai nhọn
        gc.setFill(Color.web("#94a3b8"));
        gc.setStroke(Color.web("#475569"));
        gc.fillPolygon(new double[]{cx - s * 0.32, cx - s * 0.26, cx - s * 0.04},
                new double[]{cy - s * 0.46, cy - s * 0.10, cy - s * 0.24}, 3);
        gc.fillPolygon(new double[]{cx + s * 0.32, cx + s * 0.26, cx + s * 0.04},
                new double[]{cy - s * 0.46, cy - s * 0.10, cy - s * 0.24}, 3);

        //Đầu
        gc.setFill(Color.web("#cbd5e1"));
        gc.fillOval(cx - s * 0.30, cy - s * 0.30, s * 0.60, s * 0.56);
        gc.setStroke(Color.web("#475569"));
        gc.strokeOval(cx - s * 0.30, cy - s * 0.30, s * 0.60, s * 0.56);

        //Mắt khe dọc
        gc.setFill(Color.web("#15803d"));
        gc.fillOval(cx - s * 0.19, cy - s * 0.15, s * 0.13, s * 0.14);
        gc.fillOval(cx + s * 0.06, cy - s * 0.15, s * 0.13, s * 0.14);
        gc.setFill(Color.web("#0f172a"));
        gc.fillOval(cx - s * 0.145, cy - s * 0.15, s * 0.04, s * 0.14);
        gc.fillOval(cx + s * 0.105, cy - s * 0.15, s * 0.04, s * 0.14);

        //Mũi
        gc.setFill(Color.web("#fb7185"));
        gc.fillPolygon(new double[]{cx - s * 0.05, cx + s * 0.05, cx},
                new double[]{cy + s * 0.05, cy + s * 0.05, cy + s * 0.11}, 3);

        //Ria
        gc.setStroke(Color.web("#475569"));
        gc.setLineWidth(1);
        for (int i = -1; i <= 1; i++) {
            gc.strokeLine(cx - s * 0.07, cy + s * 0.09 + i * s * 0.04,
                    cx - s * 0.36, cy + s * 0.05 + i * s * 0.09);
            gc.strokeLine(cx + s * 0.07, cy + s * 0.09 + i * s * 0.04,
                    cx + s * 0.36, cy + s * 0.05 + i * s * 0.09);
        }
    }

    private void drawFish(GraphicsContext gc, double x, double y, double s) {
        double cx = x + s * 0.56;
        double cy = y + s * 0.50;
        gc.setLineWidth(1.5);

        //Đuôi và vây lưng
        gc.setFill(Color.web("#0284c7"));
        gc.setStroke(Color.web("#075985"));
        gc.fillPolygon(new double[]{cx - s * 0.26, cx - s * 0.50, cx - s * 0.50},
                new double[]{cy, cy - s * 0.22, cy + s * 0.22}, 3);
        gc.fillPolygon(new double[]{cx - s * 0.08, cx + s * 0.12, cx + s * 0.02},
                new double[]{cy - s * 0.20, cy - s * 0.20, cy - s * 0.38}, 3);

        //Thân
        gc.setFill(Color.web("#38bdf8"));
        gc.fillOval(cx - s * 0.30, cy - s * 0.22, s * 0.66, s * 0.44);
        gc.setStroke(Color.web("#075985"));
        gc.strokeOval(cx - s * 0.30, cy - s * 0.22, s * 0.66, s * 0.44);

        //Mang
        gc.strokeArc(cx - s * 0.12, cy - s * 0.16, s * 0.20, s * 0.32, 250, 220,
                javafx.scene.shape.ArcType.OPEN);

        //Mắt
        gc.setFill(Color.WHITE);
        gc.fillOval(cx + s * 0.14, cy - s * 0.12, s * 0.14, s * 0.14);
        gc.setFill(Color.web("#0f172a"));
        gc.fillOval(cx + s * 0.185, cy - s * 0.075, s * 0.06, s * 0.06);
    }

    private void drawMethodArea(GraphicsContext gc, Snapshot state,
                                double x, double y, double w, double h) {
        panel(gc, "Method Area / Metaspace — metadata + vtable", x, y, w, h);

        double cy = y + 14;
        for (ClassInfo info : state.classes()) {
            double boxH = 26 + info.vtable().size() * 20 + 10;
            boolean hot = info.name().equals(state.highlightClass());

            slot(gc, x + 14, cy, w - 28, boxH,
                    hot ? HOT_FILL : Color.web("#fbfcfe"),
                    hot ? HOT_BORDER : SLOT_BORDER);
            classRects.put(info.name(), new double[]{x + 14, cy, w - 28, boxH});

            gc.setFill(INK);
            gc.setFont(BOX_TITLE);
            gc.fillText("class " + info.name()
                    + (info.superName().isEmpty() ? "" : " extends " + info.superName()),
                    x + 24, cy + 18);

            gc.setFont(MONO_SMALL);
            for (int i = 0; i < info.vtable().size(); i++) {
                VtableEntry entry = info.vtable().get(i);
                double ry = cy + 26 + i * 20;
                boolean inherited = !entry.owner().equals(info.name());
                boolean hit = (info.name() + "#" + entry.method()).equals(state.highlightVtable());

                if (hit) {
                    slot(gc, x + 22, ry, w - 46, 18, HIT_FILL, HIT_BORDER);
                }
                vtableRects.put(info.name() + "#" + entry.method(),
                        new double[]{x + 22, ry, w - 46, 18});

                gc.setFill(inherited ? Color.web("#b45309") : INK);
                gc.fillText("vtable  " + entry.method() + " -> " + entry.owner()
                        + (inherited ? "   (kế thừa)" : ""), x + 30, ry + 13);
            }

            cy += boxH + 12;
        }
    }

    // ---------------------------------------------------------------- arrows
    private void drawReferenceArrows(GraphicsContext gc, Snapshot state) {
        gc.setStroke(REF_ARROW);
        gc.setFill(REF_ARROW);
        gc.setLineWidth(1.6);
        for (int i = 0; i < state.locals().size(); i++) {
            Local local = state.locals().get(i);
            double[] from = localRects.get(i);
            double[] to = local.ref() == null ? null : heapRects.get(local.ref());
            if (from == null || to == null) {
                continue;
            }
            arrow(gc, from[0] + from[2], from[1] + from[3] / 2, to[0], to[1] + 16, 6 + i * 5);
        }
    }

    private void drawKlassArrows(GraphicsContext gc, Snapshot state) {
        gc.setStroke(KLASS_ARROW);
        gc.setFill(KLASS_ARROW);
        gc.setLineWidth(1.6);
        for (HeapObject object : state.heap()) {
            double[] from = heapRects.get(object.id());
            double[] to = classRects.get(object.className());
            if (from == null || to == null) {
                continue;
            }
            arrow(gc, from[0] + from[2], from[1] + 44, to[0], to[1] + 14, 8);
        }
    }

    private void drawLookupArrow(GraphicsContext gc, Snapshot state) {
        if (state.lookupPath().size() < 2) {
            return;
        }
        String child = state.lookupPath().get(0);
        String parent = state.lookupPath().get(1);
        double[] from = state.highlightVtable() == null
                ? classRects.get(child)
                : vtableRects.get(state.highlightVtable());
        double[] to = classRects.get(parent);
        if (from == null || to == null) {
            return;
        }
        gc.setStroke(LOOKUP_ARROW);
        gc.setFill(LOOKUP_ARROW);
        gc.setLineWidth(2);
        gc.setLineDashes(5, 4);
        double sx = from[0] + from[2];
        double sy = from[1] + 9;
        double ex = to[0] + to[2];
        double ey = to[1] + to[3] / 2;
        gc.strokeLine(sx, sy, sx + 22, sy);
        gc.strokeLine(sx + 22, sy, sx + 22, ey);
        gc.strokeLine(sx + 22, ey, ex, ey);
        gc.setLineDashes(null);
        head(gc, ex, ey, -1);
        gc.setFont(MONO_SMALL);
        gc.fillText("không có bản riêng -> tra ngược lên cha", to[0] + 10, to[1] - 5);
    }

    /** invokespecial: nhảy THẲNG tới class chỉ định, không đi qua vtable. */
    private void drawSpecialArrow(GraphicsContext gc, Snapshot state) {
        if (state.specialTarget() == null || state.highlightClass() == null) {
            return;
        }
        double[] from = classRects.get(state.highlightClass());
        double[] to = classRects.get(state.specialTarget());
        if (from == null || to == null) {
            return;
        }
        Color color = Color.web("#ea580c");
        gc.setStroke(color);
        gc.setFill(color);
        gc.setLineWidth(2);

        double sx = from[0] + from[2];
        double sy = from[1] + from[3] / 2;
        double ex = to[0] + to[2];
        double ey = to[1] + to[3] / 2;
        gc.strokeLine(sx, sy, sx + 18, sy);
        gc.strokeLine(sx + 18, sy, sx + 18, ey);
        gc.strokeLine(sx + 18, ey, ex, ey);
        head(gc, ex, ey, -1);

        gc.setFont(MONO_SMALL);
        gc.fillText("invokespecial: đi thẳng, bỏ qua vtable", to[0] + 10, to[1] - 5);
    }

    private void arrow(GraphicsContext gc, double x1, double y1, double x2, double y2,
                       double elbow) {
        double midX = x1 + elbow;
        gc.strokeLine(x1, y1, midX, y1);
        gc.strokeLine(midX, y1, midX, y2);
        gc.strokeLine(midX, y2, x2, y2);
        head(gc, x2, y2, 1);
    }

    /** direction 1 = mũi tên chỉ sang phải, -1 = chỉ sang trái. */
    private void head(GraphicsContext gc, double x, double y, int direction) {
        gc.fillPolygon(
                new double[]{x, x - 7.0 * direction, x - 7.0 * direction},
                new double[]{y, y - 4, y + 4}, 3);
    }

    private static String clip(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }
}
