# Stage 1 — restore & publish
# Use the official .NET 8 SDK image to compile and publish the app.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file first so Docker can cache the restore layer separately.
COPY order-service.csproj .
RUN dotnet restore

# Copy remaining source and publish a self-contained release build.
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2 — runtime
# Use the smaller ASP.NET runtime image for the final image.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy only the published output from the build stage.
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "order-service.dll"]
