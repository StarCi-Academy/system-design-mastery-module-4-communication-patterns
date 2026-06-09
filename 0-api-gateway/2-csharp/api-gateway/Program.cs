// API Gateway — ASP.NET Core minimal API reverse proxy.
// Single entry point on port 8000; routes requests by path prefix to internal services.
var builder = WebApplication.CreateBuilder(args);

// Register IHttpClientFactory so we can create named HttpClient instances per upstream.
builder.Services.AddHttpClient();

var app = builder.Build();

// Single catch-all route: inspect the path, pick the upstream, forward the request.
app.Map("{*path}", async (string? path, HttpContext context, IHttpClientFactory clientFactory) =>
{
    path = path ?? "";
    string targetUrl;

    // Route by path prefix to the correct internal service hostname + port.
    if (path.StartsWith("users"))
    {
        // user-service resolves to the Docker service on the shared network.
        targetUrl = $"http://user-service:3001/{path}";
    }
    else if (path.StartsWith("products"))
    {
        targetUrl = $"http://product-service:3002/{path}";
    }
    else if (path.StartsWith("orders"))
    {
        targetUrl = $"http://order-service:3003/{path}";
    }
    else
    {
        // Prefix lạ → gateway tự trả 404; không backend nào bị gọi.
        context.Response.StatusCode = 404;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = $"No route for /{path}" });
        return;
    }

    // Dựng request upstream, giữ nguyên method + body, rồi relay response.
    var client = clientFactory.CreateClient();
    var requestMsg = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUrl);

    // Copy the request body for POST/PUT/PATCH methods.
    if (HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method))
    {
        requestMsg.Content = new StreamContent(context.Request.Body);
        if (context.Request.ContentType != null)
            requestMsg.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
    }

    // Forward the response from the upstream service back to the client verbatim.
    try
    {
        var responseMsg = await client.SendAsync(requestMsg, HttpCompletionOption.ResponseHeadersRead);
        context.Response.StatusCode = (int)responseMsg.StatusCode;   // relay status nguyên vẹn
        foreach (var h in responseMsg.Headers)
        {
            // Bỏ Transfer-Encoding: Kestrel tự đóng khung body, nếu copy header chunked
            // của upstream sẽ bị double-chunk làm hỏng response.
            if (string.Equals(h.Key, "Transfer-Encoding", StringComparison.OrdinalIgnoreCase)) continue;
            context.Response.Headers[h.Key] = h.Value.ToArray();
        }
        if (responseMsg.Content.Headers.ContentType is { } ct2)
            context.Response.ContentType = ct2.ToString();
        await responseMsg.Content.CopyToAsync(context.Response.Body);
    }
    catch
    {
        // Upstream unreachable → 502 Bad Gateway.
        context.Response.StatusCode = 502;
        await context.Response.WriteAsJsonAsync(new { message = "upstream unavailable" });
    }
});

// Bind to 0.0.0.0 so Docker's port-publish mapping (host:8000 → container:8000) works.
app.Run("http://0.0.0.0:8000");
