using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.Application.Services.Campaigns {
    public class CampaignService {
        private readonly ICampaignRepository _repository;

        public CampaignService(ICampaignRepository repository) {
            _repository = repository;
        }

        public async Task<List<Campaign>> GetAllAsync() {
            return await _repository.GetAllAsync();
        }

        public async Task<List<Campaign>> GetByMasterIdAsync(string masterId) {
            return await _repository.GetByMasterIdAsync(masterId);
        }

        public async Task<List<Campaign>> GetByPlayerIdAsync(string playerId) {
            return await _repository.GetByPlayerIdAsync(playerId);
        }

        public async Task<Campaign?> GetByIdAsync(string id) {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<Campaign> AddAsync(Campaign campaign) {
            return await _repository.AddAsync(campaign);
        }

        public async Task UpdateAsync(string id, Campaign campaign) {
            await _repository.UpdateAsync(id, campaign);
        }

        public async Task DeleteAsync(string id) {
            await _repository.DeleteAsync(id);
        }

        public async Task AddCharacterAsync(string campaignId, CampaignCharacter character) {
            await _repository.AddCharacterAsync(campaignId, character);
        }

        public async Task UpdateCharacterDataAsync(string campaignId, string characterId, List<DynamicField> data) {
            await _repository.UpdateCharacterDataAsync(campaignId, characterId, data);
        }

        public async Task SaveRollHistoryAsync(string campaignId, DiceRoll roll) {
            await _repository.SaveRollHistoryAsync(campaignId, roll);
        }

        public async Task StartSessionAsync(string campaignId) {
            await _repository.StartSessionAsync(campaignId);
        }

        public async Task EndSessionAsync(string campaignId) {
            await _repository.EndSessionAsync(campaignId);
        }
    }
}
