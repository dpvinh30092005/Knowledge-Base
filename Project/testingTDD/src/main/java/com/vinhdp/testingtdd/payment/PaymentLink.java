package com.vinhdp.testingtdd.payment;

public record PaymentLink(
        long orderCode,
        int amount,
        String paymentLinkId,
        String checkoutUrl
) {
}
