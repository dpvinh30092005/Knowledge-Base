package com.vinhdp.abstraction.multi;

/**
 * Interface CON của Notifier, ghi đè default method.
 * Vì nó cụ thể hơn Notifier nên khi cả hai cùng có mặt, bản này thắng.
 */
public interface EmailNotifier extends Notifier {

    @Override
    default String send() {
        return "EmailNotifier.send()";
    }
}
