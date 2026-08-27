package com.vinhdp.abstraction.shapes;

import javafx.scene.canvas.GraphicsContext;

/**
 * Interface = HỢP ĐỒNG. Không giữ state, chỉ nói "ai ký thì phải vẽ được chính mình".
 * Một class có thể ký nhiều hợp đồng cùng lúc, trong khi chỉ được extends 1 class.
 */
public interface Drawable {

    void draw(GraphicsContext gc);

    /** Java 8+: default method — có sẵn phần thân, lớp con không bắt buộc viết lại. */
    default String label() {
        return getClass().getSimpleName();
    }

    /** Java 8+: static method của chính interface. */
    static String contract() {
        return "Drawable: bất kỳ ai implements đều phải tự vẽ được";
    }
}
