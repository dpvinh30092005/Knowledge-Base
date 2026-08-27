package com.vinhdp.abstraction.shapes;

/**
 * Abstract class: có state, có constructor, có method đã cài sẵn,
 * và có method abstract bắt lớp con phải tự lo.
 */
public abstract class Shape {

    protected final double x;
    protected final double y;

    protected Shape(double x, double y) {
        this.x = x;
        this.y = y;
    }

    /** Mỗi hình một công thức -> lớp cha không thể tính hộ. */
    public abstract double area();

    /** Công thức viết ra chữ, để hiện lên UI. */
    public abstract String formula();

    /** Concrete method: dùng chung, nhưng vẫn gọi được area() abstract ở trên. */
    public String describe() {
        return getClass().getSimpleName() + ": " + formula()
                + " = " + String.format("%,.2f", area());
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }
}
