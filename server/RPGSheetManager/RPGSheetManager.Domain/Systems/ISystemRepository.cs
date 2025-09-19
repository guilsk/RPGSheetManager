namespace RPGSheetManager.Domain.Systems {
    public interface ISystemRepository {
        Task<List<RPGSystem>> GetAllAsync();
        Task<List<RPGSystem>> GetByOwnerIdAsync(string ownerId);
        Task<RPGSystem?> GetByIdAsync(string id);
        Task<RPGSystem> AddAsync(RPGSystem system);
        Task UpdateAsync(string id, RPGSystem system);
        Task DeleteAsync(string id);
    }
}
