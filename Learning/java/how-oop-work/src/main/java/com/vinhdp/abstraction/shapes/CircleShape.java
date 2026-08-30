package com.vinhdp.abstraction.shapes;

import javafx.scene.canvas.GraphicsContext;

public class CircleShape extends Shape implements Drawable {

    private final double radius;

    public CircleShape(double x, double y, double radius) {
        super(x, y);
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public String formula() {
        return "pi * r^2, r = " + String.format("%,.0f", radius);
    }

    @Override
    public void draw(GraphicsContext gc) {
        gc.fillOval(x - radius, y - radius, radius * 2, radius * 2);
        gc.strokeOval(x - radius, y - radius, radius * 2, radius * 2);
    }

    public double getRadius() {
        return radius;
    }
}
