package com.vinhdp.abstraction.multi;

/**
 * Interface KHÔNG họ hàng gì với Notifier, nhưng cũng có default send().
 * Đây là nguồn gây xung đột kim cương.
 */
public interface SmsNotifier {

    default String send() {
        return "SmsNotifier.send()";
    }
}
