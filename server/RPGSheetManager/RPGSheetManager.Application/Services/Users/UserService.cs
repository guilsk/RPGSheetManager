using RPGSheetManager.Domain.Users;

namespace RPGSheetManager.Application.Services.Users {
    public class UserService {
        private readonly IUserRepository _userRepository;
        public UserService(IUserRepository userRepository) {
            _userRepository = userRepository;
        }

        public async Task<User?> GetUserByAuthIdAsync(string authId) => await _userRepository.GetByAuthIdAsync(authId);
        public async Task AddOrUpdateUserAsync(User user) => await _userRepository.AddOrUpdateAsync(user);
    }
}
