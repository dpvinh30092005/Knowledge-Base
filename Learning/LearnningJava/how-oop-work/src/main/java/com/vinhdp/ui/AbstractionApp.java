package com.vinhdp.ui;

import com.vinhdp.abstraction.shapes.CircleShape;
import com.vinhdp.abstraction.shapes.Drawable;
import com.vinhdp.abstraction.shapes.RectangleShape;
import com.vinhdp.abstraction.shapes.Shape;
import com.vinhdp.abstraction.shapes.TriangleShape;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Slider;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;

import java.util.ArrayList;
import java.util.List;

public class AbstractionApp extends DemoApp {

    private static final String[] FILLS = {"#bfdbfe", "#bbf7d0", "#fde68a"};
    private static final String[] STROKES = {"#2563eb", "#16a34a", "#d97706"};

    private final Canvas canvas = new Canvas(560, 300);
    private final Slider sizeSlider = new Slider(30, 110, 70);
    private final Label totalAreaValue = new Label();
    private final VBox areaRows = new VBox(6);

    private List<Shape> shapes = List.of();

    @Override
    protected String title() {
        return "Abstraction";
    }

    @Override
    protected String subtitle() {
        return "Shape says every shape has an area but refuses to compute it. "
                + "Drawable says every shape can draw itself. The subclasses keep both promises.";
    }

    @Override
    protected Node buildContent() {

        sizeSlider.setPrefWidth(240);
        sizeSlider.setShowTickMarks(true);
        sizeSlider.valueProperty().addListener((obs, old, value) -> rebuild(false));

        Button recomputeButton = UiKit.primary("for (Shape s : shapes) s.area()");
        recomputeButton.setOnAction(e -> {
            log.divider("One loop, one declared type Shape");
            for (Shape shape : shapes) {
                log.call(shape.getClass().getSimpleName() + ".area()");
                log.ok(String.format("%,.2f", shape.area()) + "   formula: " + shape.formula());
            }
            log.note("Shape.area() has no body at all. The loop still works because "
                    + "every concrete subclass was forced to provide one.");
        });

        Button drawButton = UiKit.primary("for (Drawable d : shapes) d.draw(gc)");
        drawButton.setOnAction(e -> {
            log.divider("Calling through the interface instead");
            for (Shape shape : shapes) {
                Drawable drawable = (Drawable) shape;
                log.call(drawable.label() + ".draw(gc)");
            }
            log.ok("label() came from the interface default method - none of the three overrode it");
            log.info(Drawable.contract());
            rebuild(false);
        });

        Button probeButton = UiKit.primary("shape instanceof TriangleShape");
        probeButton.setOnAction(e -> {
            log.call("for (Shape s : shapes) if (s instanceof TriangleShape t) t.isTall()");
            for (Shape shape : shapes) {
                if (shape instanceof TriangleShape triangle) {
                    log.ok("TriangleShape.isTall() -> " + triangle.isTall());
                } else {
                    log.info(shape.getClass().getSimpleName() + " skipped - isTall() is not on Shape");
                }
            }
        });

        VBox canvasCard = UiKit.card("List<Shape> shapes",
                UiKit.row(12, new Label("Size"), sizeSlider,
                        UiKit.grow(), UiKit.metric("Total area", totalAreaValue)),
                canvas,
                UiKit.row(10, recomputeButton, drawButton, probeButton));

        VBox areaCard = UiKit.card("describe() - a concrete method calling an abstract one",
                areaRows,
                UiKit.muted("describe() is written once in Shape. It calls area() and formula(), "
                        + "which only exist in the subclasses."));

        VBox blockedCard = UiKit.card("What abstraction forbids",
                UiKit.code("Shape s = new Shape(0, 0);        // abstract - cannot instantiate"),
                UiKit.code("class Blob extends Shape { }      // must implement area() and formula()"),
                UiKit.code("interface Drawable { int count; } // fields are public static final"),
                UiKit.muted("An abstract class is a half-finished class. An interface is a contract "
                        + "with no state at all."));

        VBox compareCard = UiKit.card("abstract class vs interface",
                compareRow("Constructor", "yes", "no"),
                compareRow("Instance fields / state", "yes", "no - constants only"),
                compareRow("Method bodies", "yes", "default and static only"),
                compareRow("How many can a class take", "extends exactly 1", "implements many"),
                compareRow("Use it when", "shared state and shared code", "a capability many unrelated types can have"));

        HBox bottom = new HBox(14, areaCard, compareCard);
        HBox.setHgrow(areaCard, Priority.ALWAYS);
        HBox.setHgrow(compareCard, Priority.ALWAYS);

        VBox content = new VBox(14, canvasCard, bottom, blockedCard);
        content.setPadding(new Insets(18));
        return content;
    }

    private HBox compareRow(String label, String abstractSide, String interfaceSide) {
        Label name = new Label(label);
        name.setMinWidth(190);
        name.getStyleClass().add("muted");
        Label left = new Label(abstractSide);
        left.setMinWidth(170);
        return UiKit.row(8, name, left, new Label(interfaceSide));
    }

    @Override
    protected void onReady() {
        log.note("Shape declares area() without a body. Drawable declares draw() without a body. "
                + "Nothing runs until a concrete class fills them in.");
        rebuild(true);
    }

    private void rebuild(boolean announce) {
        double size = sizeSlider.getValue();
        List<Shape> built = new ArrayList<>();
        built.add(new CircleShape(110, 150, size * 0.7));
        built.add(new RectangleShape(290, 150, size * 1.6, size * 1.2));
        built.add(new TriangleShape(460, 150, size * 1.5, size * 1.6));
        shapes = List.copyOf(built);

        GraphicsContext gc = canvas.getGraphicsContext2D();
        gc.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
        gc.setLineWidth(2);

        double total = 0;
        areaRows.getChildren().clear();

        for (int i = 0; i < shapes.size(); i++) {
            Shape shape = shapes.get(i);
            gc.setFill(Color.web(FILLS[i]));
            gc.setStroke(Color.web(STROKES[i]));

            // Gọi qua interface -> chỉ thấy draw(), không thấy area()
            ((Drawable) shape).draw(gc);

            gc.setFill(Color.web("#334155"));
            gc.fillText(shape.getClass().getSimpleName(), shape.getX() - 34, 268);
            gc.fillText(String.format("%,.0f", shape.area()), shape.getX() - 20, 284);

            total += shape.area();

            HBox row = UiKit.row(8, UiKit.dot(STROKES[i]), new Label(shape.describe()));
            areaRows.getChildren().add(row);
        }

        totalAreaValue.setText(String.format("%,.0f", total));

        if (announce) {
            log.call("shapes.forEach(s -> ((Drawable) s).draw(gc))");
            log.ok("three classes drew themselves, the canvas never asked what they were");
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}
