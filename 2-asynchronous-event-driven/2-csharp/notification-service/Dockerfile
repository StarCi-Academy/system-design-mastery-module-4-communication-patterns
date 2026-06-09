# Stage 1 — restore & publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY notification-service.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2 — runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "notification-service.dll"]
