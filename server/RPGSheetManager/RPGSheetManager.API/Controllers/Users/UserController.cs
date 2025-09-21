using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Users;
using RPGSheetManager.Domain.Users;

namespace RPGSheetManager.API.Controllers.Users {
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase {
        private readonly UserService _service;

        public UserController(UserService service) {
            _service = service;
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
            await _service.AddOrUpdateUserAsync(user);
            return Ok(user);
        }
    }
}
