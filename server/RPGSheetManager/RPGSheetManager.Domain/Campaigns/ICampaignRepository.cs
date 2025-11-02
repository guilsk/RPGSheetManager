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
        Task<bool> UpdateCharacterDataWithValidationAsync(string campaignId, string characterId, string playerId, List<DynamicField> updatedData);
        Task StartSessionAsync(string campaignId);
        Task EndSessionAsync(string campaignId);
        Task SaveRollHistoryAsync(string campaignId, DiceRoll roll);
        Task<List<Campaign>> GetInvitesByPlayerIdAsync(string playerId);
        Task<bool> AcceptInviteAsync(string campaignId, string playerId);
        Task<bool> DeclineInviteAsync(string campaignId, string playerId);
        Task<bool> AssociateCharacterAsync(string campaignId, string characterId, string playerId);
        Task<bool> DisassociateCharacterAsync(string campaignId, string characterId, string playerId);
        Task<CampaignCharacter?> GetCampaignCharacterAsync(string campaignId, string characterId);
        Task<string> InitializeExampleCampaignAsync();
        Task<bool> InviteToExampleCampaignAsync(string playerId);
        Task<bool> AddOldQuestSystemToUserAsync(string playerId);
        Task<bool> RemovePlayerFromCampaignAsync(string campaignId, string playerId);
    }
}
