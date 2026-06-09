package com.starci.gateway;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Enumeration;

/**
 * GatewayController — single entry point that proxies incoming requests to
 * the correct internal service based on the request-path prefix.
 *
 * <p>Routes:
 * <ul>
 *   <li>{@code /users/**} → {@code user-service:3001}</li>
 *   <li>{@code /products/**} → {@code product-service:3002}</li>
 *   <li>{@code /orders/**} → {@code order-service:3003}</li>
 *   <li>everything else → 404 at the edge (no backend touched)</li>
 * </ul>
 */
@RestController
public class GatewayController {

    /** Shared RestTemplate for forwarding requests to upstream services. */
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Proxy handler for known prefixes — forwards to the matching internal service.
     *
     * @param body    raw request body bytes (may be null for GET/DELETE)
     * @param method  HTTP method from the original request
     * @param request original servlet request (provides path + headers)
     * @return relayed response from the upstream service (status + body verbatim)
     */
    // Bắt các prefix đã biết rồi proxy sang đúng service nội bộ.
    @RequestMapping(value = {
        "/users", "/users/**",
        "/products", "/products/**",
        "/orders", "/orders/**"
    })
    public ResponseEntity<byte[]> proxy(
            @RequestBody(required = false) byte[] body,
            HttpMethod method,
            HttpServletRequest request) {

        String path = request.getRequestURI();
        String targetUri;

        // Choose upstream base URL by inspecting the path prefix.
        if (path.startsWith("/users")) {
            targetUri = "http://user-service:3001" + path;
        } else if (path.startsWith("/products")) {
            targetUri = "http://product-service:3002" + path;
        } else if (path.startsWith("/orders")) {
            targetUri = "http://order-service:3003" + path;
        } else {
            // Unreachable branch — the prefix filter above covers all mapped paths.
            return notFound(path);
        }

        // Copy header request, rồi relay response upstream nguyên vẹn.
        HttpEntity<byte[]> entity = new HttpEntity<>(body, copyHeaders(request));
        try {
            // exchange relays method + body and returns the upstream response as-is.
            return restTemplate.exchange(targetUri, method, entity, byte[].class);
        } catch (HttpStatusCodeException ex) {
            // Relay the upstream error status and body (e.g. 400, 404 from a service).
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsByteArray());
        } catch (Exception ex) {
            // Service unreachable — return 502 Bad Gateway.
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(("{\"message\":\"upstream unavailable: " + ex.getMessage() + "\"}").getBytes());
        }
    }

    /**
     * Catch-all for any path that does not match a known prefix.
     * Returns 404 immediately — no backend service is contacted.
     *
     * @param request original servlet request (provides path for error message)
     * @return JSON 404 response
     */
    // Mọi path không khớp prefix nào ở trên → gateway tự trả 404.
    @RequestMapping("/**")
    public ResponseEntity<String> handleNotFound(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.APPLICATION_JSON)
                .body(String.format("{\"message\":\"No route for %s\"}", request.getRequestURI()));
    }

    /**
     * Copy all request headers from the original servlet request into an HttpHeaders object.
     *
     * @param request original servlet request
     * @return copied headers suitable for passing to RestTemplate
     */
    private HttpHeaders copyHeaders(HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        // Enumerate and copy every header so upstream sees the same headers as the original client.
        Enumeration<String> names = request.getHeaderNames();
        if (names != null) {
            for (String name : Collections.list(names)) {
                // Skip Host header to avoid misrouting at the upstream service.
                if (!name.equalsIgnoreCase("host")) {
                    headers.add(name, request.getHeader(name));
                }
            }
        }
        return headers;
    }

    /**
     * Build a 404 JSON response for an unknown path.
     *
     * @param path the unmatched request URI
     * @return 404 ResponseEntity with JSON body
     */
    private ResponseEntity<byte[]> notFound(String path) {
        String body = String.format("{\"message\":\"No route for %s\"}", path);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body.getBytes());
    }
}
