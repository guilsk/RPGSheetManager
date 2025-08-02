using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.Application.Services.Campaigns {
    public class CampaignService {
        private readonly ICampaignRepository _repository;

        public CampaignService(ICampaignRepository repository) {
            _repository = repository;
        }

        public Task<Campaign?> GetByIdAsync(Guid id) {
            return _repository.GetByIdAsync(id);
        }

        public Task AddAsync(Campaign campaign) {
            return _repository.AddAsync(campaign);
        }

        public Task UpdateAsync(Campaign campaign) {
            return _repository.UpdateAsync(campaign);
        }

        public Task DeleteAsync(Guid id) {
            return _repository.DeleteAsync(id);
        }

        public Task AddCharacterAsync(Guid campaignId, CampaignCharacter character) {
            return _repository.AddCharacterAsync(campaignId, character);
        }

        public Task UpdateCharacterDataAsync(Guid campaignId, Guid characterId, List<DynamicField> data) {
            return _repository.UpdateCharacterDataAsync(campaignId, characterId, data);
        }

        public Task AddChatMessageAsync(Guid campaignId, ChatMessage message) {
            return _repository.AddChatMessageAsync(campaignId, message);
        }

        public Task<List<ChatMessage>> GetChatHistoryAsync(Guid campaignId) {
            return _repository.GetChatHistoryAsync(campaignId);
        }

        public Task SaveRollHistoryAsync(Guid campaignId, DiceRoll roll) {
            return _repository.SaveRollHistoryAsync(campaignId, roll);
        }

        public Task StartSessionAsync(Guid campaignId) {
            return _repository.StartSessionAsync(campaignId);
        }

        public Task EndSessionAsync(Guid campaignId) {
            return _repository.EndSessionAsync(campaignId);
        }
    }
}
