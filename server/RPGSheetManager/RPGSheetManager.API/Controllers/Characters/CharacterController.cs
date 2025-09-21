using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Domain.Characters;
using RPGSheetManager.Application.Services.Characters;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RPGSheetManager.API.Controllers.Characters {
    [ApiController]
    [Route("api/[controller]")]
    public class CharacterController : ControllerBase {
        private readonly CharacterService _service;

        public CharacterController(CharacterService service) {
            _service = service;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll() {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID não encontrado no token");
            }

            var characters = await _service.GetByUserIdAsync(userId);
            return Ok(characters);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(string id) {
            var character = await _service.GetByIdAsync(id);
            if (character == null) return NotFound();
            return Ok(character);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] Character character) {
            character.Id = null;
            character.CreatedAt = DateTime.UtcNow;
            var createdCharacter = await _service.AddAsync(character);
            return CreatedAtAction(nameof(GetById), new { id = createdCharacter.Id }, createdCharacter);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(string id, [FromBody] Character character) {
            character.Id = id;
            await _service.UpdateAsync(id, character);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id) {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        private string? GetUserId()
        {
            // Primeiro tenta o claim 'sub' que é padrão do Auth0
            var subClaim = User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(subClaim))
            {
                return subClaim;
            }

            // Fallback para NameIdentifier
            var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(nameIdentifierClaim))
            {
                return nameIdentifierClaim;
            }

            return null;
        }
    }
}
