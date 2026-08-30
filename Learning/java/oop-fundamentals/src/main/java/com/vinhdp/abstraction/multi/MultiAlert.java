package com.vinhdp.abstraction.multi;

/**
 * EmailNotifier và SmsNotifier không họ hàng gì nhau, cả hai cùng có default send().
 * Compiler KHÔNG tự chọn được -> bắt buộc phải override.
 * Bỏ method dưới đây đi là lỗi biên dịch ngay.
 */
public class MultiAlert implements EmailNotifier, SmsNotifier {

    @Override
    public String send() {
        //X.super.m() là cú pháp duy nhất để gọi thẳng default method của một interface cụ thể
        return EmailNotifier.super.send() + " + " + SmsNotifier.super.send();
    }
}
