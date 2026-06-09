package com.starci.user;

/**
 * User — domain record representing a user managed by the user-service.
 *
 * <p>Fields are mutable so Jackson can deserialize request bodies into this type.
 * Validation is kept minimal for this demo lesson.
 */
public class User {

    /** Auto-assigned integer id set by the service on creation. */
    private long id;

    /** Display name of the user. */
    private String name;

    /** Email address of the user. */
    private String email;

    /** No-arg constructor required by Jackson for deserialization. */
    public User() {}

    /**
     * Full constructor used when creating a new user record.
     *
     * @param id    auto-increment id
     * @param name  display name
     * @param email email address
     */
    public User(long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    /** @return the user's id */
    public long getId() { return id; }

    /** @return the user's display name */
    public String getName() { return name; }

    /** @return the user's email */
    public String getEmail() { return email; }

    /** @param id sets the id (used by Jackson on deserialization) */
    public void setId(long id) { this.id = id; }

    /** @param name sets the display name */
    public void setName(String name) { this.name = name; }

    /** @param email sets the email address */
    public void setEmail(String email) { this.email = email; }
}
