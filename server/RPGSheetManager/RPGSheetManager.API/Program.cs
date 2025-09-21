using MongoDB.Driver;
using RPGSheetManager.API.Extensions;
using RPGSheetManager.Infra.Settings;

namespace RPGSheetManager.API {
    public class Program {
        public static void Main(string[] args) {
            var builder = WebApplication.CreateBuilder(args);

            var allowed = builder.Configuration.GetSection("AllowedCors").Get<string[]>() ?? [];
            builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
                p.WithOrigins(allowed).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

            // Add services to the container.
            builder.Services.AddJwtAuthentication(builder.Configuration);
            builder.Services.AddSwaggerDocumentation();

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            #region MongoDB Settings
            builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));

            builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(builder.Configuration.GetSection("MongoDb:ConnectionString").Value));
            builder.Services.AddScoped(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(builder.Configuration.GetSection("MongoDb:DatabaseName").Value));

            builder.Services.AddMongoDb();
            #endregion

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment()) {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI(c => {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RPGSheetManager.API v1");
                    c.RoutePrefix = string.Empty;
                });
            }

            app.UseHttpsRedirection();
            app.UseCors();

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
