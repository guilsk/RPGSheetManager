using MongoDB.Driver;
using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.Infra.Features.Campaigns {
    public class CampaignRepository : ICampaignRepository {
        private readonly IMongoCollection<Campaign> _collection;

        public CampaignRepository(IMongoDatabase database) {
            _collection = database.GetCollection<Campaign>("Campaigns");
        }

        public async Task<Campaign?> GetByIdAsync(Guid id) {
            return await _collection.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task AddAsync(Campaign campaign) {
            await _collection.InsertOneAsync(campaign);
        }

        public async Task AddCharacterAsync(Guid campaignId, CampaignCharacter character) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.Characters, character);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task AddChatMessageAsync(Guid campaignId, ChatMessage message) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.ChatMessages, message);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task<List<ChatMessage>> GetChatHistoryAsync(Guid campaignId) {
            var campaign = await _collection
                .Find(c => c.Id == campaignId)
                .Project(c => c.ChatMessages)
                .FirstOrDefaultAsync();

            return campaign ?? new List<ChatMessage>();
        }

        public async Task DeleteAsync(Guid id) {
            await _collection.DeleteOneAsync(c => c.Id == id);
        }

        public async Task EndSessionAsync(Guid campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, false);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task SaveRollHistoryAsync(Guid campaignId, DiceRoll roll) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.DiceHistory, roll);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task StartSessionAsync(Guid campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, true);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task UpdateAsync(Campaign campaign) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaign.Id);
            await _collection.ReplaceOneAsync(filter, campaign);
        }

        public async Task UpdateCharacterDataAsync(Guid campaignId, Guid characterId, List<DynamicField> updatedData) {
            var filter = Builders<Campaign>.Filter.And(
                Builders<Campaign>.Filter.Eq(c => c.Id, campaignId),
                Builders<Campaign>.Filter.ElemMatch(c => c.Characters, ch => ch.CharId == characterId)
            );

            var update = Builders<Campaign>.Update.Set("Characters.$.DynamicData", updatedData);

            await _collection.UpdateOneAsync(filter, update);
        }
    }
}
