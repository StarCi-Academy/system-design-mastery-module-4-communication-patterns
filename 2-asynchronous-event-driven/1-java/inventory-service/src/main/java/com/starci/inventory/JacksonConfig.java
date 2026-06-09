package com.starci.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides a Jackson ObjectMapper bean for JSON parsing in consumers.
 * Needed because spring-boot-starter-web (which auto-configures ObjectMapper) is not included.
 */
@Configuration
public class JacksonConfig {

    /**
     * Create a default ObjectMapper for JSON deserialization of Kafka event payloads.
     *
     * @return configured ObjectMapper instance
     */
    @Bean
    public ObjectMapper objectMapper() {
        // Default configuration is sufficient for parsing the ORDER_CREATED event JSON
        return new ObjectMapper();
    }
}
