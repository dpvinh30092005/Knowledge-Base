package com.vinhdp.abstraction.multi;

/**
 * Vừa kế thừa class vừa implements interface, cả hai đều có send().
 * Luật "class wins": bản của BaseNotifier thắng, default method bị bỏ qua.
 */
public class LegacyAlert extends BaseNotifier implements Notifier {
}
