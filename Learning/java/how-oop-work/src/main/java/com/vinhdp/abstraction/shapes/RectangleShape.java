package com.vinhdp.abstraction.shapes;

import javafx.scene.canvas.GraphicsContext;

public class RectangleShape extends Shape implements Drawable {

    private final double width;
    private final double height;

    public RectangleShape(double x, double y, double width, double height) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }

    @Override
    public String formula() {
        return String.format("%,.0f", width) + " x " + String.format("%,.0f", height);
    }

    @Override
    public void draw(GraphicsContext gc) {
        gc.fillRect(x - width / 2, y - height / 2, width, height);
        gc.strokeRect(x - width / 2, y - height / 2, width, height);
    }

    public double getWidth() {
        return width;
    }

    public double getHeight() {
        return height;
    }
}
