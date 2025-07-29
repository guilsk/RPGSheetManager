using RPGSheetManager.Domain.Characters;

namespace RPGSheetManager.Application.Services.Characters {
    public class CharacterService {
        private readonly ICharacterRepository _repository;

        public CharacterService(ICharacterRepository repository) {
            _repository = repository;
        }

        public Task<List<Character>> GetAllAsync() => _repository.GetAllAsync();
        public Task<Character?> GetByIdAsync(Guid id) => _repository.GetByIdAsync(id);
        public Task AddAsync(Character character) => _repository.AddAsync(character);
        public Task UpdateAsync(Guid id, Character character) => _repository.UpdateAsync(id, character);
        public Task DeleteAsync(Guid id) => _repository.DeleteAsync(id);
    }
}
