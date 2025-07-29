namespace RPGSheetManager.Domain.Characters {
    public interface ICharacterRepository {
        Task<List<Character>> GetAllAsync();
        Task<Character?> GetByIdAsync(Guid id);
        Task AddAsync(Character character);
        Task UpdateAsync(Guid id, Character character);
        Task DeleteAsync(Guid id);
    }
}
