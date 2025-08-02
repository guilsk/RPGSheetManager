using RPGSheetManager.Application.Services.Campaigns;
using RPGSheetManager.Application.Services.Characters;
using RPGSheetManager.Application.Services.Systems;
using RPGSheetManager.Application.Services.Users;
using RPGSheetManager.Domain.Campaigns;
using RPGSheetManager.Domain.Characters;
using RPGSheetManager.Domain.Systems;
using RPGSheetManager.Domain.Users;
using RPGSheetManager.Infra.Features.Campaigns;
using RPGSheetManager.Infra.Features.Characters;
using RPGSheetManager.Infra.Features.Systems;
using RPGSheetManager.Infra.Features.Users;

namespace RPGSheetManager.API.Extensions {
    public static class MongoDbExtensions {
        public static IServiceCollection AddMongoDb(this IServiceCollection services) {
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<UserService>();
            services.AddScoped<ICharacterRepository, CharacterRepository>();
            services.AddScoped<CharacterService>();
            services.AddScoped<ISystemRepository, SystemRepository>();
            services.AddScoped<SystemService>();
            services.AddScoped<ICampaignRepository, CampaignRepository>();
            services.AddScoped<CampaignService>();

            return services;
        }
    }
}