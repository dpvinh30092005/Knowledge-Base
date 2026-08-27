package com.vinhdp.ui.common;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;

/** Các mảnh giao diện dùng lại giữa 4 app, để không phải lặp code layout. */
public final class UiKit {

    private UiKit() {
    }

    public static VBox card(String title, Node... children) {
        VBox box = new VBox(10);
        box.getStyleClass().add("card");
        if (title != null) {
            Label label = new Label(title);
            label.getStyleClass().add("card-title");
            box.getChildren().add(label);
        }
        box.getChildren().addAll(children);
        return box;
    }

    public static Label muted(String text) {
        Label label = new Label(text);
        label.getStyleClass().add("muted");
        label.setWrapText(true);
        return label;
    }

    public static Label code(String text) {
        Label label = new Label(text);
        label.getStyleClass().add("code");
        return label;
    }

    public static Label badge(String text, String variant) {
        Label label = new Label(text);
        label.getStyleClass().add("badge");
        if (variant != null) {
            label.getStyleClass().add(variant);
        }
        return label;
    }

    public static Button primary(String text) {
        Button button = new Button(text);
        button.getStyleClass().add("primary");
        return button;
    }

    public static Button danger(String text) {
        Button button = new Button(text);
        button.getStyleClass().add("danger");
        return button;
    }

    public static TextField field(String prompt, String value, double width) {
        TextField textField = new TextField(value);
        textField.setPromptText(prompt);
        textField.setPrefWidth(width);
        return textField;
    }

    /** Chấm tròn màu thay cho icon — không dùng emoji. */
    public static Circle dot(String webColor) {
        Circle circle = new Circle(5);
        circle.setStyle("-fx-fill: " + webColor + ";");
        return circle;
    }

    /** Một ô số liệu: nhãn nhỏ ở trên, giá trị to ở dưới. */
    public static VBox metric(String label, Label valueLabel) {
        Label caption = new Label(label);
        caption.getStyleClass().add("metric-label");
        valueLabel.getStyleClass().add("metric-value");
        VBox box = new VBox(2, caption, valueLabel);
        box.setMinWidth(120);
        return box;
    }

    public static HBox row(double spacing, Node... children) {
        HBox box = new HBox(spacing, children);
        box.setAlignment(Pos.CENTER_LEFT);
        return box;
    }

    public static Region grow() {
        Region region = new Region();
        HBox.setHgrow(region, Priority.ALWAYS);
        return region;
    }

    public static VBox column(double spacing, Insets padding, Node... children) {
        VBox box = new VBox(spacing, children);
        box.setPadding(padding);
        return box;
    }
}
