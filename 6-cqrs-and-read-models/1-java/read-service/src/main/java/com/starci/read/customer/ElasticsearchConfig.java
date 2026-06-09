package com.starci.read.customer;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Elasticsearch client configuration.
 * Reads {@code elasticsearch.node} from application.properties / env ELASTICSEARCH_NODE.
 */
@Configuration
public class ElasticsearchConfig {

    @Value("${elasticsearch.node:http://localhost:9200}")
    private String elasticsearchNode;

    /**
     * Build the official Elasticsearch Java client connected to the configured node.
     */
    @Bean
    public ElasticsearchClient elasticsearchClient() {
        RestClient restClient = RestClient.builder(HttpHost.create(elasticsearchNode)).build();
        ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        return new ElasticsearchClient(transport);
    }
}
