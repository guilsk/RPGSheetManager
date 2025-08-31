using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Domain.Systems;
using RPGSheetManager.Application.Services.Systems;

namespace RPGSheetManager.API.Controllers.Systems {
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase{
        private readonly SystemService _service;

        public SystemController(SystemService service) {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() {
            var characters = await _service.GetAllAsync();
            return Ok(characters);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id) {
            var character = await _service.GetByIdAsync(id);
            if (character == null) return NotFound();
            return Ok(character);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RPGSystem system) {
            system.Id = Guid.NewGuid().ToString();
            system.CreatedAt = DateTime.UtcNow;
            await _service.AddAsync(system);
            return CreatedAtAction(nameof(GetById), new { id = system.Id }, system);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] RPGSystem system) {
            system.Id = id;
            await _service.UpdateAsync(id, system);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id) {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
