using MongoDB.Driver;
using RPGSheetManager.Domain.Characters;

namespace RPGSheetManager.Infra.Features.Characters {
    public class CharacterRepository : ICharacterRepository {
        private readonly IMongoCollection<Character> _collection;

        public CharacterRepository(IMongoDatabase database) {
            _collection = database.GetCollection<Character>("Characters");
        }

        public async Task<List<Character>> GetAllAsync() {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<Character?> GetByIdAsync(Guid id) {
            return await _collection.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task AddAsync(Character character) {
            await _collection.InsertOneAsync(character);
        }

        public async Task UpdateAsync(Guid id, Character updated) {
            await _collection.ReplaceOneAsync(c => c.Id == id, updated);
        }

        public async Task DeleteAsync(Guid id) {
            await _collection.DeleteOneAsync(c => c.Id == id);
        }
    }
}
