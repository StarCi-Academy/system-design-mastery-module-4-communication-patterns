// User Service — ASP.NET Core minimal API managing users in memory.
// The service has no knowledge of the gateway; it exposes plain HTTP endpoints.
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// In-memory data store — thread-safe via a lock object.
var users = new List<UserRecord>();
var lockObj = new object();
var counter = 0;

// POST /users — create a new user and return HTTP 201.
app.MapPost("/users", (UserRequest req) =>
{
    int id;
    UserRecord created;
    lock (lockObj)
    {
        // Increment counter inside the lock to prevent concurrent id collisions.
        id = ++counter;
        created = new UserRecord(id, req.Name, req.Email);
        users.Add(created);
    }
    // HTTP 201 is the correct REST status for resource creation; gateway relays verbatim.
    return Results.Created($"/users/{id}", created);
});

// GET /users — list all users.
app.MapGet("/users", () =>
{
    lock (lockObj)
    {
        // Return a snapshot so the list can be modified concurrently.
        return Results.Ok(users.ToList());
    }
});

// Bind to 0.0.0.0 so Docker's port-publish works (host:3001 → container:3001).
app.Run("http://0.0.0.0:3001");

// Domain record — immutable value type for a user.
record UserRecord(int Id, string Name, string Email);

// Input DTO — fields sent by the client in the request body.
record UserRequest(string Name, string Email);
