package com.vinhdp.testingtdd.payment;

import com.vinhdp.testingtdd.order.InMemoryOrderRepository;
import com.vinhdp.testingtdd.order.Order;
import com.vinhdp.testingtdd.order.OrderService;
import com.vinhdp.testingtdd.order.OrderStatus;
import com.vinhdp.testingtdd.payos.PayOsGateway;
import com.vinhdp.testingtdd.payos.PayOsPaymentException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentServiceDriverTest {

    @Nested
    class SuccessfulPayment {

        @Test
        void success() {
            PaymentDriver driver = new PaymentDriver("SUCCESS");
            Order order = driver.createOrder(1001L, 10_000, "ORDER1001");

            PaymentLink paymentLink = driver.createPaymentForOrder(order.getOrderCode());

            assertThat(paymentLink.orderCode()).isEqualTo(1001L);
            assertThat(paymentLink.amount()).isEqualTo(10_000);
            assertThat(paymentLink.paymentLinkId()).isEqualTo("dummy-payment-link-1001");
            assertThat(paymentLink.checkoutUrl()).isEqualTo("https://pay.payos.vn/web/dummy-payment-link-1001");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);
            assertThat(driver.payOsGateway.lastOrderCode).isEqualTo(1001L);
            assertThat(driver.payOsGateway.lastAmount).isEqualTo(10_000);
            assertThat(driver.payOsGateway.lastDescription).isEqualTo("ORDER1001");
        }
    }

    @Nested
    class FailedPayment {

        @Test
        void rejectsPaymentWhenOrderDoesNotExist() {
            PaymentDriver driver = new PaymentDriver("SUCCESS");

            assertThatThrownBy(() -> driver.createPaymentForOrder(404L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Order not found: 404");
        }

        @Test
        void keepsOrderCreatedWhenPayOsGatewayFails() {
            PaymentDriver driver = new PaymentDriver("INVALID_PARAM");
            Order order = driver.createOrder(2001L, 30_000, "ORDER2001");

            assertThatThrownBy(() -> driver.createPaymentForOrder(order.getOrderCode()))
                    .isInstanceOf(PayOsPaymentException.class)
                    .hasMessage("payOS payment failed: INVALID_PARAM")
                    .satisfies(exception -> {
                        PayOsPaymentException paymentException = (PayOsPaymentException) exception;
                        assertThat(paymentException.getResultCode()).isEqualTo("INVALID_PARAM");
                    });

            assertThat(order.getStatus()).isEqualTo(OrderStatus.CREATED);
        }
    }

    private static class PaymentDriver {
        private final OrderService orderService;
        private final PayOsGatewayStub payOsGateway;
        private final PaymentService paymentService;

        private PaymentDriver(String resultCode) {
            this.orderService = new OrderService(new InMemoryOrderRepository());
            this.payOsGateway = new PayOsGatewayStub(resultCode);
            this.paymentService = new PaymentService(orderService, payOsGateway);
        }

        private Order createOrder(long orderCode, int amount, String description) {
            return orderService.createOrder(orderCode, amount, description);
        }

        private PaymentLink createPaymentForOrder(long orderCode) {
            return paymentService.createPaymentForOrder(orderCode);
        }
    }

    private static class PayOsGatewayStub implements PayOsGateway {
        private final String resultCode;
        private long lastOrderCode;
        private int lastAmount;
        private String lastDescription;

        private PayOsGatewayStub(String resultCode) {
            this.resultCode = resultCode;
        }

        @Override
        public PaymentLink createPaymentLink(Order order) {
            lastOrderCode = order.getOrderCode();
            lastAmount = order.getAmount();
            lastDescription = order.getDescription();

            if (!"SUCCESS".equals(resultCode)) {
                throw new PayOsPaymentException(resultCode);
            }

            return new PaymentLink(
                    order.getOrderCode(),
                    order.getAmount(),
                    "dummy-payment-link-" + order.getOrderCode(),
                    "https://pay.payos.vn/web/dummy-payment-link-" + order.getOrderCode()
            );
        }
    }
}
