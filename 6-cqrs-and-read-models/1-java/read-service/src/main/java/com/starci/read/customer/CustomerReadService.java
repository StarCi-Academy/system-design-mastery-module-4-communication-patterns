package com.starci.read.customer;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import co.elastic.clients.elasticsearch.core.GetRequest;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Read-side service — manages the Elasticsearch "customers" index.
 *
 * <p>Mirrors TS ElasticsearchService:
 * <ul>
 *   <li>{@code onModuleInit} → {@link #init()} creates the index on startup (ignores 400 "already exists").</li>
 *   <li>{@code upsertCustomer} → {@link #upsertCustomer(CustomerDoc)} indexes a document with refresh=true.</li>
 *   <li>{@code getById} → {@link #getById(String)} returns null on not-found.</li>
 * </ul>
 */
@Service
public class CustomerReadService {

    private static final Logger log = LoggerFactory.getLogger(CustomerReadService.class);
    private static final String INDEX = "customers";

    private final ElasticsearchClient esClient;

    public CustomerReadService(ElasticsearchClient esClient) {
        this.esClient = esClient;
    }

    /**
     * Create the "customers" index with keyword/text mappings on startup.
     * Ignores the error if the index already exists (mirrors TS status 400 check).
     */
    @PostConstruct
    public void init() {
        // Elasticsearch needs time to start; retry the index creation until ES is reachable.
        final int maxAttempts = 30;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                esClient.indices().create(CreateIndexRequest.of(req -> req
                        .index(INDEX)
                        .mappings(m -> m
                                .properties("id", p -> p.keyword(k -> k))
                                .properties("name", p -> p.text(t -> t))
                                .properties("email", p -> p.keyword(k -> k))
                        )
                ));
                log.info("Elasticsearch index \"{}\" created", INDEX);
                return;
            } catch (ElasticsearchException e) {
                // 400 resource_already_exists_exception — ignore, same as TS status !== 400 check
                if (e.response().status() == 400) {
                    log.debug("Elasticsearch index \"{}\" already exists, continuing", INDEX);
                    return;
                }
                throw new RuntimeException("Failed to create Elasticsearch index: " + INDEX, e);
            } catch (Exception e) {
                // Connection refused while ES is still booting — wait and retry.
                if (attempt == maxAttempts) {
                    throw new RuntimeException("Failed to initialize Elasticsearch index: " + INDEX, e);
                }
                log.info("Elasticsearch not ready (attempt {}/{}), retrying in 2s ...", attempt, maxAttempts);
                try {
                    Thread.sleep(2000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while waiting for Elasticsearch", ie);
                }
            }
        }
    }

    /**
     * Upsert a customer document into Elasticsearch (refresh=true so it is immediately queryable).
     *
     * @param doc customer document to index
     */
    public void upsertCustomer(CustomerDoc doc) {
        try {
            esClient.index(IndexRequest.of(req -> req
                    .index(INDEX)
                    .id(doc.getId())
                    .document(doc)
                    .refresh(co.elastic.clients.elasticsearch._types.Refresh.True)
            ));
        } catch (Exception e) {
            throw new RuntimeException("Failed to upsert customer in Elasticsearch", e);
        }
    }

    /**
     * Retrieve a customer document by ID. Returns null if not found.
     *
     * @param id customer ID
     * @return customer doc or null
     */
    public CustomerDoc getById(String id) {
        try {
            GetResponse<CustomerDoc> response = esClient.get(
                    GetRequest.of(req -> req.index(INDEX).id(id)),
                    CustomerDoc.class
            );
            return response.found() ? response.source() : null;
        } catch (ElasticsearchException e) {
            if (e.response().status() == 404) {
                return null;
            }
            throw new RuntimeException("Failed to get customer from Elasticsearch", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get customer from Elasticsearch", e);
        }
    }
}
