using MongoDB.Driver;
using RPGSheetManager.Domain.Users;

namespace RPGSheetManager.Infra.Features.Users {
    public class UserRepository : IUserRepository {
        private readonly IMongoCollection<User> _collection;

        public UserRepository(IMongoDatabase database) {
            _collection = database.GetCollection<User>("Users");
        }
        public async Task AddOrUpdateAsync(User user) {
            var filter = Builders<User>.Filter.Eq(u => u.AuthId, user.AuthId);
            await _collection.ReplaceOneAsync(filter, user, new ReplaceOptions { IsUpsert = true });
        }

        public async Task<User?> GetByAuthIdAsync(string authId) {
            return await _collection.Find(u => u.AuthId == authId).FirstOrDefaultAsync();
        }
    }
}
