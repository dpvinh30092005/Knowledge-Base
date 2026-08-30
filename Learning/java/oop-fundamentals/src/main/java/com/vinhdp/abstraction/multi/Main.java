package com.vinhdp.abstraction.multi;

import java.util.List;

/**
 * Chạy thật cả bốn trường hợp để đối chiếu với sơ đồ trong InterfaceTreeApp.
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("PlainAlert  -> " + new PlainAlert().send());
        System.out.println("EmailAlert  -> " + new EmailAlert().send());
        System.out.println("LegacyAlert -> " + new LegacyAlert().send());
        System.out.println("MultiAlert  -> " + new MultiAlert().send());

        //Cùng một biến kiểu Notifier, bốn kết quả khác nhau
        List<Notifier> all = List.of(new PlainAlert(), new EmailAlert(), new LegacyAlert());
        for (Notifier notifier : all) {
            System.out.println(notifier.getClass().getSimpleName() + " as Notifier -> "
                    + notifier.send());
        }
    }
}
