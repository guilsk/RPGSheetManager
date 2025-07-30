namespace RPGSheetManager.Domain.Systems {
    public interface ISystemRepository {
        Task<List<RPGSystem>> GetAllAsync();
        Task<RPGSystem?> GetByIdAsync(Guid id);
        Task AddAsync(RPGSystem system);
        Task UpdateAsync(Guid id, RPGSystem system);
        Task DeleteAsync(Guid id);
    }
}
