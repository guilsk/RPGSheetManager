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

        public async Task<bool> AddSavedSystemAsync(string authId, string systemId) {
            var filter = Builders<User>.Filter.Eq(u => u.AuthId, authId);
            var update = Builders<User>.Update.AddToSet(u => u.SavedSystemIds, systemId);
            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> RemoveSavedSystemAsync(string authId, string systemId) {
            var filter = Builders<User>.Filter.Eq(u => u.AuthId, authId);
            var update = Builders<User>.Update.Pull(u => u.SavedSystemIds, systemId);
            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task UpdateProfileAsync(User user) {
            var filter = Builders<User>.Filter.Eq(u => u.AuthId, user.AuthId);
            var update = Builders<User>.Update
                .Set(u => u.DisplayName, user.DisplayName)
                .Set(u => u.Email, user.Email);
            await _collection.UpdateOneAsync(filter, update);
        }
    }
}
