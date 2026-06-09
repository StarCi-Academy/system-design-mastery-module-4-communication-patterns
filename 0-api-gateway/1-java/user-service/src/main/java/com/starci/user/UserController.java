package com.starci.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * UserController — REST controller that manages users in memory.
 *
 * <p>This service does not know it sits behind a gateway. It simply exposes
 * {@code POST /users} and {@code GET /users} as a plain REST API.
 * The gateway is a transparent pass-through layer.
 */
@RestController
@RequestMapping("/users")
public class UserController {

    /**
     * In-memory user list — grows with each POST request.
     * Wrapped in {@link Collections#synchronizedList} to prevent concurrent-modification
     * issues when Tomcat's worker pool handles parallel requests.
     */
    private final List<User> users = Collections.synchronizedList(new ArrayList<>());

    /**
     * Auto-increment counter — thread-safe via AtomicLong.
     * Tomcat processes requests on multiple threads; AtomicLong avoids id collisions.
     */
    private final AtomicLong counter = new AtomicLong(0);

    /**
     * Create a new user and return it with HTTP 201 Created.
     *
     * <p>The service assigns the id — the gateway only forwarded the request.
     *
     * @param user request body containing name and email
     * @return newly created user with 201 status
     */
    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        long id = counter.incrementAndGet();
        // Construct the persisted user with the auto-assigned id.
        User created = new User(id, user.getName(), user.getEmail());
        users.add(created);
        // HTTP 201 is the correct REST status for resource creation; gateway relays it verbatim.
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Return the full list of created users (HTTP 200).
     *
     * @return snapshot of all in-memory users
     */
    @GetMapping
    public Collection<User> getAll() {
        // Synchronize to safely copy the list while another thread may be writing.
        synchronized (users) { return new ArrayList<>(users); }
    }
}
