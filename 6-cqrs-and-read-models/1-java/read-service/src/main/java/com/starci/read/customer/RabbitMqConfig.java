package com.starci.read.customer;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the read-side consumer.
 * Queue name must match write-service publisher (cqrs.customer.profile).
 */
@Configuration
public class RabbitMqConfig {

    /** Queue name — must match write-service QUEUE constant. */
    public static final String QUEUE = "cqrs.customer.profile";

    /**
     * Declare the same durable queue so consumer can start before write-service.
     */
    @Bean
    public Queue customerProfileQueue() {
        return new Queue(QUEUE, true);
    }

    /**
     * JSON message converter — deserializes incoming RabbitMQ messages to Java objects.
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configure the listener container factory to use the JSON converter,
     * with prefetchCount=1 to mirror TS noAck:false + prefetchCount:1.
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        factory.setPrefetchCount(1);
        factory.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.AUTO);
        return factory;
    }
}
