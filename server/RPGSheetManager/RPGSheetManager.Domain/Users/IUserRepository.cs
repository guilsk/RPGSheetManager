namespace RPGSheetManager.Domain.Users {
    public interface IUserRepository {
        Task<User?> GetByAuthIdAsync(string authId);
        Task AddOrUpdateAsync(User user);
    }
}
