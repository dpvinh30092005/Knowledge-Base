package com.vinhdp.testingtdd.payos;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DummyPayOsHttpClientTest {

    @Test
    void success() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();

        PayOsCreatePaymentResponse response = payOs.createPaymentLink(validRequest());

        assertThat(response.orderCode()).isEqualTo(1001L);
        assertThat(response.amount()).isEqualTo(10_000);
        assertThat(response.paymentLinkId()).isEqualTo("dummy-payment-link-1001");
        assertThat(response.checkoutUrl()).isEqualTo("https://pay.payos.vn/web/dummy-payment-link-1001");
    }

    @Test
    void amountNotInteger() {
        PayOsCreatePaymentRequest request = requestWithAmount(new BigDecimal("10000.5"));

        assertPayOsError(request, "AMOUNT_NOT_INTEGER", "Amount must be an integer");
    }

    @Test
    void decimalPartTooLong() {
        PayOsCreatePaymentRequest request = requestWithAmount(new BigDecimal("10000.55"));

        assertPayOsError(request, "DECIMAL_PART_TOO_LONG", "Amount decimal part is too long");
    }

    @Test
    void orderFound() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.createPaymentLink(validRequest());

        assertThatThrownBy(() -> payOs.createPaymentLink(validRequest()))
                .isInstanceOf(PayOsPaymentException.class)
                .hasMessage("payOS payment failed: ORDER_FOUND")
                .satisfies(exception -> {
                    PayOsPaymentException payOsException = (PayOsPaymentException) exception;
                    assertThat(payOsException.getBusinessMessage()).isEqualTo("Order already exists in payOS");
                });
    }

    @Test
    void vietqrProCreateOrderFail() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.failVietQrProCreateOrder();

        assertPayOsError(payOs, validRequest(), "VIETQR_PRO_CREATE_ORDER_FAIL", "payOS could not create VietQR Pro order");
    }

    @Test
    void paymentGatewayNotFound() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.markPaymentGatewayMissing();

        assertPayOsError(payOs, validRequest(), "PAYMENT_GATEWAY_NOT_FOUND", "Payment gateway was not found");
    }

    @Test
    void paymentGatewayPaused() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.pausePaymentGateway();

        assertPayOsError(payOs, validRequest(), "PAYMENT_GATEWAY_PAUSED", "Payment gateway is paused");
    }

    @Test
    void bankInfoNotFound() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.markBankInfoMissing();

        assertPayOsError(payOs, validRequest(), "BANK_INFO_NOT_FOUND", "Bank information was not found");
    }

    @Test
    void fiServiceAccountStateInactive() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.deactivateServiceAccount();

        assertPayOsError(payOs, validRequest(), "FI_SERVICE_ACCOUNT_STATE_INACTIVE", "Financial service account is inactive");
    }

    @Test
    void paymentGatewayOrganizationNotFound() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.markPaymentGatewayOrganizationMissing();

        assertPayOsError(payOs, validRequest(), "PAYMENT_GATEWAY_ORGANIZATION_NOT_FOUND", "Payment gateway organization was not found");
    }

    @Test
    void invalidPartnerCore() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.invalidatePartnerCore();

        assertPayOsError(payOs, validRequest(), "INVALID_PARTNER_CORE", "Partner core is invalid");
    }

    @Test
    void invalidContextType() {
        PayOsCreatePaymentRequest request = new PayOsCreatePaymentRequest(
                1001L,
                BigDecimal.valueOf(10_000),
                "ORDER1001",
                "https://example.com/cancel",
                "https://example.com/return",
                "valid-signature",
                "UNSUPPORTED_CONTEXT"
        );

        assertPayOsError(request, "INVALID_CONTEXT_TYPE", "Context type is invalid");
    }

    @Test
    void invalidParam() {
        PayOsCreatePaymentRequest request = new PayOsCreatePaymentRequest(
                1001L,
                BigDecimal.valueOf(10_000),
                "",
                "https://example.com/cancel",
                "https://example.com/return",
                "valid-signature"
        );

        assertPayOsError(request, "INVALID_PARAM", "Payment request contains invalid parameters");
    }

    @Test
    void paymentRequestDataSignatureIncorrect() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.expectSignature("expected-signature");
        PayOsCreatePaymentRequest request = new PayOsCreatePaymentRequest(
                1001L,
                BigDecimal.valueOf(10_000),
                "ORDER1001",
                "https://example.com/cancel",
                "https://example.com/return",
                "wrong-signature"
        );

        assertPayOsError(payOs, request, "PAYMENT_REQUEST_DATA_SIGNATURE_INCORRECT", "Payment request signature is incorrect");
    }

    @Test
    void subcriptionNotFound() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.markSubscriptionMissing();

        assertPayOsError(payOs, validRequest(), "SUBCRIPTION_NOT_FOUND", "Subscription was not found");
    }

    @Test
    void balanceNotEnough() {
        DummyPayOsHttpClient payOs = new DummyPayOsHttpClient();
        payOs.setAvailableBalance(BigDecimal.valueOf(9_999));

        assertPayOsError(payOs, validRequest(), "BALANCE_NOT_ENOUGH", "Balance is not enough");
    }

    private void assertPayOsError(PayOsCreatePaymentRequest request, String code, String businessMessage) {
        assertPayOsError(new DummyPayOsHttpClient(), request, code, businessMessage);
    }

    private void assertPayOsError(
            DummyPayOsHttpClient payOs,
            PayOsCreatePaymentRequest request,
            String code,
            String businessMessage
    ) {
        assertThatThrownBy(() -> payOs.createPaymentLink(request))
                .isInstanceOf(PayOsPaymentException.class)
                .hasMessage("payOS payment failed: " + code)
                .satisfies(exception -> {
                    PayOsPaymentException payOsException = (PayOsPaymentException) exception;
                    assertThat(payOsException.getResultCode()).isEqualTo(code);
                    assertThat(payOsException.getBusinessMessage()).isEqualTo(businessMessage);
                });
    }

    private PayOsCreatePaymentRequest requestWithAmount(BigDecimal amount) {
        return new PayOsCreatePaymentRequest(
                1001L,
                amount,
                "ORDER1001",
                "https://example.com/cancel",
                "https://example.com/return",
                "valid-signature"
        );
    }

    private PayOsCreatePaymentRequest validRequest() {
        return requestWithAmount(BigDecimal.valueOf(10_000));
    }
}
