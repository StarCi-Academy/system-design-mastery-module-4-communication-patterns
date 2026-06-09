package com.starci.write.customer;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration — declares the durable queue and sets JSON message converter.
 * Queue name must match the read-service consumer queue (cqrs.customer.profile).
 */
@Configuration
public class RabbitMqConfig {

    /** Queue name — must match read-service consumer (mirrors TS CUSTOMER_PROFILE_QUEUE). */
    public static final String QUEUE = "cqrs.customer.profile";

    /** Routing key / event pattern — must match read-service listener (mirrors TS CUSTOMER_PROFILE_EVENT). */
    public static final String ROUTING_KEY = "customer.profile.updated";

    /**
     * Declare a durable queue so messages survive broker restarts.
     */
    @Bean
    public Queue customerProfileQueue() {
        return new Queue(QUEUE, true);
    }

    /**
     * Use Jackson JSON converter for all AMQP messages (payload serialized as JSON).
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Override default RabbitTemplate to use the JSON message converter.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }
}
