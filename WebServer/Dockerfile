FROM mcr.microsoft.com/dotnet/sdk:9.0 AS final
WORKDIR /app
EXPOSE 7000

COPY . .
RUN dotnet restore "Hobbyist.Api/Hobbyist.Api.csproj"
RUN dotnet publish "Hobbyist.Api/Hobbyist.Api.csproj" -c Release -o /app/publish
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

WORKDIR /app/publish
CMD dotnet ef database update --project /app/Hobbyist.Api/Hobbyist.Api.csproj && dotnet Hobbyist.Api.dll