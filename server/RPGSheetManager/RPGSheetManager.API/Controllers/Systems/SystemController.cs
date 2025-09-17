using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Systems;
using RPGSheetManager.Application.Services.Users;
using System.Security.Claims;

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
        public async Task<IActionResult> CreateSystem([FromBody] object systemData)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID não encontrado no token");
                }

                // Por agora vou comentar esta funcionalidade pois não temos o método
                // var system = await _systemService.CreateSystemAsync(systemData, userId);
                // return CreatedAtAction(nameof(GetSystem), new { id = system.Id }, system);
                return BadRequest("Funcionalidade não implementada");
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
