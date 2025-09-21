using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Systems;
using RPGSheetManager.Application.Services.Users;
using RPGSheetManager.Domain.Systems;
using System.Security.Claims;
using System.Text.Json;

namespace RPGSheetManager.API.Controllers.Systems
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystemController : ControllerBase
    {
        private readonly SystemService _systemService;
        private readonly UserService _userService;

        public SystemController(SystemService systemService, UserService userService)
        {
            _systemService = systemService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSystems()
        {
            try
            {
                var systems = await _systemService.GetAllAsync();
                return Ok(systems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpGet("my-systems")]
        [Authorize]
        public async Task<IActionResult> GetMySystems()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                var systems = await _systemService.GetByOwnerIdAsync(userId);
                return Ok(systems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpGet("saved-systems")]
        [Authorize]
        public async Task<IActionResult> GetSavedSystems()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                // Buscar o usuário para obter os sistemas salvos
                var user = await _userService.GetUserByAuthIdAsync(userId);
                if (user == null || user.SavedSystemIds == null || !user.SavedSystemIds.Any())
                {
                    return Ok(new List<object>());
                }

                // Buscar os sistemas salvos
                var savedSystems = new List<object>();
                foreach (var systemId in user.SavedSystemIds)
                {
                    var system = await _systemService.GetByIdAsync(systemId);
                    if (system != null)
                    {
                        savedSystems.Add(system);
                    }
                }

                return Ok(savedSystems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSystem(string id)
        {
            try
            {
                var system = await _systemService.GetByIdAsync(id);
                if (system == null)
                {
                    return NotFound();
                }
                return Ok(system);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateSystem([FromBody] JsonElement systemData)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                // Deserializar o JSON para um objeto RPGSystem
                var systemJson = systemData.GetRawText();
                var system = JsonSerializer.Deserialize<RPGSystem>(systemJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (system == null)
                {
                    return BadRequest("Dados do sistema inválidos");
                }

                // Definir o ownerId como o usuário autenticado
                system.OwnerId = userId;
                system.CreatedAt = DateTime.UtcNow;
                system.Id = null; // Garantir que o MongoDB vai gerar um novo ID

                var createdSystem = await _systemService.AddAsync(system);

                // Automaticamente adicionar o sistema aos sistemas salvos do usuário
                if (!string.IsNullOrEmpty(createdSystem.Id))
                {
                    await _userService.AddSavedSystemAsync(userId, createdSystem.Id);
                }

                return CreatedAtAction(nameof(GetSystem), new { id = createdSystem.Id }, createdSystem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPost("{id}/save")]
        [Authorize]
        public async Task<IActionResult> SaveSystem(string id)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                var result = await _userService.AddSavedSystemAsync(userId, id);
                if (!result)
                {
                    return BadRequest("Erro ao salvar sistema");
                }

                return Ok(new { message = "Sistema salvo com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpDelete("{id}/save")]
        [Authorize]
        public async Task<IActionResult> UnsaveSystem(string id)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                var result = await _userService.RemoveSavedSystemAsync(userId, id);
                if (!result)
                {
                    return BadRequest("Erro ao remover sistema dos salvos");
                }

                return Ok(new { message = "Sistema removido dos salvos com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        [HttpPatch("{id}/obsolete")]
        [Authorize]
        public async Task<IActionResult> MarkSystemAsObsolete(string id)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                // Buscar o sistema para verificar se existe e se o usuário é o dono
                var system = await _systemService.GetByIdAsync(id);
                if (system == null)
                {
                    return NotFound("Sistema não encontrado");
                }

                // Verificar se o usuário é o criador do sistema
                if (system.OwnerId != userId)
                {
                    return Forbid("Você só pode marcar como obsoleto sistemas que você criou");
                }

                // Marcar como obsoleto
                system.Obsolete = true;
                await _systemService.UpdateAsync(id, system);

                return Ok(new { message = "Sistema marcado como obsoleto com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno: {ex.Message}");
            }
        }

        private string GetUserId()
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
