package com.vinhdp.testingtdd.payos;

public interface PayOsHttpClient {
    PayOsCreatePaymentResponse createPaymentLink(PayOsCreatePaymentRequest request);
}
