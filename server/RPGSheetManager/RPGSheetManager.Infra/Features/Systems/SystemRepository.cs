using MongoDB.Driver;
using RPGSheetManager.Domain.Systems;

namespace RPGSheetManager.Infra.Features.Systems {
    public class SystemRepository : ISystemRepository {
        private readonly IMongoCollection<RPGSystem> _collection;

        public SystemRepository(IMongoDatabase database) {
            _collection = database.GetCollection<RPGSystem>("Systems");
        }

        public async Task<List<RPGSystem>> GetAllAsync() {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<RPGSystem?> GetByIdAsync(string id) {
            return await _collection.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task AddAsync(RPGSystem systems) {
            await _collection.InsertOneAsync(systems);
        }

        public async Task UpdateAsync(string id, RPGSystem updated) {
            await _collection.ReplaceOneAsync(c => c.Id == id, updated);
        }

        public async Task DeleteAsync(string id) {
            await _collection.DeleteOneAsync(c => c.Id == id);
        }
    }
}
