FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
# Restore dependencies first for better layer caching.
COPY *.csproj ./
RUN dotnet restore
# Copy source and publish release build.
COPY . ./
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=builder /publish .
EXPOSE 3000
ENTRYPOINT ["dotnet", "event-store-service.dll"]
