namespace RPGSheetManager.Domain.Characters {
    public interface ICharacterRepository {
        Task<List<Character>> GetAllAsync();
        Task<List<Character>> GetByUserIdAsync(string userId);
        Task<Character?> GetByIdAsync(string id);
        Task<Character> AddAsync(Character character);
        Task UpdateAsync(string id, Character character);
        Task DeleteAsync(string id);
    }
}
