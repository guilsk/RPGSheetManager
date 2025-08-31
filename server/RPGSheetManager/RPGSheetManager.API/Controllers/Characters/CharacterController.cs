using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Domain.Characters;
using RPGSheetManager.Application.Services.Characters;
using Microsoft.AspNetCore.Authorization;

namespace RPGSheetManager.API.Controllers.Characters {
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CharacterController : ControllerBase {
        private readonly CharacterService _service;

        public CharacterController(CharacterService service) {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() {
            var characters = await _service.GetAllAsync();
            return Ok(characters);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(string id) {
            var character = await _service.GetByIdAsync(id);
            if (character == null) return NotFound();
            return Ok(character);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Character character) {
            character.Id = Guid.NewGuid().ToString();
            character.CreatedAt = DateTime.UtcNow;
            await _service.AddAsync(character);
            return CreatedAtAction(nameof(GetById), new { id = character.Id }, character);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(string id, [FromBody] Character character) {
            character.Id = id;
            await _service.UpdateAsync(id, character);
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(string id) {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
