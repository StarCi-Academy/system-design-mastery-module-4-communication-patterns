FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
# Restore dependencies separately for layer caching.
COPY *.csproj ./
RUN dotnet restore
COPY . ./
# Publish a self-contained release build.
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=builder /publish .
EXPOSE 8000
# Run the published binary; Kestrel listens on 0.0.0.0:8000 per Program.cs.
ENTRYPOINT ["dotnet", "api-gateway.dll"]
