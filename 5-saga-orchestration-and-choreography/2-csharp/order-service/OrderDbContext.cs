// EF Core DbContext — maps Order entity to the `orders` table in PostgreSQL.
using Microsoft.EntityFrameworkCore;

namespace OrderService;

/// <summary>
/// EF Core context for the order-service PostgreSQL database.
/// Table `orders` mirrors the TS TypeORM OrderEntity schema.
/// </summary>
public class OrderDbContext(DbContextOptions<OrderDbContext> options) : DbContext(options)
{
    /// <summary>DbSet mapped to `orders` table.</summary>
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Explicit table name matching TS entity: @Entity({ name: "orders" }).
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<Order>().Property(o => o.Status).HasDefaultValue("PENDING");
    }
}
