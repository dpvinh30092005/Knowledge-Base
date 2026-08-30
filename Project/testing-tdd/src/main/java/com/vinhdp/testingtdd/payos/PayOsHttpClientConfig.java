package com.vinhdp.testingtdd.payos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PayOsHttpClientConfig {

    @Bean
    public PayOsHttpClient payOsHttpClient() {
        return new DummyPayOsHttpClient();
    }

    @Bean
    public PayOsGateway payOsGateway(
            PayOsHttpClient payOsHttpClient,
            @Value("${payos.checksum-key:}") String checksumKey,
            @Value("${payos.cancel-url:}") String cancelUrl,
            @Value("${payos.return-url:}") String returnUrl
    ) {
        return new PayOsGatewayImpl(payOsHttpClient, checksumKey, cancelUrl, returnUrl);
    }
}
