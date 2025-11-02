using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Users;
using RPGSheetManager.Application.Services.Campaigns;
using RPGSheetManager.Domain.Users;

namespace RPGSheetManager.API.Controllers.Users {
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase {
        private readonly UserService _service;
        private readonly CampaignService _campaignService;

        public UserController(UserService service, CampaignService campaignService) {
            _service = service;
            _campaignService = campaignService;
        }

        [HttpGet("{authId}")]
        public async Task<IActionResult> GetUserByAuthId(string authId) {
            var user = await _service.GetUserByAuthIdAsync(authId);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateUser([FromBody] User user) {
            if (user == null || string.IsNullOrEmpty(user.AuthId)) {
                return BadRequest("Invalid user data.");
            }

            var isNewUser = await _service.IsNewUserAsync(user.AuthId);
            await _service.AddOrUpdateUserAsync(user);

            // Para novos usuários, configura o ambiente inicial
            if (isNewUser) {
                // Convida para campanha de exemplo
                await _campaignService.InviteToExampleCampaignAsync(user.AuthId);
                
                // Adiciona o sistema Old Quest aos sistemas salvos
                await _campaignService.AddOldQuestSystemToUserAsync(user.AuthId);
            }

            return Ok(user);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] User user) {
            if (user == null || string.IsNullOrEmpty(user.AuthId)) {
                return BadRequest("Invalid user data.");
            }

            // Verificar se o usuário está tentando atualizar seu próprio perfil
            var currentUserId = User.FindFirst("sub")?.Value;

            if (currentUserId != user.AuthId) {
                return StatusCode(403, new {
                    message = "You can only update your own profile.",
                    currentUserId = currentUserId,
                    requestedUserId = user.AuthId
                });
            }

            await _service.UpdateProfileAsync(user);
            return Ok(user);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers() {
            var users = await _service.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string search) {
            if (string.IsNullOrEmpty(search)) {
                return BadRequest("Search term is required.");
            }

            var users = await _service.SearchUsersAsync(search);
            return Ok(users);
        }
    }
}
