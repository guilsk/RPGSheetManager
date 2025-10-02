using RPGSheetManager.Domain.Users;

namespace RPGSheetManager.Application.Services.Users {
    public class UserService {
        private readonly IUserRepository _userRepository;
        public UserService(IUserRepository userRepository) {
            _userRepository = userRepository;
        }

        public async Task<User?> GetUserByAuthIdAsync(string authId) => await _userRepository.GetByAuthIdAsync(authId);
        public async Task AddOrUpdateUserAsync(User user) => await _userRepository.AddOrUpdateAsync(user);
        public async Task UpdateProfileAsync(User user) => await _userRepository.UpdateProfileAsync(user);
        public async Task<bool> AddSavedSystemAsync(string authId, string systemId) => await _userRepository.AddSavedSystemAsync(authId, systemId);
        public async Task<bool> RemoveSavedSystemAsync(string authId, string systemId) => await _userRepository.RemoveSavedSystemAsync(authId, systemId);
        public async Task<List<User>> GetAllUsersAsync() => await _userRepository.GetAllAsync();
        public async Task<List<User>> SearchUsersAsync(string searchTerm) => await _userRepository.SearchAsync(searchTerm);
    }
}
