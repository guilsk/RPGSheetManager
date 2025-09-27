namespace RPGSheetManager.Domain.Campaigns {
    public interface ICampaignRepository {
        Task<List<Campaign>> GetAllAsync();
        Task<List<Campaign>> GetByMasterIdAsync(string masterId);
        Task<List<Campaign>> GetByPlayerIdAsync(string playerId);
        Task<Campaign?> GetByIdAsync(string id);
        Task<Campaign> AddAsync(Campaign campaign);
        Task UpdateAsync(string id, Campaign campaign);
        Task DeleteAsync(string id);
        Task AddCharacterAsync(string campaignId, CampaignCharacter character);
        Task UpdateCharacterDataAsync(string campaignId, string characterId, List<DynamicField> updatedData);
        Task StartSessionAsync(string campaignId);
        Task EndSessionAsync(string campaignId);
        Task SaveRollHistoryAsync(string campaignId, DiceRoll roll);
    }
}
