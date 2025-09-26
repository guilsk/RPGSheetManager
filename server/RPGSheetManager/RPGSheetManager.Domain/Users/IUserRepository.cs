namespace RPGSheetManager.Domain.Users {
    public interface IUserRepository {
        Task<User?> GetByAuthIdAsync(string authId);
        Task AddOrUpdateAsync(User user);
        Task UpdateProfileAsync(User user);
        Task<bool> AddSavedSystemAsync(string authId, string systemId);
        Task<bool> RemoveSavedSystemAsync(string authId, string systemId);
    }
}
