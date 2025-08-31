using RPGSheetManager.Domain.Systems;

namespace RPGSheetManager.Application.Services.Systems {
    public class SystemService {
        private readonly ISystemRepository _repository;
        public SystemService(ISystemRepository repository) {
            _repository = repository;
        }

        public Task<List<RPGSystem>> GetAllAsync() => _repository.GetAllAsync();
        public Task<RPGSystem?> GetByIdAsync(string id) => _repository.GetByIdAsync(id);
        public Task AddAsync(RPGSystem system) => _repository.AddAsync(system);
        public Task UpdateAsync(string id, RPGSystem system) => _repository.UpdateAsync(id, system);
        public Task DeleteAsync(string id)=> _repository.DeleteAsync(id);
    }
}
