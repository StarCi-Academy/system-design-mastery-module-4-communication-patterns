package com.starci.write.customer;

/**
 * Request body for POST /customer/update.
 * Mirrors TS body: { id: string; name: string; email: string }.
 */
public class UpsertRequest {
    private String id;
    private String name;
    private String email;

    public UpsertRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
