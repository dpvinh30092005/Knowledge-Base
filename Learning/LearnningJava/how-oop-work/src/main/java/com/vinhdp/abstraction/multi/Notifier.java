package com.vinhdp.abstraction.multi;

/** Interface gốc, có sẵn một default method. */
public interface Notifier {

    default String send() {
        return "Notifier.send()";
    }
}
