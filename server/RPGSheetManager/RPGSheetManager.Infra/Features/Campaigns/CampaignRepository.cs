using MongoDB.Driver;
using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.Infra.Features.Campaigns {
    public class CampaignRepository : ICampaignRepository {
        private readonly IMongoCollection<Campaign> _collection;

        public CampaignRepository(IMongoDatabase database) {
            _collection = database.GetCollection<Campaign>("Campaigns");
        }

        public async Task<List<Campaign>> GetAllAsync() {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<List<Campaign>> GetByMasterIdAsync(string masterId) {
            return await _collection.Find(c => c.MasterId == masterId).ToListAsync();
        }

        public async Task<List<Campaign>> GetByPlayerIdAsync(string playerId) {
            return await _collection.Find(c => c.PlayerIds.Contains(playerId)).ToListAsync();
        }

        public async Task<Campaign?> GetByIdAsync(string id) {
            return await _collection.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Campaign> AddAsync(Campaign campaign) {
            await _collection.InsertOneAsync(campaign);
            return campaign;
        }

        public async Task UpdateAsync(string id, Campaign campaign) {
            await _collection.ReplaceOneAsync(c => c.Id == id, campaign);
        }

        public async Task DeleteAsync(string id) {
            await _collection.DeleteOneAsync(c => c.Id == id);
        }

        public async Task AddCharacterAsync(string campaignId, CampaignCharacter character) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.Characters, character);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task UpdateCharacterDataAsync(string campaignId, string characterId, List<DynamicField> updatedData) {
            var filter = Builders<Campaign>.Filter.And(
                Builders<Campaign>.Filter.Eq(c => c.Id, campaignId),
                Builders<Campaign>.Filter.ElemMatch(c => c.Characters, ch => ch.CharacterId == characterId)
            );
            var update = Builders<Campaign>.Update.Set("Characters.$.DynamicData", updatedData);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task StartSessionAsync(string campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, true);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task EndSessionAsync(string campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, false);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task SaveRollHistoryAsync(string campaignId, DiceRoll roll) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.DiceHistory, roll);
            await _collection.UpdateOneAsync(filter, update);
        }
    }
}
