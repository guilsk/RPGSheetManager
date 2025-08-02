using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Campaigns;
using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.API.Controllers.Campaigns {
    [ApiController]
    [Route("api/[controller]")]
    public class CampaignController : ControllerBase {
        private readonly CampaignService _service;

        public CampaignController(CampaignService service) {
            _service = service;
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id) {
            var campaign = await _service.GetByIdAsync(id);
            return campaign is null ? NotFound() : Ok(campaign);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Campaign campaign) {
            await _service.AddAsync(campaign);
            return CreatedAtAction(nameof(GetById), new { id = campaign.Id }, campaign);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, Campaign campaign) {
            if (id != campaign.Id)
                return BadRequest();

            await _service.UpdateAsync(campaign);
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id) {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("{campaignId:guid}/characters")]
        public async Task<IActionResult> AddCharacter(Guid campaignId, CampaignCharacter character) {
            await _service.AddCharacterAsync(campaignId, character);
            return Ok();
        }

        [HttpPut("{campaignId:guid}/characters/{charId:guid}/data")]
        public async Task<IActionResult> UpdateCharacterData(Guid campaignId, Guid charId, List<DynamicField> data) {
            await _service.UpdateCharacterDataAsync(campaignId, charId, data);
            return NoContent();
        }

        [HttpPost("{campaignId:guid}/chat")]
        public async Task<IActionResult> AddChatMessage(Guid campaignId, ChatMessage message) {
            await _service.AddChatMessageAsync(campaignId, message);
            return Ok();
        }

        [HttpGet("{campaignId:guid}/chat")]
        public async Task<IActionResult> GetChatHistory(Guid campaignId) {
            var chat = await _service.GetChatHistoryAsync(campaignId);
            return Ok(chat);
        }

        [HttpPost("{campaignId:guid}/roll")]
        public async Task<IActionResult> SaveRoll(Guid campaignId, DiceRoll roll) {
            await _service.SaveRollHistoryAsync(campaignId, roll);
            return Ok();
        }

        [HttpPost("{campaignId:guid}/start")]
        public async Task<IActionResult> StartSession(Guid campaignId) {
            await _service.StartSessionAsync(campaignId);
            return Ok();
        }

        [HttpPost("{campaignId:guid}/end")]
        public async Task<IActionResult> EndSession(Guid campaignId) {
            await _service.EndSessionAsync(campaignId);
            return Ok();
        }
    }
}
