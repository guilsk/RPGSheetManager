using RPGSheetManager.Domain.Characters;

namespace RPGSheetManager.Application.Services.Characters {
    public class CharacterService {
        private readonly ICharacterRepository _repository;

        public CharacterService(ICharacterRepository repository) {
            _repository = repository;
        }

        public Task<List<Character>> GetAllAsync() => _repository.GetAllAsync();
        public Task<List<Character>> GetByUserIdAsync(string userId) => _repository.GetByUserIdAsync(userId);
        public Task<Character?> GetByIdAsync(string id) => _repository.GetByIdAsync(id);
        public Task<Character> AddAsync(Character character) => _repository.AddAsync(character);
        public Task UpdateAsync(string id, Character character) => _repository.UpdateAsync(id, character);
        public Task DeleteAsync(string id) => _repository.DeleteAsync(id);
    }
}
