package com.vinhdp.abstraction.multi;

/**
 * Hai ứng viên, nhưng EmailNotifier extends Notifier nên nó CỤ THỂ HƠN.
 * Không cần override, compiler tự chọn EmailNotifier.send().
 */
public class EmailAlert implements Notifier, EmailNotifier {
}
