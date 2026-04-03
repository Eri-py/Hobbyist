# Runtime-only image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Full SDK image — compile only, never deployed
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish "Hobbyist.Api/Hobbyist.Api.csproj" -c Release -o /app/publish

# Build a self-contained migration binary so efbundle can run without the SDK at runtime
RUN dotnet tool install --global dotnet-ef --version 9.0.12
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN  dotnet ef migrations bundle \
    --project Hobbyist.Api/Hobbyist.Api.csproj \
    --output /app/publish/efbundle \
    --self-contained \
    --runtime linux-x64

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
# migrate.sh is run by Railway pre-deploy — converts postgres:// URL and runs efbundle
COPY migrate.sh /app/migrate.sh
RUN chmod +x /app/migrate.sh /app/efbundle
ENTRYPOINT ["dotnet", "Hobbyist.Api.dll"]
