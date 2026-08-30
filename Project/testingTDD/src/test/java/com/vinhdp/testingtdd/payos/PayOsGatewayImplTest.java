package com.vinhdp.testingtdd.payos;

import com.vinhdp.testingtdd.order.Order;
import com.vinhdp.testingtdd.payment.PaymentLink;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PayOsGatewayImplTest {

    @Test
    void sendsCreatePaymentRequestThroughHttpClient() {
        PayOsHttpClientFake httpClient = new PayOsHttpClientFake();
        PayOsGateway payOsGateway = new PayOsGatewayImpl(
                httpClient,
                "checksum-key",
                "https://example.com/cancel",
                "https://example.com/return"
        );

        PaymentLink paymentLink = payOsGateway.createPaymentLink(new Order(1001L, 10_000, "ORDER1001"));

        assertThat(httpClient.lastRequest.orderCode()).isEqualTo(1001L);
        assertThat(httpClient.lastRequest.amount()).isEqualByComparingTo(BigDecimal.valueOf(10_000));
        assertThat(httpClient.lastRequest.description()).isEqualTo("ORDER1001");
        assertThat(httpClient.lastRequest.cancelUrl()).isEqualTo("https://example.com/cancel");
        assertThat(httpClient.lastRequest.returnUrl()).isEqualTo("https://example.com/return");
        assertThat(httpClient.lastRequest.signature()).isNotBlank();
        assertThat(paymentLink.checkoutUrl()).isEqualTo("https://pay.payos.vn/web/test-link-1001");
    }

    private static class PayOsHttpClientFake implements PayOsHttpClient {
        private PayOsCreatePaymentRequest lastRequest;

        @Override
        public PayOsCreatePaymentResponse createPaymentLink(PayOsCreatePaymentRequest request) {
            lastRequest = request;
            return new PayOsCreatePaymentResponse(
                    request.orderCode(),
                    request.amount().intValueExact(),
                    "test-link-1001",
                    "https://pay.payos.vn/web/test-link-1001"
            );
        }
    }
}
