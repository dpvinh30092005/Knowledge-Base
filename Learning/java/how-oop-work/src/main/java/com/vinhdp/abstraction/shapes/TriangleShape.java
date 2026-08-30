package com.vinhdp.abstraction.shapes;

import javafx.scene.canvas.GraphicsContext;

public class TriangleShape extends Shape implements Drawable {

    private final double base;
    private final double height;

    public TriangleShape(double x, double y, double base, double height) {
        super(x, y);
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() {
        return base * height / 2;
    }

    @Override
    public String formula() {
        return String.format("%,.0f", base) + " x " + String.format("%,.0f", height) + " / 2";
    }

    @Override
    public void draw(GraphicsContext gc) {
        double[] xs = {x, x - base / 2, x + base / 2};
        double[] ys = {y - height / 2, y + height / 2, y + height / 2};
        gc.fillPolygon(xs, ys, 3);
        gc.strokePolygon(xs, ys, 3);
    }

    public double getBase() {
        return base;
    }

    public double getHeight() {
        return height;
    }

    /** Method riêng của TriangleShape — biến kiểu Shape không nhìn thấy. */
    public boolean isTall() {
        return height > base;
    }
}
