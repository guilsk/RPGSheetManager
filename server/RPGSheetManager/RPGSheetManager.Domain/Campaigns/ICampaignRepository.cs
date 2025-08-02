namespace RPGSheetManager.Domain.Campaigns {
    public interface ICampaignRepository {
        Task<Campaign?> GetByIdAsync(Guid id);
        Task AddAsync(Campaign campaign);
        Task UpdateAsync(Campaign campaign);
        Task DeleteAsync(Guid id);

        Task AddCharacterAsync(Guid campaignId, CampaignCharacter character);
        Task UpdateCharacterDataAsync(Guid campaignId, Guid characterId, List<DynamicField> updatedData);

        Task StartSessionAsync(Guid campaignId);
        Task EndSessionAsync(Guid campaignId);

        Task AddChatMessageAsync(Guid campaignId, ChatMessage message);

        Task<List<ChatMessage>> GetChatHistoryAsync(Guid campaignId);

        Task SaveRollHistoryAsync(Guid campaignId, DiceRoll roll);
    }
}
