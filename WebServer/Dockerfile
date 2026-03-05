FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy everything so project references work
COPY . .

RUN dotnet restore "Hobbyist.Api/Hobbyist.Api.csproj"
RUN dotnet publish "Hobbyist.Api/Hobbyist.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Hobbyist.Api.dll"]