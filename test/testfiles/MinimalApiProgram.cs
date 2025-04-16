var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ));
    return forecast;
});

app.MapGet("/weatherforecast/{id}", (int id) =>
    Results.Ok(new WeatherForecast()));

app.MapPost("/weatherforecast", (WeatherForecast forecast) =>
    Results.Created($"/weatherforecast/1", forecast));
